import { useEffect, useRef, useState } from 'react'
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
          <LazyList items={registered} render={card} />
        </section>
      )}
    </div>
  )
}

/** 한 번에 늘려 그릴 개수 */
const PAGE = 24

/**
 * 스크롤이 끝에 가까워지면 조금씩 더 그립니다.
 *
 * ★ 등록 공연이 862건이 되면서 카드를 전부 그리자 DOM 노드가 4만 개가 됐습니다.
 *   100건일 때는 안 보였던 문제고, 실제 휴대폰에서는 스크롤이 끊깁니다.
 *   24장씩 그리니 1,347개로 줄었습니다.
 *
 * ★ 가상 스크롤(윈도잉)을 쓰지 않았습니다. 카드 높이가 제목 줄 수·기간 표기에
 *   따라 달라서 미리 알 수 없고, 잘못 재면 스크롤이 튑니다.
 *
 * ★ IntersectionObserver 가 아니라 스크롤 이벤트를 씁니다. 관찰자는 문서가
 *   hidden 이면 콜백이 미뤄져서, 실제로 동작하는지 확인할 방법이 없었습니다.
 *   확인할 수 없는 코드는 남기지 않습니다.
 */
function LazyList<T extends { show: { id: string } }>({
  items,
  render,
}: {
  items: T[]
  render: (item: T) => React.ReactNode
}) {
  const [limit, setLimit] = useState(PAGE)
  const anchor = useRef<HTMLDivElement>(null)

  // 조건이 바뀌어 목록이 달라지면 처음부터 다시
  useEffect(() => setLimit(PAGE), [items.length])

  useEffect(() => {
    if (limit >= items.length) return
    // 스크롤되는 조상을 찾습니다. 모바일은 홈의 목록 컨테이너,
    // 데스크톱은 왼쪽 칼럼입니다 — 화면마다 다르니 태그로 찾지 않습니다.
    let el: HTMLElement | null = anchor.current?.parentElement ?? null
    while (el && el.scrollHeight <= el.clientHeight + 1) el = el.parentElement
    const scroller: HTMLElement | Window = el ?? window

    const onScroll = () => {
      const [top, view, total] =
        scroller === window
          ? [window.scrollY, window.innerHeight, document.body.scrollHeight]
          : [
              (scroller as HTMLElement).scrollTop,
              (scroller as HTMLElement).clientHeight,
              (scroller as HTMLElement).scrollHeight,
            ]
      // 끝에 닿기 전에 미리 늘려 스크롤이 멈추지 않게 합니다
      if (top + view >= total - 600) setLimit((n) => Math.min(n + PAGE, items.length))
    }
    scroller.addEventListener('scroll', onScroll, { passive: true })
    // 처음부터 화면이 다 안 찼으면(짧은 목록) 한 번 더 늘립니다
    onScroll()
    return () => scroller.removeEventListener('scroll', onScroll)
  }, [limit, items.length])

  return (
    <>
      <div className="space-y-2.5">{items.slice(0, limit).map(render)}</div>
      {limit < items.length && (
        <div ref={anchor} className="py-4">
          {/* ★ 스크롤로 자동으로 늘어나지만 버튼도 둡니다 — 스크롤되는 조상을
              못 찾는 배치가 생기면 목록이 조용히 끊깁니다. */}
          <button
            onClick={() => setLimit((n) => Math.min(n + PAGE, items.length))}
            className="w-full rounded-xl border border-border bg-surface py-3 text-2xs font-bold text-ink-2"
          >
            {items.length - limit}건 더 보기
          </button>
        </div>
      )}
    </>
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
