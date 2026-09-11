import { Moon, Sun } from 'lucide-react'
import { Segmented } from '@/components/ui/Chip'
import { useAppStore } from '@/store/useAppStore'

/**
 * 화면 테마 전환 카드 — 마이 페이지 계열 화면(관객·호스트·아티스트)이 공유합니다.
 * 역할과 무관한 설정이라 한 곳에만 둡니다.
 */
export function ThemeToggleCard() {
  const theme = useAppStore((s) => s.theme)
  const setTheme = useAppStore((s) => s.setTheme)

  return (
    <div className="card mb-4 flex items-center justify-between px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        {theme === 'light' ? (
          <Sun size={17} className="text-gold-text" />
        ) : (
          <Moon size={17} className="text-gold-text" />
        )}
        <div>
          <p className="text-[13px] font-bold">화면 테마</p>
          <p className="mt-0.5 text-2xs text-ink-3">다크·라이트 배경을 바꿀 수 있어요</p>
        </div>
      </div>
      <Segmented
        value={theme}
        onChange={setTheme}
        options={[
          { value: 'dark', label: '다크' },
          { value: 'light', label: '라이트' },
        ]}
      />
    </div>
  )
}
