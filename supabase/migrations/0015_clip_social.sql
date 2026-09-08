-- ============================================================
-- 클립 좋아요 · 댓글 (§클립).
--
-- 지금 클립 좋아요는 화면 안에서만 세고 있어서, 앱을 닫으면 사라지고 남에게도
-- 보이지 않습니다. 숫자가 0에서 안 움직이는 피드는 아무도 안 봅니다.
--
-- ★ 좋아요 행은 본인 것만 읽힙니다. 누가 무엇을 좋아하는지 남이 알 수 없어야 합니다.
--   화면에 필요한 "N개" 는 뷰가 대신 집계해서 공개합니다 — 공연 좋아요를 다룰 때와
--   같은 방식입니다.
--
-- ★ 댓글은 본문이 공개입니다. 읽을 수 있어야 다음 사람이 판단할 수 있습니다.
--   대신 지우기는 본인과 운영자만 — 신고가 들어오면 내릴 수 있어야 합니다.
-- ============================================================

create table if not exists public.clip_likes (
  user_id    uuid not null references public.profiles (id) on delete cascade,
  clip_id    uuid not null references public.artist_clips (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, clip_id)
);

create index if not exists clip_likes_clip_idx on public.clip_likes (clip_id);

alter table public.clip_likes enable row level security;

drop policy if exists clip_likes_select_self on public.clip_likes;
create policy clip_likes_select_self on public.clip_likes
  for select using (user_id = auth.uid());

drop policy if exists clip_likes_write_self on public.clip_likes;
create policy clip_likes_write_self on public.clip_likes
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create table if not exists public.clip_comments (
  id         uuid primary key default gen_random_uuid(),
  clip_id    uuid not null references public.artist_clips (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  body       text not null check (char_length(body) between 1 and 500),
  created_at timestamptz not null default now()
);

create index if not exists clip_comments_clip_idx on public.clip_comments (clip_id, created_at desc);

alter table public.clip_comments enable row level security;

drop policy if exists clip_comments_select_all on public.clip_comments;
create policy clip_comments_select_all on public.clip_comments
  for select using (true);

drop policy if exists clip_comments_insert_self on public.clip_comments;
create policy clip_comments_insert_self on public.clip_comments
  for insert with check (user_id = auth.uid());

-- 본인 댓글은 본인이, 신고받은 댓글은 운영자가. 클립 주인도 자기 클립의 댓글을
-- 정리할 수 있어야 합니다 — 자기 무대 아래 달린 악플을 못 지우면 클립을 안 올립니다.
drop policy if exists clip_comments_delete on public.clip_comments;
create policy clip_comments_delete on public.clip_comments
  for delete using (
    user_id = auth.uid()
    or public.fn_is_admin()
    or exists (
      select 1 from public.artist_clips c
      where c.id = clip_id and public.fn_owns_artist(c.artist_id)
    )
  );

-- ─────────── 피드 뷰 ───────────
--
-- 좋아요·댓글 수는 개별 행을 열지 않고 여기서만 공개합니다.
-- security_invoker = false 라 뷰 소유자 권한으로 집계합니다.

drop view if exists public.v_clip_feed;

create view public.v_clip_feed
with (security_invoker = false)
as
select
  c.id,
  c.artist_id,
  c.kind,
  c.url,
  c.thumb_url,
  c.title,
  c.duration_sec,
  c.created_at,
  a.team_name                     as artist_name,
  a.genre                         as artist_genre,
  a.photos                        as artist_photos,
  coalesce(lk.like_count, 0)      as like_count,
  coalesce(cm.comment_count, 0)   as comment_count
from public.artist_clips c
join public.artists a on a.id = c.artist_id
left join lateral (
  select count(*) as like_count from public.clip_likes l where l.clip_id = c.id
) lk on true
left join lateral (
  select count(*) as comment_count from public.clip_comments m where m.clip_id = c.id
) cm on true
-- 공개된 팀의 클립만. 심사 중인 팀 것은 피드에 나오지 않습니다.
where a.status = 'approved';

grant select on public.v_clip_feed to anon, authenticated;

-- ─────────── Realtime ───────────
-- 댓글이 붙으면 보고 있던 사람 화면에도 바로 뜹니다.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'clip_comments'
  ) then
    alter publication supabase_realtime add table public.clip_comments;
  end if;
end
$$;
