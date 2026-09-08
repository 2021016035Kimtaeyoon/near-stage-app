-- ============================================================
-- 신고 · 계정 삭제 (§16).
--
-- 둘 다 실서비스에 없으면 안 되는 것들입니다. 신고할 방법이 없는 서비스에는
-- 사람이 남지 않고, 계정 삭제는 개인정보보호법상 이용자의 권리입니다.
-- ============================================================

-- ─────────── ① 신고 ───────────
--
-- 대상이 공간·팀·클립·댓글·공연으로 여러 종류입니다. 표를 다섯 개 만들지 않고
-- (target_type, target_id) 로 둡니다 — 신고는 어차피 사람이 읽고 판단하는 것이라
-- 외래키로 무결성을 지킬 이득이 크지 않고, 대상이 삭제된 뒤에도 신고 기록은
-- 남아 있어야 합니다(같은 사람이 반복하는지 봐야 하니까요).

create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type text not null check (target_type in ('venue', 'artist', 'clip', 'comment', 'show')),
  target_id   uuid not null,
  reason      text not null check (
    reason in ('spam', 'sexual', 'violence', 'copyright', 'false_info', 'other')
  ),
  detail      text not null default '',
  status      text not null default 'open' check (status in ('open', 'resolved', 'rejected')),
  admin_note  text not null default '',
  created_at  timestamptz not null default now(),
  -- 같은 사람이 같은 대상을 여러 번 신고해도 한 건으로 봅니다
  constraint reports_unique_once unique (reporter_id, target_type, target_id)
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);
create index if not exists reports_target_idx on public.reports (target_type, target_id);

alter table public.reports enable row level security;

-- 신고 내용은 신고한 사람과 운영자만 봅니다. 신고당한 쪽에게 "누가 신고했는지"가
-- 보이면 보복이 일어나고, 그러면 아무도 신고하지 않습니다.
drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
  for select using (reporter_id = auth.uid() or public.fn_is_admin());

drop policy if exists reports_insert_self on public.reports;
create policy reports_insert_self on public.reports
  for insert with check (reporter_id = auth.uid());

drop policy if exists reports_update_admin on public.reports;
create policy reports_update_admin on public.reports
  for update using (public.fn_is_admin()) with check (public.fn_is_admin());

-- ─────────── ② 계정 삭제 ───────────
--
-- ★ 함정: shows.venue_id 는 on delete set null 인데, shows_source_shape CHECK 가
--   "우리 무대는 venue_id 와 artist_id 가 반드시 있어야 한다"고 요구합니다.
--   그래서 공간이 삭제될 때 shows.venue_id 를 null 로 바꾸려는 순간 CHECK 위반이
--   나고, 계정 삭제 전체가 실패합니다. 공연을 한 번이라도 한 호스트는 계정을
--   지울 수 없는 상태였습니다.
--
--   먼저 그 공연들을 지운 뒤 계정을 삭제합니다. 지나간 공연 기록과 그 공연에
--   달린 리뷰까지 함께 사라지는데, 그게 "삭제"의 뜻이므로 화면에서 그대로
--   알려주고 확인을 받습니다.
--
-- ★ Storage 의 사진·영상은 DB 연쇄 삭제로 지워지지 않습니다. 프론트에서 먼저
--   지우고 이 함수를 부릅니다. 실패해도 계정 삭제는 막지 않습니다 — 파일이 남는
--   것보다 계정을 못 지우는 게 더 큰 문제입니다.

create or replace function public.fn_delete_my_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception '로그인이 필요합니다' using errcode = '42501';
  end if;

  -- ① 내 공간·팀에 걸린 공연부터 지웁니다 (CHECK 위반 회피)
  delete from public.shows
  where venue_id in (select id from public.venues where owner_id = v_uid)
     or artist_id in (select id from public.artists where owner_id = v_uid);

  -- ② 계정 삭제. profiles 가 auth.users 를 on delete cascade 로 참조하고,
  --    venues·artists·attendances·likes·follows·reviews·notifications·messages·
  --    clip_likes·clip_comments 가 다시 profiles 를 연쇄 참조하므로 한 번에 정리됩니다.
  delete from auth.users where id = v_uid;
end;
$$;

revoke all on function public.fn_delete_my_account() from public;
grant execute on function public.fn_delete_my_account() to authenticated;

comment on function public.fn_delete_my_account is
  '본인 계정과 관련 데이터를 삭제합니다. Storage 파일은 프론트에서 먼저 지웁니다.';

-- ─────────── ③ 운영자가 신고를 보고 내릴 수 있게 ───────────
--
-- 공간·팀은 status 를 rejected 로 내리는 정책이 이미 있고(0003), 클립·댓글은
-- 0014·0015 에서 운영자 삭제를 열어뒀습니다. 공연만 빠져 있어서 채웁니다.

drop policy if exists shows_delete_admin on public.shows;
create policy shows_delete_admin on public.shows
  for delete using (public.fn_is_admin());
