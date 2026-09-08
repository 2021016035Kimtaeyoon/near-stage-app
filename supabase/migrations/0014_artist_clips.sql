-- ============================================================
-- 아티스트 클립 (쇼츠).
--
-- 팀이 올린 짧은 영상을 관객의 "클립" 탭과 공연 상세에 띄웁니다. 지금까지는
-- artists.clip_urls 에 외부 링크만 담겨 있었고, 클립 탭은 목데이터라 늘 비어
-- 있었습니다.
--
-- ★ 표를 따로 두는 이유: 피드는 "최신순으로 조금씩" 읽어야 하는데, 배열 컬럼에
--   들어 있으면 팀 단위로만 꺼낼 수 있어 정렬도 페이징도 안 됩니다.
--
-- kind 로 두 종류를 함께 다룹니다.
--   'upload' — 우리 Storage 에 올린 파일. 피드에서 바로 재생됩니다(릴스처럼).
--   'link'   — 유튜브·인스타 등 외부 링크. 카드로 보여주고 원본으로 보냅니다.
--
-- ★ 업로드를 받는 순간 우리가 저작물을 호스팅하는 주체가 됩니다. 신고가 들어오면
--   내릴 수 있어야 하므로, 운영자가 클립을 지울 수 있게 정책을 열어둡니다.
-- ============================================================

create table if not exists public.artist_clips (
  id           uuid primary key default gen_random_uuid(),
  artist_id    uuid not null references public.artists (id) on delete cascade,
  kind         text not null check (kind in ('upload', 'link')),
  url          text not null,
  -- 업로드 클립은 첫 프레임을 뽑아 넣습니다. 링크 클립은 유튜브 썸네일.
  thumb_url    text,
  title        text not null default '',
  duration_sec integer check (duration_sec is null or duration_sec between 1 and 600),
  created_at   timestamptz not null default now(),
  -- 같은 팀이 같은 영상을 두 번 올릴 이유가 없습니다
  constraint artist_clips_unique_url unique (artist_id, url)
);

create index if not exists artist_clips_artist_idx on public.artist_clips (artist_id);
create index if not exists artist_clips_feed_idx on public.artist_clips (created_at desc);

alter table public.artist_clips enable row level security;

-- 공개된 팀의 클립은 누구나 봅니다. 심사 중인 팀 것은 본인과 운영자만.
drop policy if exists artist_clips_select on public.artist_clips;
create policy artist_clips_select on public.artist_clips
  for select using (
    exists (select 1 from public.artists a where a.id = artist_id and a.status = 'approved')
    or public.fn_owns_artist(artist_id)
    or public.fn_is_admin()
  );

drop policy if exists artist_clips_write_own on public.artist_clips;
create policy artist_clips_write_own on public.artist_clips
  for all using (public.fn_owns_artist(artist_id))
  with check (public.fn_owns_artist(artist_id));

-- 신고 대응용 — 운영자는 남의 클립도 내릴 수 있어야 합니다
drop policy if exists artist_clips_delete_admin on public.artist_clips;
create policy artist_clips_delete_admin on public.artist_clips
  for delete using (public.fn_is_admin());

-- ─────────── 이미 등록된 링크를 옮깁니다 ───────────
-- artists.clip_urls 는 그대로 두되, 새 화면은 이 표만 읽습니다.

insert into public.artist_clips (artist_id, kind, url)
select a.id, 'link', u
from public.artists a
cross join lateral unnest(a.clip_urls) as u
where u is not null and u <> ''
on conflict (artist_id, url) do nothing;

-- ─────────── 영상 저장소 ───────────
--
-- ★ 30MB 제한은 넉넉해 보이지만 무료 용량이 1GB 라 30~300개면 찹니다.
--   길이는 앱에서 60초로 막습니다. 용량이 문제가 되면 여기부터 조입니다.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'artist-clips',
  'artist-clips',
  true,
  31457280,
  -- 썸네일(JPEG)도 같은 버킷에 넣습니다. 이미지 타입을 빼면 썸네일 업로드가
  -- mime 제한에 걸려 조용히 실패하고, 목록에서 영상 수십 개를 통째로 불러오게 됩니다.
  array['video/mp4', 'video/webm', 'video/quicktime', 'image/jpeg']
)
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- 경로 첫 칸이 올린 사람의 id 여야 합니다. 남의 폴더에 못 씁니다.
drop policy if exists "artist_clips_upload_own" on storage.objects;
create policy "artist_clips_upload_own" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'artist-clips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "artist_clips_update_own" on storage.objects;
create policy "artist_clips_update_own" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'artist-clips'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "artist_clips_delete_own" on storage.objects;
create policy "artist_clips_delete_own" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'artist-clips'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.fn_is_admin())
  );

drop policy if exists "artist_clips_read_all" on storage.objects;
create policy "artist_clips_read_all" on storage.objects
  for select using (bucket_id = 'artist-clips');

-- ─────────── 피드 Realtime ───────────
-- 새 클립이 올라오면 보고 있던 사람 화면에도 붙습니다.

do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'artist_clips'
  ) then
    alter publication supabase_realtime add table public.artist_clips;
  end if;
end
$$;
