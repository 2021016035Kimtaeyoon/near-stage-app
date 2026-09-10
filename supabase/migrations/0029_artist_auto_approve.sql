-- ============================================================
-- 아티스트 자동 승인.
--
-- 공간은 0009 에서 자동 승인을 넣었는데 아티스트는 그대로 뒀습니다 — "주소처럼
-- 기계가 확인할 수 있는 근거가 없다"는 이유였습니다. 맞는 말이지만, 그 근거가
-- 하는 일을 다시 보면 이야기가 달라집니다.
--
-- ★ 공간 자동 승인이 실제로 확인하는 것: 좌표가 진짜인지, 대한민국 안인지,
--   같은 자리에 같은 이름이 이미 있는지. "등록한 사람이 진짜 주인인지"는 그때도
--   확인하지 못했고, 그건 지금도 운영자의 사후 조치(신고 처리) 몫으로 남아
--   있습니다. 즉 자동 승인은 "이 사람이 진짜인가"를 보증한 적이 없습니다 —
--   "지도에 노출은 시키되, 명백히 이상한 것만 거른다"였을 뿐입니다.
--
-- ★ 그리고 아티스트가 승인돼도 곧바로 공연이 열리지는 않습니다. 승인은 "구인글에
--   지원할 수 있다"는 뜻이고, 실제로 공연이 생기는 유일한 통로는
--   fn_accept_application 입니다 — 그건 호스트가 그 팀의 지원 내용을 직접 보고
--   수락을 누르는 별개의 사람 판단입니다. 사전 승인을 늦춘다고 그 판단이
--   더 안전해지지 않습니다. 안전장치는 이미 호스트 쪽에 있었습니다.
--
-- ★ 그래서 공간과 똑같은 기준만 적용합니다 — 아티스트에게 "주소"에 해당하는
--   유일한 기계 확인 가능 사실은 팀 이름입니다: 필수 항목이 채워졌는지, 같은
--   이름의 팀이 이미 있는지. 그 이상(정말 이 사람이 이 팀인지, 프로필이
--   진짜인지)은 기계로 확인할 수 없다는 원래 판단은 여전히 맞고, 그건 여전히
--   운영자의 사후 조치 몫입니다 — 사전 승인을 늦춘다고 해결되는 문제가
--   아니었습니다.
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
  -- 운영자가 대신 등록하는 경우는 판정 없이 그대로 둡니다
  if coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false) then
    return new;
  end if;

  -- 필수 항목이 비었으면 심사 대기로 남깁니다
  if coalesce(btrim(new.team_name), '') = ''
     or coalesce(btrim(new.genre), '') = ''
     or new.member_count is null or new.member_count <= 0
     or new.duration_min is null or new.duration_min <= 0 then
    new.status := 'pending';
    return new;
  end if;

  -- ★ 위치가 없어 거리로 중복을 좁힐 수 없습니다. 그래서 이름이 완전히 같은
  --   경우만 봅니다 — 다른 사람 팀 이름을 그대로 베낀 등록, 또는 같은 사람이
  --   실수로 두 번 등록한 경우를 잡습니다. 부분 일치까지 보면 흔한 밴드
  --   이름("더 버스커즈" 류)이 전부 걸려 정상적인 신규 팀도 막힙니다.
  select count(*) into v_dup_count
  from public.artists a
  where a.id <> new.id
    and public.fn_norm_name(a.team_name) = public.fn_norm_name(new.team_name);

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

drop trigger if exists artists_auto_approve on public.artists;
create trigger artists_auto_approve
  before insert on public.artists
  for each row execute function public.fn_artist_auto_approve();

comment on function public.fn_artist_auto_approve is
  '등록 즉시 지원 가능 여부를 DB가 판정합니다. 필수 항목 누락이나 팀 이름 중복이면 pending 으로 남아 운영자 확인을 받습니다.';
