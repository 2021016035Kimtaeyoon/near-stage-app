# 랜딩 히어로 애니메이션 (DarkStageHero)

단일 pin 섹션(`h-[560dvh]`, 모바일 `h-[400dvh]`) 안에서 `useScroll({ offset: ['start start', 'end start'] })`로
0→1 진행률(`p`)을 뽑아내고, 그 값 하나로 커튼·무대·조명·로고·2막 패널을 전부 구동합니다.
모든 타이밍 상수는 [`heroTimeline.ts`](./heroTimeline.ts)에 있습니다 — 타이밍/강도를 바꾸려면
컴포넌트가 아니라 이 파일의 숫자를 바꾸세요.

## 진행률 구간별 요약

| 구간 | 무엇이 움직이나 | 관련 상수 (heroTimeline.ts) |
|---|---|---|
| 0 ~ 0.02 | 커튼 완전히 닫힘, 스크롤 유도 표시 보임 | `CURTAIN_CUE_FADE_END` |
| 0 ~ 0.06 | 스크롤 유도 표시 페이드아웃 | `CURTAIN_CUE_FADE_END` |
| 0 ~ 0.12 | 커튼 중앙 금색 세로 각인 "NEAR:STAGE" 페이드아웃 | `CURTAIN_EMBLEM_FADE_END` |
| 0.05 ~ 0.26 | 커튼 14(모바일 9)조각이 위로 접히며 걷힘. 가장자리 먼저, 중앙이 최대 0.09만큼 늦게 시작 | `CURTAIN_OPEN_START/END`, `CURTAIN_STAGGER_MAX`, `CURTAIN_STRIP_DURATION` |
| 0.05 ~ 0.26 | 커튼 헴 그림자 페이드아웃 | 동일 |
| 0.20 ~ 0.40 | 무대 전체 밝기 필터 0.28 → 1 | `STAGE_BRIGHTNESS_START/END` |
| 0.29 ~ 0.35 | 왼쪽 조명(27%) 점등 플리커 | `LIGHT_LEFT_RANGE` |
| 0.33 ~ 0.39 | 오른쪽 조명(73%) 점등 플리커 | `LIGHT_RIGHT_RANGE` |
| 0.34 ~ 0.40 | 중앙 조명(50%, 가장 큼) 점등 플리커 | `LIGHT_CENTER_RANGE` |
| 0.38 ~ 0.50 | 로고 낙하 (y −118vh→0, rotate −3°→0, `cubicBezier(.55,.06,.68,.19)`) | `LOGO_FALL_START/END` |
| 0.38 ~ 0.42 | 낙하 중 로고 페이드인(빨리 보여야 낙하가 보임) | `LOGO_FADE_IN_END` |
| 0.50 ~ 0.545 | 착지 스쿼시(scaleY/scaleX 반대 방향 4단 오버슈트) | `LANDING_AT`, `LANDING_SQUASH_END` |
| 0.50 ~ 0.54 | 무대 컨테이너 흔들림(y 0→4→−2→0), 화면 전체 아님 | `LANDING_SHAKE_END` |
| 0.50 ~ 0.53 | 바닥 중앙 섬광(screen 블렌드) | `LANDING_FLASH_END` |
| 0.50 ~ 0.60 | 착지 먼지 2겹(반투명 흰 타원, opacity 0→0.5→0 / scale 0.35→2.9) | `LANDING_DUST_END` |
| 0.38 ~ 0.64 | 로고 바닥 반사 opacity 0→0.16(→0.16 유지)→0(2막 축소 구간에서 소멸) | 낙하/2막 구간 상수 재사용 |
| 0.50 ~ 0.56 | 로고+타이틀 안정(정지 구간, 별도 애니메이션 없음) | `ACT1_HOLD_START/END` |
| 0.50 ~ 0.56 | 1막 타이틀·설명·CTA 페이드인 | 동일 |
| 0.56 ~ 0.62 | 1막 타이틀·CTA 페이드아웃 | `ACT1_TITLE_FADEOUT_START/END` |
| 0.56 ~ 0.64 | 로고 축소(scale 1→0.42) + 좌상단 이동(x 0→−38vw, y 0→−32vh) + opacity 1→0.55 | `ACT2_LOGO_SHRINK_START/END` |
| 0.56 ~ 0.98 | 가로 트랙 이동: `x: 100vw → -200vw` (패널0/1/2 순서로 화면을 지나감, 중앙 도달 시점은 공식상 약 0.70/0.84/0.98) | `ACT2_START/END`, `TRACK_X_RANGE` |
| 각 패널 구간 | 패널 내부 텍스트가 패널 이동보다 살짝 늦게 opacity/y로 따라옴 | `PANEL_CONTENT_WINDOWS[0..2]` |
| 0.98 ~ 1.00 | 마지막 패널(관객, CTA 포함) 유지 → 섹션 종료, 이후 일반 스크롤로 이어짐 | `ACT2_END`, `ACT2_TAIL_END` |

## 왜 이렇게 짰는지 (판단이 필요했던 부분)

- **로고 페이드인 시점(0.42)**: 명세의 "opacity 0 → 0.62에서 1"은 낙하 구간(0.38~0.50)과 맞지 않아
  보이는 즉시 낙하가 보이도록 낙하 시작 직후(0.42)에 완전히 보이게 했습니다.
- **트랙 x 공식과 "약 0.65/0.79" 표기**: 명세가 준 정확한 공식(`[0.56,0.98] → [100vw,-200vw]`)을
  그대로 구현했습니다. 계산해보면 패널0/1이 화면 정중앙에 오는 진행률은 각각 약 0.70 / 0.84로,
  명세의 "약 0.65 / 0.79"와 소폭 차이가 나지만 "약"이라는 표현과 공식 자체가 우선한다고 보고
  공식을 정확히 따랐습니다. 패널2(0.98)는 정확히 일치합니다.
- **패널 내부 stagger 창(PANEL_CONTENT_WINDOWS)**: 각 패널이 화면에 들어오는 시점보다 살짝
  이르게 시작해 화면 중앙 부근에서 완료되도록 잡았습니다(예: 패널0은 0.60~0.68).
- **진행 인디케이터**: "채워짐" 대신 세 점의 opacity를 진행률에 따라 삼각형으로 크로스페이드시켜
  transform/opacity만 쓰는 규칙을 지켰습니다.

## 헤더 처리

`LandingPage.tsx`가 히어로를 감싸는 별도 ref로 자신만의 스크롤 진행률을 추적합니다.
헤더는 **`fixed`**(sticky 아님 — sticky는 문서 흐름을 차지해 커튼 뒤로 지나가지 않습니다)로
페이지 최상단에 고정되고, 진행률 0.94~1 구간에서 배경 opacity가 0→1로 채워지며
`LogoMark`의 `dark` prop과 텍스트 색이 함께 전환됩니다. 다른 라우트의 헤더는 건드리지 않았습니다.

## reduced-motion

`useReducedMotion()`을 최상단에서 호출하고, **모든 `useTransform`/`useScroll`/`useState`를
먼저 호출한 뒤에** `if (prefersReducedMotion) return <StaticHeroFallback />`로 조기 반환합니다.
ESLint `react-hooks/rules-of-hooks`가 이 순서를 강제하며, 실제로 이 규칙이 초기 구현에서
조건부 훅 호출 1건을 잡아냈습니다(무대 밝기 필터를 JSX 안에서 바로 `useTransform` 하던 부분 →
`stageFilter` 변수로 분리). `StaticHeroFallback`은 sticky 없이 로고·타이틀·CTA·패널 3개를
세로로 쌓은 정적 화면입니다.

## 개발용 진행률 패널

`import.meta.env.DEV`일 때만 히어로 우상단에 렌더링됩니다(`DevProgressPanel`, Vite가 프로덕션
빌드에서 이 조건을 `false`로 정적 치환해 실행되지 않습니다). 점프 버튼 값은 `DEV_JUMPS`에서
관리하며, 클릭 시 `el.offsetTop + (el.offsetHeight - innerHeight) * t`로 스크롤합니다.
이 점프 값은 진행률 상수(0.05, 0.26 등)와 정확히 일치하지 않는 편의용 근사치입니다.

## 알려진 한계

- 커튼 조각의 지연(stagger)은 짝수 개(14/9)라 정확히 가운데 조각이 최댓값(0.09)에
  도달하진 않고 근사합니다(육안상 차이 없음).
- 2막 진입 시 로고 반사는 사라지지만, 좌상단으로 축소 이동한 로고 자체의 반사는 만들지 않았습니다
  (구석 배지에는 바닥 반사가 어울리지 않는다고 판단).
