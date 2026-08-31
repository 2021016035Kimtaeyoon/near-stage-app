# NEAR:STAGE 디자인 토큰 가이드

브랜드 원칙과 배경 설명이 필요하면 프로젝트 루트의 [`DESIGN.md`](../DESIGN.md)를 먼저 읽는다. 이 문서는 실무에서 바로 참조하는 토큰 표·스케일·컴포넌트 규칙만 담는다.

## 색 토큰 (`tailwind.config.js` → `theme.extend.colors`)

| 토큰 | 값 | 용도 |
|---|---|---|
| `bg` | `#0B0B0F` | 최하단 배경 |
| `surface` / `surface-1` | `#14141A` | 카드 표면 |
| `surface-2` | `#1C1C24` | 카드 안 2차 표면(입력창, 비활성 영역) |
| `surface-3` | `#262630` | 3차 표면(호버, 강조 배경) |
| `border` | `#2A2A35` | 기본 구분선·카드 테두리 |
| `border-strong` | `#3A3A47` | 강조 테두리, 포커스 전 상태 |
| `text` / `ink` | `#F5F5F7` | 본문 텍스트 (순백 `#FFFFFF` 금지) |
| `text-muted` / `ink-2` | `#9A9AA5` | 보조 텍스트 |
| `text-dim` / `ink-3` | `#6E6E7A` | placeholder, 비활성 텍스트 |
| `gold-400` | `#F7C851` | 밝은 금색 (hover, 라이트 틴트) |
| `gold-500` | `#F0B429` | 기준 브랜드색 — CTA, 활성 상태, 포커스 링 |
| `gold-600` | `#D89A1E` | 어두운 금색 (active, 보더) |
| `gold-ink` | `#14100A` | 금색 배경 위 전용 텍스트색 |
| `crimson-700` | `#8E1424` | 히어로/커튼 무드 (딥) |
| `crimson-600` | `#C0271F` | 히어로/커튼 무드 (라이트) |
| `success` / `ok` | `#3DBE7A` | 성공 상태 |
| `warning` / `warn` | `#E8873A` | 대기·경고 상태 |
| `danger` | `#E5484D` | 실패·취소·파괴적 동작 |
| `info` | `#5B8DEF` | 안내 |

## 타입 스케일 (`tailwind.config.js` → `theme.extend.fontSize`)

| 이름 | 크기/행간/자간/굵기 | 용도 |
|---|---|---|
| `display` | 32px / 1.2 / -0.03em / 800 | 랜딩 히어로 헤드라인 |
| `h1` | 24px / 1.3 / -0.025em / 800 | 화면 최상단 타이틀 |
| `h2` | 20px / 1.35 / -0.02em / 700 | 섹션 제목 |
| `h3` | 17px / 1.4 / -0.015em / 700 | 카드 제목 |
| `body` | 15px / 1.6 / -0.01em / 500 | 본문 (최대 `max-w-[34rem]`) |
| `small` | 13px / 1.5 / 0 / 500 | 메타 정보 |
| `caption` | 11.5px / 1.4 / 0.02em / 700 | 뱃지, 칩, 라벨 |

한 화면에서 굵기는 최대 3종까지만 쓰고, 실시간으로 바뀌는 숫자에는 항상 `tabular-nums`를 적용한다.

## 간격 · 반경 · 모션

- **8pt 그리드:** `4 8 12 16 20 24 32 40 56 72`만 쓴다.
- **반경:** 버튼/입력 `12px`(`rounded-xl`), 카드 `16px`(`rounded-2xl`), 시트/모달 상단만 `20px`(`rounded-3xl`), 뱃지 `pill`.
- **모션 duration:** `fast 120ms` / `base 180ms` / `slow 240ms` (`tailwind.config.js` → `transitionDuration`).
- **모션 easing:** `standard cubic-bezier(.2,0,0,1)` / `enter cubic-bezier(0,0,0,1)` / `exit cubic-bezier(.3,0,1,1)`.
- **시트/모달:** framer-motion `spring({ stiffness: 320, damping: 32 })`.
- 스크롤/애니메이션 전부 `prefers-reduced-motion`에서 즉시 전환으로 대체한다.

## 컴포넌트 사용 규칙

- **Button:** `primary` = `bg-gold-500` + `text-gold-ink` (흰 텍스트 금지). `secondary` = 투명 + `border-border-strong`. `danger` = 텍스트 전용, 배경 없음.
- **Card:** 그림자 대신 `border-border` + `inset 0 1px 0 rgba(255,255,255,.04)`. 진짜 `box-shadow`는 바텀시트·모달·토스트 같은 "떠 있는" 요소에만 쓴다(`.elevation-float`).
- **Badge/Chip:** 선택·강조 상태만 `bg-gold-500` + `text-gold-ink`, 나머지는 `border-border` + `surface-1`.
- **지도 마커:** "우리 무대"는 채움 금색 + 은은한 글로우(크게), "등록 공연"은 아웃라인만(작게) — 색이 아니라 채움 방식과 크기로 구분한다.
- **로고:** `src/components/shell/LogoMark.tsx`로만 렌더링. `src/components/shell/logoGeometry.ts`는 확정된 브랜드 자산이므로 **절대 수정 금지**.

## 하지 말아야 할 것

- 화면 코드에 새 hex 리터럴을 직접 쓰지 않는다 — 항상 위 토큰(Tailwind 클래스)만 참조한다.
- 금색 배경 위에 흰 글자를 쓰지 않는다 (대비 부족) — `text-gold-ink`를 쓴다.
- 크림슨(`crimson-*`)과 그라데이션을 랜딩 히어로·커튼 밖으로 확장하지 않는다.
- 일반 카드에 `box-shadow`를 쓰지 않는다 — 다크 배경에서 거의 안 보이고 지저분해 보인다.
- 색만으로 상태를 구분하지 않는다 — 아이콘/라벨을 함께 쓴다.
- 이모지를 장르·상태 표시에 쓰지 않는다.
