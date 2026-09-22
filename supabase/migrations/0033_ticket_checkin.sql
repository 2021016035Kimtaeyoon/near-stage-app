-- ============================================================
-- 우리 무대 QR 체크인 (§12 후속).
--
-- MyReservations.tsx·PreShowChecklist.tsx 에는 "QR 티켓 없음"이라고 못박은
-- 이유가 적혀 있었습니다 — 결제·좌석 지정이 없는데 티켓처럼 보이면 관객이
-- 입장을 보장받았다고 오해한다는 것. 그 우려는 지금도 유효해서, 이번에
-- 참석 예정을 "선착순으로 정원까지만" 받도록 같이 손봅니다 — 정원 안에서는
-- 실제로 입장이 보장되므로, 그제서야 QR이 오해를 만들지 않습니다.
--
-- 이 마이그레이션이 하는 일 네 가지:
--  1. 정원 초과를 DB 레벨에서도 막습니다(화면은 이미 막고 있었지만, 프론트
--     체크는 API를 직접 때리면 뚫립니다 — §1 원칙).
--  2. 노쇼 3회면 새 참석 예정 등록을 막습니다. "노쇼"는 참석 예정을 눌러놓고
--     체크인(QR)도 안 하고 공연이 끝난 경우로 정의합니다.
--  3. 체크인은 attendances.status 를 'attended' 로 바꾸는 것뿐입니다 — 새
--     테이블도, 서명된 토큰도 없습니다. attendances.id (UUID, 추측 불가능)
--     자체가 QR에 담기는 티켓 값입니다. 누가 이 값을 알아도, 본인이거나
--     그 공연의 호스트·아티스트가 아니면 RLS가 UPDATE를 막습니다.
--  4. 호스트만 체크인할 수 있었던 걸 아티스트도 할 수 있게 엽니다 — 공연
--     당일 문 앞에 있는 건 호스트일 수도, 아티스트 팀원일 수도 있습니다.
-- ============================================================

-- ─────────── 좌석 배치도 (선택) ───────────

alter table public.shows
  add column if not exists seat_map_url text;

comment on column public.shows.seat_map_url is
  '호스트가 올린 좌석 배치도 이미지. 없으면 null — 필수 항목이 아닙니다.';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('show-seatmaps', 'show-seatmaps', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "seatmaps_public_read" on storage.objects;
drop policy if exists "seatmaps_insert_own_folder" on storage.objects;
drop policy if exists "seatmaps_update_own_folder" on storage.objects;
drop policy if exists "seatmaps_delete_own_folder" on storage.objects;

create policy "seatmaps_public_read" on storage.objects
  for select using (bucket_id = 'show-seatmaps');

create policy "seatmaps_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'show-seatmaps' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "seatmaps_update_own_folder" on storage.objects
  for update to authenticated
  using (bucket_id = 'show-seatmaps' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "seatmaps_delete_own_folder" on storage.objects
  for delete to authenticated
  using (bucket_id = 'show-seatmaps' and (storage.foldername(name))[1] = auth.uid()::text);

-- ─────────── 정원 · 노쇼 가드 ───────────

create or replace function public.fn_no_show_count(p_user_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  -- 노쇼 = 참석 예정을 눌러놓고(going), 취소도 체크인(attended)도 없이
  -- 공연 시간이 지난 경우. 취소했으면 노쇼가 아니고, 체크인했으면 실제로 온
  -- 것이니 당연히 노쇼가 아닙니다.
  select count(*)::int
  from public.attendances a
  join public.shows s on s.id = a.show_id
  where a.user_id = p_user_id
    and a.status = 'going'
    and s.starts_at + (s.duration_min || ' minutes')::interval < now();
$$;

create or replace function public.fn_guard_attendance()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_show      public.shows%rowtype;
  v_going_sum integer;
  v_no_shows  integer;
begin
  -- 참석 예정으로 들어가거나(전환), 이미 간 채로 인원수를 늘리는 경우 정원을
  -- 검사합니다. 노쇼 검사는 처음 전환되는 순간에만 — 인원수만 늘리는 기존
  -- 참석자를 매번 다시 막을 이유는 없습니다.
  if new.status = 'going' and (tg_op = 'INSERT' or old.status is distinct from 'going' or old.headcount is distinct from new.headcount) then
    select * into v_show from public.shows where id = new.show_id;

    select coalesce(sum(headcount), 0) into v_going_sum
    from public.attendances
    where show_id = new.show_id and status = 'going' and id is distinct from new.id;

    if v_going_sum + new.headcount > v_show.capacity then
      raise exception '정원이 다 찼어요' using errcode = 'P0001';
    end if;
  end if;

  if new.status = 'going' and (tg_op = 'INSERT' or old.status is distinct from 'going') then
    v_no_shows := public.fn_no_show_count(new.user_id);
    if v_no_shows >= 3 then
      raise exception '노쇼 3회로 참석 예정 등록이 제한되었어요' using errcode = 'P0001';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists attendances_guard on public.attendances;
create trigger attendances_guard
  before insert or update on public.attendances
  for each row execute function public.fn_guard_attendance();

-- ─────────── RLS: 체크인은 호스트뿐 아니라 아티스트도 ───────────

drop policy if exists attendances_select_self_or_host on public.attendances;
drop policy if exists attendances_update_self_or_host on public.attendances;

create policy attendances_select_self_or_host on public.attendances
  for select using (
    user_id = auth.uid()
    or exists (
      select 1 from public.shows s
      where s.id = show_id
        and (public.fn_owns_venue(s.venue_id) or public.fn_owns_artist(s.artist_id))
    )
  );

create policy attendances_update_self_or_host on public.attendances
  for update using (
    user_id = auth.uid()
    or exists (
      select 1 from public.shows s
      where s.id = show_id
        and (public.fn_owns_venue(s.venue_id) or public.fn_owns_artist(s.artist_id))
    )
  );

-- 결과 확인:
--   select policyname, cmd from pg_policies where tablename = 'attendances';
--   select tgname from pg_trigger where tgrelid = 'public.attendances'::regclass;
