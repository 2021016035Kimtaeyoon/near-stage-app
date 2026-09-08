-- ============================================================
-- 수락 알림의 링크를 실제로 존재하는 경로로 고칩니다.
--
-- 0002 에서 '/artist/activity' 와 '/host/dashboard' 를 넣었는데, 앱에 그런
-- 라우트가 없습니다. 알림을 눌러도 역할 홈으로 튕깁니다 — 확정 소식을 받고
-- 눌렀는데 아무 데도 안 가는 게 가장 허탈합니다.
--
-- 양쪽 다 만들어진 공연 상세로 보냅니다. 그 화면은 v_public_shows 를 읽고
-- 실제로 동작합니다.
-- ============================================================

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
    '/audience/show/' || v_show_id
  );

  insert into public.notifications (user_id, type, title, body, link)
  values (
    v_venue.owner_id,
    'confirmed',
    '공연이 확정되었습니다',
    v_artist.team_name || ' · ' || to_char(v_slot.starts_at at time zone 'Asia/Seoul', 'MM/DD HH24:MI'),
    '/audience/show/' || v_show_id
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

-- ============================================================
-- Realtime: shows 의 INSERT 를 구독할 수 있게 퍼블리케이션에 넣습니다 (§11).
--
-- 호스트가 수락한 순간, 지도를 보고 있던 사람 화면에도 새 공연이 떠야 합니다.
-- 새로고침해야 보이면 "방금 만든 공연이 어디 갔지"가 됩니다.
--
-- ★ 뷰(v_public_shows)는 Realtime 을 태울 수 없어서 원본 테이블을 구독합니다.
--   프론트는 payload 를 쓰지 않고 "신호"로만 받아 뷰를 다시 읽습니다 — payload
--   에는 뷰가 하는 승인 여부 필터와 집계가 없기 때문입니다.
--
-- ★ Realtime 도 RLS 를 지킵니다. shows_select_public 이 승인된 공간·팀의 확정
--   공연만 통과시키므로, 심사 중인 공간의 공연은 남에게 새어 나가지 않습니다.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'shows'
  ) then
    alter publication supabase_realtime add table public.shows;
  end if;
end
$$;
