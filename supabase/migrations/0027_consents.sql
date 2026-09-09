-- ============================================================
-- 약관 동의 기록.
--
-- 지금까지 로그인 시트에 "로그인하면 동의하는 것으로 봅니다"라고 적어뒀을 뿐,
-- 실제로 언제 무슨 버전에 동의했는지는 어디에도 남기지 않았습니다. 나중에
-- 분쟁이 생기면 "동의했다"는 사실을 증명할 방법이 없습니다.
--
-- ★ profiles 에 컬럼을 추가하지 않고 별도 표로 둡니다. 약관이 개정되면 그때마다
--   다시 동의를 받아야 하는데, 컬럼 하나로는 마지막 동의만 남고 이전 기록이
--   덮어써집니다. 표로 두면 "1차 가입 때는 이 버전에, 개정 후 이 버전에 다시"가
--   전부 남습니다.
--
-- ★ 지우거나 고칠 수 없습니다(append-only). 동의 기록은 증거이고, 증거를
--   본인이 수정할 수 있으면 증거가 아닙니다.
-- ============================================================

create table if not exists public.consents (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  kind       text not null check (kind in ('terms', 'privacy')),
  -- src/config/legal.ts 의 LEGAL_UPDATED_AT 값을 그대로 씁니다. 그 파일이
  -- 바뀌면(약관 개정) 새 버전으로 다시 한 행이 쌓입니다.
  version    text not null,
  agreed_at  timestamptz not null default now(),
  constraint consents_unique_version unique (user_id, kind, version)
);

create index if not exists consents_user_idx on public.consents (user_id);

alter table public.consents enable row level security;

-- 본인 기록은 본인이 보고, 운영자는 분쟁 대응을 위해 전체를 봅니다.
drop policy if exists consents_select on public.consents;
create policy consents_select on public.consents
  for select using (user_id = auth.uid() or public.fn_is_admin());

-- ★ 본인 동의만 남길 수 있습니다. update·delete 정책이 없으므로 한번 남긴
--   기록은 아무도(운영자 포함) 고칠 수 없습니다 — RLS 는 없는 작업을 허용하지
--   않는 방식으로 되어 있어서, 정책을 만들지 않는 것 자체가 차단입니다.
drop policy if exists consents_insert_own on public.consents;
create policy consents_insert_own on public.consents
  for insert with check (user_id = auth.uid());
