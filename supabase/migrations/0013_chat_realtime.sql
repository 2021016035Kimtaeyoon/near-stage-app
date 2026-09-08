-- ============================================================
-- 채팅 Realtime (§13).
--
-- 채팅에서 새로고침을 시키면 그건 채팅이 아닙니다. 상대가 보낸 메시지가 바로
-- 붙어야 "몇 시에 갈까요"가 대화가 됩니다.
--
-- ★ Realtime 도 RLS 를 지킵니다. messages_select_parties 가 이 방의 공간이나
--   팀을 가진 사람만 통과시키므로, 남의 대화가 구독으로 새어 나가지 않습니다.
--   여기 오가는 건 개런티 협의 같은 내용이라 새면 안 됩니다.
--
-- threads 는 구독하지 않습니다. 대화방은 수락하는 순간 한 번 생기고 그 뒤로
-- 바뀌지 않아서, 목록은 화면에 들어올 때 읽으면 충분합니다.
-- ============================================================

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'messages'
  ) then
    alter publication supabase_realtime add table public.messages;
  end if;
end
$$;
