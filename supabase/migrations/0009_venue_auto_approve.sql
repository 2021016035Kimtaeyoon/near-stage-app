-- ============================================================
-- 공간 자동 승인
--
-- 사전 승인(운영자가 하나하나 확인) 을 없애고, 조건을 만족하면 등록 즉시 공개합니다.
-- 오픈 직후에 운영자가 로그인하기 전까지 지도가 비어 있는 문제를 없애기 위함입니다.
--
-- ★ 왜 DB 트리거인가
--   자동 승인을 프론트에서 하면 그건 "클라이언트의 주장"일 뿐입니다. status 를
--   클라이언트가 정할 수 있게 되면 조건을 우회해 approved 로 넣을 수 있습니다.
--   그래서 INSERT 시점에 DB 가 직접 판정합니다.
--
-- ★ 자동 승인이 확인하는 것과 못 하는 것
--   확인: 좌표가 실제로 잡혔는지, 대한민국 안인지, 필수 항목이 채워졌는지,
--         같은 자리에 같은 이름의 공간이 이미 있지 않은지(중복·장난 등록 방어)
--   못 함: 등록한 사람이 그 가게의 주인인지. 주소는 누구나 고를 수 있습니다.
--         그래서 운영자 화면의 승인/반려 기능은 남겨둡니다 — 사전 심사가 아니라
--         사후 조치(신고 처리·강제 비공개)용입니다.
-- ============================================================

/**
 * 대한민국 육지·부속도서를 넉넉히 감싸는 사각형.
 * 좌표가 0,0 이거나 해외로 잡힌 경우를 걸러내는 용도입니다.
 */
create or replace function public.fn_is_in_korea(p_lat double precision, p_lng double precision)
returns boolean
language sql
immutable
as $$
  select p_lat between 33.0 and 38.7 and p_lng between 124.5 and 132.0;
$$;

/** 이름 비교용 정규화 — 공백·괄호 차이로 중복을 놓치지 않게 합니다 */
create or replace function public.fn_norm_name(p_name text)
returns text
language sql
immutable
as $$
  select lower(regexp_replace(coalesce(p_name, ''), '[[:space:]()\-_.]', '', 'g'));
$$;

create or replace function public.fn_venue_auto_approve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dup_count int;
begin
  -- 운영자가 대신 등록하는 경우(§9)는 판정 없이 그대로 둡니다
  if coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false) then
    return new;
  end if;

  -- 필수 항목이 비었으면 심사 대기로 남깁니다
  if coalesce(btrim(new.name), '') = ''
     or coalesce(btrim(new.address), '') = ''
     or new.capacity is null or new.capacity <= 0
     or new.lat is null or new.lng is null then
    new.status := 'pending';
    return new;
  end if;

  -- 좌표가 엉뚱한 곳이면 심사 대기
  if not public.fn_is_in_korea(new.lat, new.lng) then
    new.status := 'pending';
    new.reject_reason := null;
    return new;
  end if;

  -- 같은 자리(약 30m 이내)에 같은 이름의 공간이 이미 있으면 심사 대기.
  -- 위도 0.0003 도는 약 33m, 경도 0.0004 도는 서울 기준 약 35m 입니다.
  select count(*) into v_dup_count
  from public.venues v
  where v.id <> new.id
    and public.fn_norm_name(v.name) = public.fn_norm_name(new.name)
    and abs(v.lat - new.lat) < 0.0003
    and abs(v.lng - new.lng) < 0.0004;

  if v_dup_count > 0 then
    new.status := 'pending';
    return new;
  end if;

  -- 여기까지 통과하면 즉시 공개합니다
  new.status := 'approved';
  new.reject_reason := null;
  return new;
end;
$$;

drop trigger if exists venues_auto_approve on public.venues;
create trigger venues_auto_approve
  before insert on public.venues
  for each row execute function public.fn_venue_auto_approve();

comment on function public.fn_venue_auto_approve is
  '등록 즉시 공개 여부를 DB가 판정합니다. 조건을 못 채우면 pending 으로 남아 운영자 확인을 받습니다.';
