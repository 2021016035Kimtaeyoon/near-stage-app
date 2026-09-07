-- ============================================================
-- 자동 승인 트리거 수정 + 이미 대기 중인 공간 재판정
--
-- 0009 에 버그가 있었습니다. "운영자가 대신 등록하는 경우는 판정하지 않는다"는
-- 분기를 뒀는데, 그러면 운영자가 올린 공간은 판정을 건너뛰고 컬럼 기본값인
-- 'pending' 으로 남습니다. 일반 사용자보다 운영자가 불리해지는 결과입니다.
--
-- 운영자 특례를 없앱니다. 운영자도 같은 조건으로 판정하고, 필요하면 등록 후
-- UPDATE 로 상태를 바꿉니다(승인 상태 변경은 운영자만 가능하도록 이미 막혀 있음).
-- ============================================================

-- ─────────── 승인 상태 가드도 함께 고칩니다 ───────────
--
-- 0002 의 가드는 status 를 바꾸려는 사람이 운영자인지 확인합니다. 그런데
-- auth.uid() 가 없는 문맥(SQL Editor, service_role, cron)에서는 운영자로 인식되지
-- 않아 서버측 작업까지 막혔습니다. service_role 은 정의상 신뢰하는 주체이고,
-- Edge Function 과 마이그레이션이 그 문맥에서 돕니다.
--
-- 로그인한 사용자(auth.uid() 가 있는 경우)에게는 그대로 운영자만 허용합니다.

create or replace function public.fn_guard_approval_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $
begin
  if new.status is distinct from old.status then
    -- 서버측(service_role·SQL Editor·cron)에는 auth.uid() 가 없습니다
    if auth.uid() is null then
      return new;
    end if;
    if not coalesce(
      (select p.is_admin from public.profiles p where p.id = auth.uid()),
      false
    ) then
      raise exception '승인 상태는 운영자만 변경할 수 있습니다'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$;

create or replace function public.fn_venue_auto_approve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dup_count int;
begin
  -- 필수 항목이 비었으면 심사 대기로 남깁니다
  if coalesce(btrim(new.name), '') = ''
     or coalesce(btrim(new.address), '') = ''
     or new.capacity is null or new.capacity <= 0
     or new.lat is null or new.lng is null then
    new.status := 'pending';
    return new;
  end if;

  -- 좌표가 엉뚱한 곳이면 심사 대기 (0,0 이나 해외 좌표)
  if not public.fn_is_in_korea(new.lat, new.lng) then
    new.status := 'pending';
    new.reject_reason := null;
    return new;
  end if;

  -- 같은 자리(약 30m 이내)에 같은 이름의 공간이 이미 있으면 심사 대기
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

  new.status := 'approved';
  new.reject_reason := null;
  return new;
end;
$$;

-- ─────────── 이미 대기 중인 공간 재판정 ───────────
--
-- 버그 때문에 대기로 남은 공간들을 같은 조건으로 다시 판정합니다.
-- 조건을 만족하는 것만 공개로 바꾸고, 못 채운 것은 그대로 둡니다.

update public.venues v
set status = 'approved', reject_reason = null
where v.status = 'pending'
  and coalesce(btrim(v.name), '') <> ''
  and coalesce(btrim(v.address), '') <> ''
  and v.capacity is not null and v.capacity > 0
  and v.lat is not null and v.lng is not null
  and public.fn_is_in_korea(v.lat, v.lng)
  and not exists (
    select 1
    from public.venues o
    where o.id <> v.id
      and o.status = 'approved'
      and public.fn_norm_name(o.name) = public.fn_norm_name(v.name)
      and abs(o.lat - v.lat) < 0.0003
      and abs(o.lng - v.lng) < 0.0004
  );

-- 결과 확인
select name, status, capacity, address from public.venues order by created_at desc;
