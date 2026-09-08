import { AnimatePresence } from 'framer-motion'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { PageTransition } from '@/components/shell/PageTransition'
import { ROLE_HOME } from '@/config/nav'
import { useAppStore } from '@/store/useAppStore'

import { BookingFlow } from '@/screens/audience/BookingFlow'
import { ClipFeed } from '@/screens/audience/ClipFeed'
import { HomeMap } from '@/screens/audience/HomeMap'
import { MyPage } from '@/screens/audience/MyPage'
import { ReviewCompose } from '@/screens/audience/ReviewCompose'
import { ShowDetail } from '@/screens/audience/ShowDetail'
import { ChatListScreen } from '@/screens/common/ChatListScreen'
import { ChatThreadScreen } from '@/screens/common/ChatThreadScreen'
import { NotificationsScreen } from '@/screens/common/NotificationsScreen'
import { AdminScreen } from '@/screens/admin/AdminScreen'
import { ArtistRegisterScreen } from '@/screens/artist/ArtistRegisterScreen'
import { MyArtistsScreen } from '@/screens/artist/MyArtistsScreen'
import { MyVenuesScreen } from '@/screens/host/MyVenuesScreen'
import { VenueRegisterScreen } from '@/screens/host/VenueRegisterScreen'
import { VenueSlotsScreen } from '@/screens/host/VenueSlotsScreen'
import { OwnerApplicantsScreen } from '@/screens/owner/OwnerApplicantsScreen'
import { OwnerDashboard } from '@/screens/owner/OwnerDashboard'
import { OwnerRecruitScreen } from '@/screens/owner/OwnerRecruitScreen'
import { OwnerVenueScreen } from '@/screens/owner/OwnerVenueScreen'
import { PerformerActivity } from '@/screens/performer/PerformerActivity'
import { PerformerPostsScreen } from '@/screens/performer/PerformerPostsScreen'
import { PerformerProfile } from '@/screens/performer/PerformerProfile'
import { PerformerVenueDetail } from '@/screens/performer/PerformerVenueDetail'
import { VenueExploreScreen } from '@/screens/performer/VenueExploreScreen'

function RoleRedirect() {
  const role = useAppStore((s) => s.role)
  return <Navigate to={ROLE_HOME[role]} replace />
}

/**
 * `prefix`가 있으면 그 접두사를 뗀 경로로 라우트를 매칭합니다.
 * 데스크톱 웹앱(`/desktop/...`)이 모바일과 같은 화면들을 그대로 재사용할 때 씁니다.
 * 단, 화면 내부의 navigate()는 접두사 없는 실제 경로로 이동하므로,
 * 하위 화면에서 다른 경로로 이동하면 데스크톱 셸을 벗어나 모바일 화면으로 전환됩니다.
 */
export function AppRoutes({ prefix = '' }: { prefix?: string } = {}) {
  const rawLocation = useLocation()
  const location = prefix
    ? { ...rawLocation, pathname: rawLocation.pathname.slice(prefix.length) || '/' }
    : rawLocation
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<RoleRedirect />} />

        {/* 관객 */}
        <Route
          path="/audience/home"
          element={
            <PageTransition>
              <HomeMap />
            </PageTransition>
          }
        />
        <Route
          path="/audience/clips"
          element={
            <PageTransition>
              <ClipFeed />
            </PageTransition>
          }
        />
        <Route
          path="/audience/show/:showId"
          element={
            <PageTransition>
              <ShowDetail />
            </PageTransition>
          }
        />
        <Route
          path="/audience/book/:showId"
          element={
            <PageTransition>
              <BookingFlow />
            </PageTransition>
          }
        />
        <Route
          path="/audience/review/:showId"
          element={
            <PageTransition>
              <ReviewCompose />
            </PageTransition>
          }
        />
        <Route
          path="/audience/my"
          element={
            <PageTransition>
              <MyPage />
            </PageTransition>
          }
        />

        {/* 운영자 (§9) — 접근 제어는 RLS 가 합니다 */}
        <Route
          path="/admin"
          element={
            <PageTransition>
              <AdminScreen />
            </PageTransition>
          }
        />

        {/* 아티스트 — 팀 등록 (§8-2) */}
        <Route
          path="/artist/new"
          element={
            <PageTransition>
              <ArtistRegisterScreen />
            </PageTransition>
          }
        />
        <Route
          path="/artist/me"
          element={
            <PageTransition>
              <MyArtistsScreen />
            </PageTransition>
          }
        />

        {/* 호스트 — 공간 등록 (§8-1) */}
        <Route
          path="/host/venue/new"
          element={
            <PageTransition>
              <VenueRegisterScreen />
            </PageTransition>
          }
        />
        <Route
          path="/host/venue/:venueId/slots"
          element={
            <PageTransition>
              <VenueSlotsScreen />
            </PageTransition>
          }
        />
        <Route
          path="/host/venue"
          element={
            <PageTransition>
              <MyVenuesScreen />
            </PageTransition>
          }
        />

        {/* 공간주 */}
        <Route
          path="/owner/dashboard"
          element={
            <PageTransition>
              <OwnerDashboard />
            </PageTransition>
          }
        />
        <Route
          path="/owner/venue"
          element={
            <PageTransition>
              <OwnerVenueScreen />
            </PageTransition>
          }
        />
        <Route
          path="/owner/recruit"
          element={
            <PageTransition>
              <OwnerRecruitScreen />
            </PageTransition>
          }
        />
        <Route
          path="/owner/applicants/:postId"
          element={
            <PageTransition>
              <OwnerApplicantsScreen />
            </PageTransition>
          }
        />

        {/* 공연자 */}
        <Route
          path="/performer/explore"
          element={
            <PageTransition>
              <VenueExploreScreen />
            </PageTransition>
          }
        />
        <Route
          path="/performer/venue/:venueId"
          element={
            <PageTransition>
              <PerformerVenueDetail />
            </PageTransition>
          }
        />
        <Route
          path="/performer/posts"
          element={
            <PageTransition>
              <PerformerPostsScreen />
            </PageTransition>
          }
        />
        <Route
          path="/performer/activity"
          element={
            <PageTransition>
              <PerformerActivity />
            </PageTransition>
          }
        />
        <Route
          path="/performer/profile"
          element={
            <PageTransition>
              <PerformerProfile />
            </PageTransition>
          }
        />

        {/* 공통 */}
        <Route
          path="/notifications"
          element={
            <PageTransition>
              <NotificationsScreen />
            </PageTransition>
          }
        />
        <Route
          path="/chat"
          element={
            <PageTransition>
              <ChatListScreen />
            </PageTransition>
          }
        />
        <Route
          path="/chat/:threadId"
          element={
            <PageTransition>
              <ChatThreadScreen />
            </PageTransition>
          }
        />

        <Route path="*" element={<RoleRedirect />} />
      </Routes>
    </AnimatePresence>
  )
}
