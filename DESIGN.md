---
name: NEAR:STAGE
description: 공연할 곳이 없는 공연자와 손님이 필요한 공간을 잇는 3면 마켓플레이스
colors:
  bg: "#0B0B0F"
  surface-1: "#14141A"
  surface-2: "#1C1C24"
  surface-3: "#262630"
  border: "#2A2A35"
  border-strong: "#3A3A47"
  text: "#F5F5F7"
  text-muted: "#9A9AA5"
  text-dim: "#6E6E7A"
  gold-400: "#F7C851"
  gold-500: "#F0B429"
  gold-600: "#D89A1E"
  gold-ink: "#14100A"
  crimson-700: "#8E1424"
  crimson-600: "#C0271F"
  status-ok: "#3DBE7A"
  status-warn: "#E8873A"
  status-danger: "#E5484D"
  status-info: "#5B8DEF"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontWeight: 800
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontWeight: 500
    lineHeight: 1.6
rounded:
  xl: "16px"
  2xl: "20px"
  3xl: "24px"
  pill: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.gold-500}"
    textColor: "{colors.gold-ink}"
    rounded: "12px"
  card:
    backgroundColor: "{colors.surface-1}"
    rounded: "16px"
---

# Design System: NEAR:STAGE

## Overview

**Creative North Star: "동네 무대의 간판"**

NEAR:STAGE의 시각적 진실은 어두운 무대 위로 조명이 떨어지는 순간입니다: 검정에 가까운 배경 위로 굵은 흰 "NEAR"와 금색 곡선 "STAGE"가 조명을 받아 떠오릅니다. 로고의 색 언어(금색 = 브랜드/행동, 크림슨 = 무드/커튼)를 앱 전체의 다크 UI로 그대로 확장합니다.

**Key Characteristics:**
- 배경은 항상 거의 검정(`bg`) — 금색은 행동(버튼·강조·활성 상태)에만, 크림슨은 히어로·커튼의 무드에만 쓴다
- 다크 UI에서 `box-shadow`는 뜨는 요소(시트·모달·토스트)에만 쓰고, 카드는 테두리 + 옅은 안쪽 하이라이트로 구분한다
- 그라데이션은 랜딩 히어로·커튼 밖에서 쓰지 않는다 — 나머지는 전부 단색
- 아이콘은 `lucide-react`로 통일하고, 이모지는 쓰지 않는다

## Colors

주조색은 로고에서 그대로 가져온 금색 하나이며, 크림슨은 히어로 전용 무드 색, 나머지는 무채색(다크)과 기능색(성공/경고/위험/정보)입니다.

### Brand
- **Gold 500** (`#F0B429`): 기준 브랜드색. 기본 CTA 배경, 활성 탭 인디케이터, 강조 숫자, 포커스 링.
- **Gold 400** (`#F7C851`) / **Gold 600** (`#D89A1E`): 밝은/어두운 톤 보정용(hover, 보조 강조).
- **Gold Ink** (`#14100A`): 금색 배경 위에 올라가는 텍스트 전용 색. **금색 배경 위에 흰 글자를 쓰지 않는다(대비 부족).**
- **Crimson 700 / 600** (`#8E1424` / `#C0271F`): 랜딩 히어로 커튼·조명 무드 전용. 버튼·뱃지 등 UI 요소에는 쓰지 않는다.

### Neutral (Dark)
- **Bg** (`#0B0B0F`): 최하단 배경.
- **Surface 1/2/3** (`#14141A` / `#1C1C24` / `#262630`): 카드 → 카드 안 2차 표면 → 그 안의 3차 표면 순으로 밝아진다.
- **Border / Border Strong** (`#2A2A35` / `#3A3A47`): 구분선과 카드 테두리.
- **Text / Text Muted / Text Dim** (`#F5F5F7` / `#9A9AA5` / `#6E6E7A`): 본문·보조·placeholder 텍스트 3단. 순수 흰색(`#FFFFFF`)은 쓰지 않는다.

### Status (기능색, 브랜드 색과 분리)
- **Ok** (`#3DBE7A`), **Warn** (`#E8873A`), **Danger** (`#E5484D`), **Info** (`#5B8DEF`): 예약 성공/대기/취소/안내 같은 시스템 상태 전용. 브랜드 강조 용도로 전용하지 않는다.

### Named Rules
**The Gold-Only Action Rule.** 버튼·CTA·활성 상태에 쓰는 브랜드색은 금색 하나뿐이다. 장르 태그·카테고리 색(`GENRE_COLOR`, `CATEGORY_COLOR`, `src/lib/theme.ts`)은 지도 마커와 필터 칩을 구분하기 위한 예외이며, 행동 강조에는 절대 쓰지 않는다.

**The Dark Canvas Rule.** 배경은 항상 `bg`(`#0B0B0F`)에서 시작한다. 크림슨 그라데이션은 랜딩 히어로(`DarkStageHero.tsx`)와 그 커튼(`curtainFolds.ts`) 안에서만 쓰고, 그 외 어디에도 확장하지 않는다.

## Typography

**Display Font:** Pretendard Variable (weight 700–800, with Pretendard → Apple SD Gothic Neo → 시스템 산세리프 순 폴백)
**Body Font:** Pretendard Variable (weight 500–700, 같은 폴백 체인)

### Fixed Scale (`tailwind.config.js` `fontSize`)
- **display** (32px/1.2/-0.03em/800): 랜딩 히어로 헤드라인 전용.
- **h1** (24px/1.3/-0.025em/800): 화면 최상단 타이틀.
- **h2** (20px/1.35/-0.02em/700): 섹션 제목.
- **h3** (17px/1.4/-0.015em/700): 카드 제목, 공연/공간 이름.
- **body** (15px/1.6/-0.01em/500): 설명 문단, 최대 `max-w-[34rem]`(68자).
- **small** (13px/1.5/0/500): 보조 텍스트, 메타 정보.
- **caption** (11.5px/1.4/0.02em/700): 뱃지, 칩, 통계 라벨.

### Named Rules
**The Tabular Numbers Rule.** 가격·거리·카운트다운처럼 실시간으로 바뀌는 숫자는 항상 `tabular-nums`를 적용해, 자리 흔들림 없이 표시한다.

**The Three Weights Rule.** 한 화면에서 폰트 굵기는 최대 3종(예: 500/700/800)만 쓴다.

## Layout

모바일 프로토타입은 375px 기준 단일 컬럼, 하단 탭바 + 상단 검색/필터 순서를 고정 그리드로 쓴다. 데스크톱 웹앱(`/desktop`)은 240px 고정 사이드내비 + `max-w-[1120px]` 중앙 콘텐츠(지도/리스트는 60/40 분할)이며, `useIsDesktop()`으로 좁은 화면에서는 모바일 앱으로 안내한다. 랜딩페이지(`/landing`)는 `max-w-5xl`~`max-w-6xl` 컨테이너를 쓴다.

## Elevation & Depth

다크 배경 위 `box-shadow`는 거의 보이지 않으므로, 카드는 그림자 대신 **테두리 + 안쪽 위쪽 하이라이트**로 뜬 느낌을 준다. 진짜 그림자는 화면 위로 "떠 있는" 요소(바텀시트, 모달, 토스트)에만 예약한다.

### Shadow Vocabulary
- **card** (`border-border` + `inset 0 1px 0 rgba(255,255,255,.04)`): 기본 카드 — 사이드바, 리스트 아이템, 데스크톱 패널.
- **card-elevated** (`border-border-strong` + 안쪽 하이라이트 + 옅은 외부 그림자): 카드보다 한 단계 더 떠 보여야 하는 요소(히어로 지표, 강조 카드).
- **elevation-float** (`box-shadow: 0 -8px 40px rgba(0,0,0,.5)` + `backdrop-filter: blur(16px)`): 바텀시트·모달·토스트 전용.

### Named Rules
**The Floating-Only Shadow Rule.** 진짜 `box-shadow`는 화면 위에 떠 있는 요소에만 쓴다. 일반 카드에 그림자를 쓰지 않는다 — 다크 배경에서는 거의 안 보이고, 있어도 지저분해 보인다.

## Shapes

버튼·인풋은 `rounded-xl`(12px), 카드는 `rounded-2xl`(16px 상당), 시트·모달은 위쪽 모서리만 `rounded-3xl`(20px)로 두 갈래로 정리한다. 뱃지는 `rounded-full`(pill). 각진 모서리(radius 0)는 어디에도 쓰지 않는다.

## Components

### Buttons
- **Primary:** 금색(`bg-gold-500`) 배경 + `text-gold-ink`, `rounded-xl`. 흰 텍스트 금지(대비 부족).
- **Secondary:** 투명 배경 + `border-border-strong` 테두리, `text-ink`.
- **Danger:** 텍스트 전용(`text-danger`), 배경 없음 — 파괴적 동작은 절대 채움 버튼으로 만들지 않는다.
- **Hover / Active:** `active:scale-[0.985]` — 눌림을 물리적으로 느끼게 하는 최소한의 피드백만 준다.

### Chips
- **Style:** 미선택 시 `border-border` + `surface-1` 배경, 선택 시 `bg-gold-500` 채움 + `text-gold-ink`.
- **State:** 필터 칩(다중 선택 가능)과 정렬 칩(단일 선택)을 같은 스타일로 통일해, 사용자가 별도로 학습하지 않게 한다.

### Cards / Containers
- **Corner Style:** `rounded-2xl`.
- **Background:** `surface-1`(`#14141A`).
- **Shadow Strategy:** 기본은 `card`, 강조가 필요하면 `card-elevated` (Elevation & Depth 참조) — 둘 다 진짜 그림자가 아니라 테두리+하이라이트.
- **Border:** `border-border` 1px.

### Navigation (모바일 하단 탭 / 데스크톱 상단 바)
- 활성 탭·역할은 금색 아이콘+라벨과 2px 금색 `layoutId` 인디케이터로 표시한다.
- 비활성 상태는 `text-ink-2`, hover 시 `text-ink`로만 바뀌며 배경은 바뀌지 않는다.

### 로고 (LogoMark)
- 배경 없이 굵은 "NEAR"와 곡선 "STAGE"(금색, 크림슨 그림자)를 겹친 워드마크. 모든 화면에서 `src/components/shell/LogoMark.tsx`로만 렌더링하며, **`src/components/shell/logoGeometry.ts`의 좌표·수식은 확정된 브랜드 자산이므로 절대 수정하지 않는다.**
- **랜딩 히어로 전용 확장:** `src/screens/landing/DarkStageHero.tsx`는 로고가 커튼이 열리며 무대 위로 떨어지는 연출을 담당한다. 배경·조명이 있는 이 특정 장면 밖으로 커튼 그라데이션을 확장하지 않는다.

## Do's and Don'ts

### Do:
- **Do** 브랜드 강조가 필요한 모든 곳에 `bg-gold-500`/`text-gold-500`/`gold.DEFAULT` 같은 시맨틱 토큰만 참조한다. 화면 코드에 새 hex 리터럴을 직접 쓰지 않는다.
- **Do** 배경은 항상 다크 토큰(`bg`/`surface-*`)으로 두고, 카드는 그림자 대신 테두리+하이라이트로 구분한다.
- **Do** 숫자가 자주 바뀌는 자리에는 `tabular-nums`를 적용한다.

### Don't:
- **Don't** 금색 배경 위에 흰 텍스트를 쓰지 않는다 — `text-gold-ink`를 쓴다.
- **Don't** 크림슨/그라데이션을 랜딩 히어로·커튼 밖으로 확장하지 않는다.
- **Don't** 아이콘 대신 이모지를 장르·상태 표시에 쓰지 않는다 — `lucide-react` 체계로 이미 통일되어 있고, 실결제가 오가는 마켓플레이스에서 이모지는 신뢰도를 떨어뜨린다.
