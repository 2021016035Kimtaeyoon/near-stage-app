import { supabase } from '@/lib/supabase'

/**
 * 클립(쇼츠) 업로드.
 *
 * ★ 길이와 용량을 브라우저에서 먼저 막습니다. 서버에 올린 뒤 거절하면 사용자는
 *   업로드가 다 끝날 때까지 기다렸다가 실패를 봅니다. 모바일 데이터로 30MB 를
 *   다 쓴 뒤에요.
 *
 * ★ 영상은 줄이지 않고 그대로 올립니다. 브라우저에서 영상을 재인코딩하려면
 *   WebCodecs 나 ffmpeg.wasm 이 필요한데, 전자는 지원이 고르지 않고 후자는
 *   번들이 20MB 를 넘습니다. 대신 길이·용량 제한을 걸어 원본을 받습니다.
 *
 * 썸네일은 첫 프레임을 캔버스로 떠서 JPEG 로 따로 올립니다 — 목록에서 영상
 * 수십 개를 동시에 불러오면 데이터가 순식간에 나갑니다.
 */

export const CLIP_BUCKET = 'artist-clips'
export const MAX_CLIP_BYTES = 30 * 1024 * 1024
export const MAX_CLIP_SECONDS = 60
export const MAX_CLIPS = 5
const ALLOWED = ['video/mp4', 'video/webm', 'video/quicktime']

export interface ClipProbe {
  durationSec: number
  width: number
  height: number
  /** 첫 프레임 JPEG. 만들지 못하면 null */
  thumb: Blob | null
}

export function validateClipFile(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return 'MP4 · WebM · MOV 만 올릴 수 있어요'
  if (file.size > MAX_CLIP_BYTES) return '30MB 이하 영상만 올릴 수 있어요'
  return null
}

/** 길이를 재고 첫 프레임을 뽑습니다. 메타데이터를 못 읽으면 그대로 진행합니다 */
export function probeClip(file: File): Promise<ClipProbe> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const video = document.createElement('video')
    video.preload = 'metadata'
    video.muted = true
    video.playsInline = true

    const done = (probe: ClipProbe) => {
      URL.revokeObjectURL(url)
      video.removeAttribute('src')
      resolve(probe)
    }

    // 어떤 이유로든 못 읽으면 0초로 돌려주고, 호출한 쪽이 길이 검사를 건너뜁니다
    const fail = () => done({ durationSec: 0, width: 0, height: 0, thumb: null })
    video.onerror = fail

    video.onloadedmetadata = () => {
      const durationSec = Number.isFinite(video.duration) ? Math.round(video.duration) : 0
      const width = video.videoWidth
      const height = video.videoHeight
      // 0초 지점은 검은 화면인 경우가 많아 살짝 뒤로 감습니다
      video.currentTime = Math.min(0.5, Math.max(0, video.duration / 2 || 0))

      video.onseeked = () => {
        const canvas = document.createElement('canvas')
        // 썸네일은 세로 720 이면 충분합니다
        const scale = Math.min(1, 720 / Math.max(width || 1, height || 1))
        canvas.width = Math.max(1, Math.round(width * scale))
        canvas.height = Math.max(1, Math.round(height * scale))
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          done({ durationSec, width, height, thumb: null })
          return
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        canvas.toBlob(
          (blob) => done({ durationSec, width, height, thumb: blob }),
          'image/jpeg',
          0.8,
        )
      }
      // seek 이 안 되는 코덱도 있습니다 — 그때는 썸네일 없이 진행합니다
      setTimeout(() => done({ durationSec, width, height, thumb: null }), 3000)
    }

    video.src = url
  })
}

export interface UploadedClip {
  url: string
  thumbUrl: string | null
  durationSec: number | null
  path: string
}

/**
 * 영상 한 개 업로드.
 * @param onProgress 0~1. 검사 0.15, 썸네일 0.3, 업로드 완료 1.
 */
export async function uploadClip(
  userId: string,
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<UploadedClip> {
  const invalid = validateClipFile(file)
  if (invalid) throw new Error(invalid)

  onProgress?.(0.05)
  const probe = await probeClip(file)
  if (probe.durationSec > MAX_CLIP_SECONDS) {
    throw new Error(`${MAX_CLIP_SECONDS}초 이하 영상만 올릴 수 있어요 (지금 ${probe.durationSec}초)`)
  }
  onProgress?.(0.15)

  const stem = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const ext = file.type === 'video/webm' ? 'webm' : file.type === 'video/quicktime' ? 'mov' : 'mp4'

  let thumbUrl: string | null = null
  if (probe.thumb) {
    const { error } = await supabase.storage
      .from(CLIP_BUCKET)
      .upload(`${stem}.jpg`, probe.thumb, { contentType: 'image/jpeg', upsert: false })
    // 썸네일 실패는 업로드를 막지 않습니다 — 영상만 있어도 재생은 됩니다
    if (!error) {
      thumbUrl = supabase.storage.from(CLIP_BUCKET).getPublicUrl(`${stem}.jpg`).data.publicUrl
    }
  }
  onProgress?.(0.3)

  const path = `${stem}.${ext}`
  const { error } = await supabase.storage
    .from(CLIP_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false })
  if (error) throw new Error(error.message)

  onProgress?.(1)
  return {
    url: supabase.storage.from(CLIP_BUCKET).getPublicUrl(path).data.publicUrl,
    thumbUrl,
    durationSec: probe.durationSec || null,
    path,
  }
}

/** Storage 가 돌려주는 영어 메시지를 사람 말로 바꿉니다 */
export function clipUploadHint(message: string): string {
  if (/mime/i.test(message)) return '이 형식은 올릴 수 없어요. MP4 로 바꿔 다시 시도해주세요.'
  if (/exceeded|too large|size/i.test(message)) return '30MB 이하 영상만 올릴 수 있어요'
  return message
}
