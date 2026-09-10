# 운영 가이드

배포 절차는 [`DEPLOY.md`](./DEPLOY.md), DB 구조는 [`SCHEMA.md`](./SCHEMA.md)를 보세요.
이 문서는 "이미 돌고 있는 것을 어떻게 확인·관리하는가"만 다룹니다.

## Supabase 프로젝트

- 프로젝트 ref: `rbsywpjywbylmuacrkkh`, 리전 서울(ap-northeast-2)
- 대시보드: https://supabase.com/dashboard/project/rbsywpjywbylmuacrkkh
- SQL Editor: https://supabase.com/dashboard/project/rbsywpjywbylmuacrkkh/sql/new
- **무료 플랜 — 7일간 요청이 없으면 프로젝트가 자동 일시정지됩니다.** `sync-kopis`
  크론이 매일 새벽 4시에 도는 것이 정리 작업이자 동시에 이걸 막는 생존 신호입니다.
  일시정지되면 대시보드에서 수동으로 "Resume"해야 합니다(자동 재개 없음).

## Edge Functions

| 함수 | 하는 일 | 필요한 시크릿 |
|---|---|---|
| `sync-kopis` | KOPIS 공연 목록 동기화, 매일 새벽 4시 자동 실행 | `KOPIS_API_KEY`, `KAKAO_REST_API_KEY`(주소→좌표) |
| `kakao-oidc` | 카카오 로그인(OIDC id_token 교환) | `KAKAO_REST_API_KEY`, `KAKAO_CLIENT_SECRET` |
| `kakao-memo` | 참석 예정 확정 시 "나에게 보내기" 카카오톡 메시지 | 없음(사용자의 access_token을 그때그때 받아 그대로 씀, 저장 안 함) |
| `clip-og` | 클립 공유 링크의 미리보기(OG) 이미지 생성 | `SITE_URL`(실제 서비스 주소 — 배포 전엔 개발 주소로 임시 설정 가능) |

`SUPABASE_URL`/`SUPABASE_ANON_KEY`/`SUPABASE_SERVICE_ROLE_KEY`는 런타임이 자동 주입하므로
따로 설정할 필요 없습니다.

### 배포

```bash
npx supabase functions deploy <함수이름> --project-ref rbsywpjywbylmuacrkkh
```

### 시크릿 설정/확인

```bash
npx supabase secrets set KEY=값 --project-ref rbsywpjywbylmuacrkkh
npx supabase secrets list --project-ref rbsywpjywbylmuacrkkh
```

### 직접 호출(테스트용)

```bash
curl -X POST "https://rbsywpjywbylmuacrkkh.supabase.co/functions/v1/sync-kopis" \
  -H "Authorization: Bearer <anon key>"
```

`sync-kopis`는 시간이 걸립니다(공연 1건마다 상세·공연장 API를 부름). 신규 공연이
많으면 한 번에 못 끝내고 `stoppedEarly: true`를 돌려줄 수 있습니다 — 정상이며,
다음 실행이 이어받습니다(이미 받은 공연은 API를 다시 안 부르고 건너뜀).

**대시보드에서 함수를 붙여넣을 때 주의**: 코드 첫 줄이 `/**`(블록 주석)로 시작하면
붙여넣기 중 첫 줄이 잘려 파싱이 깨지는 사고가 있었습니다. 그래서 모든 함수의 파일
맨 위 설명은 `//` 줄 주석으로 되어 있습니다 — 새 함수를 만들 때도 이 관례를 따르세요.

## pg_cron

```sql
select * from cron.job;                                    -- 등록된 작업 목록
select * from cron.job_run_details order by start_time desc limit 20;  -- 실행 이력
```

일정은 [`SCHEMA.md`의 pg_cron 표](./SCHEMA.md#pg_cron-스케줄-전부-utc-기준-등록-괄호가-kst)를 보세요.
`sync-kopis-daily` 작업은 `service_role` 키를 SQL 안에 직접 담고 있어서 **저장소에
커밋하지 않습니다** — DB에서 직접 확인/재등록해야 하고, 그 SQL 원본은
`supabase/migrations/0005_cron.sql`에 `<SERVICE_ROLE_KEY>` 자리표시자로만 남아 있습니다.

## 카카오

- **카카오 로그인은 Supabase 내장 OAuth provider를 안 씁니다.** 그쪽은 scope에
  `account_email`을 강제로 넣어 비즈 앱 전환 전에는 KOE205로 막힙니다. 대신
  `kakao-oidc` Edge Function으로 직접 OIDC id_token을 교환합니다(`useKakaoLogin.ts`).
- **카카오톡 메시지 발송("나에게 보내기") 권한이 필요합니다** — 카카오 개발자
  콘솔에서 `talk_message` 동의항목을 켜야 참석 예정 확정 알림이 갑니다.
- 사이트 도메인 등록: 배포 주소가 정해지면 카카오 개발자 콘솔의 "플랫폼 > Web"에
  추가해야 로그인 리다이렉트가 통과합니다.

## 로그인 수단

카카오·구글·이메일(매직링크) 셋. 이메일은 비밀번호가 없습니다 — 자세한 이유는
`hooks/useAuth.ts`의 `signInWithEmail` 주석 참고.

**★ 이메일 로그인은 SMTP를 붙이기 전까지 실사용에 열지 마세요.** Supabase 기본
메일 발송은 시간당 2~4통이고 발신 주소가 `supabase.io`라 스팸함으로 자주 빠집니다.
붙이는 방법: Supabase 대시보드 → Authentication → Email → SMTP Settings에서
[Resend](https://resend.com)(무료 월 3,000통) 같은 서비스 연결.

## 알려진 운영 함정

- **KOPIS는 공연 "기간"만 주지 "요일"은 안 줍니다.** `schedule_note`(원문)를
  파싱해서 요일을 판정하는데, 파싱 못 한 건 필터링하지 않고 "예매처에서 확인"으로
  안내합니다 — 추측해서 거르면 실제 공연이 목록에서 사라집니다.
- **`fn_prune_past_kopis`가 `source='own'`은 절대 안 지웁니다** — 실수로 지우면
  리뷰·방문객 기록(호스트를 설득하는 유일한 증거)이 함께 사라집니다.
- **위치정보는 절대 서버로 보내지 않습니다** — 새 기능을 만들 때 이 원칙을
  깨는 API 설계(좌표를 body/쿼리에 담아 서버로 보내는 것)를 하지 마세요.
- **`security definer` 함수를 새로 만들면 반드시 EXECUTE 권한을 확인**하세요.
  기본값은 `PUBLIC`에 열려 있고, PostgREST가 자동으로 `/rest/v1/rpc/`에 노출합니다.
  사람이 직접 호출할 함수가 아니면 `revoke all ... from public, anon, authenticated`를
  같이 넣으세요(0025 보안 사고 참고).

## 아직 실행 안 한 것 (코드는 준비됨)

- **`clip-og` Edge Function 배포 + `SITE_URL` 시크릿 설정** — 클립 공유 미리보기가
  아직 사이트 대표 이미지만 보여주는 중.
- **이메일 로그인용 SMTP 연결** — 위 참고.
- **배포 전체** — [`no-deploy-yet` 메모리] 참고, 사장님이 먼저 말할 때까지 진행하지 않음.
