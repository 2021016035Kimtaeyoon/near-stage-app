import { ChevronRight, FileText, ShieldAlert, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CenterModal } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/Field'
import { useAuthStore } from '@/hooks/useAuth'
import { deleteMyAccount } from '@/hooks/useReports'
import { toast } from '@/store/useToast'

const CONFIRM_WORD = '삭제'

/**
 * 약관 링크 + 계정 삭제 (§16).
 *
 * ★ 계정 삭제는 개인정보보호법상 이용자의 권리라 반드시 있어야 하고, 문의 메일을
 *   보내라고 하는 건 "권리를 보장했다"고 하기 어렵습니다. 앱 안에서 바로 되게 합니다.
 *
 * ★ 무엇이 사라지는지 먼저 다 적고, 단어를 직접 입력하게 합니다. 되돌릴 수 없는
 *   동작에 확인 버튼 한 번만 두면 실수로 누릅니다.
 */
export function AccountDangerZone() {
  const navigate = useNavigate()
  const userId = useAuthStore((s) => s.userId)
  const [open, setOpen] = useState(false)
  const [word, setWord] = useState('')
  const [busy, setBusy] = useState(false)

  const run = async () => {
    if (word.trim() !== CONFIRM_WORD) {
      toast(`"${CONFIRM_WORD}" 를 정확히 입력해주세요`, 'warn')
      return
    }
    setBusy(true)
    const err = await deleteMyAccount()
    setBusy(false)
    if (err) {
      toast('삭제하지 못했어요', 'error', err)
      return
    }
    setOpen(false)
    toast('계정을 삭제했어요', 'success', '이용해주셔서 감사했습니다')
    navigate('/audience/home', { replace: true })
  }

  return (
    <div className="mt-6">
      <div className="card overflow-hidden">
        <LinkRow
          icon={FileText}
          label="이용약관"
          onClick={() => navigate('/legal/terms')}
        />
        <LinkRow
          icon={ShieldAlert}
          label="개인정보처리방침"
          onClick={() => navigate('/legal/privacy')}
          last
        />
      </div>

      {userId && (
        <button
          onClick={() => {
            setWord('')
            setOpen(true)
          }}
          className="mt-3 flex w-full items-center gap-2 px-1 py-2 text-left"
        >
          <Trash2 size={13} className="shrink-0 text-ink-3" />
          <span className="flex-1 text-2xs font-semibold text-ink-3">계정 삭제</span>
        </button>
      )}

      <CenterModal open={open} onClose={() => setOpen(false)} title="계정을 삭제할까요?">
        <p className="text-[13px] leading-relaxed text-ink-2">
          아래가 <b>즉시, 되돌릴 수 없이</b> 사라집니다.
        </p>
        <ul className="mt-2.5 space-y-1.5">
          {[
            '이름과 프로필 사진',
            '등록한 공간과 공연팀 (사진·영상 포함)',
            '그 공간·팀으로 확정된 공연과 거기 달린 리뷰',
            '참석 예정, 좋아요, 팔로우, 댓글',
            '호스트·아티스트와 주고받은 채팅',
          ].map((t) => (
            <li key={t} className="flex gap-2 text-2xs leading-relaxed text-ink-2">
              <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-danger" />
              {t}
            </li>
          ))}
        </ul>
        <p className="mt-2.5 text-2xs leading-relaxed text-ink-3">
          이미 지나간 공연 기록도 함께 사라집니다. 함께 공연한 상대방 화면에서도 그
          공연이 보이지 않게 됩니다.
        </p>

        <div className="mt-4">
          <TextInput
            autoFocus
            value={word}
            onChange={(e) => setWord(e.target.value)}
            placeholder={`확인을 위해 "${CONFIRM_WORD}" 를 입력하세요`}
          />
        </div>

        <div className="mt-4 flex gap-2">
          <Button variant="outline" full onClick={() => setOpen(false)}>
            취소
          </Button>
          <Button
            variant="danger"
            full
            loading={busy}
            disabled={word.trim() !== CONFIRM_WORD}
            onClick={() => void run()}
          >
            삭제합니다
          </Button>
        </div>
      </CenterModal>
    </div>
  )
}

function LinkRow({
  icon: Icon,
  label,
  onClick,
  last = false,
}: {
  icon: typeof FileText
  label: string
  onClick: () => void
  last?: boolean
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-4 py-3 text-left ${
        last ? '' : 'border-b border-border'
      }`}
    >
      <Icon size={15} className="shrink-0 text-ink-3" />
      <span className="flex-1 text-[13px] font-semibold">{label}</span>
      <ChevronRight size={16} className="shrink-0 text-ink-3" />
    </button>
  )
}
