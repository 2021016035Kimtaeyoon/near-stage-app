import type { ReactNode } from 'react'
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
export function PhoneFrame({ children, side }: Props) {
  const isDesktop = useIsDesktop()

  if (!isDesktop) {
    return (
      <div id="app-viewport" className="relative h-[100dvh] w-full overflow-hidden bg-bg">
        {children}
      </div>
    )
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full items-center justify-center gap-10 overflow-hidden bg-[#F3F3F6] px-8 py-10">
      <AmbientBackdrop />

      <div className="relative z-10 hidden w-[320px] shrink-0 flex-col gap-6 lg:flex">
        <div>
          <LogoMark className="w-[168px]" />
          <p className="mt-3 text-sm leading-relaxed text-ink-2">{SERVICE_TAGLINE}</p>
        </div>
        {side}
      </div>

      {/* 디바이스 베젤 */}
      <div
        className="relative z-10 shrink-0 rounded-[54px] border border-[#2A2A34] bg-[#101016] p-[10px]"
        style={{ boxShadow: '0 40px 120px rgba(0,0,0,.7), inset 0 1px 0 rgba(255,255,255,.06)' }}
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

function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      <div
        className="absolute -left-40 top-0 h-[520px] w-[520px] rounded-full opacity-[0.16] blur-[120px]"
        style={{ background: 'radial-gradient(circle, #FF6B4A 0%, transparent 70%)' }}
      />
      <div
        className="absolute -right-32 bottom-0 h-[560px] w-[560px] rounded-full opacity-[0.14] blur-[130px]"
        style={{ background: 'radial-gradient(circle, #FF3D77 0%, transparent 70%)' }}
      />
    </div>
  )
}
