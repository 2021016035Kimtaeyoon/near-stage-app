import { useNavigate } from 'react-router-dom'
import { ShowCard } from '@/components/cards/ShowCard'
import { SERVICE_NAME } from '@/config/brand'
import type { ShowWithMeta } from '@/store/selectors'

/**
 * 우리 무대 / 등록 공연을 위아래 다른 칸으로 나눠 보여줍니다.
 *
 * ★ 섞어 놓으면 구분이 배지 하나뿐입니다. 등록 공연 100건 사이에 우리 무대 1건이
 *   스크롤 어딘가에 묻히고, 그러면 이 서비스가 실제로 만들어낸 공연이 안 보여서
 *   그냥 공연 정보 앱이 됩니다.
 *
 * ★ 날짜를 골라도 목록이 거의 그대로였던 것도 같은 이유였습니다. 등록 공연 대부분이
 *   몇 주짜리 기간 공연이라 어느 날을 눌러도 90건 넘게 남습니다. 칸을 나누고 건수를
 *   적어두면 무엇이 걸렸는지 눈에 보입니다.
 */
export function ShowSections({
  results,
  nowIso,
  likedShowIds,
  onToggleLike,
  onOpen,
  highlightShowId,
  registerPath = '/host/venue/new',
}: {
  results: ShowWithMeta[]
  nowIso: string
  likedShowIds: string[]
  onToggleLike: (id: string) => void
  onOpen: (id: string) => void
  highlightShowId: string | null
  /** 공간 등록 화면 경로 — 데스크톱은 /desktop 접두어가 붙습니다 */
  registerPath?: string
}) {
  const own = results.filter((r) => r.show.source === 'own')
  const registered = results.filter((r) => r.show.source !== 'own')

  const card = (item: ShowWithMeta) => (
    <ShowCard
      key={item.show.id}
      item={item}
      nowIso={nowIso}
      liked={likedShowIds.includes(item.show.id)}
      onToggleLike={() => onToggleLike(item.show.id)}
      onClick={() => onOpen(item.show.id)}
      highlighted={item.show.id === highlightShowId}
    />
  )

  return (
    <div className="space-y-5">
      <section>
        <SectionHead
          title={`${SERVICE_NAME} 무대`}
          count={own.length}
          desc="이 서비스로 성사된 공연. 참석 예정을 눌러두면 자리를 알려드려요"
        />
        {own.length > 0 ? (
          <div className="space-y-2.5">{own.map(card)}</div>
        ) : (
          <NoOwnHere registerPath={registerPath} />
        )}
      </section>

      {registered.length > 0 && (
        <section>
          <SectionHead
            title="등록 공연"
            count={registered.length}
            desc="공연예술통합전산망(KOPIS)에서 받아온 공연. 예매는 예매처에서 합니다"
          />
          <div className="space-y-2.5">{registered.map(card)}</div>
        </section>
      )}
    </div>
  )
}

function SectionHead({ title, count, desc }: { title: string; count: number; desc: string }) {
  return (
    <div className="mb-2.5">
      <div className="flex items-baseline gap-1.5">
        <h3 className="text-[15px] font-bold">{title}</h3>
        <span className="tnum text-2xs font-bold text-ink-3">{count}건</span>
      </div>
      <p className="mt-0.5 text-2xs leading-relaxed text-ink-3">{desc}</p>
    </div>
  )
}

/** 고른 조건에 우리 무대가 없을 때 — 한 줄로만. 등록 공연이 아래에 있으니까요 */
function NoOwnHere({ registerPath }: { registerPath: string }) {
  const navigate = useNavigate()
  return (
    <div className="card flex items-center gap-3 p-3">
      <p className="min-w-0 flex-1 text-2xs leading-relaxed text-ink-2">
        이 조건에는 아직 없어요. 당신의 가게가 이 동네 첫 무대가 될 수 있습니다.
      </p>
      <button
        onClick={() => navigate(registerPath)}
        className="shrink-0 rounded-lg border border-border-strong px-2.5 py-1.5 text-2xs font-bold"
      >
        공간 등록
      </button>
    </div>
  )
}
