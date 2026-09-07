import { useEffect } from 'react'
import { useMyArtists, useMyVenues } from '@/hooks/useMyResources'
import { useAppStore } from '@/store/useAppStore'

/**
 * 보유 리소스를 스토어의 "지금 보고 있는 공간/팀"에 연결합니다.
 *
 * ★ 역할은 계정 속성이 아니라 보유 리소스로 판단합니다(§7). 그래서 로그인만으로는
 *   currentVenueId 가 정해지지 않고, 실제로 가진 공간을 읽어와 채워야 합니다.
 *
 * 여러 개를 가졌으면 승인된 것을 먼저 고릅니다 — 대시보드·구인글은 승인된 공간에서만
 * 의미가 있기 때문입니다. 하나도 없으면 null 로 두고, 화면이 등록 안내를 띄웁니다.
 */
export function useRoleSync(): void {
  const { data: venues } = useMyVenues()
  const { data: artists } = useMyArtists()
  const currentVenueId = useAppStore((s) => s.currentVenueId)
  const currentPerformerId = useAppStore((s) => s.currentPerformerId)

  useEffect(() => {
    const pick = venues.find((v) => v.status === 'approved') ?? venues[0] ?? null
    const next = pick?.id ?? null
    // 이미 가지고 있는 공간이 목록에 그대로 있으면 건드리지 않습니다 —
    // 사장님이 공간 여러 개 중 하나를 골라둔 상태를 덮어쓰지 않기 위함입니다.
    if (currentVenueId && venues.some((v) => v.id === currentVenueId)) return
    if (currentVenueId !== next) useAppStore.setState({ currentVenueId: next })
  }, [venues, currentVenueId])

  useEffect(() => {
    const pick = artists.find((a) => a.status === 'approved') ?? artists[0] ?? null
    const next = pick?.id ?? null
    if (currentPerformerId && artists.some((a) => a.id === currentPerformerId)) return
    if (currentPerformerId !== next) useAppStore.setState({ currentPerformerId: next })
  }, [artists, currentPerformerId])
}
