-- ============================================================
-- NEAR:STAGE 초기 스키마
--
-- 설계 원칙 세 가지
--  1. shows 는 아무나 INSERT 할 수 없습니다. 우리 무대는 fn_accept_application 만,
--     등록 공연(KOPIS)은 Edge Function 만 넣습니다. "공연이 생기는 경로"를 하나로
--     묶어야 슬롯 잠금·알림·스레드 생성이 빠짐없이 함께 일어납니다.
--  2. 승인 상태(status)는 본인이 못 바꿉니다. 트리거로 막습니다. 프론트에서 막으면
--     API를 직접 때리는 순간 뚫립니다.
--  3. 사용자 위치 좌표는 어디에도 저장하지 않습니다. 공간 좌표만 저장하고,
--     거리 계산은 브라우저 안에서 끝냅니다 (위치정보법 신고 대상 회피).
-- ============================================================

create extension if not exists "pgcrypto";

-- ─────────────────────────── 프로필 ───────────────────────────

create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null default '',
  avatar_url   text,
  phone        text,
  is_admin     boolean not null default false,
  created_at   timestamptz not null default now()
);

comment on table public.profiles is
  '카카오 로그인 시 트리거로 자동 생성됩니다. 역할(호스트/아티스트)은 여기 두지 않습니다 — 보유 리소스로 판단합니다.';

-- ─────────────────────────── 공간 ───────────────────────────

create type public.approval_status as enum ('pending', 'approved', 'rejected');

create table public.venues (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles (id) on delete cascade,
  name             text not null,
  category         text not null,
  address          text not null,
  lat              double precision not null,
  lng              double precision not null,
  capacity         integer not null check (capacity > 0),
  rental_fee       integer not null default 0 check (rental_fee >= 0),
  equipment        jsonb not null default '{}'::jsonb,
  preferred_genres text[] not null default '{}',
  description      text not null default '',
  photos           text[] not null default '{}',
  status           public.approval_status not null default 'pending',
  reject_reason    text,
  created_at       timestamptz not null default now()
);

create index venues_status_idx on public.venues (status);
create index venues_owner_idx on public.venues (owner_id);

-- ─────────────────────────── 아티스트 ───────────────────────────

create table public.artists (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references public.profiles (id) on delete cascade,
  team_name     text not null,
  genre         text not null,
  member_count  integer not null default 1 check (member_count > 0),
  duration_min  integer not null default 60 check (duration_min > 0),
  bio           text not null default '',
  setlist       text[] not null default '{}',
  needs         text[] not null default '{}',
  photos        text[] not null default '{}',
  clip_urls     text[] not null default '{}',
  status        public.approval_status not null default 'pending',
  reject_reason text,
  created_at    timestamptz not null default now()
);

create index artists_status_idx on public.artists (status);
create index artists_owner_idx on public.artists (owner_id);

-- ─────────────────────────── 공연 ───────────────────────────

create type public.show_status as enum ('confirmed', 'ongoing', 'ended', 'canceled');
create type public.show_source as enum ('own', 'kopis');

create table public.shows (
  id             uuid primary key default gen_random_uuid(),
  venue_id       uuid references public.venues (id) on delete set null,
  artist_id      uuid references public.artists (id) on delete set null,
  slot_id        uuid,
  title          text not null,
  description    text not null default '',
  starts_at      timestamptz not null,
  duration_min   integer not null default 60 check (duration_min > 0),
  capacity       integer not null default 0 check (capacity >= 0),
  status         public.show_status not null default 'confirmed',
  source         public.show_source not null default 'own',
  kopis_id       text unique,
  external_url   text,
  -- 등록 공연(KOPIS)은 우리 venues 에 없는 공연장에서 열립니다
  venue_name_raw text,
  venue_addr_raw text,
  lat            double precision,
  lng            double precision,
  created_at     timestamptz not null default now(),
  -- 우리 무대는 공간·아티스트가 반드시 있고, 등록 공연은 원본 id 가 반드시 있습니다
  constraint shows_source_shape check (
    (source = 'own' and venue_id is not null and artist_id is not null)
    or
    (source = 'kopis' and kopis_id is not null)
  )
);

create index shows_starts_at_idx on public.shows (starts_at);
create index shows_venue_idx on public.shows (venue_id);
create index shows_artist_idx on public.shows (artist_id);

-- ─────────────────────────── 가능 시간 슬롯 ───────────────────────────

create table public.venue_slots (
  id                uuid primary key default gen_random_uuid(),
  venue_id          uuid not null references public.venues (id) on delete cascade,
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  is_open           boolean not null default true,
  locked_by_show_id uuid references public.shows (id) on delete set null,
  created_at        timestamptz not null default now(),
  -- ★ 같은 공간의 같은 시각에 슬롯이 둘일 수 없습니다 (이중 예약 1차 방어선)
  constraint venue_slots_unique_start unique (venue_id, starts_at),
  constraint venue_slots_order check (ends_at > starts_at)
);

create index venue_slots_venue_idx on public.venue_slots (venue_id, starts_at);

alter table public.shows
  add constraint shows_slot_fk foreign key (slot_id)
  references public.venue_slots (id) on delete set null;

-- ─────────────────────────── 구인글 / 지원 ───────────────────────────

create type public.post_status as enum ('open', 'closed');
create type public.application_status as enum ('pending', 'accepted', 'rejected');

create table public.posts (
  id            uuid primary key default gen_random_uuid(),
  venue_id      uuid not null references public.venues (id) on delete cascade,
  wanted_genres text[] not null default '{}',
  date_from     date not null,
  date_to       date not null,
  -- 참고용 금액입니다. 결제와 연결되지 않습니다.
  offer_fee     integer not null default 0 check (offer_fee >= 0),
  message       text not null default '',
  status        public.post_status not null default 'open',
  created_at    timestamptz not null default now(),
  constraint posts_date_order check (date_to >= date_from)
);

create index posts_status_idx on public.posts (status, created_at desc);
create index posts_venue_idx on public.posts (venue_id);

create table public.applications (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references public.posts (id) on delete cascade,
  artist_id     uuid not null references public.artists (id) on delete cascade,
  message       text not null default '',
  status        public.application_status not null default 'pending',
  reject_reason text,
  created_at    timestamptz not null default now(),
  -- ★ 같은 구인글에 같은 팀이 두 번 지원할 수 없습니다
  constraint applications_unique_apply unique (post_id, artist_id)
);

create index applications_post_idx on public.applications (post_id);
create index applications_artist_idx on public.applications (artist_id);

-- ─────────────────────────── 참석 / 반응 / 리뷰 ───────────────────────────

create type public.attendance_status as enum ('going', 'attended', 'canceled');

create table public.attendances (
  id         uuid primary key default gen_random_uuid(),
  show_id    uuid not null references public.shows (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  headcount  integer not null default 1 check (headcount between 1 and 4),
  status     public.attendance_status not null default 'going',
  created_at timestamptz not null default now(),
  constraint attendances_unique_user unique (show_id, user_id)
);

create index attendances_show_idx on public.attendances (show_id);

create table public.likes (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  show_id    uuid not null references public.shows (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, show_id)
);

create table public.follows (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  artist_id  uuid not null references public.artists (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, artist_id)
);

create type public.review_target as enum ('venue', 'artist');

create table public.reviews (
  id          uuid primary key default gen_random_uuid(),
  show_id     uuid not null references public.shows (id) on delete cascade,
  user_id     uuid not null references public.profiles (id) on delete cascade,
  target_type public.review_target not null,
  rating      integer not null check (rating between 1 and 5),
  body        text not null default '',
  created_at  timestamptz not null default now(),
  -- 공간 리뷰와 아티스트 리뷰를 각각 한 번씩만
  constraint reviews_unique_target unique (show_id, user_id, target_type)
);

create index reviews_show_idx on public.reviews (show_id);

-- 호스트가 공연 후 입력하는 실제 방문객 수 (성과 리포트의 원천)
create table public.show_reports (
  id            uuid primary key default gen_random_uuid(),
  show_id       uuid not null unique references public.shows (id) on delete cascade,
  visitor_count integer not null check (visitor_count >= 0),
  note          text not null default '',
  created_at    timestamptz not null default now()
);

-- ─────────────────────────── 알림 / 채팅 ───────────────────────────

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  type       text not null,
  title      text not null,
  body       text not null default '',
  link       text,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.threads (
  id         uuid primary key default gen_random_uuid(),
  venue_id   uuid not null references public.venues (id) on delete cascade,
  artist_id  uuid not null references public.artists (id) on delete cascade,
  show_id    uuid references public.shows (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint threads_unique_pair unique (venue_id, artist_id)
);

create table public.messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.threads (id) on delete cascade,
  sender_id  uuid not null references public.profiles (id) on delete cascade,
  body       text not null,
  read_at    timestamptz,
  created_at timestamptz not null default now()
);

create index messages_thread_idx on public.messages (thread_id, created_at);
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
-- ============================================================
-- RLS — 프론트에서 막지 말고 DB에서 막습니다
--
-- 화면 코드는 얼마든지 우회할 수 있습니다. 브라우저 콘솔에서 supabase 클라이언트를
-- 직접 부르면 끝입니다. 그래서 "누가 무엇을 볼 수 있고 쓸 수 있는가"는 전부 여기에만
-- 적습니다. 화면은 편의를 위해 버튼을 숨길 뿐, 그것이 보안 장치는 아닙니다.
-- ============================================================

alter table public.profiles      enable row level security;
alter table public.venues        enable row level security;
alter table public.artists       enable row level security;
alter table public.shows         enable row level security;
alter table public.venue_slots   enable row level security;
alter table public.posts         enable row level security;
alter table public.applications  enable row level security;
alter table public.attendances   enable row level security;
alter table public.likes         enable row level security;
alter table public.follows       enable row level security;
alter table public.reviews       enable row level security;
alter table public.show_reports  enable row level security;
alter table public.notifications enable row level security;
alter table public.threads       enable row level security;
alter table public.messages      enable row level security;

-- ─────────── 도우미 ───────────

create or replace function public.fn_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function public.fn_owns_venue(p_venue_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.venues v where v.id = p_venue_id and v.owner_id = auth.uid()
  );
$$;

create or replace function public.fn_owns_artist(p_artist_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.artists a where a.id = p_artist_id and a.owner_id = auth.uid()
  );
$$;

-- ─────────── 프로필 ───────────
-- 이름·사진은 공개(리뷰 작성자 표기에 필요), 수정은 본인만.

create policy profiles_select_all on public.profiles
  for select using (true);

create policy profiles_update_self on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- ─────────── 공간 ───────────

create policy venues_select_approved on public.venues
  for select using (status = 'approved' or owner_id = auth.uid() or public.fn_is_admin());

create policy venues_insert_own on public.venues
  for insert with check (owner_id = auth.uid());

-- status 변경은 0002 의 트리거가 막습니다 (운영자만)
create policy venues_update_own on public.venues
  for update using (owner_id = auth.uid() or public.fn_is_admin());

create policy venues_delete_own on public.venues
  for delete using (owner_id = auth.uid() or public.fn_is_admin());

-- ─────────── 아티스트 ───────────

create policy artists_select_approved on public.artists
  for select using (status = 'approved' or owner_id = auth.uid() or public.fn_is_admin());

create policy artists_insert_own on public.artists
  for insert with check (owner_id = auth.uid());

create policy artists_update_own on public.artists
  for update using (owner_id = auth.uid() or public.fn_is_admin());

create policy artists_delete_own on public.artists
  for delete using (owner_id = auth.uid() or public.fn_is_admin());

-- ─────────── 공연 ───────────
--
-- ★ INSERT 정책이 없습니다. 일부러입니다.
--   우리 무대는 fn_accept_application(security definer)만, 등록 공연은 Edge Function이
--   service_role 로 넣습니다. 그 두 경로 밖에서는 공연이 생길 수 없습니다.

create policy shows_select_public on public.shows
  for select using (
    source = 'kopis'
    or (
      status = 'confirmed'
      and exists (select 1 from public.venues v where v.id = venue_id and v.status = 'approved')
      and exists (select 1 from public.artists a where a.id = artist_id and a.status = 'approved')
    )
    or public.fn_owns_venue(venue_id)
    or public.fn_owns_artist(artist_id)
    or public.fn_is_admin()
  );

create policy shows_update_owner on public.shows
  for update using (public.fn_owns_venue(venue_id) or public.fn_is_admin());

-- ─────────── 슬롯 ───────────

create policy venue_slots_select_all on public.venue_slots
  for select using (true);

create policy venue_slots_write_owner on public.venue_slots
  for all using (public.fn_owns_venue(venue_id)) with check (public.fn_owns_venue(venue_id));

-- ─────────── 구인글 ───────────

create policy posts_select_all on public.posts
  for select using (true);

create policy posts_write_owner on public.posts
  for all using (public.fn_owns_venue(venue_id)) with check (public.fn_owns_venue(venue_id));

-- ─────────── 지원 ───────────
--
-- 지원서는 지원한 팀과 그 구인글을 낸 공간 주인만 봅니다. 다른 팀의 지원 내용이
-- 보이면 경쟁 팀의 제안 조건이 노출됩니다.

create policy applications_select_parties on public.applications
  for select using (
    public.fn_owns_artist(artist_id)
    or exists (
      select 1 from public.posts p
      where p.id = post_id and public.fn_owns_venue(p.venue_id)
    )
    or public.fn_is_admin()
  );

create policy applications_insert_own_artist on public.applications
  for insert with check (public.fn_owns_artist(artist_id));

-- 수락·거절은 공간 주인만. (수락은 fn_accept_application 을 통해 일어납니다)
create policy applications_update_venue_owner on public.applications
  for update using (
    exists (
      select 1 from public.posts p
      where p.id = post_id and public.fn_owns_venue(p.venue_id)
    )
  );

create policy applications_delete_own_artist on public.applications
  for delete using (public.fn_owns_artist(artist_id));

-- ─────────── 참석 ───────────
--
-- 집계(going_count)는 v_public_shows 가 대신 공개하므로, 행 자체는 본인 것만 봅니다.
-- 공간 주인은 자기 공연의 참석 명단을 봐야 입장 확인을 할 수 있습니다.

create policy attendances_select_self_or_host on public.attendances
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.shows s
      where s.id = show_id and public.fn_owns_venue(s.venue_id)
    )
  );

-- 등록 공연(KOPIS)은 참석 대상이 아닙니다 — 예매는 원본 예매처에서 합니다
create policy attendances_insert_self on public.attendances
  for insert with check (
    user_id = auth.uid()
    and exists (select 1 from public.shows s where s.id = show_id and s.source = 'own')
  );

create policy attendances_update_self_or_host on public.attendances
  for update using (
    user_id = auth.uid()
    or exists (
      select 1 from public.shows s
      where s.id = show_id and public.fn_owns_venue(s.venue_id)
    )
  );

-- ─────────── 좋아요 / 팔로우 ───────────

create policy likes_select_self on public.likes for select using (user_id = auth.uid());
create policy likes_write_self on public.likes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy follows_select_self on public.follows for select using (user_id = auth.uid());
create policy follows_write_self on public.follows
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────── 리뷰 ───────────
--
-- ★ 공연이 끝났고, 실제로 참석한 사람만 씁니다. 안 가본 공연에 별점을 남길 수 없습니다.

create policy reviews_select_all on public.reviews
  for select using (true);

create policy reviews_insert_attendee on public.reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.shows s
      where s.id = show_id
        and s.status = 'ended'
    )
    and exists (
      select 1 from public.attendances a
      where a.show_id = show_id and a.user_id = auth.uid() and a.status <> 'canceled'
    )
  );

create policy reviews_update_self on public.reviews
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy reviews_delete_self on public.reviews
  for delete using (user_id = auth.uid() or public.fn_is_admin());

-- ─────────── 공연 결과 보고 ───────────

create policy show_reports_select_all on public.show_reports
  for select using (true);

create policy show_reports_write_host on public.show_reports
  for all using (
    exists (select 1 from public.shows s where s.id = show_id and public.fn_owns_venue(s.venue_id))
  ) with check (
    exists (select 1 from public.shows s where s.id = show_id and public.fn_owns_venue(s.venue_id))
  );

-- ─────────── 알림 ───────────
-- 발송은 서버(security definer 함수 / Edge Function)만 합니다. INSERT 정책 없음.

create policy notifications_select_self on public.notifications
  for select using (user_id = auth.uid());

create policy notifications_update_self on public.notifications
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────── 채팅 ───────────

create policy threads_select_parties on public.threads
  for select using (public.fn_owns_venue(venue_id) or public.fn_owns_artist(artist_id));

create policy messages_select_parties on public.messages
  for select using (
    exists (
      select 1 from public.threads t
      where t.id = thread_id
        and (public.fn_owns_venue(t.venue_id) or public.fn_owns_artist(t.artist_id))
    )
  );

create policy messages_insert_parties on public.messages
  for insert with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.threads t
      where t.id = thread_id
        and (public.fn_owns_venue(t.venue_id) or public.fn_owns_artist(t.artist_id))
    )
  );

create policy messages_update_parties on public.messages
  for update using (
    exists (
      select 1 from public.threads t
      where t.id = thread_id
        and (public.fn_owns_venue(t.venue_id) or public.fn_owns_artist(t.artist_id))
    )
  );
-- ============================================================
-- v_public_shows 에 좋아요 수를 추가합니다.
--
-- likes 테이블은 RLS로 "본인 행만" 읽게 막아뒀습니다. 그래야 남이 무엇을
-- 좋아하는지 알 수 없죠. 그런데 화면에는 "이 공연 좋아요 N개"가 필요합니다.
-- 뷰는 security_invoker = false 라 뷰 소유자 권한으로 집계하므로, 개별 행을
-- 노출하지 않고 합계만 공개할 수 있습니다.
--
-- 공간 평점도 함께 넣습니다. venues 에 평점 컬럼을 두지 않고 리뷰에서 계산합니다 —
-- 하드코딩된 숫자를 만들지 않기 위함입니다.
-- ============================================================

-- create or replace 는 컬럼을 맨 뒤에만 추가할 수 있습니다. venue_rating 을 중간에
-- 끼워 넣으므로 지우고 새로 만듭니다. 이 뷰에 의존하는 객체는 없습니다.
drop view if exists public.v_public_shows;

create view public.v_public_shows
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
  coalesce(v.name, s.venue_name_raw)    as venue_name,
  coalesce(v.address, s.venue_addr_raw) as venue_address,
  coalesce(v.lat, s.lat)                as lat,
  coalesce(v.lng, s.lng)                as lng,
  v.category                            as venue_category,
  vr.venue_rating,
  a.team_name                            as artist_name,
  a.genre                                as artist_genre,
  a.photos                               as artist_photos,
  coalesce(att.going_count, 0)           as going_count,
  coalesce(lk.like_count, 0)             as like_count,
  rv.avg_rating,
  coalesce(rv.review_count, 0)           as review_count
from public.shows s
left join public.venues v on v.id = s.venue_id
left join public.artists a on a.id = s.artist_id
left join lateral (
  select sum(x.headcount) as going_count
  from public.attendances x
  where x.show_id = s.id and x.status <> 'canceled'
) att on true
left join lateral (
  -- 이 공간의 모든 공연에 달린 공간 리뷰 평균. venues 에는 평점 컬럼이 없고
  -- 리뷰가 유일한 원천입니다 (하드코딩된 평점을 두지 않기 위함).
  select round(avg(r.rating)::numeric, 1) as venue_rating
  from public.reviews r
  join public.shows s2 on s2.id = r.show_id
  where s2.venue_id = s.venue_id and r.target_type = 'venue'
) vr on true
left join lateral (
  select count(*) as like_count
  from public.likes l
  where l.show_id = s.id
) lk on true
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

grant select on public.v_public_shows to anon, authenticated;
-- ============================================================
-- 공연에 포스터와 가격 안내를 추가합니다.
--
-- 등록 공연(KOPIS)은 실제 포스터 이미지와 "전석 30,000원" 같은 가격 안내
-- 문장을 함께 제공합니다. 이걸 버리고 우리가 그려낸 대체 이미지를 쓰는 건
-- 있는 정보를 낭비하는 일입니다.
--
-- 가격은 숫자가 아니라 원문 문장으로 둡니다. "전석 30,000원", "R석 70,000원
-- / S석 50,000원" 처럼 형태가 자유롭고, 우리가 결제에 관여하지 않으므로
-- 파싱해서 숫자로 만들 이유가 없습니다. 화면에는 원문을 그대로 보여주고,
-- 실제 결제는 원본 예매처에서 합니다.
--
-- 우리 무대(own)는 둘 다 비어 있습니다. 사진은 venues.photos/artists.photos 를
-- 쓰고, 참가비는 없습니다(현장에서 호스트가 정함).
-- ============================================================

alter table public.shows
  add column if not exists poster_url text,
  add column if not exists price_note text;

comment on column public.shows.poster_url is
  '등록 공연의 원본 포스터 URL. 우리 무대는 비어 있고 venues/artists 의 photos 를 씁니다.';
comment on column public.shows.price_note is
  '가격 안내 원문. 파싱하지 않습니다 — 결제는 원본 예매처에서 합니다.';

-- ─────────── 뷰에 두 컬럼 반영 ───────────
-- create or replace 는 컬럼을 중간에 끼워 넣을 수 없어 지우고 다시 만듭니다.

drop view if exists public.v_public_shows;

create view public.v_public_shows
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
  s.poster_url,
  s.price_note,
  s.created_at,
  coalesce(v.name, s.venue_name_raw)    as venue_name,
  coalesce(v.address, s.venue_addr_raw) as venue_address,
  coalesce(v.lat, s.lat)                as lat,
  coalesce(v.lng, s.lng)                as lng,
  v.category                            as venue_category,
  vr.venue_rating,
  a.team_name                            as artist_name,
  a.genre                                as artist_genre,
  a.photos                               as artist_photos,
  coalesce(att.going_count, 0)           as going_count,
  coalesce(lk.like_count, 0)             as like_count,
  rv.avg_rating,
  coalesce(rv.review_count, 0)           as review_count
from public.shows s
left join public.venues v on v.id = s.venue_id
left join public.artists a on a.id = s.artist_id
left join lateral (
  select sum(x.headcount) as going_count
  from public.attendances x
  where x.show_id = s.id and x.status <> 'canceled'
) att on true
left join lateral (
  -- 이 공간의 모든 공연에 달린 공간 리뷰 평균. venues 에는 평점 컬럼이 없고
  -- 리뷰가 유일한 원천입니다 (하드코딩된 평점을 두지 않기 위함).
  select round(avg(r.rating)::numeric, 1) as venue_rating
  from public.reviews r
  join public.shows s2 on s2.id = r.show_id
  where s2.venue_id = s.venue_id and r.target_type = 'venue'
) vr on true
left join lateral (
  select count(*) as like_count
  from public.likes l
  where l.show_id = s.id
) lk on true
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

grant select on public.v_public_shows to anon, authenticated;
-- ============================================================
-- 등록 공연의 원본 장르를 저장합니다.
--
-- KOPIS 의 장르는 '뮤지컬', '서양음악(클래식)', '한국음악(국악)', '대중음악',
-- '무용', '서커스/마술' 처럼 우리 장르 목록과 다릅니다. 지금은 목록에 없는
-- 장르를 전부 '연극'으로 끼워 넣고 있어서, 오케스트라 정기연주회가 '연극'으로
-- 표시됩니다. 틀린 정보를 보여주는 것보다 원본을 그대로 보여주는 게 맞습니다.
--
-- 우리 무대(own)는 artists.genre 가 원천이라 이 컬럼이 비어 있습니다.
-- ============================================================

alter table public.shows
  add column if not exists genre_raw text;

comment on column public.shows.genre_raw is
  '등록 공연의 원본 장르 표기(KOPIS genrenm). 우리 장르 목록에 맞추지 않고 그대로 보여줍니다.';

-- ─────────── 뷰에 반영 ───────────
-- create or replace 는 컬럼을 중간에 끼워 넣을 수 없어 지우고 다시 만듭니다.

drop view if exists public.v_public_shows;

create view public.v_public_shows
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
  s.poster_url,
  s.price_note,
  s.genre_raw,
  s.created_at,
  coalesce(v.name, s.venue_name_raw)    as venue_name,
  coalesce(v.address, s.venue_addr_raw) as venue_address,
  coalesce(v.lat, s.lat)                as lat,
  coalesce(v.lng, s.lng)                as lng,
  v.category                            as venue_category,
  vr.venue_rating,
  a.team_name                            as artist_name,
  a.genre                                as artist_genre,
  a.photos                               as artist_photos,
  coalesce(att.going_count, 0)           as going_count,
  coalesce(lk.like_count, 0)             as like_count,
  rv.avg_rating,
  coalesce(rv.review_count, 0)           as review_count
from public.shows s
left join public.venues v on v.id = s.venue_id
left join public.artists a on a.id = s.artist_id
left join lateral (
  select sum(x.headcount) as going_count
  from public.attendances x
  where x.show_id = s.id and x.status <> 'canceled'
) att on true
left join lateral (
  -- 이 공간의 모든 공연에 달린 공간 리뷰 평균. venues 에는 평점 컬럼이 없고
  -- 리뷰가 유일한 원천입니다 (하드코딩된 평점을 두지 않기 위함).
  select round(avg(r.rating)::numeric, 1) as venue_rating
  from public.reviews r
  join public.shows s2 on s2.id = r.show_id
  where s2.venue_id = s.venue_id and r.target_type = 'venue'
) vr on true
left join lateral (
  select count(*) as like_count
  from public.likes l
  where l.show_id = s.id
) lk on true
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

grant select on public.v_public_shows to anon, authenticated;
-- ============================================================
-- 사진 저장소 (§14)
--
-- 버킷 두 개를 만들고 정책을 붙입니다.
--  - 읽기: 누구나 (공간·팀 사진은 지도와 목록에 그대로 보여야 합니다)
--  - 쓰기: 로그인한 사용자가 "자기 폴더에만"
--
-- 폴더 규칙: <user_id>/<파일명>
-- 경로의 첫 칸을 소유자 id 로 강제하면, 남의 사진을 덮어쓰거나 지울 수 없습니다.
-- storage.foldername(name)[1] 이 그 첫 칸입니다.
--
-- 리사이즈는 업로드 전에 브라우저에서 합니다(최대 1600px, JPEG 0.82).
-- 원본을 그대로 받으면 폰 사진 한 장이 5~10MB 라 무료 용량이 금방 찹니다.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('venue-photos', 'venue-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('artist-photos', 'artist-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─────────── 정책 ───────────
-- 같은 이름의 정책이 있으면 지우고 다시 만듭니다 (재실행 가능하게)

drop policy if exists "photos_public_read" on storage.objects;
drop policy if exists "photos_insert_own_folder" on storage.objects;
drop policy if exists "photos_update_own_folder" on storage.objects;
drop policy if exists "photos_delete_own_folder" on storage.objects;

create policy "photos_public_read" on storage.objects
  for select using (bucket_id in ('venue-photos', 'artist-photos'));

create policy "photos_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('venue-photos', 'artist-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_update_own_folder" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('venue-photos', 'artist-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('venue-photos', 'artist-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
-- ============================================================
-- 공간 자동 승인
--
-- 사전 승인(운영자가 하나하나 확인) 을 없애고, 조건을 만족하면 등록 즉시 공개합니다.
-- 오픈 직후에 운영자가 로그인하기 전까지 지도가 비어 있는 문제를 없애기 위함입니다.
--
-- ★ 왜 DB 트리거인가
--   자동 승인을 프론트에서 하면 그건 "클라이언트의 주장"일 뿐입니다. status 를
--   클라이언트가 정할 수 있게 되면 조건을 우회해 approved 로 넣을 수 있습니다.
--   그래서 INSERT 시점에 DB 가 직접 판정합니다.
--
-- ★ 자동 승인이 확인하는 것과 못 하는 것
--   확인: 좌표가 실제로 잡혔는지, 대한민국 안인지, 필수 항목이 채워졌는지,
--         같은 자리에 같은 이름의 공간이 이미 있지 않은지(중복·장난 등록 방어)
--   못 함: 등록한 사람이 그 가게의 주인인지. 주소는 누구나 고를 수 있습니다.
--         그래서 운영자 화면의 승인/반려 기능은 남겨둡니다 — 사전 심사가 아니라
--         사후 조치(신고 처리·강제 비공개)용입니다.
-- ============================================================

/**
 * 대한민국 육지·부속도서를 넉넉히 감싸는 사각형.
 * 좌표가 0,0 이거나 해외로 잡힌 경우를 걸러내는 용도입니다.
 */
create or replace function public.fn_is_in_korea(p_lat double precision, p_lng double precision)
returns boolean
language sql
immutable
as $$
  select p_lat between 33.0 and 38.7 and p_lng between 124.5 and 132.0;
$$;

/** 이름 비교용 정규화 — 공백·괄호 차이로 중복을 놓치지 않게 합니다 */
create or replace function public.fn_norm_name(p_name text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(coalesce(p_name, ''), '[[:space:]()\-_.]', '', 'g'));
$$;

create or replace function public.fn_venue_auto_approve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dup_count int;
begin
  -- 운영자가 대신 등록하는 경우(§9)는 판정 없이 그대로 둡니다
  if coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false) then
    return new;
  end if;

  -- 필수 항목이 비었으면 심사 대기로 남깁니다
  if coalesce(btrim(new.name), '') = ''
     or coalesce(btrim(new.address), '') = ''
     or new.capacity is null or new.capacity <= 0
     or new.lat is null or new.lng is null then
    new.status := 'pending';
    return new;
  end if;

  -- 좌표가 엉뚱한 곳이면 심사 대기
  if not public.fn_is_in_korea(new.lat, new.lng) then
    new.status := 'pending';
    new.reject_reason := null;
    return new;
  end if;

  -- 같은 자리(약 30m 이내)에 같은 이름의 공간이 이미 있으면 심사 대기.
  -- 위도 0.0003 도는 약 33m, 경도 0.0004 도는 서울 기준 약 35m 입니다.
  select count(*) into v_dup_count
  from public.venues v
  where v.id <> new.id
    and public.fn_norm_name(v.name) = public.fn_norm_name(new.name)
    and abs(v.lat - new.lat) < 0.0003
    and abs(v.lng - new.lng) < 0.0004;

  if v_dup_count > 0 then
    new.status := 'pending';
    return new;
  end if;

  -- 여기까지 통과하면 즉시 공개합니다
  new.status := 'approved';
  new.reject_reason := null;
  return new;
end;
$$;

drop trigger if exists venues_auto_approve on public.venues;
create trigger venues_auto_approve
  before insert on public.venues
  for each row execute function public.fn_venue_auto_approve();

comment on function public.fn_venue_auto_approve is
  '등록 즉시 공개 여부를 DB가 판정합니다. 조건을 못 채우면 pending 으로 남아 운영자 확인을 받습니다.';
-- ============================================================
-- 자동 승인 트리거 수정 + 이미 대기 중인 공간 재판정
--
-- 0009 에 버그가 있었습니다. "운영자가 대신 등록하는 경우는 판정하지 않는다"는
-- 분기를 뒀는데, 그러면 운영자가 올린 공간은 판정을 건너뛰고 컬럼 기본값인
-- 'pending' 으로 남습니다. 일반 사용자보다 운영자가 불리해지는 결과입니다.
--
-- 운영자 특례를 없앱니다. 운영자도 같은 조건으로 판정하고, 필요하면 등록 후
-- UPDATE 로 상태를 바꿉니다(승인 상태 변경은 운영자만 가능하도록 이미 막혀 있음).
-- ============================================================

-- ─────────── 승인 상태 가드도 함께 고칩니다 ───────────
--
-- 0002 의 가드는 status 를 바꾸려는 사람이 운영자인지 확인합니다. 그런데
-- auth.uid() 가 없는 문맥(SQL Editor, service_role, cron)에서는 운영자로 인식되지
-- 않아 서버측 작업까지 막혔습니다. service_role 은 정의상 신뢰하는 주체이고,
-- Edge Function 과 마이그레이션이 그 문맥에서 돕니다.
--
-- 로그인한 사용자(auth.uid() 가 있는 경우)에게는 그대로 운영자만 허용합니다.

create or replace function public.fn_guard_approval_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $
begin
  if new.status is distinct from old.status then
    -- 서버측(service_role·SQL Editor·cron)에는 auth.uid() 가 없습니다
    if auth.uid() is null then
      return new;
    end if;
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
$;

create or replace function public.fn_venue_auto_approve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dup_count int;
begin
  -- 필수 항목이 비었으면 심사 대기로 남깁니다
  if coalesce(btrim(new.name), '') = ''
     or coalesce(btrim(new.address), '') = ''
     or new.capacity is null or new.capacity <= 0
     or new.lat is null or new.lng is null then
    new.status := 'pending';
    return new;
  end if;

  -- 좌표가 엉뚱한 곳이면 심사 대기 (0,0 이나 해외 좌표)
  if not public.fn_is_in_korea(new.lat, new.lng) then
    new.status := 'pending';
    new.reject_reason := null;
    return new;
  end if;

  -- 같은 자리(약 30m 이내)에 같은 이름의 공간이 이미 있으면 심사 대기
  select count(*) into v_dup_count
  from public.venues v
  where v.id <> new.id
    and public.fn_norm_name(v.name) = public.fn_norm_name(new.name)
    and abs(v.lat - new.lat) < 0.0003
    and abs(v.lng - new.lng) < 0.0004;

  if v_dup_count > 0 then
    new.status := 'pending';
    return new;
  end if;

  new.status := 'approved';
  new.reject_reason := null;
  return new;
end;
$$;

-- ─────────── 이미 대기 중인 공간 재판정 ───────────
--
-- 버그 때문에 대기로 남은 공간들을 같은 조건으로 다시 판정합니다.
-- 조건을 만족하는 것만 공개로 바꾸고, 못 채운 것은 그대로 둡니다.

update public.venues v
set status = 'approved', reject_reason = null
where v.status = 'pending'
  and coalesce(btrim(v.name), '') <> ''
  and coalesce(btrim(v.address), '') <> ''
  and v.capacity is not null and v.capacity > 0
  and v.lat is not null and v.lng is not null
  and public.fn_is_in_korea(v.lat, v.lng)
  and not exists (
    select 1
    from public.venues o
    where o.id <> v.id
      and o.status = 'approved'
      and public.fn_norm_name(o.name) = public.fn_norm_name(v.name)
      and abs(o.lat - v.lat) < 0.0003
      and abs(o.lng - v.lng) < 0.0004
  );

-- 결과 확인
select name, status, capacity, address from public.venues order by created_at desc;
