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
