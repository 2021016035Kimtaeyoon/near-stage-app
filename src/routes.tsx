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
import { TicketScreen } from '@/screens/audience/TicketScreen'
import { ChatListScreen } from '@/screens/common/ChatListScreen'
import { ChatThreadScreen } from '@/screens/common/ChatThreadScreen'
import { NotificationsScreen } from '@/screens/common/NotificationsScreen'
import { Placeholder } from '@/screens/common/Placeholder'
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
          path="/audience/ticket/:reservationId"
          element={
            <PageTransition>
              <TicketScreen />
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
