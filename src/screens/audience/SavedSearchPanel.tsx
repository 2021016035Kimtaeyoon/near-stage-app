import { Bell, BellOff, BellPlus, Trash2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { cn } from '@/lib/cn'
import { describeSavedFilter } from '@/lib/savedSearch'
import { useAppStore } from '@/store/useAppStore'
import { toast } from '@/store/useToast'

/**
 * 관심 조건 목록.
 *
 * 행을 누르면 그 조건을 지도 필터에 다시 얹고 홈으로 보냅니다. 종 아이콘은 알림 on/off,
 * 휴지통은 삭제입니다. 마이페이지와 데스크톱 사이드바가 함께 씁니다.
 */
export function SavedSearchPanel({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate()
  const savedSearches = useAppStore((s) => s.savedSearches)
  const applySavedSearch = useAppStore((s) => s.applySavedSearch)
  const toggleAlert = useAppStore((s) => s.toggleSavedSearchAlert)
  const removeSavedSearch = useAppStore((s) => s.removeSavedSearch)

  const alertCount = savedSearches.filter((s) => s.alertOn).length

  return (
    <section className={cn('card overflow-hidden', compact ? 'mb-0' : 'mb-4')}>
      <div className="flex items-start justify-between gap-3 px-4 pb-2.5 pt-3.5">
        <div className="min-w-0">
          <h2 className="flex items-center gap-1.5 text-[13px] font-bold">
            <BellPlus size={15} className="text-gold-text" />
            관심 조건
          </h2>
          <p className="mt-0.5 text-2xs leading-snug text-ink-3">
            조건에 맞는 공연이 새로 열리면 알려드려요. 기간은 빼고 거리·장르만 대조합니다.
          </p>
        </div>
        {savedSearches.length > 0 && (
          <span className="tnum shrink-0 rounded-full bg-surface-2 px-2 py-1 text-2xs font-bold text-ink-2">
            알림 {alertCount}
          </span>
        )}
      </div>

      {savedSearches.length === 0 ? (
        <p className="border-t border-border px-4 py-5 text-center text-xs leading-relaxed text-ink-3">
          아직 저장한 조건이 없어요.
          <br />
          홈에서 필터를 맞춘 뒤 <span className="font-bold text-ink-2">이 조건 저장</span>을 눌러보세요.
        </p>
      ) : (
        <ul className="divide-y divide-border border-t border-border">
          {savedSearches.map((s) => (
            <li key={s.id} className="flex items-center gap-1">
              <button
                onClick={() => {
                  applySavedSearch(s.id)
                  navigate('/audience/home')
                }}
                className="tap min-w-0 flex-1 px-4 py-3 text-left"
              >
                <span className="block truncate text-[13px] font-bold">{s.name}</span>
                <span className="mt-0.5 block truncate text-2xs text-ink-3">
                  {describeSavedFilter(s.filter)}
                </span>
              </button>

              <button
                onClick={() => {
                  toggleAlert(s.id)
                  toast(s.alertOn ? '알림을 껐어요' : '알림을 켰어요', 'default', s.name)
                }}
                aria-label={s.alertOn ? `${s.name} 알림 끄기` : `${s.name} 알림 켜기`}
                aria-pressed={s.alertOn}
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors',
                  s.alertOn ? 'bg-gold-500 text-gold-ink' : 'bg-surface-2 text-ink-3',
                )}
              >
                {s.alertOn ? <Bell size={15} /> : <BellOff size={15} />}
              </button>

              <button
                onClick={() => {
                  removeSavedSearch(s.id)
                  toast('관심 조건을 삭제했어요', 'default', s.name)
                }}
                aria-label={`${s.name} 삭제`}
                className="mr-3 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-3 active:bg-surface-2"
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
