-- ============================================================
-- 첫 운영자 지정
--
-- is_admin 은 RLS 와 트리거로 본인이 바꿀 수 없게 막혀 있습니다. 당연히 그래야
-- 하지만, 그래서 첫 운영자는 SQL 로 직접 지정해야 합니다.
--
-- 실행 방법: Supabase 대시보드 → SQL Editor 에 붙여넣고 Run.
-- ============================================================

update public.profiles
set is_admin = true
where id = 'd9564033-cc6e-49a3-a07a-116bfda3b65e';

-- 확인
select id, display_name, is_admin from public.profiles;
