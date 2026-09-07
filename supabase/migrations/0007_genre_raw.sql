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
