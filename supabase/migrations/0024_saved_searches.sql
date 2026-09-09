-- ============================================================
-- 관심 조건 — 가짜였던 기능을 실제로 만듭니다.
--
-- 지금까지 관심 조건은 브라우저 메모리에만 있었습니다.
--   · 새로고침하면 사라집니다
--   · '알림 받기'를 켜도 대조하는 곳이 없어 알림이 영영 오지 않습니다
--   · 거리 조건은 연남동 고정 좌표(DEFAULT_USER_LOCATION)로 재고 있었습니다
--     — 사용자의 위치가 아닙니다
--
-- ★ 조건은 장르만 둡니다.
--   거리는 서버가 대조할 수 없습니다. 브라우저 좌표를 서버로 보내지 않는 것이
--   이 서비스의 원칙이고, 그래서 예전 코드가 고정 좌표로 거리를 재는 거짓말을
--   하고 있었습니다. 없는 조건을 흉내내느니 빼는 게 낫습니다.
--
-- ★ 알림은 우리 무대에만 겁니다.
--   등록 공연(KOPIS)은 하루에 수십 건씩 들어옵니다. 거기에 알림을 걸면
--   첫날 알림함이 터지고 사람들은 알림을 통째로 끕니다. 우리 무대는 이
--   서비스가 성사시킨 공연이고, 관객이 기다리는 것도 그쪽입니다.
-- ============================================================

create table if not exists public.saved_searches (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles (id) on delete cascade,
  name       text not null,
  /** 빈 배열이면 '장르 상관없이 우리 무대가 열리면 알림' 입니다 */
  genres     text[] not null default '{}',
  alert_on   boolean not null default true,
  created_at timestamptz not null default now(),
  constraint saved_searches_unique unique (user_id, genres)
);

create index if not exists saved_searches_user_idx
  on public.saved_searches (user_id, created_at desc);

-- ★ 장르 배열을 항상 정렬해 둡니다. 안 그러면 ['밴드','국악'] 과 ['국악','밴드']
--   가 다른 값이 되어 유니크 제약이 같은 조건을 두 번 허용합니다.
create or replace function public.fn_sort_saved_genres()
returns trigger
language plpgsql
as $$
begin
  new.genres := coalesce(
    (select array_agg(g order by g) from unnest(new.genres) as g),
    '{}'
  );
  return new;
end;
$$;

drop trigger if exists saved_searches_sort on public.saved_searches;
create trigger saved_searches_sort
  before insert or update on public.saved_searches
  for each row execute function public.fn_sort_saved_genres();

alter table public.saved_searches enable row level security;

-- 내 조건은 나만 봅니다. 운영자도 보지 않습니다 — 무엇을 보고 싶어하는지는
-- 운영에 필요한 정보가 아닙니다.
drop policy if exists saved_searches_rw_self on public.saved_searches;
create policy saved_searches_rw_self on public.saved_searches
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ─────────── 새 무대가 열리면 알림 ───────────
--
-- ★ fn_accept_application 을 고치지 않고 트리거로 답니다. 그 함수는 길고,
--   공연이 만들어지는 경로가 나중에 늘어날 수 있습니다. 사실(공연 생성)이
--   일어난 자리에 붙여두면 경로가 늘어도 알림이 빠지지 않습니다.

create or replace function public.fn_notify_saved_searches()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_genre       text;
  v_venue_name  text;
  v_venue_owner uuid;
  v_artist_owner uuid;
  v_when        text;
  r             record;
begin
  -- 등록 공연에는 걸지 않습니다 (위 주석 참고)
  if new.source <> 'own' then return new; end if;

  select a.genre, a.owner_id into v_genre, v_artist_owner
  from public.artists a where a.id = new.artist_id;

  select v.name, v.owner_id into v_venue_name, v_venue_owner
  from public.venues v where v.id = new.venue_id;

  v_when := to_char(new.starts_at at time zone 'Asia/Seoul', 'MM/DD HH24:MI');

  for r in
    select s.user_id, s.name
    from public.saved_searches s
    where s.alert_on
      -- 빈 배열 = 장르 안 가림
      and (cardinality(s.genres) = 0 or v_genre = any (s.genres))
      -- ★ 공연을 만든 당사자에게는 보내지 않습니다. 확정 알림을 이미 받는데
      --   관심 조건 알림까지 오면 같은 일로 두 번 울립니다.
      and s.user_id is distinct from v_venue_owner
      and s.user_id is distinct from v_artist_owner
  loop
    insert into public.notifications (user_id, type, title, body, link)
    values (
      r.user_id,
      'saved_search',
      '관심 조건에 맞는 공연이 열렸어요',
      coalesce(v_venue_name, '공간') || ' · ' || v_when || ' · ' || r.name,
      '/audience/show/' || new.id
    );
  end loop;

  return new;
end;
$$;

drop trigger if exists shows_notify_saved_searches on public.shows;
create trigger shows_notify_saved_searches
  after insert on public.shows
  for each row execute function public.fn_notify_saved_searches();

comment on function public.fn_notify_saved_searches is
  '우리 무대가 새로 만들어지면 장르가 맞는 관심 조건에 알림을 넣습니다. 등록 공연은 제외.';
