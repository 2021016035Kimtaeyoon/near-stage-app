import type { Application, Post, Settlement, Show, WeeklyVisitStat } from '@/types'

export interface OwnerKpis {
  monthShowCount: number
  monthReserved: number
  estimatedExtraAudience: number
  pendingSettlement: number
}

function sameMonth(iso: string, nowIso: string): boolean {
  const d = new Date(iso)
  const now = new Date(nowIso)
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
}

export function computeOwnerKpis(
  venueId: string,
  shows: Show[],
  settlements: Settlement[],
  weeklyStats: WeeklyVisitStat[],
  nowIso: string,
): OwnerKpis {
  const venueShows = shows.filter((s) => s.venueId === venueId)
  const monthShows = venueShows.filter((s) => sameMonth(s.startAt, nowIso))
  const monthReserved = monthShows.reduce((n, s) => n + s.reservedCount, 0)

  const myStats = weeklyStats.filter((w) => w.venueId === venueId)
  const withShow = myStats.filter((w) => w.hadShow).map((w) => w.visitors)
  const withoutShow = myStats.filter((w) => !w.hadShow).map((w) => w.visitors)
  const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0)
  const diff = Math.max(0, avg(withShow) - avg(withoutShow))
  const estimatedExtraAudience = Math.round(diff * Math.max(1, monthShows.length))

  const showIds = new Set(venueShows.map((s) => s.id))
  const pendingSettlement = settlements
    .filter((st) => showIds.has(st.showId) && st.status === '정산대기')
    .reduce((n, st) => n + st.net, 0)

  return {
    monthShowCount: monthShows.length,
    monthReserved,
    estimatedExtraAudience,
    pendingSettlement,
  }
}

export function upcomingShowsForVenue(venueId: string, shows: Show[], nowIso: string): Show[] {
  const now = new Date(nowIso).getTime()
  return shows
    .filter((s) => s.venueId === venueId && new Date(s.startAt).getTime() >= now)
    .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
}

export interface PendingApplicant {
  post: Post
  application: Application
}

export function pendingApplicantsForVenue(venueId: string, posts: Post[]): PendingApplicant[] {
  const out: PendingApplicant[] = []
  for (const post of posts) {
    if (post.venueId !== venueId) continue
    for (const app of post.applications) {
      if (app.status === '대기') out.push({ post, application: app })
    }
  }
  return out.sort((a, b) => new Date(b.application.createdAt).getTime() - new Date(a.application.createdAt).getTime())
}
