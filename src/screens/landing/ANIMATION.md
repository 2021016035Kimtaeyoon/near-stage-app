# 랜딩 히어로 애니메이션 (DarkStageHero)

단일 pin 섹션(`h-[560dvh]`, 모바일 `h-[400dvh]`) 안에서 `useScroll({ offset: ['start start', 'end end'] })`로
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
| 0.05 ~ 0.26 | **좌우 두 폭**이 각자 바깥쪽 끝을 축으로 scaleX `1→0.34` + x `∓6%`로 갈라져 열림 (`cubicBezier(.4,0,.2,1)`) | `CURTAIN_OPEN_START/END`, `PANEL_SCALE_END`, `PANEL_X_END` |
| 0.05 ~ 0.26 | 중앙 이음새 그림자 opacity 1→0 (두 폭이 맞물린 것처럼 보이다가 열리며 사라짐) | 동일 |
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

## ⚠️ 근본 원인이었던 offset 버그 (2막 도중 흰 배경으로 떨어지던 문제의 진짜 원인)

`useScroll({ target: ref, offset: ['start start', 'end start'] })`를 계속 써왔는데,
이건 **틀린 조합**이었습니다. `'end start'`는 섹션의 **바닥**이 뷰포트 **위쪽**에 닿는
순간(`scrollY = sectionTop + sectionHeight`)에 progress=1이 되지만, `position: sticky`가
실제로 풀리는 시점은 그보다 뷰포트 높이(`100dvh`)만큼 **더 이른** `scrollY = sectionTop +
sectionHeight - viewportHeight`입니다. 그래서 progress가 항상 실제 pin 해제 시점보다
뒤처져 있었고, 2막 뒷부분(패널2~3, 0.82~1.00 근방)이 이미 pin이 풀려 일반 스크롤이 된
상태에서 재생되며 화면이 흰 배경으로 뚝 떨어졌습니다.

**수정**: `offset: ['start start', 'end end']`로 교체(`DarkStageHero.tsx`, `LandingPage.tsx`
둘 다). `'end end'`는 섹션 바닥이 뷰포트 **바닥**에 닿는 순간 progress=1이 되므로
`scrollY = sectionTop + sectionHeight - viewportHeight`와 정확히 일치합니다 — 이게
`position: sticky`가 풀리는 지점 그 자체입니다. 실제로 `scrollY=4130`(직전)에서
sticky top=0, `scrollY=4160`(직후)에서 top=-20으로, 예측한 4140에서 정확히 풀리는 것을
`getBoundingClientRect()`로 확인했습니다(이건 순수 CSS 동작이라 프레이머모션 리액티비티
없이도 검증 가능했습니다).

## 이번 라운드에서 고친 버그 7개

1. **로고·설명문 겹침** — 1막을 절대배치 두 블록 대신 `flex flex-col items-center justify-center` 하나로
   묶었습니다(로고 → gap-10(40px) → 태그라인 → mt-7(28px) → CTA). 자식 2개가 정상 flex flow라 구조적으로
   겹칠 수 없습니다. 긴 `SERVICE_DESCRIPTION`은 1막에서 빼고, 짧은 한 줄 `HERO_TAGLINE`("오늘 밤, 걸어갈 수
   있는 무대")만 씁니다. 원래의 긴 설명은 패널 본문(`body`)으로 옮겼습니다. 짧은 창(`max-height:760px`)에서는
   로고 폭과 gap을 한 단계 줄입니다(`shortViewport` 미디어쿼리).
2. **가로 트랙 도중 세로로 떨어짐** — 트랙(`motion.div style={{x:trackX}}`)이 처음부터 `sticky` 컨테이너
   **안에** 있는지 다시 확인하고, 명세가 준 `[0.56,0.97]→['100vw','-200vw']` 매핑을 정확히 그대로 구현했습니다.
   pointer-events는 커튼 레이어에만 `pointer-events-none`을 주고 트랙은 항상 클릭 가능합니다.
3. **커튼 톱니 현상** — 조각(strip)별 개별 translateY를 완전히 폐기하고 통짜 커튼 한 장(위로 상승)으로
   바꿨습니다. *(이후 라운드에서 "좌우로 갈라지는 개막 + SVG 벨벳 주름"으로 다시 한번 전면 교체됐습니다 —
   아래 [커튼 — 좌우 분할 개막 + SVG 주름](#커튼--좌우-분할-개막--svg-주름) 참고. `CurtainStrip.tsx`는
   두 라운드 다 걸쳐 삭제된 채로 유지됩니다.)*
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

## 커튼 — 좌우 분할 개막 + SVG 주름

이전의 "위로 올라가는 통짜 커튼"(조각별 상승 → 통짜 상승 → 물결+펄럭이는 밑단)을 전부 폐기하고,
**좌우로 갈라지는 진짜 극장 커튼**으로 다시 만들었습니다.

**여는 방식**: 좌/우 두 패널(각 `w-[52%]`, 중앙 4% 겹침)이 각자 바깥쪽 끝(`origin-left`/`origin-right`)을
축으로 `scaleX: 1 → PANEL_SCALE_END(0.34)` + `x: 0 → ∓PANEL_X_END(6%)`로 오그라들며 물러납니다.
`x`만 쓰면 판자가 미끄러지듯 보이므로 `scaleX` 축소가 핵심입니다 — 천이 바깥쪽으로 뭉치면서 주름이
촘촘해지는 게 실제 커튼이 열리는 모습입니다. 닫혀 있을 때는 중앙에 10px 폭 그림자
(`linear-gradient(90deg, transparent, rgba(0,0,0,.55), transparent)`)를 겹쳐 두 폭이 맞물린 것처럼
보이게 하고, 열리며 함께 사라집니다(`heroTimeline.ts`의 `PANEL_SCALE_END`/`PANEL_X_END`,
`DarkStageHero.tsx`의 `CURTAIN_EASE = cubicBezier(.4,0,.2,1)`).

**천 질감 — 조절 손잡이 3가지** (전부 [`curtainFolds.ts`](./curtainFolds.ts)):
1. **주름 폭 배열 `FOLD_WIDTHS`** — `[7,5,8,6,9,5,7,6,8,5,7,9,6,8,5,9]`(16개, 합 110). `buildFolds()`가
   합을 100으로 정규화해 각 주름의 x0/x1을 계산하므로, 이 배열의 숫자를 바꾸면 주름 폭 리듬이 바뀝니다.
   모바일은 `.slice(0, 10)`으로 앞 10개만 씁니다(다시 정규화됨).
2. **ridge/valley 배치 `FOLD_TYPES`** — 같은 길이의 `'ridge'|'valley'` 배열. 규칙적으로 교대하면
   골판지처럼 보이므로 일부러 불규칙하게 섞여 있습니다(`['ridge','valley','ridge','ridge','valley',...]`).
   각 주름은 `type`에 따라 `fold-ridge-{side}`/`fold-valley-{side}` 세로 그라데이션 중 하나를 씁니다
   (능선은 중간에 밝은 스펙큘러 하이라이트 `#C4213A`, 골은 전체적으로 어두운 `#6E0C18` 톤).
3. **scaleX 최종값 `PANEL_SCALE_END`**(`heroTimeline.ts`, 기본 0.34) — 다 열렸을 때 패널이 얼마나
   얇아지는지. 작을수록 무대가 더 넓게 드러납니다.

주름 하나는 `M x0t 0 L x1t 0 L x1 bottomY Q midX 200 x0 bottomY Z` 형태로, 위쪽(`x0t`/`x1t`)이
아래쪽보다 5% 좁아 배튼에 물린 드레이프를 표현하고, 바닥은 `Q` 커브라 주름마다 살짝 처지는 스캘럽이
자동으로 생깁니다(하드 스톱 없음).

**패널 위 오버레이 4겹** (패널의 자식이라 scaleX/x와 함께 통째로 변형됨, `CurtainPanelSurface`):
① 세로 명암 falloff → ② 측면 조명(안쪽이 밝고 바깥쪽 끝이 어두움, 좌우 패널이 서로 대칭) →
③ 안쪽 선단에 4px 하이라이트 띠(조명이 천 앞단을 스치는 효과 — 패널이 열리는 동안 패널과 함께
움직여 입체감을 만듦) → ④ 옅은 비네트(모바일에서는 생략).

**밸런스도 같은 천으로 보이도록**, 스캘럽 패턴의 `fill`을 flat color 대신 14px 폭 ridge/valley
세로줄 패턴(`ns-valance-fold`)으로 바꿨습니다(SVG pattern 안에 pattern을 중첩).

실제 렌더링에서 16개(모바일 10개) 주름의 `d` 속성이 전부 다른 폭인 것, 패널 2개(좌/우)가 각각
별도 SVG로 존재하는 것을 DOM에서 확인했습니다.

## 알려진 한계

- 2막에서 좌상단으로 축소 이동한 로고 자체의 바닥 반사는 만들지 않았습니다.
- 이 세션의 브라우저 탭이 scroll-reactivity가 멈춰 있어(문서 참고: 히어로 최초 커밋 당시부터 반복된
  환경 한계), 커튼이 실제로 갈라지는 애니메이션 중간 프레임은 라이브로 확인하지 못했습니다. 닫힌
  상태(progress=0)의 정적 렌더링과 주름 path 데이터는 DOM으로 직접 검증했습니다.
