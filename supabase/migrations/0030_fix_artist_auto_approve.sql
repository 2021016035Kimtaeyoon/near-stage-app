-- ============================================================
-- 아티스트 자동 승인 트리거 수정 — 0009 가 겪은 것과 똑같은 버그.
--
-- 0029 를 쓰면서 0009(공간 자동 승인)의 "운영자가 대신 등록하는 경우는 판정
-- 없이 그대로 둔다"는 분기를 그대로 베꼈습니다. 그런데 그 분기는 0010 에서
-- 이미 지워진 것이었습니다 — "판정 없이 둔다"는 컬럼 기본값(pending)에 그대로
-- 남는다는 뜻이라, 운영자가 자기 팀을 등록하면 일반 사용자보다 불리하게
-- 영원히 심사 대기에 갇힙니다. 0009 를 읽고 0029 를 썼는데 그 뒤에 나온
-- 0010 을 놓쳐서, 이미 한 번 고쳐진 버그를 그대로 다시 만들었습니다.
--
-- ★ 운영자 특례를 없앱니다. 운영자도 같은 조건으로 판정하고, 필요하면 등록
--   후 UPDATE 로 상태를 바꿉니다 — 승인 상태 변경은 이미 운영자만 가능하도록
--   막혀 있습니다(fn_guard_approval_status, 0002/0010).
-- ============================================================

create or replace function public.fn_artist_auto_approve()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dup_count int;
begin
  -- 필수 항목이 비었으면 심사 대기로 남깁니다
  if coalesce(btrim(new.team_name), '') = ''
     or coalesce(btrim(new.genre), '') = ''
     or new.member_count is null or new.member_count <= 0
     or new.duration_min is null or new.duration_min <= 0 then
    new.status := 'pending';
    return new;
  end if;

  -- 위치가 없어 거리로 중복을 좁힐 수 없습니다. 그래서 이름이 완전히 같은
  -- 경우만 봅니다 — 다른 사람 팀 이름을 그대로 베낀 등록, 또는 같은 사람이
  -- 실수로 두 번 등록한 경우를 잡습니다.
  select count(*) into v_dup_count
  from public.artists a
  where a.id <> new.id
    and public.fn_norm_name(a.team_name) = public.fn_norm_name(new.team_name);

  if v_dup_count > 0 then
    new.status := 'pending';
    return new;
  end if;

  new.status := 'approved';
  new.reject_reason := null;
  return new;
end;
$$;

-- ─────────── 이 버그로 이미 대기 중인 팀 재판정 ───────────
--
-- 0029 가 적용된 뒤부터 지금까지, 운영자가 등록한 팀만 이 버그로 부당하게
-- pending 에 갇혀 있을 수 있습니다. 같은 조건으로 다시 판정해 조건을 만족하면
-- 공개로 바꿉니다. 일반 사용자가 등록해 정당하게 대기 중인 팀(이름 중복 등)은
-- 조건 자체가 안 맞아 그대로 남습니다.

update public.artists a
set status = 'approved', reject_reason = null
where a.status = 'pending'
  and coalesce(btrim(a.team_name), '') <> ''
  and coalesce(btrim(a.genre), '') <> ''
  and a.member_count is not null and a.member_count > 0
  and a.duration_min is not null and a.duration_min > 0
  and not exists (
    select 1 from public.artists o
    where o.id <> a.id
      and public.fn_norm_name(o.team_name) = public.fn_norm_name(a.team_name)
  );

-- 결과 확인: select team_name, status, owner_id from public.artists order by created_at desc;
