import { useEffect, useState } from 'react'

/** SSR 없이 동작하는 간단한 미디어 쿼리 훅 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches)

  useEffect(() => {
    const mql = window.matchMedia(query)
    const onChange = (e: MediaQueryListEvent) => setMatches(e.matches)
    setMatches(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [query])

  return matches
}

/** 데스크톱(아이폰 프레임을 씌울 환경)인지 */
export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 900px) and (min-height: 720px)')
}
