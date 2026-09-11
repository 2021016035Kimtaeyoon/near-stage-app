-- ============================================================
-- 공연이 확정된 슬롯(잠긴 슬롯)을 DB 레벨에서도 보호합니다.
--
-- ★ 지금까지는 "공연이 잡힌 슬롯은 못 지운다/못 닫는다"는 규칙이 화면 코드
--   (src/hooks/useSlots.ts, src/screens/host/VenueSlotsScreen.tsx)에만
--   있었고, RLS 는 사장님이 자기 공간의 슬롯이면 뭐든 허용했습니다
--   (venue_slots_write_owner, for all). 개발자 도구로 직접 호출하거나,
--   나중에 다른 화면에서 이 확인을 빼먹으면 확정된 공연의 슬롯을
--   지우거나 다시 열 수 있었습니다 — shows.slot_id 는 on delete set null
--   이라 공연 자체는 안 지워지지만, 이중 예약 방지(UNIQUE 제약)가 그
--   시간대에서 조용히 사라집니다.
--
-- ★ "프론트가 조건을 빼먹어도 DB 가 막는다"는 이 프로젝트의 원칙(SCHEMA.md
--   §5)에 맞춰, 잠긴 슬롯(locked_by_show_id is not null)은 사장님도
--   수정·삭제할 수 없게 막습니다. 잠금을 걸고 푸는 건 이미 security
--   definer 함수(fn_accept_application, fn_cancel_show)만 하고 있고,
--   이 함수들은 RLS 를 우회하므로 정상 흐름은 전혀 영향받지 않습니다.
-- ============================================================

drop policy if exists venue_slots_write_owner on public.venue_slots;

create policy venue_slots_insert_owner on public.venue_slots
  for insert with check (public.fn_owns_venue(venue_id));

create policy venue_slots_update_owner on public.venue_slots
  for update
  using (public.fn_owns_venue(venue_id) and locked_by_show_id is null)
  with check (public.fn_owns_venue(venue_id) and locked_by_show_id is null);

create policy venue_slots_delete_owner on public.venue_slots
  for delete using (public.fn_owns_venue(venue_id) and locked_by_show_id is null);

-- 결과 확인:
--   select policyname, cmd from pg_policies where tablename = 'venue_slots';
