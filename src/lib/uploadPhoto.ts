import { supabase } from '@/lib/supabase'

/**
 * 사진 업로드 (§14).
 *
 * 업로드 전에 브라우저에서 줄입니다. 폰 사진 한 장이 5~10MB 라 원본을 그대로 받으면
 * 무료 용량이 금방 차고, 목록에서 불러올 때도 느립니다. canvas 로 직접 처리해서
 * 라이브러리를 더 들이지 않았습니다.
 *
 * 경로는 항상 `<user_id>/...` 로 시작합니다. Storage 정책이 첫 칸을 소유자 id 로
 * 강제하므로(0008_storage.sql), 남의 사진을 덮어쓰거나 지울 수 없습니다.
 */

export const MAX_EDGE = 1600
export const JPEG_QUALITY = 0.82
export const MAX_BYTES = 5 * 1024 * 1024
export const MAX_PHOTOS = 6
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp']

export type PhotoBucket = 'venue-photos' | 'artist-photos' | 'show-seatmaps'

export function validatePhotoFile(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return 'JPG · PNG · WebP 만 올릴 수 있어요'
  if (file.size > MAX_BYTES) return '5MB 이하 사진만 올릴 수 있어요'
  return null
}

/** 긴 변을 MAX_EDGE 로 줄이고 JPEG 로 다시 인코딩합니다 */
async function shrink(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height))
  const w = Math.round(bitmap.width * scale)
  const h = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    bitmap.close()
    // 캔버스를 못 쓰면 원본을 그대로 올립니다 — 업로드 자체를 막지는 않습니다
    return file
  }
  ctx.drawImage(bitmap, 0, 0, w, h)
  bitmap.close()

  return new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob ?? file), 'image/jpeg', JPEG_QUALITY)
  })
}

export interface UploadResult {
  url: string
  path: string
}

/**
 * 한 장 업로드.
 * @param onProgress 0~1. 리사이즈까지 0.3, 업로드 완료 1 로 알려줍니다.
 */
export async function uploadPhoto(
  bucket: PhotoBucket,
  userId: string,
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<UploadResult> {
  const invalid = validatePhotoFile(file)
  if (invalid) throw new Error(invalid)

  onProgress?.(0.1)
  const blob = await shrink(file)
  onProgress?.(0.3)

  // 같은 파일명을 여러 번 올려도 덮어쓰지 않도록 시각을 붙입니다
  const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: 'image/jpeg',
    upsert: false,
  })
  if (error) throw new Error(error.message)

  onProgress?.(1)
  const { data } = supabase.storage.from(bucket).getPublicUrl(path)
  return { url: data.publicUrl, path }
}

/** 업로드했던 사진 삭제 — 등록을 취소하거나 사진을 바꿀 때 씁니다 */
export async function deletePhoto(bucket: PhotoBucket, path: string): Promise<void> {
  await supabase.storage.from(bucket).remove([path])
}

/** 공개 URL 에서 저장 경로를 되찾습니다 (삭제할 때 필요) */
export function pathFromPublicUrl(bucket: PhotoBucket, url: string): string | null {
  const marker = `/storage/v1/object/public/${bucket}/`
  const i = url.indexOf(marker)
  return i < 0 ? null : url.slice(i + marker.length)
}
