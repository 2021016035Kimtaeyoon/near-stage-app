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
