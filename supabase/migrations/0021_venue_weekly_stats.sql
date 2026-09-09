-- ============================================================
-- 주간 손님 수 — 호스트를 설득하는 유일한 숫자.
--
-- 지금은 공연별 실제 방문객(show_reports)만 있습니다. 그런데 호스트가 알고 싶은 건
-- "공연을 하면 손님이 느는가" 이고, 그걸 알려면 **공연이 없던 주**도 있어야 합니다.
-- 비교 대상이 없으면 아무것도 증명하지 못합니다.
--
-- ★ 우리가 추정하지 않습니다. 사장님이 주 1회 적은 숫자로만 계산합니다. 예전
--   대시보드에 있던 "예상 추가 집객"은 공연 없던 날의 방문객을 우리가 알 방법이
--   없는데도 숫자를 만들어냈고, 그래서 지웠습니다. 이 표는 그 자리를 정직하게
--   채우는 방법입니다.
--
-- ★ 공연이 있었는지는 저장하지 않고 shows 에서 셉니다. 저장해두면 나중에 공연이
--   취소되거나 추가됐을 때 어긋납니다. 사실이 한 군데에만 있어야 합니다.
-- ============================================================

create table if not exists public.venue_weekly_stats (
  id            uuid primary key default gen_random_uuid(),
  venue_id      uuid not null references public.venues (id) on delete cascade,
  -- 그 주의 월요일 (KST 기준). 주 단위를 하나로 고정해야 비교가 성립합니다.
  week_start    date not null,
  visitor_count integer not null check (visitor_count >= 0),
  note          text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  constraint venue_weekly_unique unique (venue_id, week_start)
);

create index if not exists venue_weekly_idx
  on public.venue_weekly_stats (venue_id, week_start desc);

alter table public.venue_weekly_stats enable row level security;

-- ★ 가게 매출과 직결되는 영업 정보입니다. 공간 주인과 운영자만 봅니다.
--   관객에게도, 아티스트에게도, 다른 호스트에게도 보이지 않습니다.
drop policy if exists venue_weekly_rw_owner on public.venue_weekly_stats;
create policy venue_weekly_rw_owner on public.venue_weekly_stats
  for all using (public.fn_owns_venue(venue_id) or public.fn_is_admin())
  with check (public.fn_owns_venue(venue_id));

-- ─────────── 주 단위 요약 뷰 ───────────
--
-- ★ security_invoker = true 입니다. v_public_shows 와 반대입니다.
--   그 뷰는 "개별 행은 숨기고 집계만 공개"하려고 소유자 권한으로 돌렸지만,
--   이 뷰는 숨겨야 할 데이터 그 자체라 호출자 권한으로 돌려 RLS 를 그대로
--   태워야 합니다. false 로 두면 남의 가게 매출이 통째로 새어 나갑니다.

drop view if exists public.v_venue_weekly;

create view public.v_venue_weekly
with (security_invoker = true)
as
select
  w.id,
  w.venue_id,
  w.week_start,
  w.visitor_count,
  w.note,
  w.updated_at,
  coalesce(sc.show_count, 0) as show_count
from public.venue_weekly_stats w
left join lateral (
  -- 그 주(월 00:00 ~ 다음 월 00:00, KST)에 열린 우리 무대 수
  select count(*) as show_count
  from public.shows s
  where s.venue_id = w.venue_id
    and s.source = 'own'
    and s.status <> 'canceled'
    and s.starts_at >= (w.week_start::timestamp at time zone 'Asia/Seoul')
    and s.starts_at <  ((w.week_start + 7)::timestamp at time zone 'Asia/Seoul')
) sc on true;

grant select on public.v_venue_weekly to authenticated;

-- ─────────── 수정 시각 자동 갱신 ───────────

create or replace function public.fn_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists venue_weekly_touch on public.venue_weekly_stats;
create trigger venue_weekly_touch
  before update on public.venue_weekly_stats
  for each row execute function public.fn_touch_updated_at();
