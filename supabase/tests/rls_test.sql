-- ============================================================
-- RLS 정책 검증
--
-- 실행 방법: Supabase 대시보드 → SQL Editor 에 이 파일을 통째로 붙여넣고 Run.
-- (경고가 뜨면 "Run without RLS" 를 누르세요 — 임시 테이블은 RLS 대상이 아닙니다)
--
-- 마지막에 8행짜리 표가 나옵니다. 전부 PASS 여야 합니다.
-- begin ... rollback 으로 감싸여 있어 몇 번을 돌려도 데이터가 남지 않습니다.
--
-- 확인하는 것 (§6 요구사항)
--   1. 남의 공간을 수정할 수 없다
--   2. 제3자가 남의 지원서를 조회할 수 없다
--   3. 운영자가 아니면 승인 상태를 바꿀 수 없다
--   4. 승인 안 된 공간은 남에게 보이지 않는다
--   5. 같은 구인글에 같은 팀이 두 번 지원할 수 없다
--   6. 같은 공간의 같은 시각에 슬롯이 둘일 수 없다
--   7. 안 가본 공연에 리뷰를 쓸 수 없다
--   8. 공연을 직접 INSERT 할 수 없다
-- ============================================================

begin;

create temporary table _result (
  no int,
  name text,
  passed boolean,
  detail text
) on commit drop;

-- ★ 이 테이블은 postgres 가 만들지만 아래에서 authenticated 로 역할을 바꿔 쓰기 때문에,
--   미리 권한을 열어줘야 합니다. (이게 없으면 "permission denied for table _result")
grant all on _result to authenticated, anon, public;

-- ─────────── 테스트용 계정 3명 ───────────

do $$
declare
  ids uuid[] := array[
    '11111111-1111-1111-1111-111111111111'::uuid,  -- 앨리스 (공간 주인)
    '22222222-2222-2222-2222-222222222222'::uuid,  -- 밥 (아티스트)
    '33333333-3333-3333-3333-333333333333'::uuid   -- 찰리 (제3자)
  ];
  names text[] := array['앨리스', '밥', '찰리'];
  i int;
begin
  for i in 1..3 loop
    insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                            email_confirmed_at, created_at, updated_at,
                            raw_app_meta_data, raw_user_meta_data)
    values (ids[i], '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
            'rlstest' || i || '@test.local', '', now(), now(), now(),
            '{}'::jsonb, jsonb_build_object('name', names[i]))
    on conflict (id) do nothing;

    -- 트리거가 프로필을 만들어주지만, 이미 있던 계정이면 건너뛰므로 여기서도 보장합니다
    insert into public.profiles (id, display_name)
    values (ids[i], names[i])
    on conflict (id) do nothing;
  end loop;
end $$;

-- 앨리스의 공간(미승인) / 밥의 팀(승인) / 구인글 / 밥의 지원
insert into public.venues (id, owner_id, name, category, address, lat, lng, capacity, status)
values ('aaaaaaaa-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '앨리스의 공간', '카페', '서울시 마포구', 37.56, 126.92, 30, 'pending');

insert into public.artists (id, owner_id, team_name, genre, status)
values ('bbbbbbbb-0000-0000-0000-000000000001',
        '22222222-2222-2222-2222-222222222222',
        '밥의 팀', '밴드', 'approved');

insert into public.posts (id, venue_id, date_from, date_to)
values ('cccccccc-0000-0000-0000-000000000001',
        'aaaaaaaa-0000-0000-0000-000000000001',
        current_date, current_date + 7);

insert into public.applications (id, post_id, artist_id)
values ('dddddddd-0000-0000-0000-000000000001',
        'cccccccc-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001');

-- ─────────── ① 남의 공간 수정 (밥이 앨리스 공간을) ───────────

set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

do $$
declare n int;
begin
  update public.venues set name = '밥이 가로챈 공간'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  insert into _result values (1, '남의 공간 수정이 막히는가', n = 0,
    n || '행 수정됨 (0이어야 정상)');
exception when others then
  insert into _result values (1, '남의 공간 수정이 막히는가', true, '예외로 차단: ' || sqlerrm);
end $$;

-- ─────────── ② 제3자가 남의 지원서 조회 (찰리가) ───────────

set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

do $$
declare n int;
begin
  select count(*) into n from public.applications
  where id = 'dddddddd-0000-0000-0000-000000000001';
  insert into _result values (2, '제3자가 남의 지원서를 못 보는가', n = 0,
    n || '건 조회됨 (0이어야 정상)');
end $$;

-- ─────────── ③ 승인 상태 자가 변경 (앨리스가 자기 공간을) ───────────

set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';

do $$
begin
  update public.venues set status = 'approved'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  insert into _result values (3, '본인이 승인 상태를 못 바꾸는가', false, '변경에 성공해버림');
exception when others then
  insert into _result values (3, '본인이 승인 상태를 못 바꾸는가', true, '차단: ' || sqlerrm);
end $$;

-- ─────────── ④ 미승인 공간이 제3자에게 보이는가 ───────────

set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

do $$
declare n int;
begin
  select count(*) into n from public.venues
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  insert into _result values (4, '미승인 공간이 남에게 안 보이는가', n = 0,
    n || '건 조회됨 (0이어야 정상)');
end $$;

-- ─────────── ⑤ 같은 구인글 중복 지원 (밥이 또) ───────────

set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

do $$
begin
  insert into public.applications (post_id, artist_id)
  values ('cccccccc-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001');
  insert into _result values (5, '중복 지원이 막히는가', false, '두 번째 지원이 들어감');
exception when unique_violation then
  insert into _result values (5, '중복 지원이 막히는가', true, 'UNIQUE 제약으로 차단');
when others then
  insert into _result values (5, '중복 지원이 막히는가', true, '차단: ' || sqlerrm);
end $$;

-- ─────────── ⑥ 같은 공간·같은 시각 슬롯 중복 ───────────

reset role;
reset request.jwt.claims;

do $$
declare v_at timestamptz := date_trunc('hour', now()) + interval '1 day';
begin
  insert into public.venue_slots (venue_id, starts_at, ends_at)
  values ('aaaaaaaa-0000-0000-0000-000000000001', v_at, v_at + interval '2 hours');
  insert into public.venue_slots (venue_id, starts_at, ends_at)
  values ('aaaaaaaa-0000-0000-0000-000000000001', v_at, v_at + interval '3 hours');
  insert into _result values (6, '같은 시각 슬롯 중복이 막히는가', false, '두 개가 들어감');
exception when unique_violation then
  insert into _result values (6, '같은 시각 슬롯 중복이 막히는가', true, 'UNIQUE 제약으로 차단');
end $$;

-- ─────────── ⑦ 안 가본 공연에 리뷰 ───────────
--
-- 리뷰 대상 공연을 관리자 권한으로 하나 만들어 둡니다 (RLS 우회 — 테스트 준비용).

insert into public.shows (id, venue_id, artist_id, title, starts_at, status, source)
values ('eeeeeeee-0000-0000-0000-000000000001',
        'aaaaaaaa-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001',
        '테스트 공연', now() - interval '2 days', 'ended', 'own');

set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';

do $$
begin
  insert into public.reviews (show_id, user_id, target_type, rating, body)
  values ('eeeeeeee-0000-0000-0000-000000000001',
          '33333333-3333-3333-3333-333333333333', 'venue', 5, '가보지도 않음');
  insert into _result values (7, '미참석자 리뷰가 막히는가', false, '리뷰가 들어감');
exception when others then
  insert into _result values (7, '미참석자 리뷰가 막히는가', true, '차단: ' || sqlerrm);
end $$;

-- ─────────── ⑧ 공연 직접 INSERT ───────────

do $$
begin
  insert into public.shows (venue_id, artist_id, title, starts_at, source)
  values ('aaaaaaaa-0000-0000-0000-000000000001',
          'bbbbbbbb-0000-0000-0000-000000000001',
          '몰래 만든 공연', now() + interval '1 day', 'own');
  insert into _result values (8, '공연 직접 생성이 막히는가', false, 'INSERT 성공해버림');
exception when others then
  insert into _result values (8, '공연 직접 생성이 막히는가', true, '차단: ' || sqlerrm);
end $$;

-- ─────────── 결과 ───────────

reset role;
reset request.jwt.claims;

select
  no,
  name,
  case when passed then 'PASS' else 'FAIL' end as result,
  detail
from _result
order by no;

-- 테스트 데이터는 남기지 않습니다
rollback;
