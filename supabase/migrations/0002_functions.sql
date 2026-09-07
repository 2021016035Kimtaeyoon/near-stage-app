-- ============================================================
-- 트리거 · 뷰 · 매칭 트랜잭션
-- ============================================================

-- ─────────── 첫 로그인 시 프로필 자동 생성 ───────────

create or replace function public.fn_handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'nickname',
      new.raw_user_meta_data ->> 'full_name',
      ''
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.fn_handle_new_user();

-- ─────────── 승인 상태는 운영자만 바꿉니다 ───────────
--
-- RLS 로 "본인 행 UPDATE 허용"을 주면 본인이 자기 status 를 approved 로 바꿔버릴 수
-- 있습니다. 컬럼 단위 권한 대신 트리거로 막습니다 — 어떤 경로로 들어와도 걸립니다.

create or replace function public.fn_guard_approval_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status is distinct from old.status then
    if not coalesce(
      (select p.is_admin from public.profiles p where p.id = auth.uid()),
      false
    ) then
      raise exception '승인 상태는 운영자만 변경할 수 있습니다'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

create trigger venues_guard_status
  before update on public.venues
  for each row execute function public.fn_guard_approval_status();

create trigger artists_guard_status
  before update on public.artists
  for each row execute function public.fn_guard_approval_status();

-- ─────────── 공개 공연 뷰 ───────────
--
-- 우리 무대는 공간·아티스트가 모두 승인된 것만 공개합니다. 등록 공연은 그대로 공개.
-- 참석 인원 합계와 리뷰 평균을 여기서 함께 계산해, 화면이 집계를 따로 하지 않게 합니다.

create or replace view public.v_public_shows
with (security_invoker = false)
as
select
  s.id,
  s.venue_id,
  s.artist_id,
  s.slot_id,
  s.title,
  s.description,
  s.starts_at,
  s.duration_min,
  s.capacity,
  s.status,
  s.source,
  s.kopis_id,
  s.external_url,
  s.created_at,
  coalesce(v.name, s.venue_name_raw)       as venue_name,
  coalesce(v.address, s.venue_addr_raw)    as venue_address,
  coalesce(v.lat, s.lat)                   as lat,
  coalesce(v.lng, s.lng)                   as lng,
  v.category                               as venue_category,
  a.team_name                              as artist_name,
  a.genre                                  as artist_genre,
  coalesce(att.going_count, 0)             as going_count,
  rv.avg_rating,
  coalesce(rv.review_count, 0)             as review_count
from public.shows s
left join public.venues v on v.id = s.venue_id
left join public.artists a on a.id = s.artist_id
left join lateral (
  select sum(x.headcount) as going_count
  from public.attendances x
  where x.show_id = s.id and x.status <> 'canceled'
) att on true
left join lateral (
  select round(avg(r.rating)::numeric, 1) as avg_rating, count(*) as review_count
  from public.reviews r
  where r.show_id = s.id
) rv on true
where
  (s.source = 'kopis')
  or (
    s.source = 'own'
    and s.status = 'confirmed'
    and v.status = 'approved'
    and a.status = 'approved'
  );

comment on view public.v_public_shows is
  '지도·목록이 읽는 유일한 공연 소스. 승인 안 된 공간·아티스트의 공연은 여기 나타나지 않습니다.';

grant select on public.v_public_shows to anon, authenticated;

-- ─────────── ★ 매칭 → 공연 생성 (심장) ───────────
--
-- 7가지를 한 트랜잭션에서 처리합니다. 하나라도 실패하면 전부 롤백됩니다.
-- 중간 상태(지원은 수락됐는데 공연이 없는 상태)가 남으면 안 되기 때문입니다.

create or replace function public.fn_accept_application(
  p_application_id uuid,
  p_slot_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_app       public.applications%rowtype;
  v_post      public.posts%rowtype;
  v_venue     public.venues%rowtype;
  v_artist    public.artists%rowtype;
  v_slot      public.venue_slots%rowtype;
  v_show_id   uuid;
  v_thread_id uuid;
  v_follower  record;
begin
  select * into v_app from public.applications where id = p_application_id for update;
  if not found then
    raise exception '지원 내역을 찾을 수 없습니다' using errcode = 'P0002';
  end if;
  if v_app.status <> 'pending' then
    raise exception '이미 처리된 지원입니다' using errcode = 'P0001';
  end if;

  select * into v_post from public.posts where id = v_app.post_id for update;
  select * into v_venue from public.venues where id = v_post.venue_id;
  select * into v_artist from public.artists where id = v_app.artist_id;

  -- 호출자가 이 공간의 주인인지 확인합니다. security definer 라 RLS 가 적용되지 않으므로
  -- 여기서 직접 막지 않으면 남의 구인글 지원자를 수락할 수 있게 됩니다.
  if v_venue.owner_id <> auth.uid() then
    raise exception '이 구인글의 공간 소유자만 수락할 수 있습니다' using errcode = '42501';
  end if;

  select * into v_slot from public.venue_slots where id = p_slot_id for update;
  if not found or v_slot.venue_id <> v_venue.id then
    raise exception '이 공간의 슬롯이 아닙니다' using errcode = 'P0002';
  end if;
  if v_slot.locked_by_show_id is not null then
    raise exception '이미 공연이 잡힌 시간입니다' using errcode = 'P0001';
  end if;
  if not v_slot.is_open then
    raise exception '닫혀 있는 시간입니다' using errcode = 'P0001';
  end if;

  -- ① 이 지원을 수락
  update public.applications set status = 'accepted' where id = p_application_id;

  -- ② 같은 구인글의 다른 대기 지원은 자동 거절
  update public.applications
  set status = 'rejected', reject_reason = '다른 팀 확정'
  where post_id = v_post.id and id <> p_application_id and status = 'pending';

  -- ③ 구인글 마감
  update public.posts set status = 'closed' where id = v_post.id;

  -- ④ 공연 생성
  insert into public.shows (
    venue_id, artist_id, slot_id, title, description,
    starts_at, duration_min, capacity, status, source
  )
  values (
    v_venue.id,
    v_artist.id,
    v_slot.id,
    v_artist.team_name || ' @ ' || v_venue.name,
    v_artist.bio,
    v_slot.starts_at,
    v_artist.duration_min,
    v_venue.capacity,
    'confirmed',
    'own'
  )
  returning id into v_show_id;

  -- ⑤ 슬롯 잠금 — 같은 시간에 두 번째 공연이 못 들어옵니다
  update public.venue_slots
  set locked_by_show_id = v_show_id
  where id = v_slot.id;

  -- ⑥ 알림 3종
  insert into public.notifications (user_id, type, title, body, link)
  values (
    v_artist.owner_id,
    'accepted',
    '지원이 수락되었습니다',
    v_venue.name || '에서 공연이 확정되었어요.',
    '/artist/activity'
  );

  insert into public.notifications (user_id, type, title, body, link)
  values (
    v_venue.owner_id,
    'confirmed',
    '공연이 확정되었습니다',
    v_artist.team_name || ' · ' || to_char(v_slot.starts_at at time zone 'Asia/Seoul', 'MM/DD HH24:MI'),
    '/host/dashboard'
  );

  for v_follower in
    select f.user_id from public.follows f where f.artist_id = v_artist.id
  loop
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_follower.user_id,
      'new_show',
      '팔로우한 ' || v_artist.team_name || '의 공연이 열렸어요',
      v_venue.name || ' · ' || to_char(v_slot.starts_at at time zone 'Asia/Seoul', 'MM/DD HH24:MI'),
      '/audience/show/' || v_show_id
    );
  end loop;

  -- ⑦ 호스트 ↔ 아티스트 대화방
  insert into public.threads (venue_id, artist_id, show_id)
  values (v_venue.id, v_artist.id, v_show_id)
  on conflict (venue_id, artist_id) do update set show_id = excluded.show_id
  returning id into v_thread_id;

  return v_show_id;
end;
$$;

comment on function public.fn_accept_application is
  '지원 수락 → 공연 생성까지 한 트랜잭션. 공간 소유자만 호출할 수 있고, 슬롯이 이미 잠겨 있으면 실패합니다.';

revoke all on function public.fn_accept_application(uuid, uuid) from public;
grant execute on function public.fn_accept_application(uuid, uuid) to authenticated;
