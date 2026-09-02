import { useEffect, useState, type ReactNode } from 'react'
import { PHONE_HEIGHT, PHONE_WIDTH, SERVICE_TAGLINE } from '@/config/brand'
import { useIsDesktop } from '@/lib/useMediaQuery'
import { LogoMark } from './LogoMark'

interface Props {
  children: ReactNode
  /** 데스크톱에서 프레임 옆에 붙는 패널 (역할 전환기 등) */
  side?: ReactNode
}

/**
 * 데스크톱: 화면 중앙에 아이폰 프레임(390×844) 안에서 앱이 렌더링됩니다.
 * 모바일: 프레임 없이 풀스크린.
 *
 * 앱 내부의 모든 오버레이(탭바·바텀시트·토스트)는 fixed 대신
 * 이 컨테이너 기준 absolute 로 배치해 프레임 밖으로 새지 않게 합니다.
 */
/** 베젤 패딩(위아래 10px)까지 포함한 목업의 실제 레이아웃 높이 */
const FRAME_HEIGHT = PHONE_HEIGHT + 20
/** 위아래 여백(py-10)까지 감안해, 목업이 필요로 하는 세로 공간 */
const FRAME_OUTER_HEIGHT = FRAME_HEIGHT + 80

export function PhoneFrame({ children, side }: Props) {
  const isDesktop = useIsDesktop()

  // 창이 폰보다 낮으면 잘리는 대신 축소합니다. CSS calc로는 길이를 무단위 배율로 바꿀 수
  // 없어서(scale()은 숫자만 받음) JS로 계산합니다.
  const [frameScale, setFrameScale] = useState(1)
  useEffect(() => {
    const fit = () => setFrameScale(Math.min(1, window.innerHeight / FRAME_OUTER_HEIGHT))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  if (!isDesktop) {
    return (
      <div id="app-viewport" className="relative h-[100dvh] w-full overflow-hidden bg-bg">
        {children}
      </div>
    )
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center gap-10 overflow-hidden bg-[#F3F3F6] px-8 py-10">
      <div className="relative z-10 hidden w-[320px] shrink-0 flex-col gap-6 lg:flex">
        <div>
          <LogoMark className="w-[168px]" />
          <p className="mt-3 text-sm leading-relaxed text-ink-2">{SERVICE_TAGLINE}</p>
        </div>
        {side}
      </div>

      {/* 디바이스 베젤 — 창 높이가 폰(844px)보다 낮으면 통째로 축소해 잘리지 않게 합니다.
          예전엔 노트북처럼 세로가 짧은 창에서 폰 아래쪽이 화면 밖으로 잘려나가,
          하단에 붙는 요소(지도 화면의 공연 목록 시트, 탭바 등)가 아예 안 보였습니다. */}
      <div
        className="relative z-10 shrink-0 rounded-[54px] border border-[#2A2A34] bg-[#101016] p-[10px]"
        style={{
          boxShadow: '0 40px 120px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.06)',
          transform: `scale(${frameScale})`,
          transformOrigin: 'center',
          // transform은 레이아웃 크기를 안 줄이므로, 줄어든 만큼 음수 마진으로 자리도 회수합니다.
          // (안 그러면 컨테이너가 원래 높이 그대로 남아 폰 아래쪽이 화면 밖으로 밀립니다)
          marginBlock: `${(-(1 - frameScale) * FRAME_HEIGHT) / 2}px`,
        }}
      >
        <div
          id="app-viewport"
          className="relative overflow-hidden rounded-[45px] bg-bg"
          style={{ width: PHONE_WIDTH, height: PHONE_HEIGHT }}
        >
          {children}
          {/* 다이나믹 아일랜드 */}
          <div className="pointer-events-none absolute left-1/2 top-[10px] z-[60] h-[26px] w-[104px] -translate-x-1/2 rounded-full bg-black" />
          {/* 홈 인디케이터 */}
          <div className="pointer-events-none absolute bottom-[7px] left-1/2 z-[60] h-[4px] w-[124px] -translate-x-1/2 rounded-full bg-black/20" />
        </div>
      </div>
    </div>
  )
}

