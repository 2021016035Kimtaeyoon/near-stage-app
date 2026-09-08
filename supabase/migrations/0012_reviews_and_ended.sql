-- ============================================================
-- 리뷰를 실제로 쓸 수 있게 고칩니다 (§12).
--
-- 문제: reviews_insert_attendee 가 shows.status = 'ended' 를 요구하는데, 공연을
-- 'ended' 로 바꾸는 주체가 앱에도 DB 에도 없습니다. 그래서 지금은 리뷰를 쓸 수
-- 있는 사람이 영원히 0명입니다.
--
-- 고치는 방향: 상태 컬럼 대신 시간으로 판단합니다.
--   ★ 크론이 도는지에 공연 종료 여부가 달려 있으면, 크론이 한 번 실패한 날
--     아무도 리뷰를 못 씁니다. 공연이 끝났는지는 시계가 이미 알고 있습니다.
--   status 는 취소('canceled')처럼 사람이 정하는 일에만 씁니다.
--
-- 함께 고치는 것: 뷰가 status = 'confirmed' 인 공연만 통과시켜서, 나중에
-- 'ongoing'/'ended' 로 표시하는 순간 공연이 목록에서 사라집니다. 리뷰 화면도
-- 이 뷰로 공연을 읽기 때문에 리뷰를 쓰러 들어가면 "공연을 찾을 수 없어요"가 뜹니다.
-- 취소된 공연만 빼도록 바꿉니다.
-- ============================================================

-- ─────────── ① 뷰: 취소만 제외 ───────────
-- 컬럼 목록은 0007 기준 그대로 두고 WHERE 만 바꿉니다.
-- (컬럼을 하나라도 빠뜨리면 42P16 cannot drop columns from view 가 납니다.)

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
    and s.status <> 'canceled'
    and v.status = 'approved'
    and a.status = 'approved'
  );

grant select on public.v_public_shows to anon, authenticated;

-- ─────────── ② shows RLS 도 같은 기준으로 ───────────
-- 뷰만 고치고 원본 정책을 두면, 상세 화면이 shows 를 직접 읽는 경로에서 어긋납니다.

drop policy if exists shows_select_public on public.shows;

create policy shows_select_public on public.shows
  for select using (
    source = 'kopis'
    or (
      status <> 'canceled'
      and exists (select 1 from public.venues v where v.id = venue_id and v.status = 'approved')
      and exists (select 1 from public.artists a where a.id = artist_id and a.status = 'approved')
    )
    or public.fn_owns_venue(venue_id)
    or public.fn_owns_artist(artist_id)
    or public.fn_is_admin()
  );

-- ─────────── ③ 리뷰: 시간으로 판단 ───────────

drop policy if exists reviews_insert_attendee on public.reviews;

create policy reviews_insert_attendee on public.reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.shows s
      where s.id = show_id
        and s.status <> 'canceled'
        -- ★ 공연이 실제로 끝난 뒤에만. 시작 시각 + 공연 길이가 지나야 합니다.
        and s.starts_at + make_interval(mins => s.duration_min) < now()
    )
    -- ★ 실제로 참석한 사람만. 안 가본 공연에 별점을 남길 수 없습니다.
    and exists (
      select 1 from public.attendances a
      where a.show_id = show_id and a.user_id = auth.uid() and a.status <> 'canceled'
    )
  );

-- ─────────── ④ 알림 Realtime ───────────
-- 인앱 알림이 "다시 들어와야 보이는" 것이면 확정 소식이 제때 안 닿습니다.
-- notifications_select_self 가 본인 것만 통과시키므로 남의 알림은 새지 않습니다.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end
$$;
