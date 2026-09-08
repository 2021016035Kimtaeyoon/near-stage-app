/**
 * 외부 링크 클립을 앱 안에서 재생하기 위한 임베드 주소.
 *
 * ★ 유튜브와 비메오만 앱 안에서 재생됩니다. 인스타그램·틱톡은 자동재생이 되는
 *   임베드를 제공하지 않아서, 쇼츠처럼 흘러가게 만들 수가 없습니다. 억지로 흉내
 *   내면 검은 화면만 뜨므로 그 두 곳은 카드로 두고 원본으로 보냅니다.
 *
 * 앞으로 올라올 클립은 대부분 앱에 직접 올린 파일(kind='upload')이라 이 경로는
 * 예전에 넣어둔 링크를 살리기 위한 것입니다.
 */

export type EmbedKind = 'youtube' | 'vimeo' | 'external'

export interface ClipEmbed {
  kind: EmbedKind
  /** iframe 에 넣을 주소. external 이면 null */
  src: string | null
}

function parse(raw: string): URL | null {
  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`)
  } catch {
    return null
  }
}

export function youtubeId(raw: string): string | null {
  const u = parse(raw)
  if (!u) return null
  const host = u.hostname.replace(/^www\./, '')
  if (host === 'youtu.be') return u.pathname.slice(1) || null
  if (!host.endsWith('youtube.com')) return null
  // /shorts/<id>, /embed/<id>, /watch?v=<id>
  const m = u.pathname.match(/^\/(?:shorts|embed|v)\/([^/?]+)/)
  if (m) return m[1]
  return u.searchParams.get('v')
}

function vimeoId(raw: string): string | null {
  const u = parse(raw)
  if (!u) return null
  if (!u.hostname.replace(/^www\./, '').endsWith('vimeo.com')) return null
  const m = u.pathname.match(/\/(\d+)/)
  return m ? m[1] : null
}

/**
 * @param active 지금 화면에 보이는 카드인지. 보이지 않는 카드는 autoplay 를 끕니다 —
 *               안 그러면 피드에 있는 영상이 전부 동시에 재생됩니다.
 * @param muted  소리. 브라우저는 소리 있는 자동재생을 막습니다.
 */
export function clipEmbed(url: string, active: boolean, muted: boolean): ClipEmbed {
  const yt = youtubeId(url)
  if (yt) {
    const p = new URLSearchParams({
      autoplay: active ? '1' : '0',
      mute: muted ? '1' : '0',
      loop: '1',
      playlist: yt, // loop 은 playlist 가 있어야 동작합니다
      controls: '0',
      modestbranding: '1',
      rel: '0',
      playsinline: '1',
    })
    return { kind: 'youtube', src: `https://www.youtube-nocookie.com/embed/${yt}?${p}` }
  }

  const vm = vimeoId(url)
  if (vm) {
    const p = new URLSearchParams({
      autoplay: active ? '1' : '0',
      muted: muted ? '1' : '0',
      loop: '1',
      background: '1',
      playsinline: '1',
    })
    return { kind: 'vimeo', src: `https://player.vimeo.com/video/${vm}?${p}` }
  }

  return { kind: 'external', src: null }
}

/** 유튜브 썸네일 — 링크 클립의 미리보기 */
export function clipThumbnail(url: string): string | null {
  const id = youtubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}
