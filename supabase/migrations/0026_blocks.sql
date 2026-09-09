-- ============================================================
-- 차단.
--
-- 채팅·댓글이 있는데 차단이 없었습니다. 괴롭히는 사람을 만나면 할 수 있는
-- 일이 신고 하나뿐이고, 신고가 처리될 때까지 그 사람 글이 계속 보입니다.
--
-- ★ 이 서비스가 감출 수 있는 범위만 다룹니다. 차단은 "내 화면에서 안 보이게"
--   입니다 — 상대를 앱에서 못 쓰게 막는 게 아닙니다(그건 운영자의 신고 조치
--   영역입니다). 클립 댓글처럼 전체 공개 글에 적용됩니다.
-- ============================================================

create table if not exists public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  constraint blocks_not_self check (blocker_id <> blocked_id)
);

create index if not exists blocks_blocked_idx on public.blocks (blocked_id);

alter table public.blocks enable row level security;

-- 내 차단 목록은 나만 봅니다. 차단당한 사람에게 "누가 차단했는지"가 보이면
-- 보복이 일어나고, 그러면 아무도 차단하지 않습니다(신고와 같은 원칙).
drop policy if exists blocks_select_own on public.blocks;
create policy blocks_select_own on public.blocks
  for select using (blocker_id = auth.uid());

drop policy if exists blocks_insert_own on public.blocks;
create policy blocks_insert_own on public.blocks
  for insert with check (blocker_id = auth.uid());

drop policy if exists blocks_delete_own on public.blocks;
create policy blocks_delete_own on public.blocks
  for delete using (blocker_id = auth.uid());
