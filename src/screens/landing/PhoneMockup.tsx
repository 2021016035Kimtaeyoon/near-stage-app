import { motion } from 'framer-motion'
import { Heart, MapPin, Search } from 'lucide-react'
import { useState, type MouseEvent } from 'react'
import { GenreTag, SourceBadge } from '@/components/ui/Badge'
import { PosterArt } from '@/components/ui/PosterArt'

/**
 * 랜딩 히어로용 정적 목업 — 실제 라이브 지도 대신 손으로 짠 미리보기입니다.
 * (라이브 컴포넌트를 그대로 꽂으면 무겁고, 스케일 축소 시 Leaflet 렌더링이
 *  불안정해질 수 있어 안전하게 정적 스냅샷으로 재현했습니다.)
 *
 * 입체감: 마우스를 따라 살짝 기울어지는 3D 틸트 + 은은한 공중부양 애니메이션 +
 * 바닥 그림자로 "떠 있는" 느낌을 줍니다.
 */
export function PhoneMockup() {
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 })

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    setTilt({ rx: py * -12, ry: px * 16 })
  }
  const handleMouseLeave = () => setTilt({ rx: 0, ry: 0 })

  return (
    <div className="relative" style={{ perspective: 1400 }}>
      {/* 바닥 그림자 — 공중에 떠 있는 듯한 깊이감 */}
      <div
        aria-hidden
        className="absolute left-1/2 top-[96%] h-12 w-[230px] -translate-x-1/2 rounded-full opacity-70 blur-2xl"
        style={{ background: 'radial-gradient(ellipse, rgba(23,23,28,.45) 0%, transparent 72%)' }}
      />

      <motion.div
        animate={{ y: [0, -16, 0] }}
        transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          initial={{ opacity: 0, scale: 0.9, rotateY: -22, rotateX: 6 }}
          animate={{ opacity: 1, scale: 1, rotateX: tilt.rx, rotateY: tilt.ry }}
          transition={{ type: 'spring', stiffness: 140, damping: 16 }}
          className="relative shrink-0 overflow-hidden rounded-[46px] border-[10px] border-[#101016] bg-bg"
          style={{
            width: 300,
            height: 620,
            transformStyle: 'preserve-3d',
            boxShadow: '0 50px 100px -20px rgba(23,23,28,.35), 0 0 0 1px rgba(23,23,28,.06)',
          }}
        >
          <div className="pointer-events-none absolute left-1/2 top-0 z-20 h-[22px] w-[86px] -translate-x-1/2 rounded-b-2xl bg-[#101016]" />

          <div className="map-offline-grid absolute inset-0" />

          <div className="absolute inset-x-0 top-0 px-4 pb-3 pt-9">
            <div className="flex h-9 items-center gap-2 rounded-full border border-border bg-surface/95 px-3 shadow-sm backdrop-blur">
              <Search size={13} className="text-ink-3" />
              <span className="text-2xs text-ink-3">NEAR:STAGE · 오늘 뭐 볼까요?</span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {['오늘 밤', '2km', '우리 무대만'].map((t) => (
                <span key={t} className="rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-bg">
                  {t}
                </span>
              ))}
            </div>
          </div>

          {/* 지도 위 마커 흉내 */}
          {[
            { top: '34%', left: '28%', own: true },
            { top: '46%', left: '62%', own: false },
            { top: '58%', left: '40%', own: true },
            { top: '30%', left: '70%', own: true },
          ].map((m, i) => (
            <span
              key={i}
              className="absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                top: m.top,
                left: m.left,
                background: m.own ? 'linear-gradient(135deg,#FF6B4A,#FF3D77)' : '#14141B',
                border: m.own ? '2px solid #fff' : '1.5px solid #6B6B77',
                boxShadow: '0 4px 10px rgba(0,0,0,.25)',
              }}
            />
          ))}

          {/* 하단 카드 시트 흉내 */}
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl border-t border-border bg-surface/97 px-4 pb-6 pt-3 shadow-[0_-16px_40px_rgba(0,0,0,.12)]">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-border-strong" />
            <p className="mb-2 text-xs font-bold">
              이 지역 공연 <span className="text-[#FF5560]">12건</span>
            </p>
            <div className="card flex gap-2.5 p-2.5">
              <PosterArt seed="landing-mock-1" genre="스탠드업" className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <SourceBadge source="own" size="sm" />
                </div>
                <p className="mt-1 truncate text-[13px] font-bold">농담수집가 솔로쇼</p>
                <p className="flex items-center gap-0.5 text-[10px] text-ink-3">
                  <MapPin size={9} /> 카페 온화 · 125m
                </p>
              </div>
              <Heart size={14} className="mt-1 shrink-0 text-ink-3" />
            </div>
            <div className="card mt-2 flex gap-2.5 p-2.5">
              <PosterArt seed="landing-mock-2" genre="밴드" className="h-14 w-14 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1">
                  <SourceBadge source="kopis" size="sm" />
                  <GenreTag genre="밴드" size="sm" />
                </div>
                <p className="mt-1 truncate text-[13px] font-bold">가을 인디 위켄드</p>
                <p className="flex items-center gap-0.5 text-[10px] text-ink-3">
                  <MapPin size={9} /> 상상마당 홍대 · 1.3km
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
