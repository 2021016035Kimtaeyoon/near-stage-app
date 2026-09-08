-- ============================================================
-- 지난 등록 공연 정리 + 자동 실행.
--
-- 등록 공연(KOPIS)은 매일 새로 들어오는데 지난 것이 계속 쌓입니다. 목록에서는
-- 시간으로 걸러지지만 표에는 남아서, 몇 달이면 수천 건이 되고 뷰의 집계가 느려집니다.
--
-- ★ 우리 무대(source='own')는 절대 지우지 않습니다. 지난 공연에 리뷰와 방문객
--   기록(show_reports)이 달려 있고, 그게 호스트를 설득하는 유일한 증거입니다.
--   지우면 "이 가게에서 공연이 몇 번 있었고 몇 명 왔는지"가 사라집니다.
--
-- ★ 끝난 지 7일까지는 남깁니다. 어제 끝난 공연을 오늘 찾는 사람이 있고,
--   공유 링크를 받아 열었을 때 "없는 공연"이 되면 안 됩니다.
-- ============================================================

create or replace function public.fn_prune_past_kopis()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_deleted integer;
begin
  with gone as (
    delete from public.shows
    where source = 'kopis'
      and coalesce(run_ends_at, starts_at + make_interval(mins => duration_min))
          < now() - interval '7 days'
    returning 1
  )
  select count(*) into v_deleted from gone;

  return v_deleted;
end;
$$;

comment on function public.fn_prune_past_kopis is
  '끝난 지 7일 지난 등록 공연을 지웁니다. 우리 무대는 건드리지 않습니다.';

-- ─────────── 자동 실행 ───────────
--
-- ★ Supabase 무료 플랜은 7일간 요청이 없으면 프로젝트를 일시정지합니다. 출시 초기에
--   트래픽이 없으면 일주일 뒤 앱이 죽습니다. 매일 도는 크론이 그걸 막는 역할도
--   함께 합니다 — 정리 작업이 곧 생존 신호입니다.

create extension if not exists pg_cron;

-- 이미 등록된 같은 이름의 작업이 있으면 지웁니다
select cron.unschedule('prune-past-kopis')
where exists (select 1 from cron.job where jobname = 'prune-past-kopis');

-- 매일 새벽 4시 20분 KST (= 19:20 UTC). KOPIS 수집(4시)이 끝난 뒤에 정리합니다.
select cron.schedule(
  'prune-past-kopis',
  '20 19 * * *',
  $job$ select public.fn_prune_past_kopis(); $job$
);
