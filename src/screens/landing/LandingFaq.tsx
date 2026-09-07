import { ChevronDown } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/cn'

/**
 * 자주 묻는 질문.
 *
 * 등록을 망설이게 만드는 질문 세 가지(§3-2 필수 항목)를 맨 위에 둡니다.
 * 돈 이야기와 자격 조건이 여기서 풀리지 않으면 사장님들은 등록 버튼을 누르지 않습니다.
 */
const FAQS: Array<{ q: string; a: string }> = [
  {
    q: '비용이 드나요?',
    a: '들지 않습니다. 시범 운영 기간으로 등록·매칭·공연 노출까지 모든 이용이 전면 무료입니다. 수수료도, 예약금도, 결제 단계도 없습니다.',
  },
  {
    q: '개런티는 어떻게 정하나요?',
    a: '호스트와 아티스트가 직접 협의해 현장에서 정산합니다. 플랫폼은 대금에 관여하지 않습니다. 구인글에 적는 금액은 참고용이고, 실제 금액·지급 방식·취소 기준은 두 분이 대화로 정하시면 됩니다.',
  },
  {
    q: '우리 가게도 될까요?',
    a: '손님이 앉을 자리와 공연할 한 평 정도의 공간만 있으면 됩니다. 카페·바·식당·스튜디오 모두 가능하고, 무대나 음향 장비가 없어도 괜찮습니다. 가지고 계신 장비를 등록해두면 그 조건에 맞는 팀만 지원합니다.',
  },
  {
    q: '공연팀은 어떤 조건이 필요한가요?',
    a: '장르 제한은 없습니다. 밴드·마술·스탠드업·연극·국악·DJ 어느 쪽이든 등록할 수 있습니다. 필요한 장비를 체크해두면 조건이 맞는 공간만 추천됩니다.',
  },
  {
    q: '등록하면 바로 공개되나요?',
    a: '운영자 확인을 거친 뒤 공개됩니다. 실제로 운영 중인 공간인지, 공연이 가능한 팀인지 한 번 확인하는 절차라 보통 하루 안에 끝납니다. 확인 중에는 본인에게만 보입니다.',
  },
]

export function LandingFaq() {
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section className="mx-auto max-w-3xl px-6 py-14 md:py-20">
      <h2 className="text-center text-2xl font-extrabold tracking-tight md:text-3xl">
        자주 묻는 질문
      </h2>

      <ul className="mt-8 space-y-2.5">
        {FAQS.map((f, i) => {
          const expanded = open === i
          return (
            <li key={f.q} className="card overflow-hidden">
              <button
                onClick={() => setOpen(expanded ? null : i)}
                aria-expanded={expanded}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left"
              >
                <span className="text-[15px] font-bold">{f.q}</span>
                <ChevronDown
                  size={18}
                  className={cn(
                    'shrink-0 text-ink-3 transition-transform duration-200',
                    expanded && 'rotate-180',
                  )}
                />
              </button>
              {expanded && (
                <p className="border-t border-border px-5 py-4 text-sm leading-relaxed text-ink-2">
                  {f.a}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}
