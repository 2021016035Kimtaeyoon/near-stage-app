# Edge Functions

## sync-kopis — 등록 공연 수집

지도가 오픈 첫날 비지 않게 하는 장치입니다. 우리 무대가 0건이어도 서울의 실제
공연들이 `등록 공연`으로 지도에 뜹니다.

### 필요한 시크릿

```bash
npx supabase secrets set KOPIS_API_KEY=발급받은키
npx supabase secrets set KAKAO_REST_API_KEY=카카오REST키
```

`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 는 런타임이 자동으로 넣어줍니다.
service_role 키는 **프론트엔드에 절대 넣지 않습니다** — 이 함수 안에서만 씁니다.
shows 테이블에 INSERT 정책이 없기 때문에(0003_rls.sql), 이 함수만 등록 공연을
넣을 수 있습니다.

### 배포

```bash
npx supabase functions deploy sync-kopis
```

### 수동 실행

```bash
npx supabase functions invoke sync-kopis
```

응답 예: `{ ok: true, fetched: 100, upserted: 84, skippedNoCoords: 12, failed: 4 }`

좌표를 못 구한 공연은 건너뜁니다. 좌표가 없으면 지도에 찍을 수 없고, 목록에서도
빠지기 때문에 넣어도 보이지 않습니다.

### 하루 한 번 자동 실행

`0005_cron.sql` 을 SQL Editor에서 실행하면 매일 새벽 4시(KST)에 돌아갑니다.

### 알아둘 것

- **서울만** 수집합니다 (`signgucode=11`). 지역을 넓히려면 index.ts 의 `REGION` 을
  바꾸세요.
- **회차별 행을 만들지 않습니다.** KOPIS 의 공연 시간 안내는
  "화요일 ~ 금요일(19:30), 토요일(15:00,19:00)" 같은 자유 문장이라 정확한 회차를
  기계적으로 뽑기 어렵습니다. 공연 하나에 행 하나를 만들고 시작일의 첫 시각을
  씁니다. 정확한 회차는 카드의 원본 예매처 링크에서 확인하도록 했습니다.
- **출처 표기 의무.** 화면에 "공연 정보 출처: 공연예술통합전산망(KOPIS)" 를
  노출합니다. 상업적 이용 조건은 예술경영지원센터 약관을 확인하고, 애매하면
  직접 문의하세요.
