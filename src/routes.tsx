import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PageTransition } from '@/components/shell/PageTransition'
import { ROLE_HOME } from '@/config/nav'
import { useAppStore } from '@/store/useAppStore'

import { Placeholder } from '@/screens/common/Placeholder'

function RoleRedirect() {
  const role = useAppStore((s) => s.role)
  return <Navigate to={ROLE_HOME[role]} replace />
}

export function AppRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RoleRedirect />} />

        {/* 관객 */}
        <Route
          path="/audience/home"
          element={
            <PageTransition>
              <Placeholder title="홈 / 지도" note="단계 3에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/audience/clips"
          element={
            <PageTransition>
              <Placeholder title="클립 피드" note="단계 5에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/audience/show/:showId"
          element={
            <PageTransition>
              <Placeholder title="공연 상세" note="단계 4에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/audience/book/:showId"
          element={
            <PageTransition>
              <Placeholder title="예약" note="단계 4에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/audience/ticket/:reservationId"
          element={
            <PageTransition>
              <Placeholder title="QR 티켓" note="단계 4에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/audience/review/:showId"
          element={
            <PageTransition>
              <Placeholder title="리뷰 작성" note="단계 4에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/audience/my"
          element={
            <PageTransition>
              <Placeholder title="마이" note="단계 5에서 구현됩니다." />
            </PageTransition>
          }
        />

        {/* 공간주 */}
        <Route
          path="/owner/dashboard"
          element={
            <PageTransition>
              <Placeholder title="대시보드" note="단계 6에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/owner/venue"
          element={
            <PageTransition>
              <Placeholder title="내 공간 관리" note="단계 7에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/owner/recruit"
          element={
            <PageTransition>
              <Placeholder title="구인 & 지원자" note="단계 8에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/owner/applicants/:postId"
          element={
            <PageTransition>
              <Placeholder title="지원자" note="단계 8에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/owner/settlement"
          element={
            <PageTransition>
              <Placeholder title="정산" note="단계 10에서 구현됩니다." />
            </PageTransition>
          }
        />

        {/* 공연자 */}
        <Route
          path="/performer/explore"
          element={
            <PageTransition>
              <Placeholder title="장소 탐색" note="단계 9에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/performer/venue/:venueId"
          element={
            <PageTransition>
              <Placeholder title="공간 상세" note="단계 9에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/performer/posts"
          element={
            <PageTransition>
              <Placeholder title="구인글 & 역경매" note="단계 9에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/performer/activity"
          element={
            <PageTransition>
              <Placeholder title="내 활동" note="단계 9에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/performer/profile"
          element={
            <PageTransition>
              <Placeholder title="프로필 / 포트폴리오" note="단계 9에서 구현됩니다." />
            </PageTransition>
          }
        />

        {/* 공통 */}
        <Route
          path="/notifications"
          element={
            <PageTransition>
              <Placeholder title="알림" note="단계 10에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/chat"
          element={
            <PageTransition>
              <Placeholder title="채팅" note="단계 10에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/chat/:threadId"
          element={
            <PageTransition>
              <Placeholder title="채팅방" note="단계 10에서 구현됩니다." />
            </PageTransition>
          }
        />
        <Route
          path="/demo"
          element={
            <PageTransition>
              <Placeholder title="자동 시연" note="단계 11에서 구현됩니다." />
            </PageTransition>
          }
        />

        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </AnimatePresence>
  )
}
