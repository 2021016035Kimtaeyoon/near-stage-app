# NEAR:STAGE DB 스키마

Supabase Postgres, 리전 **ap-northeast-2(서울)**. 마이그레이션 `supabase/migrations/0001~0030`이
유일한 원천입니다 — 이 문서는 그걸 읽기 쉽게 정리한 것이고, 어긋나면 마이그레이션이 맞습니다.

이전에 있던 `docs/FEATURES.md`는 지웠습니다. 결제·QR·정산·환불·회원등급을 설명하는
문서였는데, 그건 이 서비스가 실제로 하는 일과 정반대입니다(§완전 무료 원칙 참고) —
프로토타입 초기 설계가 실서비스로 바뀌면서 갱신되지 않고 남아 있었습니다.

## 설계 원칙 (0001의 주석, 지금도 유효)

1. **`shows`는 아무나 INSERT 할 수 없습니다.** 우리 무대는 `fn_accept_application`만,
   등록 공연(KOPIS)은 Edge Function(`service_role`)만 넣습니다. INSERT 정책이 아예 없습니다 —
   "공연이 생기는 경로"를 하나로 묶어야 슬롯 잠금·알림·채팅방 생성이 빠짐없이 함께 일어납니다.
2. **승인 상태(`status`)는 본인이 못 바꿉니다.** RLS로 "본인 행 UPDATE 허용"을 주면
   본인이 자기 status를 `approved`로 바꿀 수 있어서, 트리거(`fn_guard_approval_status`)로
   막습니다 — 컬럼 권한이 아니라 트리거라 어떤 경로로 들어와도 걸립니다.
3. **위치 좌표는 서버로 안 보냅니다.** 공간 좌표만 저장하고, 사용자 위치는 브라우저
   안에서만 거리 계산에 씁니다.
4. **완전 무료.** 결제·수수료·예약금·정산·QR티켓이 없습니다. `offer_fee`(구인글 참고
   금액), `rental_fee`는 전부 표시용 숫자일 뿐 결제와 연결되지 않습니다. 개런티는
   당사자가 현장에서 직접 정산합니다.
5. **RLS-first.** "프론트에서 막지 말고 DB에서 막는다." 프론트 코드가 조건을 빼먹어도
   DB가 막으면 뚫리지 않습니다.

## 역할은 계정 속성이 아니라 보유 리소스

`profiles`에 역할 컬럼이 없습니다. 공간(`venues`)이 있으면 호스트, 팀(`artists`)이
있으면 아티스트, 둘 다 없으면 관객입니다. 둘 다 가질 수 있습니다.

---

## 테이블

### 사람

| 테이블 | 핵심 컬럼 | 비고 |
|---|---|---|
| `profiles` | `id`(=auth.users.id), `display_name`, `avatar_url`, `is_admin` | 로그인 시 `fn_handle_new_user` 트리거가 자동 생성. `phone` 컬럼은 있지만 어디서도 채우지 않음(전화번호 안 받음) |
| `consents` | `user_id`, `kind`('terms'\|'privacy'), `version`, `agreed_at` | append-only(0027). update/delete 정책이 없어 아무도(운영자 포함) 못 고침. `version`은 `src/config/legal.ts`의 `LEGAL_UPDATED_AT` |
| `blocks` | `blocker_id`, `blocked_id` | 0026. 클립 댓글에서 클라이언트가 직접 걸러 씀(서버 강제 아님 — 댓글은 원래 전체 공개) |

### 공간 · 팀

| 테이블 | 핵심 컬럼 | 비고 |
|---|---|---|
| `venues` | `owner_id`, `name`, `category`, `address`, `lat/lng`, `capacity`, `equipment`(jsonb), `status` | `status`는 `fn_venue_auto_approve` 트리거가 INSERT 시 즉시 판정(0009+0010) |
| `artists` | `owner_id`, `team_name`, `genre`, `member_count`, `duration_min`, `needs`(text[]), `status` | `status`는 `fn_artist_auto_approve`가 판정(0029+0030) |
| `artist_clips` | `artist_id`, `kind`('upload'\|'link'), `url`, `thumb_url`, `title` | 0014. `artists.clip_urls`는 구버전 호환용으로만 남음 |
| `clip_likes` / `clip_comments` | `clip_id`, `user_id` | 0015 |

### 공연

| 테이블 | 핵심 컬럼 | 비고 |
|---|---|---|
| `shows` | `venue_id`, `artist_id`(우리 무대만), `starts_at`, `run_ends_at`, `status`(enum: confirmed/ongoing/ended/canceled), `source`('own'\|'kopis'), `schedule_note`, `cancel_reason`, `canceled_at` | **INSERT 정책 없음.** `shows_source_shape` CHECK: own이면 venue_id+artist_id 필수, kopis면 kopis_id 필수 |
| `venue_slots` | `venue_id`, `starts_at`, `ends_at`, `is_open`, `locked_by_show_id` | `venue_slots_unique_start`로 같은 공간 같은 시각 중복 슬롯 방지 |
| `posts` | `venue_id`, `wanted_genres`, `date_from/to`, `offer_fee`(참고용, 결제 아님), `status`('open'\|'closed') | |
| `applications` | `post_id`, `artist_id`, `status`(pending/accepted/rejected) | `applications_unique_apply`로 같은 글에 같은 팀 중복 지원 방지 |
| `post_invites` | `post_id`, `artist_id`, `invited_by`, `message` | 0028. 호스트가 먼저 아티스트를 초대. `applications`와 별개 표 — 아티스트가 실제로 지원 버튼을 눌러야 `applications`에 행이 생김 |

### 참석 · 반응 · 리뷰

| 테이블 | 핵심 컬럼 | 비고 |
|---|---|---|
| `attendances` | `show_id`, `user_id`, `headcount`(1~4), `status`(going/attended/canceled) | INSERT는 `source='own'`인 show만 가능 |
| `likes` / `follows` | `user_id` + `show_id`/`artist_id` | 복합 PK, 본인 행만 select |
| `reviews` | `show_id`, `user_id`, `target_type`('venue'\|'artist'), `rating`, `body` | INSERT 조건(0012): **시간 기준**으로 공연이 끝났고(`starts_at + duration_min < now()`), 참석 예정을 취소하지 않았을 것. `status='ended'`가 아니라 시간으로 판단 — 아무도 `status`를 `ended`로 바꿔주지 않아서 원래는 리뷰가 구조적으로 불가능했던 버그(0012에서 수정) |
| `show_reports` | `show_id`(unique), `visitor_count`, `note` | 호스트가 공연 후 직접 기록. 안 적으면 `null`(0으로 채우면 "손님이 안 왔다"로 읽힘) |
| `venue_weekly_stats` | `venue_id`, `week_start`, `visitor_count` | 0021. 공연 있던 주/없던 주 비교의 원천. 공연 여부는 저장 안 하고 `v_venue_weekly`가 `shows`에서 매번 셈 |

### 알림 · 채팅 · 관심조건

| 테이블 | 핵심 컬럼 | 비고 |
|---|---|---|
| `notifications` | `user_id`, `type`, `title`, `body`, `link`, `read_at` | 프론트에 INSERT 권한 없음 — 전부 트리거/함수가 넣음. `type` 값은 `NotificationList.tsx`의 아이콘 매핑과 반드시 맞아야 함 |
| `threads` / `messages` | `venue_id`+`artist_id`(unique pair) / `thread_id`, `sender_id` | `threads`는 `fn_accept_application`이 자동 생성. 자유 채팅은 공연 확정 전엔 열리지 않음 |
| `saved_searches` | `user_id`, `genres`(text[]), `alert_on` | 0024. **장르만** — 거리·기간은 조건에 없음(서버가 위치를 모르고, 기간을 넣으면 알림이 영영 안 옴). `fn_sort_saved_genres` 트리거가 배열을 정렬해 같은 조건 중복 저장 방지 |

### 신고 · 오류 로그

| 테이블 | 핵심 컬럼 | 비고 |
|---|---|---|
| `reports` | `reporter_id`, `target_type`(venue/artist/clip/comment/show), `target_id`, `reason`, `status` | `target_id`에 외래키 없음 — 대상이 지워져도 신고 기록(누가 반복하는지)은 남아야 함 |
| `client_errors` | (익명 INSERT 허용) | 0019. 로그아웃 상태에서도 크래시를 잡아야 해서 anon INSERT 허용, SELECT는 운영자만. 사용자 id 저장 안 함 |

---

## 뷰

| 뷰 | 용도 | 주의 |
|---|---|---|
| `v_public_shows` | 지도·목록이 읽는 **유일한** 공연 소스 | `security_invoker = false` — 승인 안 된 공간/팀 행은 아예 안 보이게 소유자 권한으로 집계. 컬럼을 추가하려면 `drop view` 후 `create view` 필요(42P16, `create or replace`로 컬럼 추가 불가) — **반드시 가장 최근 정의(현재 0018)에서 시작**할 것, 예전 정의에서 시작하면 그 뒤 추가된 컬럼이 통째로 날아감(0012에서 실제로 겪음) |
| `v_clip_feed` | 클립 피드 — 좋아요/댓글 수 집계 | 0015+0017. 마찬가지로 `security_invoker = false` |
| `v_venue_weekly` | 주간 손님 수 + 그 주 공연 여부 | 0021. **`security_invoker = true`**(위 둘과 반대) — 이건 숨겨야 할 매출 정보 자체라 호출자 권한으로 RLS를 그대로 태움 |

---

## RLS 요약 (테이블별 "누가 볼 수 있나")

- **완전 공개(select true)**: `profiles`, `venue_slots`, `posts`, `reviews`, `show_reports`
- **승인된 것만 + 본인/운영자**: `venues`, `artists` (`status='approved' or owner_id=auth.uid() or fn_is_admin()`)
- **당사자만**: `applications`(지원 팀 + 구인글 낸 공간), `post_invites`(초대한 공간 + 받은 팀),
  `attendances`(본인 + 그 공연 공간주), `threads`/`messages`(그 쌍의 공간주+팀주), `notifications`(본인),
  `saved_searches`(본인), `blocks`(본인), `consents`(본인+운영자)
- **본인만(타인 완전 비공개)**: `likes`, `follows`

도우미 함수 `fn_is_admin()` / `fn_owns_venue(id)` / `fn_owns_artist(id)` 가 대부분의 정책에서
반복 사용됩니다. 전부 `security definer` — RLS를 우회해 `profiles.is_admin`이나
`venues/artists.owner_id`를 직접 비교합니다(정책 안에서 그 테이블을 다시 SELECT하면 무한 재귀).

---

## 트랜잭션 함수 (RPC로 프론트가 직접 호출)

이 넷은 `authenticated`에게 `EXECUTE` 권한이 명시적으로 있고, 내부에서 `auth.uid()`를
다시 확인합니다(`security definer`라 RLS가 적용 안 되므로 함수 자체가 확인해야 함).

- **`fn_accept_application(application_id, slot_id)`** — 이 서비스의 심장. 한 트랜잭션에서
  ① 지원 수락 ② 같은 구인글의 나머지 지원 자동 거절 ③ 구인글 마감 ④ `shows` 행 생성
  ⑤ 슬롯 잠금 ⑥ 알림 3종(팀/공간주/팔로워) ⑦ 채팅방 생성. 하나라도 실패하면 전부 롤백.
  공간 소유자만 호출 가능.
- **`fn_cancel_show(show_id, reason)`** — 취소 + 슬롯 재오픈 + 참석자 전원과 상대방에게
  알림. 공간주·팀주 둘 다 호출 가능.
- **`fn_delete_my_account()`** — 내 공간/팀에 걸린 `shows`부터 지우고(CHECK 제약 위반
  회피) `auth.users` 삭제(`profiles` 이하 전부 cascade).
- **`updateDisplayName`** 같은 단순 갱신은 RPC가 아니라 `profiles_update_own` RLS로 직접 처리.

## 자동 판정 트리거 (INSERT/UPDATE 시 DB가 스스로 결정)

- **`fn_venue_auto_approve`** / **`fn_artist_auto_approve`** — 등록 즉시 공개할지
  심사 대기로 둘지 DB가 판정. 공간은 좌표가 진짜인지+한국 안인지+중복 이름, 팀은
  필수 항목+중복 이름만 봄(위치가 없어 이름 완전 일치만). **운영자 등록도 예외 없이
  같은 조건으로 판정**(0010, 0030) — "운영자는 판정 없이 통과"를 넣으면 컬럼 기본값
  `pending`에 그대로 남아 오히려 더 불리해짐. **자동 승인이 확인 못 하는 것**: 등록한
  사람이 진짜 그 공간/팀의 주인인지. 그건 지금도 운영자의 사후 조치(신고 처리) 몫.
- **`fn_guard_approval_status`** — `status` UPDATE를 운영자만 허용. 단, `auth.uid()`가
  없는 문맥(service_role, SQL Editor, cron)은 통과시킴(0010) — 안 그러면 Edge Function이나
  마이그레이션 자체가 막힘.

## 알림 발송 함수 (트리거, 사람이 직접 안 부름)

전부 `revoke all ... from public, anon, authenticated`로 RPC 직접 호출을 막아뒀습니다
(§보안 사고 참고). `fn_accept_application`/`fn_cancel_show` 안에서 직접 INSERT하는 알림
외에, 별도 트리거로 도는 것들:

- **`fn_notify_post_invite`** (0028) — 초대받으면 팀 주인에게.
- **`fn_notify_saved_searches`** (0024) — 우리 무대가 새로 생기면(`shows` AFTER INSERT,
  `source='own'`만) 장르가 맞는 관심조건 저장자에게. **당사자(공간주/팀주)는 제외** —
  확정 알림을 이미 받는데 또 오면 같은 일로 두 번 울림.

## 유지보수·크론 함수 (매일 자동 실행, 사람이 직접 안 부름)

- **`fn_prune_past_kopis`** — 끝난 지 7일 지난 등록 공연 삭제. `source='own'`은 **절대**
  안 지움(리뷰·방문객 기록이 호스트를 설득하는 유일한 증거).
- **`fn_prune_client_errors`** — 30일 지난 오류 로그 삭제.
- **`fn_notify_show_reminders`** — 내일 하는 우리 무대의 참석 예정자에게 리마인드.
  "지금부터 24시간 이내"가 아니라 "내일 날짜"로 골라서 크론이 한 번 밀려도 안 놓침.
- **`fn_notify_review_requests`** — 끝난 지 3일 이내인 우리 무대 참석자에게 리뷰 요청.
  이미 쓴 사람/이미 받은 사람 제외(중복 판정은 `notifications`의 `(user_id,type,link)`로,
  새 표를 안 만듦).

모두 `security definer`이고 **anon/authenticated에게 EXECUTE 권한이 없습니다** — 아래
"보안 사고" 참고.

---

## Storage 버킷

| 버킷 | 용량 제한 | 허용 타입 | 정책 |
|---|---|---|---|
| `venue-photos` | 5MB | jpeg/png/webp | 공개 읽기, 본인 폴더(`{uid}/...`)에만 쓰기 |
| `artist-photos` | 5MB | jpeg/png/webp | 위와 동일 |
| `artist-clips` | 30MB | mp4/webm/quicktime **+ jpeg** | 공개 읽기, 본인 폴더에만 쓰기. jpeg가 섞인 이유: 업로드 클립 썸네일도 같은 버킷에 넣는데, 이미지 타입을 빼면 썸네일 업로드가 mime 제한에 조용히 걸림 |

폴더 구조는 전부 `{auth.uid()}/파일명` — `storage.foldername(name)[1] = auth.uid()::text`로 강제.

---

## pg_cron 스케줄 (전부 UTC 기준 등록, 괄호가 KST)

| 시각(UTC) | KST | 작업 | 함수 |
|---|---|---|---|
| `0 19 * * *` | 04:00 | KOPIS 동기화 | Edge Function `sync-kopis` 호출 (pg_net, 0005) |
| `20 19 * * *` | 04:20 | 지난 등록 공연 정리 | `fn_prune_past_kopis` |
| `0 10 * * *` | 19:00 | 공연 전날 리마인드 | `fn_notify_show_reminders` |
| `0 2 * * *` | 11:00 | 리뷰 요청 | `fn_notify_review_requests` |

KOPIS 동기화는 그 자체로 **"7일 무활동 시 무료 프로젝트 일시정지"를 막는 생존 신호**
역할도 겸합니다 — 매일 DB에 요청이 들어가므로.

---

## 마이그레이션 이력 (0001~0030)

| # | 내용 |
|---|---|
| 0001 | 초기 스키마 전체 |
| 0002 | 트리거·뷰·`fn_accept_application` |
| 0003 | RLS 전체 |
| 0004 | `v_public_shows`에 집계(좋아요·평점) 추가 |
| 0005 | KOPIS 동기화 크론 |
| 0006 | `shows.poster_url`/`price_note` |
| 0007 | `shows.genre_raw` |
| 0008 | Storage 버킷(venue/artist 사진) |
| 0009 | 공간 자동 승인 |
| 0010 | 0009 버그 수정(운영자 특례 제거) |
| 0011 | 알림 링크 수정 + `shows` Realtime 추가 |
| 0012 | 리뷰를 시간 기준으로(구조적으로 불가능했던 버그 수정) |
| 0013 | `messages` Realtime |
| 0014 | 클립 업로드(`artist_clips`, Storage) |
| 0015 | 클립 좋아요·댓글 |
| 0016 | 신고, 계정 삭제 |
| 0017 | 공연 기간(`run_ends_at`) — 등록 공연 100건이 하루 만에 사라지던 버그 수정 |
| 0018 | 공연 취소(`fn_cancel_show`) |
| 0019 | 클라이언트 오류 로그 |
| 0020 | 지난 등록 공연 자동 정리 + 생존 신호 크론 |
| 0021 | 주간 손님 수 |
| 0022 | 등록 공연 시작일 복구(깨진 정규식 버그) |
| 0023 | 공연 요일 판정용 `schedule_note` |
| 0024 | 관심 조건(`saved_searches`) — 실제로 동작하게 |
| 0025 | 공연 리마인드·리뷰 요청 + **RPC 권한 노출 사고 수정**(아래) |
| 0026 | 차단 |
| 0027 | 약관 동의 기록 |
| 0028 | 호스트→아티스트 초대 |
| 0029 | 아티스트 자동 승인 |
| 0030 | 0029 버그 수정(0010과 같은 종류의 운영자 특례 버그) |

---

## 보안 사고 — RPC로 노출됐던 관리자 함수 (0025)

Postgres 함수는 기본적으로 `PUBLIC`에 `EXECUTE`가 열려 있고, PostgREST는 `public`
스키마의 모든 함수를 `/rest/v1/rpc/<이름>`으로 자동 노출합니다. `security definer`가
붙은 일반 함수(트리거 함수 제외 — 트리거 함수는 `RETURNS TRIGGER`라 Postgres가 직접
호출을 거부함)는 **anon 키만 있으면 아무나 관리자 권한으로 실행**할 수 있었습니다.

실제로 열려 있던 것: `fn_prune_past_kopis`(공연을 지우는 함수)가 익명 POST로 200을
반환했습니다. RLS만 챙기고 함수 권한을 안 봐서 생긴 구멍입니다.

**교훈**: `security definer`이고 사람이 직접 호출할 일이 없는 함수는 전부
`revoke all on function ... from public, anon, authenticated;`를 마이그레이션에
같이 넣을 것. 사용자가 직접 호출해야 하는 함수(`fn_accept_application` 등)만
`grant execute ... to authenticated`로 명시적으로 열어둘 것.

---

## 알아두면 자주 겪는 함정

- **`create or replace view`로 컬럼 추가 불가**(42P16) — `drop view` + `create view` 필요,
  반드시 최신 정의에서 시작.
- **PostgREST FK 모호성**(PGRST201) — 같은 테이블로 가는 외래키 경로가 둘이면
  `profiles!artists_owner_id_fkey(...)`처럼 제약 이름을 명시해야 함.
- **`regexp_matches(..., 'g')`는 SET-RETURNING**이라 `UPDATE ... SET` 안에서 못 씀(0A000) —
  `substring(x from 'regex')` 사용.
- **Realtime 채널 이름이 같으면 같은 채널 객체를 돌려줌** — 같은 훅을 쓰는 화면이
  둘 이상 뜨면(데스크톱+모바일, 탭+상세) 이미 `subscribe()`된 채널에 `.on()`을 불러
  예외가 남. 채널 이름에 `useId()`를 붙여야 함.
- **KOPIS는 공연 "기간"만 주지 "요일"은 안 줌** — `dtguidance` 원문(`schedule_note`)을
  `lib/showSchedule.ts`가 파싱. 못 읽으면 거르지 않고 "직접 확인" 안내.
