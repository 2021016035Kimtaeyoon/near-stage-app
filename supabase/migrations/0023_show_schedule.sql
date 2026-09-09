-- ============================================================
-- 등록 공연의 공연 요일.
--
-- 0022 로 시작일은 고쳤지만, 여러 날에 걸친 기간 공연 33건(최장 74일)은 아직
-- 그 기간의 모든 날짜에 뜹니다. KOPIS 가 주는 것은 '기간'이지 '무슨 요일에
-- 하는지'가 아니기 때문입니다.
--
-- 요일은 상세 API 의 dtguidance 에 사람이 읽는 문장으로 들어 있습니다:
--   '화요일 ~ 금요일(20:00), 토요일(15:00,19:00), 일요일(15:00)'
--   '2026.09.16(수) 15:30, 2026.09.17(목) 19:30'
-- 동기화 함수는 이 문장에서 첫 시각만 뽑아 쓰고 나머지를 버리고 있었습니다.
-- 그 문장을 그대로 저장해 두면 앱이 요일을 읽어 거를 수 있습니다.
--
-- ★ 원문을 그대로 둡니다. 요일 배열로 미리 바꿔 저장하지 않습니다. 지금 파서가
--   못 읽는 표기를 나중에 읽게 될 때, 원문이 남아 있어야 다시 계산할 수 있습니다.
--   그리고 못 읽었을 때 관객에게 보여줄 것도 결국 이 원문입니다.
--
-- ★ 채우는 것은 동기화입니다. 이 마이그레이션은 자리만 만듭니다 —
--   sync-kopis 를 다시 배포하고 한 번 Invoke 해야 값이 들어옵니다.
--   그 전까지는 전부 null 이고, 앱은 "예매처에서 확인하세요"로 남겨둡니다.
-- ============================================================

alter table public.shows
  add column if not exists schedule_note text;

comment on column public.shows.schedule_note is
  'KOPIS dtguidance 원문. 공연 요일·시각 안내 문장. 우리 무대는 비어 있습니다.';

-- ─────────── 뷰 갱신 ───────────
--
-- ★ create or replace 로는 컬럼을 추가할 수 없습니다(42P16). drop 하고 다시
--   만들어야 하고, 반드시 가장 최근 정의(0018)에서 출발해야 합니다.
--   0012 에서 0004 기준으로 만들었다가 뒤에 추가된 컬럼을 날린 적이 있습니다.

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
