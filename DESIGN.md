---
name: NEAR:STAGE
description: 공연할 곳이 없는 공연자와 손님이 필요한 공간을 잇는 3면 마켓플레이스
colors:
  primary: "#FF5560"
  primary-light: "#FF6B4A"
  primary-deep: "#FF3D77"
  neutral-bg: "#FFFFFF"
  neutral-surface-2: "#F2F2F5"
  neutral-border: "#E5E5EA"
  neutral-border-strong: "#D1D1D9"
  neutral-ink: "#17171C"
  neutral-ink-2: "#5B5B66"
  neutral-ink-3: "#8B8B96"
  status-ok: "#1EA672"
  status-warn: "#D98A00"
  status-danger: "#E0403E"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontWeight: 900
  body:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  xl: "16px"
  2xl: "20px"
  3xl: "24px"
  pill: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#FFFFFF"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.neutral-bg}"
    rounded: "{rounded.2xl}"
---

# Design System: NEAR:STAGE

## Overview

**Creative North Star: "동네 무대의 간판"**

NEAR:STAGE의 시각적 진실은 무대 조명입니다: 어두운 무대 위로 조명이 떨어지고, 그 아래 굵은 흰 "NEAR"와 무대 앞줄처럼 아래로 둥글게 휘어지는 코랄 레드 "STAGE"가 서 있습니다. 랜딩 인트로는 이 장면을 스크롤로 직접 연출하고(빈 무대 → 조명 → 로고 등장), 그 외 화면에서는 같은 색 언어를 평면 워드마크(LogoMark)로 이어받습니다.

**Key Characteristics:**
- 단일 주조색(코랄 레드)만 쓰고, 카테고리·상태 표시에만 예외적으로 별도 색을 허용한다
- 배경은 항상 흰색 — 사진·지도·실데이터가 색을 대신 채운다
- 카드는 옅은 다층 그림자로 뜨고, 보라/네온 계열 장식은 쓰지 않는다
- 아이콘은 `lucide-react`로 통일하고, 이모지는 쓰지 않는다

## Colors

주조색은 무대 조명을 닮은 코랄 레드 하나이며, 나머지는 전부 무채색과 기능색(성공/경고/위험)입니다.

### Primary
- **Stage Coral** (`#FF5560`): 단색으로 쓸 때(뱃지, 상태 점, 강조 숫자, 아이콘 스트로크)의 기준값. 랜딩 인트로의 곡선 STAGE 워드마크에도 이 값을 쓴다.
- **Stage Coral Light** (`#FF6B4A`) / **Stage Coral Deep** (`#FF3D77`): 버튼·CTA·`brand-text` 헤드라인 강조에 쓰는 그라데이션의 양 끝. `--brand-from`/`--brand-to` (`src/index.css`)로 정의되어 있고, 화면 코드는 이 두 값을 직접 쓰지 않고 `.brand-gradient`/`.brand-text` 클래스만 참조한다.

### Neutral
- **Pure White** (`#FFFFFF`): 배경(`bg`)과 카드 표면(`surface`). 페이지 전체가 이 위에 뜬다.
- **Mist Surface** (`#F2F2F5`): 카드 안의 2차 표면(입력창 배경, 비활성 영역).
- **Hairline / Hairline Strong** (`#E5E5EA` / `#D1D1D9`): 구분선과 카드 테두리.
- **Ink / Ink-2 / Ink-3** (`#17171C` / `#5B5B66` / `#8B8B96`): 본문·보조·placeholder 텍스트 3단.

### Status (기능색, 브랜드 색과 분리)
- **Ok** (`#1EA672`), **Warn** (`#D98A00`), **Danger** (`#E0403E`): 예약 성공/대기/취소 같은 시스템 상태 전용. 브랜드 강조 용도로 전용하지 않는다.

### Named Rules
**The One Coral Rule.** 주조색은 이 코랄 레드 계열 하나뿐이다. 장르 태그·카테고리 색(`GENRE_COLOR`, `CATEGORY_COLOR`, `src/lib/theme.ts`)은 지도 마커와 필터 칩을 구분하기 위한 예외이며, 브랜드 강조에는 절대 쓰지 않는다.

**The White Canvas Rule.** 배경은 항상 흰색이다. 섹션마다 옅은 회색(`surface-2`)으로 리듬을 줄 수는 있어도, 채도 있는 색 배경(파스텔, 다크 섹션 등)으로 전환하지 않는다. 유일한 예외는 랜딩페이지 클로징 섹션의 다크 풋터 한 곳뿐이며, 그 외 어디에도 반복하지 않는다.

## Typography

**Display Font:** Pretendard Variable (weight 800–900, with Pretendard → Apple SD Gothic Neo → 시스템 산세리프 순 폴백)
**Body Font:** Pretendard Variable (weight 400–600,같은 폴백 체인)

**Character:** 하나의 가변 폰트 안에서 굵기 차이만으로 제목/본문을 가른다. 헤드라인은 굵고 타이트하게, 본문은 가볍고 여유 있게 — 한글·영문(`NEAR:STAGE`, 가격, 시간)이 한 문장에 섞여도 서체가 깨지지 않는다.

### Hierarchy
- **Display** (weight 900, `text-4xl`~`text-[52px]`, `leading-[1.15]`): 랜딩 히어로 헤드라인 전용.
- **Headline** (weight 800, `text-3xl`~`text-4xl`): 섹션 제목.
- **Title** (weight 800, `text-lg`~`text-xl`): 카드 제목, 공연/공간 이름.
- **Body** (weight 400, `text-sm`~`text-[15px]`, `leading-relaxed`, 최대 65ch): 설명 문단.
- **Label** (weight 700, `text-2xs`~`text-xs`): 뱃지, 칩, 통계 라벨.

### Named Rules
**The Tabular Numbers Rule.** 가격·거리·카운트다운처럼 실시간으로 바뀌는 숫자는 항상 `.tnum`(`font-variant-numeric: tabular-nums`)을 적용해, 자리 흔들림 없이 표시한다.

## Layout

모바일 프로토타입은 375px 기준 단일 컬럼, 하단 탭바 + 상단 검색/필터 순서를 고정 그리드로 쓴다. 데스크톱 웹앱(`/desktop`)은 420px 고정 사이드바 + 나머지 폭을 차지하는 지도의 2단 레이아웃이며, `useIsDesktop()`으로 좁은 화면에서는 모바일 앱으로 안내한다. 랜딩페이지(`/landing`)는 `max-w-5xl`~`max-w-6xl` 컨테이너에 반응형 1→2컬럼 히어로, 이후 섹션은 세로로 쌓인다.

## Elevation & Depth

플랫이 기본이고, 그림자는 "카드가 배경 위에 떠 있다"는 계층 정보를 줄 때만 쓴다. 순수 검정 그림자 대신 `rgba(23,23,28,…)` — 배경색 톤에 맞춘 그림자만 쓴다.

### Shadow Vocabulary
- **card** (`0 1px 2px rgba(23,23,28,.04), 0 8px 20px -12px rgba(23,23,28,.1)`): 기본 카드 — 사이드바, 리스트 아이템, 데스크톱 패널.
- **card-elevated** (`0 2px 4px rgba(23,23,28,.04), 0 20px 40px -16px rgba(23,23,28,.16)`): 카드보다 한 단계 더 떠 보여야 하는 요소(히어로 지표, 강조 카드).
- **card-hover** (호버 시 `translateY(-2px)` + 그림자 확대, `@media (hover:hover)`에서만): 인터랙션 피드백.

### Named Rules
**The Tinted Shadow Rule.** 그림자 색은 항상 배경(잉크) 톤에서 파생시킨다. 브랜드 코랄을 그림자에 섞는 곳은 CTA 버튼처럼 "이건 누르는 액션이다"를 강조해야 할 때로 한정한다(`rgba(255,61,119,…)`).

## Shapes

카드·시트류는 `rounded-2xl`(20px), 배지·필·버튼류는 `rounded-full`(pill)로 두 갈래만 쓴다. 중간 크기 라운드(`rounded-xl`, 16px)는 작은 인풋·칩에 한정한다. 각진 모서리(radius 0)는 어디에도 쓰지 않는다.

## Components

### Buttons
- **Shape:** 항상 pill (`rounded-full`).
- **Primary:** `.brand-gradient` (Stage Coral Light → Deep) 배경, 흰 텍스트, `shadow-[0_6px_20px_rgba(255,61,119,.25)]`.
- **Secondary:** 흰 배경 + `border-border-strong` 테두리, 잉크 텍스트.
- **Hover / Active:** `active:scale-[0.985]` — 눌림을 물리적으로 느끼게 하는 최소한의 피드백만 준다.

### Chips
- **Style:** 미선택 시 `border-border` + 흰 배경, 선택 시 `.brand-gradient` 채움 또는 `brand` 텍스트 컬러 강조.
- **State:** 필터 칩(다중 선택 가능)과 정렬 칩(단일 선택)을 같은 스타일로 통일해, 사용자가 별도로 학습하지 않게 한다.

### Cards / Containers
- **Corner Style:** `rounded-2xl` (20px).
- **Background:** `#FFFFFF`.
- **Shadow Strategy:** 기본은 `card`, 강조가 필요하면 `card-elevated` (Elevation & Depth 참조).
- **Border:** `border-border` (`#E5E5EA`) 1px, 그림자와 함께 쓴다.

### Navigation (모바일 하단 탭 / 데스크톱 상단 바)
- 활성 탭·역할은 `.brand-gradient` 필 인디케이터로 표시하고, 데스크톱에서는 `layoutId` 기반으로 부드럽게 슬라이드한다.
- 비활성 상태는 `text-ink-2`, hover 시 `text-ink`로만 바뀌며 배경은 바뀌지 않는다.

### 로고 (LogoMark)
- 배경 없이 굵은 검정(라이트)/흰색(다크) "NEAR"와 코랄 레드 이탤릭 "STAGE"(-7도 회전)를 겹친 평면 워드마크. 모든 화면에서 `src/components/shell/LogoMark.tsx`로만 렌더링한다.
- **랜딩 인트로 전용 예외:** `src/screens/landing/StageWordmark.tsx`는 STAGE를 무대 앞줄처럼 아래로 둥글게 휘는 곡선(SVG textPath)에 얹은 별도 워드마크로, 어두운 무대 연출(`DarkStageHero.tsx`) 안에서만 쓴다. 배경·조명이 있는 이 특정 장면 밖으로 확장하지 않는다.

## Do's and Don'ts

### Do:
- **Do** 브랜드 강조가 필요한 모든 곳에 `.brand-gradient`/`.brand-text`/`brand.DEFAULT` 같은 시맨틱 토큰만 참조한다. 화면 코드에 새 hex 리터럴을 직접 쓰지 않는다.
- **Do** 배경은 항상 흰색으로 두고, 실제 공연·공간 사진과 지도로 화면의 색을 채운다.
- **Do** 숫자가 자주 바뀌는 자리에는 `.tnum`을 적용한다.

### Don't:
- **Don't** 보라·네온 계열의 인공적인 메시 그라디언트 배경을 쓰지 않는다 — 가장 흔한 "AI가 만든 SaaS" 신호이며, 로고의 절제된 태도와도 맞지 않는다.
- **Don't** 웃고 있는 스톡사진 속 "비즈니스 캐주얼" 인물 사진을 쓰지 않는다 — 이 서비스의 신뢰 자산은 실제 공연·공간 사진이다.
- **Don't** 아이콘 대신 이모지를 장르·상태 표시에 쓰지 않는다 — `lucide-react` 체계로 이미 통일되어 있고, 실결제가 오가는 마켓플레이스에서 이모지는 신뢰도를 떨어뜨린다.
