-- ============================================================
-- 호스트가 아티스트를 먼저 찾아 초대합니다.
--
-- 지금까지 마켓플레이스가 반쪽이었습니다. 아티스트는 공간을 탐색할 수
-- 있는데(/performer/explore), 호스트는 구인글을 올리고 지원이 오기만
-- 기다릴 수밖에 없었습니다. 마음에 드는 팀을 봐도 연락할 방법이 없습니다.
--
-- ★ 새 메시지 채널을 열지 않습니다. threads/messages 는 공연이 확정된 뒤에만
--   열립니다(0001) — 확정 전에 자유 채팅을 열면 전화번호 교환이나 대금 협상이
--   플랫폼 밖에서 일어나게 됩니다. 초대는 정해진 문장 하나(내 구인글 + 짧은
--   메시지)만 오갑니다.
--
-- ★ applications 표에 직접 넣지 않습니다. applications 는 "아티스트가 낸
--   지원"이라는 사실 자체이고, RLS 도 그렇게 짜여 있습니다
--   (applications_insert_own_artist: fn_owns_artist(artist_id) 만 허용).
--   호스트가 그 표에 쓸 수 있게 열면 "아티스트가 지원한 것"과 "호스트가
--   대신 써넣은 것"을 구분할 수 없게 됩니다. 초대는 별개의 사실이라 별개의
--   표로 둡니다. 아티스트가 초대를 보고 실제로 지원을 누르면, 그때
--   applications 에 정상적으로 한 행이 생깁니다.
-- ============================================================

create table if not exists public.post_invites (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts (id) on delete cascade,
  artist_id  uuid not null references public.artists (id) on delete cascade,
  invited_by uuid not null references public.profiles (id) on delete cascade,
  message    text not null default '',
  created_at timestamptz not null default now(),
  -- 같은 구인글로 같은 팀을 두 번 초대하지 않습니다
  constraint post_invites_unique unique (post_id, artist_id)
);

create index if not exists post_invites_artist_idx on public.post_invites (artist_id);
create index if not exists post_invites_post_idx on public.post_invites (post_id);

alter table public.post_invites enable row level security;

-- 초대를 보낸 호스트와 초대받은 팀만 봅니다. 다른 팀에게 "누구를 찍었는지"가
-- 보이면 안 됩니다 — 지원 내용을 서로 못 보게 한 것과 같은 이유입니다.
drop policy if exists post_invites_select_parties on public.post_invites;
create policy post_invites_select_parties on public.post_invites
  for select using (
    public.fn_owns_artist(artist_id)
    or exists (
      select 1 from public.posts p
      where p.id = post_id and public.fn_owns_venue(p.venue_id)
    )
    or public.fn_is_admin()
  );

-- 내 구인글로만 초대를 보낼 수 있습니다
drop policy if exists post_invites_insert_venue_owner on public.post_invites;
create policy post_invites_insert_venue_owner on public.post_invites
  for insert with check (
    invited_by = auth.uid()
    and exists (
      select 1 from public.posts p
      where p.id = post_id and public.fn_owns_venue(p.venue_id)
    )
  );

-- 지운다 = 취소(호스트) 또는 닫기(아티스트). 아티스트가 지원을 누르면
-- 프론트에서 이 행을 지웁니다 — "초대함" 목록에 이미 지원한 것까지 남아
-- 있으면 다시 지원하라는 것처럼 보입니다.
drop policy if exists post_invites_delete_parties on public.post_invites;
create policy post_invites_delete_parties on public.post_invites
  for delete using (
    public.fn_owns_artist(artist_id)
    or exists (
      select 1 from public.posts p
      where p.id = post_id and public.fn_owns_venue(p.venue_id)
    )
  );

-- ─────────── 초대받으면 알림 ───────────

create or replace function public.fn_notify_post_invite()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_artist_owner uuid;
  v_venue_name   text;
begin
  select owner_id into v_artist_owner from public.artists where id = new.artist_id;

  select v.name into v_venue_name
  from public.posts p join public.venues v on v.id = p.venue_id
  where p.id = new.post_id;

  if v_artist_owner is not null then
    insert into public.notifications (user_id, type, title, body, link)
    values (
      v_artist_owner,
      'invited',
      '초대를 받았어요',
      coalesce(v_venue_name, '공간') || '에서 우리 팀에 관심을 보였어요',
      '/performer/posts'
    );
  end if;

  return new;
end;
$$;

drop trigger if exists post_invites_notify on public.post_invites;
create trigger post_invites_notify
  after insert on public.post_invites
  for each row execute function public.fn_notify_post_invite();

-- ★ 트리거 함수도 PostgREST 의 /rest/v1/rpc/ 로 노출됩니다(0025 에서 확인한
--   문제와 같은 종류). 사람이 직접 부를 일이 없으니 회수합니다.
revoke all on function public.fn_notify_post_invite() from public, anon, authenticated;
