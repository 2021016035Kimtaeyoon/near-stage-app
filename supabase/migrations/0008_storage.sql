-- ============================================================
-- 사진 저장소 (§14)
--
-- 버킷 두 개를 만들고 정책을 붙입니다.
--  - 읽기: 누구나 (공간·팀 사진은 지도와 목록에 그대로 보여야 합니다)
--  - 쓰기: 로그인한 사용자가 "자기 폴더에만"
--
-- 폴더 규칙: <user_id>/<파일명>
-- 경로의 첫 칸을 소유자 id 로 강제하면, 남의 사진을 덮어쓰거나 지울 수 없습니다.
-- storage.foldername(name)[1] 이 그 첫 칸입니다.
--
-- 리사이즈는 업로드 전에 브라우저에서 합니다(최대 1600px, JPEG 0.82).
-- 원본을 그대로 받으면 폰 사진 한 장이 5~10MB 라 무료 용량이 금방 찹니다.
-- ============================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('venue-photos', 'venue-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp']),
  ('artist-photos', 'artist-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- ─────────── 정책 ───────────
-- 같은 이름의 정책이 있으면 지우고 다시 만듭니다 (재실행 가능하게)

drop policy if exists "photos_public_read" on storage.objects;
drop policy if exists "photos_insert_own_folder" on storage.objects;
drop policy if exists "photos_update_own_folder" on storage.objects;
drop policy if exists "photos_delete_own_folder" on storage.objects;

create policy "photos_public_read" on storage.objects
  for select using (bucket_id in ('venue-photos', 'artist-photos'));

create policy "photos_insert_own_folder" on storage.objects
  for insert to authenticated
  with check (
    bucket_id in ('venue-photos', 'artist-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_update_own_folder" on storage.objects
  for update to authenticated
  using (
    bucket_id in ('venue-photos', 'artist-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "photos_delete_own_folder" on storage.objects
  for delete to authenticated
  using (
    bucket_id in ('venue-photos', 'artist-photos')
    and (storage.foldername(name))[1] = auth.uid()::text
  );
