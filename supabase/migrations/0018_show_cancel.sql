-- ============================================================
-- 공연 취소 (출시 전 점검에서 발견).
--
-- 현실에서 공연은 취소됩니다. 아티스트가 아프고, 가게가 갑자기 공사를 하고,
-- 태풍이 옵니다. 그런데 취소할 방법이 없어서 열리지 않을 공연이 지도에 계속
-- 남아 있었습니다. 관객이 헛걸음합니다.
--
-- ★ 아티스트도 취소할 수 있어야 합니다. shows_update_owner 는 공간 주인만
--   허용하고 있었는데, 못 오게 된 쪽은 아티스트인 경우가 더 많습니다.
--   전화로 말하고 화면에는 남아 있는 상태가 제일 나쁩니다.
--
-- ★ 취소하면 슬롯을 다시 엽니다. 안 그러면 그 시간이 영구히 잠겨서, 다른 팀을
--   부를 수도 없게 됩니다.
--
-- ★ 취소 사유를 남깁니다. 참석 예정을 눌러둔 관객에게 그대로 보냅니다 —
--   "취소되었습니다" 만 오면 왜인지 알 수 없어 다시는 안 옵니다.
-- ============================================================

alter table public.shows
  add column if not exists canceled_at    timestamptz,
  add column if not exists cancel_reason  text;

comment on column public.shows.cancel_reason is
  '취소 사유. 참석 예정을 눌러둔 관객에게 알림으로 그대로 전달됩니다.';

-- ─────────── 취소 함수 ───────────
--
-- 트랜잭션으로 묶습니다. 상태만 바꾸고 슬롯을 못 열면 그 시간이 잠긴 채 남고,
-- 알림을 못 보내면 관객이 모르고 찾아옵니다.

create or replace function public.fn_cancel_show(
  p_show_id uuid,
  p_reason text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_show   public.shows%rowtype;
  v_venue  public.venues%rowtype;
  v_artist public.artists%rowtype;
  v_att    record;
  v_uid    uuid := auth.uid();
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '42501';
  end if;
  if coalesce(btrim(p_reason), '') = '' then
    raise exception '취소 사유를 적어주세요' using errcode = 'P0001';
  end if;

  select * into v_show from public.shows where id = p_show_id for update;
  if not found then
    raise exception '공연을 찾을 수 없습니다' using errcode = 'P0002';
  end if;
  if v_show.source <> 'own' then
    raise exception '등록 공연은 이곳에서 취소할 수 없습니다' using errcode = 'P0001';
  end if;
  if v_show.status = 'canceled' then
    raise exception '이미 취소된 공연입니다' using errcode = 'P0001';
  end if;

  select * into v_venue  from public.venues  where id = v_show.venue_id;
  select * into v_artist from public.artists where id = v_show.artist_id;

  -- security definer 라 RLS 가 적용되지 않습니다. 여기서 직접 막지 않으면
  -- 남의 공연을 취소할 수 있게 됩니다.
  if v_venue.owner_id <> v_uid and v_artist.owner_id <> v_uid and not public.fn_is_admin() then
    raise exception '이 공연의 호스트나 아티스트만 취소할 수 있습니다' using errcode = '42501';
  end if;

  -- ① 취소 표시
  update public.shows
  set status = 'canceled', canceled_at = now(), cancel_reason = btrim(p_reason)
  where id = p_show_id;

  -- ② 슬롯을 다시 엽니다. 잠긴 채 두면 그 시간에 다른 팀도 못 부릅니다.
  update public.venue_slots
  set locked_by_show_id = null, is_open = true
  where locked_by_show_id = p_show_id;

  -- ③ 참석 예정을 눌러둔 관객에게 사유를 그대로 알립니다
  for v_att in
    select a.user_id from public.attendances a
    where a.show_id = p_show_id and a.status <> 'canceled'
  loop
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_att.user_id,
      'show_canceled',
      '공연이 취소되었어요',
      v_show.title || ' · ' || btrim(p_reason),
      '/audience/my'
    );
  end loop;

  -- ④ 상대방에게도 알립니다. 취소한 쪽은 이미 알고 있으니 반대편만.
  if v_venue.owner_id <> v_uid then
    insert into public.notifications (user_id, type, title, body, link)
    values (v_venue.owner_id, 'show_canceled', '공연이 취소되었어요',
            v_show.title || ' · ' || btrim(p_reason), '/owner/dashboard');
  end if;
  if v_artist.owner_id <> v_uid then
    insert into public.notifications (user_id, type, title, body, link)
    values (v_artist.owner_id, 'show_canceled', '공연이 취소되었어요',
            v_show.title || ' · ' || btrim(p_reason), '/performer/activity');
  end if;
end;
$$;

revoke all on function public.fn_cancel_show(uuid, text) from public;
grant execute on function public.fn_cancel_show(uuid, text) to authenticated;

-- ─────────── 뷰에 취소 사유 노출 ───────────
-- 취소된 공연은 목록에서 빠지지만, 참석 예정을 눌러둔 사람은 상세에서 사유를
-- 봐야 합니다. 그래서 뷰에는 남기고 목록 필터에서만 걸러냅니다.

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
