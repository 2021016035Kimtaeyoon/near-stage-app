-- ============================================================
-- 클라이언트 오류 수집 (출시 전 점검에서 발견).
--
-- 지금은 사용자가 겪은 크래시를 알 방법이 없습니다. 오늘 "공연 눌렀을 때 화면이
-- 안 뜬다"는 문제도 사장님이 말해주셔야 알았고, 그때까지 며칠 동안 아무도 공연
-- 상세를 볼 수 없었습니다.
--
-- 외부 서비스(Sentry 등)를 붙이지 않은 이유:
--   ① 무료 플랜도 계정·키 관리가 늘고, 개인정보처리방침에 위탁 항목을 추가해야
--      합니다. "받는 정보를 최소로"라는 원칙과 어긋납니다.
--   ② 우리가 필요한 건 "어느 화면이 죽었나" 하나입니다. 표 하나로 충분합니다.
--
-- ★ 개인정보를 담지 않습니다. 사용자 id 도 넣지 않습니다 — 누가 겪었는지가 아니라
--   어디가 죽었는지가 필요합니다. user agent 도 브라우저 종류만 짧게 자릅니다.
--
-- ★ 아무나 INSERT 할 수 있습니다(로그인 전에도 크래시가 나므로). 대신 읽기는
--   운영자만이고, 길이 제한과 하루 정리로 쓰레기가 쌓이지 않게 합니다.
-- ============================================================

create table if not exists public.client_errors (
  id         uuid primary key default gen_random_uuid(),
  -- 어느 화면에서 났는지 (해시 경로. 쿼리는 떼고 저장합니다)
  route      text not null default '' check (char_length(route) <= 200),
  message    text not null default '' check (char_length(message) <= 500),
  -- 스택은 앞부분만. 전체를 담으면 표가 금방 커집니다
  stack      text not null default '' check (char_length(stack) <= 2000),
  -- 'Chrome 131 / Android' 정도. 전체 UA 는 지문이 되므로 자릅니다
  agent      text not null default '' check (char_length(agent) <= 120),
  app_build  text not null default '' check (char_length(app_build) <= 60),
  created_at timestamptz not null default now()
);

create index if not exists client_errors_recent_idx on public.client_errors (created_at desc);

alter table public.client_errors enable row level security;

-- 로그인 전에도 크래시가 납니다. 그래서 익명도 넣을 수 있어야 합니다.
drop policy if exists client_errors_insert_any on public.client_errors;
create policy client_errors_insert_any on public.client_errors
  for insert to anon, authenticated with check (true);

-- 읽기는 운영자만. 오류 메시지에 화면 정보가 담기므로 공개하지 않습니다.
drop policy if exists client_errors_select_admin on public.client_errors;
create policy client_errors_select_admin on public.client_errors
  for select using (public.fn_is_admin());

drop policy if exists client_errors_delete_admin on public.client_errors;
create policy client_errors_delete_admin on public.client_errors
  for delete using (public.fn_is_admin());

-- ─────────── 오래된 기록 정리 ───────────
-- 30일이면 충분합니다. 그보다 오래된 크래시는 이미 고쳤거나 잊힌 것입니다.

create or replace function public.fn_prune_client_errors()
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.client_errors where created_at < now() - interval '30 days';
$$;
