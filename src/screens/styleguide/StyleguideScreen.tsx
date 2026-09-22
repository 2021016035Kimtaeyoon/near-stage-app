import { Heart } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { LogoMark } from '@/components/shell/LogoMark'
import { GenreTag, SourceBadge, StatusDot, Tag } from '@/components/ui/Badge'
import { Button, IconButton } from '@/components/ui/Button'
import { Chip, Segmented, Toggle } from '@/components/ui/Chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { Gauge, Label, RangeSlider, Stepper, TextArea, TextInput } from '@/components/ui/Field'
import { KpiCard, KpiGrid } from '@/components/ui/Kpi'
import { Skeleton, SkeletonCircle, SkeletonText } from '@/components/ui/Skeleton'
import { ToastHost } from '@/components/ui/Toast'
import { toast } from '@/store/useToast'

/**
 * DEV 전용 디자인 QA 페이지. 토큰·타입 스케일·컴포넌트의 모든 상태를 한 화면에
 * 모아 눈으로 검수합니다. `import.meta.env.DEV`일 때만 App.tsx에서 마운트됩니다.
 */
export function StyleguideScreen() {
  const navigate = useNavigate()
  return (
    <div className="relative min-h-screen w-full bg-bg text-ink">
      {/* ToastHost는 absolute inset-0 기준 — 페이지 전체를 감싼 relative 부모 대신
          fixed 뷰포트 컨테이너에 넣어야 스크롤해도 화면 안에 보입니다 */}
      <div className="pointer-events-none fixed inset-0 z-[999]">
        <div className="relative h-full">
          <ToastHost />
        </div>
      </div>
      <header className="sticky top-0 z-10 border-b border-border bg-bg/95 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <h1 className="text-h2 font-bold">/styleguide — 디자인 QA</h1>
            <p className="mt-0.5 text-small text-ink-3">DEV 전용. 프로덕션 빌드에는 포함되지 않습니다.</p>
          </div>
          <button
            onClick={() => navigate('/')}
            className="tap rounded-full border border-border-strong px-3 text-small font-semibold text-ink-2"
          >
            앱으로
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-10 px-6 py-8">
        <ColorSection />
        <TypeSection />
        <LogoSection />
        <ButtonSection />
        <FieldSection />
        <ChipSection />
        <BadgeSection />
        <KpiSection />
        <CardSection />
        <SkeletonSection />
        <EmptyStateSection />
        <ToastSection />
      </main>
    </div>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-h3 font-bold">{title}</h2>
      <div className="card-elevated space-y-4 p-5">{children}</div>
    </section>
  )
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-2 text-2xs font-bold uppercase tracking-wide text-ink-3">{label}</p>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

const TOKENS = [
  ['bg', 'bg-bg', '최하단 배경'],
  ['surface-1', 'bg-surface-1', '카드 표면'],
  ['surface-2', 'bg-surface-2', '2차 표면'],
  ['surface-3', 'bg-surface-3', '3차 표면'],
  ['border', 'bg-border', '기본 구분선'],
  ['border-strong', 'bg-border-strong', '강조 테두리'],
  ['gold-400', 'bg-gold-400', '밝은 금색'],
  ['gold-500', 'bg-gold-500', '기준 브랜드색'],
  ['gold-600', 'bg-gold-600', '어두운 금색'],
  ['ok', 'bg-ok', '성공'],
  ['warn', 'bg-warn', '경고'],
  ['danger', 'bg-danger', '위험'],
  ['info', 'bg-info', '안내'],
] as const

function ColorSection() {
  return (
    <Block title="색 토큰">
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {TOKENS.map(([name, cls, desc]) => (
          <div key={name} className="overflow-hidden rounded-xl border border-border">
            <div className={`h-14 ${cls}`} />
            <div className="p-2">
              <p className="text-2xs font-bold">{name}</p>
              <p className="text-2xs text-ink-3">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </Block>
  )
}

const TYPE_SCALE = [
  ['display', 'text-display'],
  ['h1', 'text-h1'],
  ['h2', 'text-h2'],
  ['h3', 'text-h3'],
  ['body', 'text-body'],
  ['small', 'text-small'],
  ['caption', 'text-caption'],
] as const

function TypeSection() {
  return (
    <Block title="타입 스케일">
      {TYPE_SCALE.map(([name, cls]) => (
        <p key={name} className={cls}>
          {name} — 근처 무대에서 오늘 밤 공연을 예약하세요
        </p>
      ))}
    </Block>
  )
}

function LogoSection() {
  return (
    <Block title="로고">
      <Row label="plain / stage / marquee (light)">
        <LogoMark variant="plain" className="w-24" />
        <LogoMark variant="stage" className="w-24" />
        <LogoMark variant="marquee" className="w-24" />
      </Row>
      <Row label="dark 배경 위">
        <div className="rounded-xl bg-stage p-4">
          <LogoMark dark variant="marquee" className="w-24" />
        </div>
      </Row>
    </Block>
  )
}

function ButtonSection() {
  return (
    <Block title="Button">
      <Row label="variant">
        <Button variant="brand">brand</Button>
        <Button variant="solid">solid</Button>
        <Button variant="ghost">ghost</Button>
        <Button variant="outline">outline</Button>
        <Button variant="danger">danger</Button>
      </Row>
      <Row label="size">
        <Button size="sm">sm</Button>
        <Button size="md">md</Button>
        <Button size="lg">lg</Button>
      </Row>
      <Row label="state">
        <Button variant="brand">기본</Button>
        <Button variant="brand" loading>
          로딩
        </Button>
        <Button variant="brand" disabled>
          비활성
        </Button>
      </Row>
      <Row label="icon button">
        <IconButton label="좋아요">
          <Heart size={18} />
        </IconButton>
      </Row>
    </Block>
  )
}

function FieldSection() {
  const [range, setRange] = useState(3)
  const [count, setCount] = useState(2)
  return (
    <Block title="Field">
      <Row label="text input">
        <div className="w-64">
          <Label hint="선택">공연 제목</Label>
          <TextInput placeholder="예: 재즈 트리오 라이브" />
        </div>
        <div className="w-64">
          <Label>오류 상태</Label>
          <TextInput defaultValue="너무짧음" error="5자 이상 입력해주세요" />
        </div>
      </Row>
      <Row label="textarea">
        <div className="w-full">
          <TextArea rows={2} placeholder="소개를 입력하세요" />
        </div>
      </Row>
      <Row label="stepper / slider / gauge">
        <Stepper value={count} onChange={setCount} />
        <div className="w-56">
          <RangeSlider value={range} onChange={setRange} min={0} max={10} unit="km" />
        </div>
        <div className="w-56">
          <Gauge value={72} caption="입력을 더 채우면 매칭률이 올라가요" />
        </div>
      </Row>
    </Block>
  )
}

function ChipSection() {
  const [active, setActive] = useState(false)
  const [seg, setSeg] = useState<'a' | 'b'>('a')
  const [toggle, setToggle] = useState(true)
  return (
    <Block title="Chip / Segmented / Toggle">
      <Row label="chip">
        <Chip active={active} onClick={() => setActive((v) => !v)}>
          기본 칩
        </Chip>
        <Chip active brand>
          브랜드 강조
        </Chip>
      </Row>
      <Row label="segmented">
        <Segmented
          value={seg}
          onChange={setSeg}
          options={[
            { value: 'a', label: '전체' },
            { value: 'b', label: '우리 무대' },
          ]}
        />
      </Row>
      <Row label="toggle">
        <div className="w-64">
          <Toggle checked={toggle} onChange={setToggle} label="새 소식 알림" hint="공연 확정 시에만" />
        </div>
      </Row>
    </Block>
  )
}

function BadgeSection() {
  return (
    <Block title="Badge / Tag / StatusDot">
      <Row label="source badge">
        <SourceBadge source="own" />
        <SourceBadge source="kopis" />
      </Row>
      <Row label="genre tag">
        <GenreTag genre="밴드" />
        <GenreTag genre="싱어송라이터" />
      </Row>
      <Row label="tag tone">
        <Tag>default</Tag>
        <Tag tone="ok">ok</Tag>
        <Tag tone="warn">warn</Tag>
        <Tag tone="danger">danger</Tag>
      </Row>
      <Row label="status dot">
        <StatusDot label="공연중" tone="live" />
        <StatusDot label="곧 시작" tone="soon" />
        <StatusDot label="종료" tone="done" />
      </Row>
    </Block>
  )
}

function KpiSection() {
  return (
    <Block title="Kpi">
      <KpiGrid>
        <KpiCard icon={Heart} label="이번 달 참석 예정" value="128명" tone="brand" hint="3건 진행중" />
        <KpiCard icon={Heart} label="총 예약 관객" value="42명" />
      </KpiGrid>
    </Block>
  )
}

function CardSection() {
  return (
    <Block title="Card 표면">
      <Row label="card / card-hover / card-elevated">
        <div className="card w-40 p-3 text-xs">card</div>
        <div className="card card-hover w-40 p-3 text-xs">card-hover (호버·프레스)</div>
        <div className="card-elevated w-40 p-3 text-xs">card-elevated</div>
      </Row>
    </Block>
  )
}

function SkeletonSection() {
  return (
    <Block title="Skeleton">
      <Row label="primitive">
        <SkeletonCircle className="h-10 w-10" />
        <div className="w-40 space-y-2">
          <SkeletonText className="w-full" />
          <SkeletonText className="w-2/3" />
        </div>
        <Skeleton className="h-16 w-16 rounded-xl" />
      </Row>
    </Block>
  )
}

function EmptyStateSection() {
  return (
    <Block title="EmptyState">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {(['stage', 'search', 'ticket', 'chat', 'chart'] as const).map((art) => (
          <div key={art} className="rounded-xl border border-border">
            <EmptyState art={art} title={art} description="일러스트 미리보기" />
          </div>
        ))}
      </div>
    </Block>
  )
}

function ToastSection() {
  return (
    <Block title="Toast">
      <Row label="tone">
        <Button variant="outline" size="sm" onClick={() => toast('기본 토스트')}>
          default
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast('저장했어요', 'success', '변경사항이 반영됐어요')}>
          success
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast('확인이 필요해요', 'warn')}>
          warn
        </Button>
        <Button variant="outline" size="sm" onClick={() => toast('처리하지 못했어요', 'error')}>
          error
        </Button>
      </Row>
      <p className="text-2xs text-ink-3">버튼을 누르면 실제 ToastHost에 뜹니다 (앱 전역에 이미 마운트되어 있어야 보입니다).</p>
    </Block>
  )
}
