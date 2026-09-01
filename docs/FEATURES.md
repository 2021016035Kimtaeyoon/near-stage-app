# NEAR:STAGE 기능 명세 — 상태 기계 · 전파 규칙 · 계산식

실무에서 "이 상태 전이가 맞는지", "이 숫자가 어디서 나오는지"를 확인할 때 참조하는 문서입니다.
디자인 토큰/스케일은 [`DESIGN.md`](./DESIGN.md)를 보세요. 무결성 규칙은 코드로도 존재합니다 —
`/devcheck`(DEV 전용)가 아래 표의 참조 무결성 규칙을 실제 store 데이터로 매 순간 검증합니다.

## 1. 엔티티별 상태 기계

### Application (지원)

```
대기 ──accept(다른 지원 없음)──▶ 수락
대기 ──reject──────────────────▶ 거절
대기 ──(같은 post의 다른 지원이 수락됨)──▶ 거절 (자동, 사유: "다른 지원자와 매칭되어 마감되었습니다")
수락/거절 ──(모든 액션)──▶ 변화 없음 + toast('이미 처리된 지원입니다')
```

가드 위치: `src/store/actions/owner.ts`의 `acceptApplication`/`rejectApplication`.
`status !== '대기'`이면 즉시 `null`/`return`하고 `toast()`로 사용자에게 알립니다 — 실패를 조용히
삼키지 않습니다.

### Show (공연)

```
(없음) ──acceptApplication──▶ 공연확정
공연확정 ──(getShowStatus, startAt 도달)──▶ 진행중   [파생, 필드 갱신 아님]
진행중 ──(getShowStatus, startAt+durationMin 경과)──▶ 종료 [파생, 필드 갱신 아님]
```

`Show.status` 필드는 확정 시점에 `'공연확정'`으로 딱 한 번 기록되는 정적 값입니다(시간이 지나도
자동으로 바뀌지 않습니다). "지금 진행중/종료인가"가 필요한 모든 화면은
`src/store/selectors.ts`의 **`getShowStatus(show, nowIso)`** 로 매번 다시 계산해야 합니다 —
정산 가능 여부(`settleAll`), 정산 화면의 "공연 종료 후 정산 가능" 배지, `/devcheck`의 정산 지표가
전부 이 함수를 씁니다. `모집중`/`매칭완료`는 타입에는 존재하지만 실제로 이 상태의 Show를
만드는 코드 경로가 없습니다(향후 "임시 매칭" 기능을 추가할 때만 필요).

### Reservation (예약)

```
(없음) ──createReservation──▶ 예약
예약 ──cancelReservation (시작 3시간 이전만)──▶ 취소 (refundAmount = depositPaid 전액)
예약 ──checkInReservation──▶ 입장완료
예약 ──cancelReservation (시작 3시간 이내)──▶ 변화 없음 + toast('공연 3시간 전부터는...')
취소/입장완료 ──(모든 액션)──▶ 변화 없음 + toast(경고)
```

가드 위치: `src/store/actions/audience.ts`. 3시간 컷오프는 `CANCEL_CUTOFF_MS` 상수.
`checkInReservation`은 공간주 대시보드의 "오늘 입장 확인" 섹션(`OwnerDashboard.tsx`)에서 호출됩니다.

### Settlement (정산)

```
(없음) ──acceptApplication (Show 확정과 동시)──▶ 정산대기 (gross=0, net=0)
정산대기 ──createReservation (매 예약마다)──▶ 정산대기 (gross/net 재계산)
정산대기 ──settleAll (해당 Show가 getShowStatus==='종료'인 것만)──▶ 정산완료
```

`settleAll`은 아직 진행 전/진행중인 공연의 정산대기 건은 건드리지 않습니다 — 종료된 건이
하나도 없으면 `toast('정산할 종료된 공연이 없습니다')`를 띄우고 0을 반환합니다. 정산 화면
(`OwnerSettlementScreen.tsx`)은 "정산 예정액" KPI(전체 정산대기 합계, 미래 공연 포함)와
"정산 가능 건수"(종료된 것만)를 구분해서 보여줍니다.

### ReverseBid (역경매)

```
(없음) ──createReverseBid──▶ 등록됨 (proposals: [])
등록됨 ──addBidProposal (반복 가능)──▶ 등록됨 (proposals에 추가)
```

역경매는 상태 필드가 없는 단순 append-only 구조입니다. 제안 수락/거절 플로우는 아직 없습니다
(현재 스코프 밖 — 향후 확장 시 Application과 동일한 가드 패턴을 적용하세요).

## 2. 크로스 롤 전파 (10건)

| # | 트리거 | 전파 결과 | 구현 위치 |
|---|---|---|---|
| 1 | 공간주 구인글 작성 | 공연자 목록에 즉시 노출, 공연자 역할 전체에 알림, "지원 0명" 카드 표시 | `owner.ts:createPost` |
| 2 | 공연자 지원 | 공간주 지원자 목록/대기 카운트/대시보드 배너 갱신, 공간주 알림, **공연자 "내 활동"에 대기 카드 표시** | `performer.ts:applyToPost` + `PerformerActivity.tsx` |
| 3 | 공간주 지원 수락 | Show 확정(source:'own'), 관객 지도에 즉시 새 핀, 슬롯 잠금, **같은 post의 다른 지원 자동 거절**, **채팅 스레드 자동 생성**, 알림 3건(공연자/공간주/**팔로워만**) | `owner.ts:acceptApplication` |
| 4 | 관객 예약 | 정원 클램프, QR 발급, reservedCount 증가, 매진 뱃지, 정산 gross/net 재계산, 공간주 알림, **공연자 내 활동에 예약 인원 표시** | `audience.ts:createReservation` + `PerformerActivity.tsx` |
| 5 | 관객 예약 취소 | reservedCount 복구, **환불액 기록(refundAmount)**, **공간주 알림**, 3시간 컷오프 가드 | `audience.ts:cancelReservation` |
| 6 | 공간주 QR 입장 처리 | Reservation → 입장완료 | `audience.ts:checkInReservation` (대시보드 "오늘 입장 확인"에서 호출) |
| 7 | 공연 종료 (파생) | `getShowStatus`가 '종료' 반환 → 정산 화면에서 정산 가능 상태로 전환 | `selectors.ts:getShowStatus` + `owner.ts:settleAll` |
| 8 | 관객 리뷰 작성 | 리뷰 탭 즉시 노출, 대상(공간/공연자) 알림, **평균 평점·리뷰 수 재계산** | `audience.ts:addReview` |
| 9 | 관객 팔로우 | followerCount ±1, 팬 추이 차트 갱신, **팔로우한 공연자의 공연이 확정되면 그 관객에게만 알림** | `audience.ts:toggleFollow` + `owner.ts:acceptApplication`(followers 알림) |
| 10 | 공간주 긴급 매칭 발송 | 장르 매칭 공연자에게 알림, 3초 후 실제 Application 2건 생성(데모 타이머, 실제 store mutation) | `owner.ts:sendUrgentMatch` + `UrgentMatchModal.tsx` |

**굵게 표시한 항목**이 이번 작업에서 채운 gap입니다. 반경 기반 필터링(#10)은 `Performer`에
좌표 필드가 없어 장르 매칭으로 대체되어 있습니다 — 실제 반경 필터가 필요하면 `Performer`에
`lat`/`lng`를 추가해야 합니다(현재 스코프 밖).

## 3. 파생 계산 공식

모두 화면에 하드코딩하지 않고 매 렌더마다 store 데이터에서 다시 계산합니다.

- **정산액**: `net = max(0, gross - platformFee)`, `gross = ticketPrice × reservedCount`
  (`audience.ts:createReservation`). `platformFee`는 확정 시점에 고정(`PLATFORM_FEE`, `config/brand.ts`).
- **평점 재계산**: `recomputeRating(prevAvg, prevCount, added) = round(((prevAvg×prevCount + added) / (prevCount+1)) × 10) / 10`
  (`audience.ts`) — 리뷰 1건이 들어올 때마다 가중평균으로 다시 계산, 소수 1자리 반올림.
- **예상 추가 집객**: `diff = max(0, avg(공연있던주 방문객) - avg(공연없던주 방문객))`,
  `estimatedExtraAudience = round(diff × max(1, 이번달 공연수))` (`ownerSelectors.ts:computeOwnerKpis`).
- **정산 예정액 KPI**: 해당 공간의 모든 `정산대기` 건 net 합계 (진행 전 공연 포함 — "예정" 의미).
- **정산 가능 건수**: 위와 별개로, `getShowStatus(show, now) === '종료'`인 것만 필터링한 뒤 net 합계
  (`OwnerSettlementScreen.tsx`, `settleAll`이 실제로 정산 처리하는 건수와 일치).
- **환불액**: 취소 시 `refundAmount = depositPaid` 전액 (부분 환불 없음 — 3시간 컷오프를 넘기면
  애초에 취소 자체가 불가능하므로 항상 전액 환불).

## 4. 검증 규칙 (입력 폼)

- 새 hex 리터럴 금지 — `docs/DESIGN.md`의 토큰만 사용(`CLAUDE.md` 규칙).
- `TextInput`/`TextArea`는 `error?: string` prop으로 오류 상태를 표현 — 빨간 보더 + `ErrorText`
  (아이콘 없이 색으로만 구분하지 않도록 "⚠" 접두어 포함).
- 예약 취소: `hoursUntilStart > 3`이어야 취소 가능 (`TicketScreen.tsx`, `cancelReservation` 가드와 이중 확인).
- 지원 수락/거절: `application.status === '대기'`일 때만 가능.
- 정산 처리: 해당 Show가 `종료` 상태일 때만 가능.

## 5. `/devcheck` 무결성 규칙 (9건)

`src/screens/devcheck/invariants.ts`에 실제 코드로 존재합니다 — DEV 빌드에서 `/#/devcheck`로 확인하세요.

1. 공연 → 공간 참조 무결성
2. 공연 → 공연자 참조 무결성
3. 예약 인원 ≤ 정원
4. 예약 → 공연 참조 무결성
5. 정산 → 공연 참조 무결성
6. 구인글당 수락된 지원은 최대 1건
7. 슬롯 잠금 → 공연 참조 무결성
8. 평점은 0~5 범위
9. 취소된 예약은 환불액을 기록

## 6. 알려진 스코프 밖 (의도적으로 남겨둠)

- `ReverseBid` 제안 수락/거절 플로우 (현재는 제안 등록까지만).
- `Performer` 위치 좌표 기반 실제 반경 필터링 (현재는 장르 매칭으로 대체).
- 부분 환불 / 위약금 정책 (현재는 전액 환불 또는 취소 불가만 존재).
- 회원등급(새싹→단골→VIP→헤드라이너)·이벤트 기능(`src/lib/membership.ts`, `src/screens/audience/EventsPanel.tsx`,
  `MembershipCard.tsx`)은 이 문서의 스코프인 마켓플레이스 코어 플로우와 별개로 이전에 추가된
  기능입니다. 유지할지 여부는 별도로 확인이 필요합니다.
