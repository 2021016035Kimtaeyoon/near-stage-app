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
