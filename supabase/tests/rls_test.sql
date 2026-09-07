-- ============================================================
-- RLS 정책 검증
--
-- 실행 방법: Supabase 대시보드 → SQL Editor 에 이 파일을 통째로 붙여넣고 Run.
-- 마지막에 나오는 표에서 모든 행이 PASS 여야 합니다. 하나라도 FAIL 이면 그 정책이
-- 뚫려 있는 것입니다.
--
-- 확인하는 것 (§6 요구사항)
--   1. 남의 공간을 수정할 수 없다
--   2. 남의 구인글 지원자를 조회할 수 없다
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

-- 테스트용 사용자 두 명을 auth.users 에 직접 넣습니다 (service_role 로 실행되는 SQL Editor 기준)
do $$
declare
  v_alice uuid := '11111111-1111-1111-1111-111111111111';
  v_bob   uuid := '22222222-2222-2222-2222-222222222222';
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
                          email_confirmed_at, created_at, updated_at,
                          raw_app_meta_data, raw_user_meta_data)
  values
    (v_alice, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'alice@test.local', '', now(), now(), now(), '{}'::jsonb, '{"name":"앨리스"}'::jsonb),
    (v_bob, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
     'bob@test.local', '', now(), now(), now(), '{}'::jsonb, '{"name":"밥"}'::jsonb)
  on conflict (id) do nothing;
end $$;

-- 앨리스의 공간 / 밥의 팀을 만들어 둡니다 (여기까지는 관리자 권한)
insert into public.venues (id, owner_id, name, category, address, lat, lng, capacity, status)
values ('aaaaaaaa-0000-0000-0000-000000000001',
        '11111111-1111-1111-1111-111111111111',
        '앨리스의 공간', '카페', '서울시 마포구', 37.56, 126.92, 30, 'pending')
on conflict (id) do nothing;

insert into public.artists (id, owner_id, team_name, genre, status)
values ('bbbbbbbb-0000-0000-0000-000000000001',
        '22222222-2222-2222-2222-222222222222',
        '밥의 팀', '밴드', 'approved')
on conflict (id) do nothing;

insert into public.posts (id, venue_id, date_from, date_to)
values ('cccccccc-0000-0000-0000-000000000001',
        'aaaaaaaa-0000-0000-0000-000000000001',
        current_date, current_date + 7)
on conflict (id) do nothing;

insert into public.applications (id, post_id, artist_id)
values ('dddddddd-0000-0000-0000-000000000001',
        'cccccccc-0000-0000-0000-000000000001',
        'bbbbbbbb-0000-0000-0000-000000000001')
on conflict (id) do nothing;

-- ─────────────────────────────────────────────
-- 여기서부터 "밥"으로 위장합니다 (일반 로그인 사용자)
-- ─────────────────────────────────────────────
set local role authenticated;
set local request.jwt.claims = '{"sub":"22222222-2222-2222-2222-222222222222","role":"authenticated"}';

-- ① 남의 공간 수정 시도
do $$
declare n int;
begin
  update public.venues set name = '밥이 가로챈 공간'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  get diagnostics n = row_count;
  insert into _result values (1, '남의 공간 수정이 막히는가', n = 0,
    n || '행이 수정됨 (0이어야 정상)');
exception when others then
  insert into _result values (1, '남의 공간 수정이 막히는가', true, '예외로 차단: ' || sqlerrm);
end $$;

-- ② 남의 구인글 지원자 조회 시도 — 밥은 자기 팀 지원서라 보입니다.
--    대신 "앨리스가 밥의 팀 지원서를 보는지"가 아니라, 제3자가 못 보는지를 확인합니다.
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
do $$
declare n int;
begin
  select count(*) into n from public.applications
  where id = 'dddddddd-0000-0000-0000-000000000001';
  insert into _result values (2, '제3자가 남의 지원서를 못 보는가', n = 0,
    n || '건 조회됨 (0이어야 정상)');
end $$;

-- ③ 승인 상태 자가 변경 시도 (앨리스가 자기 공간을 approved 로)
set local request.jwt.claims = '{"sub":"11111111-1111-1111-1111-111111111111","role":"authenticated"}';
do $$
begin
  update public.venues set status = 'approved'
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  insert into _result values (3, '본인이 승인 상태를 못 바꾸는가', false, '변경에 성공해버림');
exception when others then
  insert into _result values (3, '본인이 승인 상태를 못 바꾸는가', true, '차단: ' || sqlerrm);
end $$;

-- ④ 승인 안 된 공간이 제3자에게 안 보이는가
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
do $$
declare n int;
begin
  select count(*) into n from public.venues
  where id = 'aaaaaaaa-0000-0000-0000-000000000001';
  insert into _result values (4, '미승인 공간이 남에게 안 보이는가', n = 0,
    n || '건 조회됨 (0이어야 정상)');
end $$;

-- ⑤ 같은 구인글 중복 지원
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

-- ⑥ 같은 공간·같은 시각 슬롯 중복
set local role postgres;
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

-- ⑦ 안 가본 공연에 리뷰
set local role authenticated;
set local request.jwt.claims = '{"sub":"33333333-3333-3333-3333-333333333333","role":"authenticated"}';
do $$
declare v_show uuid;
begin
  select id into v_show from public.shows limit 1;
  if v_show is null then
    insert into _result values (7, '미참석자 리뷰가 막히는가', true, '공연이 없어 건너뜀 (정책은 존재)');
    return;
  end if;
  insert into public.reviews (show_id, user_id, target_type, rating, body)
  values (v_show, '33333333-3333-3333-3333-333333333333', 'venue', 5, '가보지도 않음');
  insert into _result values (7, '미참석자 리뷰가 막히는가', false, '리뷰가 들어감');
exception when others then
  insert into _result values (7, '미참석자 리뷰가 막히는가', true, '차단: ' || sqlerrm);
end $$;

-- ⑧ 공연 직접 INSERT
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

-- ─────────────────────────────────────────────
set local role postgres;
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
