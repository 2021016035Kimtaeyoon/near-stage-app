import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { markLandingSeen } from './landingSeen'
import { useIsDesktop } from './useMediaQuery'

/**
 * 화면 크기에 맞는 앱 경로로 보내는 이동 함수.
 *
 * ★ 랜딩의 CTA 들이 전부 '/desktop/...' 로 하드코딩돼 있었습니다. 랜딩 링크는
 *   카카오톡으로 공유되고 대부분 폰에서 열리는데, 좁은 화면에서 /desktop 은
 *   "이 화면은 데스크톱에 최적화되어 있어요" 안내로 막힙니다. 서비스를 처음 보는
 *   사람이 첫 탭에서 막히는 셈입니다.
 *
 * 여기서 한 번에 고릅니다 — 넓은 화면이면 데스크톱 셸, 좁으면 모바일 앱.
 */
export function useAppNavigate(): (path: string) => void {
  const navigate = useNavigate()
  const isDesktop = useIsDesktop()
  return useCallback(
    (path: string) => {
      // 이 함수는 랜딩 화면에서만 씁니다 — 여기서 나간다는 건 랜딩을 봤다는 뜻이라,
      // 다음 접속부터는 바로 앱으로 들어가게 여기서 한 번에 기록합니다.
      markLandingSeen()
      const clean = path.startsWith('/') ? path : `/${path}`
      navigate(isDesktop ? `/desktop${clean === '/' ? '' : clean}` : clean)
    },
    [navigate, isDesktop],
  )
}
