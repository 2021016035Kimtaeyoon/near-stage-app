-- ============================================================
-- v_public_shows 에 좋아요 수를 추가합니다.
--
-- likes 테이블은 RLS로 "본인 행만" 읽게 막아뒀습니다. 그래야 남이 무엇을
-- 좋아하는지 알 수 없죠. 그런데 화면에는 "이 공연 좋아요 N개"가 필요합니다.
-- 뷰는 security_invoker = false 라 뷰 소유자 권한으로 집계하므로, 개별 행을
-- 노출하지 않고 합계만 공개할 수 있습니다.
-- ============================================================

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
