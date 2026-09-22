-- ============================================================
-- v_public_shows 에 좌석 배치도 노출.
--
-- 관객이 참석 예정을 누르기 전에 배치도를 보고 판단할 수 있어야 합니다.
-- create or replace 로는 컬럼을 추가할 수 없어(42P16) drop 후 재생성합니다 —
-- 반드시 가장 최근 정의(0023)에서 출발합니다.
-- ============================================================

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
  s.run_ends_at,
  s.duration_min,
  s.capacity,
  s.status,
  s.cancel_reason,
  s.source,
  s.kopis_id,
  s.external_url,
  s.poster_url,
  s.price_note,
  s.genre_raw,
  s.schedule_note,
  s.seat_map_url,
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
    and v.status = 'approved'
    and a.status = 'approved'
  );

grant select on public.v_public_shows to anon, authenticated;
