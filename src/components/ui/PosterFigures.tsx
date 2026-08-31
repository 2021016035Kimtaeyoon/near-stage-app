import { Limb, Person, POSTER_SILHOUETTE as SIL } from './PosterPrimitives'
import type { Genre } from '@/types'

/**
 * 장르별 "포스터 실루엣" — 무대 조명 역광을 받는 연주자 실루엣 + 소품.
 * 전부 100x100 좌표계의 순수 도형이라 사진 없이도 장면처럼 읽힙니다(PosterArt 참고).
 */

const BAND = (
  <g>
    <Person />
    <Limb d="M57.4,53.5 Q62.5,59 57.5,65.5" />
    <rect
      x="40.8"
      y="43.5"
      width="2.3"
      height="23"
      rx="1.1"
      fill={SIL}
      transform="rotate(-27 42 55)"
    />
    <ellipse cx="52.5" cy="64" rx="6.2" ry="7.2" fill={SIL} />
    <ellipse cx="54.5" cy="75.5" rx="8.4" ry="9.2" fill={SIL} />
  </g>
)

const SINGER = (
  <g>
    <Person cx={53} />
    <rect x="29.3" y="49" width="1.7" height="31" rx="0.85" fill={SIL} />
    <circle cx="30.15" cy="47.6" r="2.3" fill={SIL} />
    <Limb d="M60.4,53.5 Q65,60 60,68" />
    <ellipse cx="55.5" cy="71" rx="9" ry="9.8" fill={SIL} />
    <rect
      x="43.5"
      y="43.5"
      width="2.2"
      height="20"
      rx="1.1"
      fill={SIL}
      transform="rotate(-22 44.6 53)"
    />
  </g>
)

const STANDUP = (
  <g>
    <Person cx={45} />
    <rect x="61.5" y="45" width="1.8" height="35" rx="0.9" fill={SIL} />
    <ellipse cx="63" cy="44" rx="2.8" ry="1.9" fill={SIL} transform="rotate(28 63 44)" />
    <Limb d="M52.4,53.5 Q59,49 63.5,51.5" />
  </g>
)

const MAGIC = (
  <g>
    <Person />
    <Limb d="M57.4,53.5 Q65,47 69.5,40.5" />
    <path
      d="M70.5,36 L71.6,39.8 L75.5,40.8 L71.6,41.8 L70.5,45.6 L69.4,41.8 L65.5,40.8 L69.4,39.8 Z"
      fill="rgba(247,200,81,.8)"
    />
    <path
      d="M33,40 h9.5 v1.8 h-9.5 Z M35,31 h5.5 v9.4 h-5.5 Z"
      fill={SIL}
      opacity={0.85}
    />
  </g>
)

const THEATER = (
  <g>
    <path
      d="M0,0 Q22,36 9,88 Q4,60 0,42 Z"
      fill={SIL}
      opacity={0.8}
    />
    <path
      d="M100,0 Q78,36 91,88 Q96,60 100,42 Z"
      fill={SIL}
      opacity={0.8}
    />
    <Person />
    <Limb d="M42.6,53.5 Q38,58.5 40,64.5" />
    <Limb d="M57.4,53.5 Q62,58.5 60,64.5" />
  </g>
)

const DEBATE = (
  <g>
    <circle cx="30" cy="55" r="4" fill={SIL} />
    <path d="M30,58.6 C25.5,58.6 22,62 21,66.5 L19,79 C24,81.5 30,81.5 30,81.5 L30,58.6Z" fill={SIL} />
    <circle cx="70" cy="55" r="4" fill={SIL} />
    <path d="M70,58.6 C74.5,58.6 78,62 79,66.5 L81,79 C76,81.5 70,81.5 70,81.5 L70,58.6Z" fill={SIL} />
    <rect x="42" y="73.5" width="16" height="3.2" rx="1.2" fill={SIL} opacity={0.75} />
    <rect x="49" y="66" width="2" height="8" rx="1" fill={SIL} opacity={0.75} />
  </g>
)

const PARTY = (
  <g>
    <circle cx="50" cy="44.5" r="4.6" fill={SIL} />
    <path
      d="M50,48.8 C46.6,48.8 43.8,50.6 42.5,53.4 L40,72 C45.6,76 54.4,76.4 59,72.5 L57.5,53.4 C56.2,50.6 53.4,48.8 50,48.8 Z"
      fill={SIL}
    />
    <Limb d="M57.4,53.5 Q65.5,47.5 70,41" />
    <Limb d="M42.6,55 Q37,60 39,66" />
    <path d="M58.5,72 Q66,76 65,84" stroke={SIL} strokeWidth={4.6} strokeLinecap="round" fill="none" />
    <path d="M40.5,73 Q35,78 38,84.5" stroke={SIL} strokeWidth={4.6} strokeLinecap="round" fill="none" />
    <g fill="rgba(247,200,81,.85)">
      <rect x="26" y="34" width="2.4" height="2.4" transform="rotate(20 27 35)" />
      <rect x="72" y="30" width="2.2" height="2.2" transform="rotate(-15 73 31)" />
      <rect x="64" y="24" width="2" height="2" transform="rotate(40 65 25)" />
      <circle cx="33" cy="26" r="1.3" />
    </g>
  </g>
)

const GUGAK = (
  <g>
    <Person cx={46} />
    <Limb d="M53.4,53.5 Q60,49.5 63.5,55.5" />
    <rect x="62.5" y="53" width="1.7" height="11" rx="0.8" fill={SIL} transform="rotate(24 63.4 58)" />
    <ellipse cx="70" cy="66" rx="8.6" ry="6.4" fill={SIL} />
    <rect x="66" y="72" width="1.6" height="8" fill={SIL} opacity={0.8} />
    <rect x="72.5" y="72" width="1.6" height="8" fill={SIL} opacity={0.8} />
  </g>
)

const DJ = (
  <g>
    <path d="M45.5,41.5 Q50,35 54.5,41.5" stroke={SIL} strokeWidth={2} fill="none" />
    <circle cx="45.3" cy="43" r="2" fill={SIL} />
    <circle cx="54.7" cy="43" r="2" fill={SIL} />
    <Person />
    <rect x="36" y="65" width="28" height="11" rx="2.4" fill={SIL} />
    <circle cx="44" cy="70.5" r="3.6" fill="rgba(20,15,10,.75)" />
    <circle cx="56" cy="70.5" r="3.6" fill="rgba(20,15,10,.75)" />
  </g>
)

export const POSTER_FIGURE: Record<Genre, JSX.Element> = {
  밴드: BAND,
  싱어송라이터: SINGER,
  스탠드업: STANDUP,
  마술: MAGIC,
  연극: THEATER,
  토론: DEBATE,
  솔로파티: PARTY,
  국악: GUGAK,
  DJ: DJ,
}
