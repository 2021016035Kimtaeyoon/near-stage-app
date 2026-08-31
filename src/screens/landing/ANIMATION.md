# 랜딩 히어로 애니메이션 (DarkStageHero)

단일 pin 섹션(`h-[560dvh]`, 모바일 `h-[400dvh]`) 안에서 `useScroll({ offset: ['start start', 'end start'] })`로
0→1 진행률(`p`)을 뽑아내고, 그 값 하나로 커튼·무대·조명·로고·2막 패널을 전부 구동합니다.
모든 타이밍 상수는 [`heroTimeline.ts`](./heroTimeline.ts)에 있습니다 — 타이밍/강도를 바꾸려면
컴포넌트가 아니라 이 파일의 숫자를 바꾸세요. 로고 좌표는 [`logoGeometry.ts`](../../components/shell/logoGeometry.ts)에서
대칭 각도로 생성됩니다.

## 진행률 구간별 요약

| 구간 | 무엇이 움직이나 | 관련 상수 |
|---|---|---|
| 0 ~ 0.02 | 커튼 완전히 닫힘, 스크롤 유도 표시 보임 | `CURTAIN_CUE_FADE_END` |
| 0 ~ 0.06 | 스크롤 유도 표시 페이드아웃 | `CURTAIN_CUE_FADE_END` |
| 0 ~ 0.12 | 커튼 중앙 금색 세로 각인 "NEAR:STAGE" 페이드아웃 | `CURTAIN_EMBLEM_FADE_END` |
| 0.05 ~ 0.26 | **통짜 커튼 한 장**이 y `0%→-100%` + scaleY `1→0.9`(top 기준)로 걷힘. 밑단은 부모 scaleY를 상쇄하는 counter-scale로 항상 같은 두께·항상 수평 | `CURTAIN_OPEN_START/END`, `CURTAIN_SCALE_END` |
| 0.05 ~ 0.26 | 상단 개더 존(가로 명암 띠) 높이 0→22%, 커튼 헴 그림자 페이드아웃 | 동일 |
| 0.20 ~ 0.40 | 무대 전체 밝기 필터 0.28 → 1 | `STAGE_BRIGHTNESS_START/END` |
| 0.29 ~ 0.35 / 0.33~0.39 / 0.34~0.40 | 좌(27%) → 우(73%) → 중앙(50%, 가장 큼) 조명 점등 플리커 | `LIGHT_*_RANGE` |
| 0.38 ~ 0.50 | 로고 낙하 (y −118vh→0, rotate −3°→0, `cubicBezier(.55,.06,.68,.19)`) | `LOGO_FALL_START/END` |
| 0.38 ~ 0.42 | 낙하 중 로고 페이드인 | `LOGO_FADE_IN_END` |
| 0.50 ~ 0.545 | 착지 스쿼시(scaleY/scaleX 반대 방향 4단 오버슈트) | `LANDING_AT`, `LANDING_SQUASH_END` |
| 0.50 ~ 0.54 | 무대 컨테이너 흔들림(y 0→4→−2→0) | `LANDING_SHAKE_END` |
| 0.50 ~ 0.53 | 바닥 중앙 섬광(screen 블렌드) | `LANDING_FLASH_END` |
| 0.50 ~ 0.60 | 착지 먼지 2겹 | `LANDING_DUST_END` |
| 0.38 ~ 0.62 | 로고 바닥 반사 opacity 0→0.16(유지)→0(2막 축소 구간에서 소멸) | 낙하/2막 구간 상수 재사용 |
| 0.50 ~ 0.56 | 로고+태그라인+CTA 정지(숨 고르기), 1막 텍스트 페이드인 | `ACT1_HOLD_START/END` |
| 0.56 ~ 0.62 | 로고 축소(scale 1→0.4) + 좌상단 이동(x 0→−38vw, y 0→−32vh) + opacity 1→0.5, **동시에** 1막 태그라인·CTA 페이드아웃 | `ACT2_LOGO_SHRINK_START/END`, `ACT1_TITLE_FADEOUT_START/END` |
| 0.56 ~ 0.97 | 가로 트랙 `x: 100vw → -200vw` (패널 중앙 도달 시점 근사: 0.66 / 0.815 / 0.97) | `ACT2_START/END`, `TRACK_X_RANGE` |
| 각 패널 구간 | 패널 내부 텍스트가 패널 이동보다 살짝 늦게 opacity/y로 따라옴 | `PANEL_CONTENT_WINDOWS[0..2]` |
| 0.97 ~ 1.00 | 마지막 패널(관객, CTA 포함) 유지 → pin 해제, 다음 섹션으로 이어짐 | `ACT2_END`, `ACT2_TAIL_END` |

## 이번 라운드에서 고친 버그 7개

1. **로고·설명문 겹침** — 1막을 절대배치 두 블록 대신 `flex flex-col items-center justify-center` 하나로
   묶었습니다(로고 → gap-10(40px) → 태그라인 → mt-7(28px) → CTA). 자식 2개가 정상 flex flow라 구조적으로
   겹칠 수 없습니다. 긴 `SERVICE_DESCRIPTION`은 1막에서 빼고, 짧은 한 줄 `HERO_TAGLINE`("오늘 밤, 걸어갈 수
   있는 무대")만 씁니다. 원래의 긴 설명은 패널 본문(`body`)으로 옮겼습니다. 짧은 창(`max-height:760px`)에서는
   로고 폭과 gap을 한 단계 줄입니다(`shortViewport` 미디어쿼리).
2. **가로 트랙 도중 세로로 떨어짐** — 트랙(`motion.div style={{x:trackX}}`)이 처음부터 `sticky` 컨테이너
   **안에** 있는지 다시 확인하고, 명세가 준 `[0.56,0.97]→['100vw','-200vw']` 매핑을 정확히 그대로 구현했습니다.
   pointer-events는 커튼 레이어에만 `pointer-events-none`을 주고 트랙은 항상 클릭 가능합니다.
3. **커튼 톱니 현상** — 조각(strip)별 개별 translateY를 완전히 폐기하고, **통짜 커튼 한 장**으로 교체했습니다.
   밑단은 부모의 `scaleY`를 `1/s`로 상쇄하는 자식 요소라 상승 중에도 두께가 항상 같고 좌우 어디서나 수평입니다.
   `CurtainStrip.tsx`는 삭제했습니다.
4. **밸런스 지그재그가 너무 큼** — `clip-path` 퍼센트 폴리곤 대신 SVG `<pattern patternUnits="userSpaceOnUse">`로
   **절대 px** 스캘럽(타일 80px, 깊이 14px)을 반복시켰습니다. 화면이 넓어지면 스캘럽 개수만 늘어나고
   크기는 항상 같습니다.
5. **로고 좌우 비대칭/선과 겹침** — `logoGeometry.ts`가 좌표를 표로 박아두지 않고 `arcPath()`/`letterAt()`로
   대칭 각도(θ ∈ [-22,-11,0,11,22])에서 생성합니다. Node로 재계산해 검증값(ARC_UPPER/LOWER, S/T/A/G/E 좌표,
   밴드 여백 11.38px)과 소수 둘째 자리까지 일치함을 확인했습니다. `LogoMark`는 `variant`(`plain`/`stage`/`marquee`)
   prop을 받고, 기본값 `plain`은 그림자 없이 두 선 두께만 다르며 랜딩 히어로가 이걸 씁니다.
6. **헤더 우측 겹침 + 디버그 패널 노출** — 헤더 우측을 `flex items-center gap-4 whitespace-nowrap`으로 묶고
   "모바일 앱 체험" 버튼은 `hidden lg:inline-flex`로 좁은 폭에서 숨깁니다. 디버그 패널은 기본 **미렌더**
   상태이며 `Shift+D` 또는 `?debug=1`로만 열리고(`localStorage('ns-hero-debug')`에 상태 저장), 열렸을 때도
   `fixed bottom-3 right-3`(우측 하단)에 닫기 버튼과 함께 뜹니다. 진행률 숫자는 패널 안에만 존재합니다.
7. **(헤더가 히어로 뒤로 지나가지 않던 문제, 직전 라운드에서 수정)** — 헤더를 `sticky`에서 `fixed`로 바꿔
   첫 프레임부터 커튼이 헤더 뒤까지 그대로 보이도록 했습니다.

## reduced-motion

`useReducedMotion()`을 최상단에서 호출하고, **모든 `useTransform`/`useScroll`/`useState`를 먼저 호출한 뒤에**
`if (prefersReducedMotion) return <StaticHeroFallback />`로 조기 반환합니다. ESLint `react-hooks/rules-of-hooks`가
이 순서를 강제하며(무대 밝기 필터를 JSX 안에서 바로 `useTransform`하던 조건부 호출 1건을 이전 라운드에서
실제로 잡아냈습니다), 이번 라운드에도 0 에러로 통과했습니다. `StaticHeroFallback`은 sticky 없이 로고·태그라인·
CTA·패널 3개를 세로로 쌓은 정적 화면입니다.

## 개발용 디버그 패널

`import.meta.env.DEV`일 때만 존재하고, 기본은 닫힘(미렌더)입니다. `Shift+D`로 토글, `?debug=1`로 처음부터 열기,
상태는 `localStorage`에 저장돼 새로고침에도 유지됩니다. 열리면 우측 하단에 진행률 숫자 + 구간 점프 버튼 +
닫기(×)가 뜹니다. 점프 값은 `DEV_JUMPS`에서 관리하며 `el.offsetTop + (el.offsetHeight - innerHeight) * t`로
스크롤하는 편의용 근사치입니다(진행률 상수와 정확히 일치하진 않습니다). 프로덕션 빌드 산출물에서
`grep`으로 관련 문자열이 전혀 없음을 확인했습니다.

## 알려진 한계

- 커튼 배경의 "명암 미세 흔들림"(background-position 이동)은 구현하지 않았습니다 — 완료 조건에 없는
  선택 사항이라 토큰을 아꼈습니다.
- 밑단의 좌우 대칭 sag(처짐)는 구현하지 않았습니다. 밑단은 항상 완벽한 수평선입니다(요구사항의 핵심
  조건은 "밑단이 계단으로 깨지지 않을 것"이며 이는 충족합니다).
- 2막에서 좌상단으로 축소 이동한 로고 자체의 바닥 반사는 만들지 않았습니다.
