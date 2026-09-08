-- ============================================================
-- 등록 공연(KOPIS)의 공연 기간을 저장합니다.
--
-- 문제: 등록 공연 100건이 전부 "동기화한 날" 날짜로 들어가 있습니다. 하루가 지나면
-- 전부 과거가 되어 지도에서 사라지고, 관객이 보는 공연이 0건이 됩니다.
--
-- 원인 둘.
--   ① sync-kopis 의 정규식이 깨져 있었습니다 (`.replace(/./g,'-')` 는 모든 문자를
--      바꿔서 "----------" 이 되고, 그게 항상 오늘보다 작아서 모든 공연이 오늘로
--      당겨졌습니다).
--   ② 애초에 "시작일이 지났으면 오늘로 당긴다"는 방식이 매일 동기화에 의존합니다.
--      크론이 하루 실패하면 지도가 빕니다.
--
-- 고치는 방향: 원본 기간을 그대로 저장하고, "지금이 기간 안이면 진행 중"으로 봅니다.
--   대학로 연극은 두 달을 공연합니다. 하루짜리 시각 하나로 표현하려 한 것이 잘못이었고,
--   기간을 그대로 두면 크론이 며칠 멈춰도 목록이 비지 않습니다.
--
-- ★ 우리 무대(own)는 run_ends_at 이 비어 있습니다. 슬롯 하나에 한 번 열리는 공연이라
--   시작 시각과 길이로 충분합니다.
-- ============================================================

alter table public.shows
  add column if not exists run_ends_at timestamptz;

comment on column public.shows.run_ends_at is
  '등록 공연의 공연 마지막 날(23:59 KST). 이 시각까지 목록에 남습니다. 우리 무대는 null.';

-- ─────────── 뷰에 반영 ───────────
-- 컬럼을 중간에 끼워 넣으므로 지우고 새로 만듭니다 (create or replace 는 42P16).

drop view if exists public.v_clip_feed;
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

-- 0015 의 클립 피드 뷰를 그대로 다시 만듭니다 (위에서 함께 지웠으므로)
create view public.v_clip_feed
with (security_invoker = false)
as
select
  c.id,
  c.artist_id,
  c.kind,
  c.url,
  c.thumb_url,
  c.title,
  c.duration_sec,
  c.created_at,
  a.team_name                     as artist_name,
  a.genre                         as artist_genre,
  a.photos                        as artist_photos,
  coalesce(lk.like_count, 0)      as like_count,
  coalesce(cm.comment_count, 0)   as comment_count
from public.artist_clips c
join public.artists a on a.id = c.artist_id
left join lateral (
  select count(*) as like_count from public.clip_likes l where l.clip_id = c.id
) lk on true
left join lateral (
  select count(*) as comment_count from public.clip_comments m where m.clip_id = c.id
) cm on true
where a.status = 'approved';

grant select on public.v_clip_feed to anon, authenticated;

-- ─────────── 이미 들어온 100건 응급 처치 ───────────
--
-- 전부 어제 날짜로 도장 찍혀 있어서 지금 지도가 비어 있습니다. description 에
-- 원본 기간이 "장르 · 2026.09.07 ~ 2026.11.30" 형태로 남아 있어서, 거기서 마지막
-- 날짜를 꺼내 run_ends_at 을 채웁니다.
--
-- ★ 이건 한 번만 쓰는 응급 처치입니다. 함수를 재배포하면 다음 동기화부터 원본
--   기간이 제대로 들어옵니다.

update public.shows
set run_ends_at = (
  -- 'YYYY.MM.DD' 마지막 등장을 날짜로 읽어 그날 23:59 KST 로
  to_timestamp(
    (regexp_matches(description, '(\d{4}\.\d{2}\.\d{2})\s*$', 'g'))[1] || ' 23:59',
    'YYYY.MM.DD HH24:MI'
  ) at time zone 'Asia/Seoul'
)
where source = 'kopis'
  and run_ends_at is null
  and description ~ '\d{4}\.\d{2}\.\d{2}\s*$';

-- 기간을 못 읽은 것은 오늘부터 2주로 둡니다. 지도가 비는 것보다는 낫고, 다음
-- 동기화에서 정확한 값으로 덮입니다.
update public.shows
set run_ends_at = (now() + interval '14 days')
where source = 'kopis' and run_ends_at is null;
