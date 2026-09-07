-- ============================================================
-- KOPIS 수집 자동 실행 — 매일 새벽 4시(KST)
--
-- pg_cron 과 pg_net 은 Supabase 에 이미 있습니다. Edge Function 을 HTTP 로
-- 호출하는 방식이라, 함수 배포가 끝난 뒤에 이 파일을 실행하세요.
--
-- ★ 아래 <SERVICE_ROLE_KEY> 자리는 직접 채워야 합니다. 이 SQL 을 저장소에
--   커밋하지 마세요 — 대신 Supabase 대시보드 SQL Editor 에서 한 번만 실행하고
--   이 파일은 예시로 두세요.
-- ============================================================

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 이미 등록된 같은 이름의 작업이 있으면 지웁니다
select cron.unschedule('sync-kopis-daily')
where exists (select 1 from cron.job where jobname = 'sync-kopis-daily');

select cron.schedule(
  'sync-kopis-daily',
  -- UTC 기준입니다. 19:00 UTC = 04:00 KST
  '0 19 * * *',
  $$
  select net.http_post(
    url := 'https://rbsywpjywbylmuacrkkh.supabase.co/functions/v1/sync-kopis',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer <SERVICE_ROLE_KEY>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- 확인: select * from cron.job;
-- 실행 이력: select * from cron.job_run_details order by start_time desc limit 10;
