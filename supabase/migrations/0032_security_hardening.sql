-- ============================================================
-- 배포 전 보안 점검(2026-09-17)에서 나온 구멍 다섯 개를 막습니다.
--
-- 전부 "화면은 막고 있지만 DB 는 열려 있던" 자리입니다. 브라우저 콘솔에서
-- supabase 클라이언트를 직접 부르면 통과하던 것들입니다 (SCHEMA.md §5 원칙).
--
-- 몇 번을 다시 실행해도 같은 결과가 되도록 썼습니다.
-- ============================================================


-- ─────────── 1. is_admin 은 본인이 바꿀 수 없습니다 ───────────
--
-- ★ 가장 큰 구멍이었습니다. profiles_update_self 는 "본인 행이면 어느 칸이든"
--   수정을 허용하는데, is_admin 을 지키는 트리거가 없었습니다. 로그인한 누구나
--     update profiles set is_admin = true where id = 내 id
--   한 줄로 운영자가 될 수 있었고, 승인 상태 가드(fn_guard_approval_status)와
--   fn_is_admin() 에 기대는 모든 정책이 같이 무너집니다.
--
--   venues/artists 의 status 와 같은 방식으로 막습니다 — 운영자이거나
--   서버측(SQL Editor·service_role, auth.uid() 없음)일 때만 바꿀 수 있습니다.
--   ops/grant_admin.sql 은 SQL Editor 에서 돌리므로 그대로 동작합니다.

create or replace function public.fn_guard_profile_admin()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.is_admin is distinct from old.is_admin then
    if auth.uid() is null then
      return new;
    end if;
    if not coalesce(
      (select p.is_admin from public.profiles p where p.id = auth.uid()),
      false
    ) then
      raise exception '운영자 권한은 본인이 변경할 수 없습니다'
        using errcode = '42501';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_admin on public.profiles;
create trigger profiles_guard_admin
  before update on public.profiles
  for each row execute function public.fn_guard_profile_admin();


-- ─────────── 2. 전화번호는 공개하지 않습니다 ───────────
--
-- profiles_select_all 이 using (true) 라 phone 칸까지 비로그인 포함 누구에게나
-- 읽혔습니다. RLS 는 "행"만 거르고 "칸"은 못 거르므로 칸 단위 권한으로 막습니다.
--
-- ★ 테이블 전체 SELECT 가 주어져 있으면 칸 하나만 revoke 해도 효과가 없습니다.
--   전체를 걷고, 공개해도 되는 칸만 다시 줍니다. 화면은 이 칸들만 읽습니다
--   (useAuth.ts, 리뷰·댓글 작성자 표기).
--
--   앞으로 profiles 에 공개할 칸을 추가하면 여기 grant 목록에도 넣어야 합니다.
--   안 넣으면 그 칸을 select 할 때 permission denied 가 납니다.

revoke select on public.profiles from anon, authenticated;
grant select (id, display_name, avatar_url, is_admin, created_at)
  on public.profiles to anon, authenticated;


-- ─────────── 3. 리뷰는 "그 공연"에 참석한 사람만 ───────────
--
-- 0012 의 정책 안에서
--     select 1 from attendances a where a.show_id = show_id ...
-- 의 오른쪽 show_id 는 reviews.show_id 가 아니라 가장 가까운 a.show_id 로
-- 풀립니다. 즉 a.show_id = a.show_id, 항상 참입니다. 아무 공연이든 한 번만
-- 참석했으면 끝난 공연 어디에나 리뷰를 쓸 수 있었습니다.
-- 테이블 이름을 붙여 의도대로 고칩니다.

drop policy if exists reviews_insert_attendee on public.reviews;

create policy reviews_insert_attendee on public.reviews
  for insert with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.shows s
      where s.id = reviews.show_id
        and s.status <> 'canceled'
        and s.starts_at + make_interval(mins => s.duration_min) < now()
    )
    and exists (
      select 1 from public.attendances a
      where a.show_id = reviews.show_id
        and a.user_id = auth.uid()
        and a.status <> 'canceled'
    )
  );


-- ─────────── 4. 채팅 메시지는 읽음 표시만 바꿀 수 있습니다 ───────────
--
-- messages_update_parties 는 읽음 표시(read_at)를 위해 대화 당사자에게 UPDATE 를
-- 열어둔 것인데, 칸 제한이 없어 상대가 보낸 글의 본문까지 고칠 수 있었습니다.
-- 본문·보낸 사람·대화방·시각은 한 번 쓰면 바뀌지 않게 합니다.

create or replace function public.fn_guard_message_immutable()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.body is distinct from old.body
     or new.sender_id is distinct from old.sender_id
     or new.thread_id is distinct from old.thread_id
     or new.created_at is distinct from old.created_at then
    raise exception '보낸 메시지는 수정할 수 없습니다'
      using errcode = '42501';
  end if;
  return new;
end;
$$;

drop trigger if exists messages_guard_immutable on public.messages;
create trigger messages_guard_immutable
  before update on public.messages
  for each row execute function public.fn_guard_message_immutable();


-- ─────────── 5. 링크는 http(s) 주소만 ───────────
--
-- 클립 링크와 예매 링크는 화면에서 <a href> 로 그대로 나갑니다. 형식 검사가
-- 화면에만 있어서, 직접 호출하면 javascript: 로 시작하는 주소를 넣을 수 있었습니다.
--
-- ★ not valid — 이미 들어 있는 행은 검사하지 않고, 앞으로 들어오는 것만 막습니다.
--   기존 데이터 때문에 이 파일 전체가 실패하지 않게 하기 위해서입니다.

alter table public.artist_clips drop constraint if exists artist_clips_url_http;
alter table public.artist_clips
  add constraint artist_clips_url_http check (url ~* '^https?://') not valid;

alter table public.shows drop constraint if exists shows_external_url_http;
alter table public.shows
  add constraint shows_external_url_http
  check (external_url is null or external_url ~* '^https?://') not valid;


-- ─────────── 확인 ───────────
-- 트리거 두 개가 보여야 합니다: profiles_guard_admin, messages_guard_immutable
select tgrelid::regclass as table_name, tgname
from pg_trigger
where tgname in ('profiles_guard_admin', 'messages_guard_immutable');
