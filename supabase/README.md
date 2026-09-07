# Supabase 적용 순서

## 처음 한 번

SQL Editor에 `APPLY_ALL.sql` 전체를 붙여넣고 Run.
"Run without RLS" 를 누르세요 — 스크립트 뒷부분이 15개 테이블에 RLS를 직접 켭니다.
(에디터의 경고는 파일 앞부분의 `create table`만 보고 뜨는 것입니다)

`migrations/` 안의 세 파일을 순서대로 실행해도 결과는 같습니다.

| 파일 | 내용 |
| --- | --- |
| `0001_init.sql` | 테이블 15개 + 제약 |
| `0002_functions.sql` | 프로필 자동생성 트리거, 승인상태 가드, `v_public_shows`, `fn_accept_application` |
| `0003_rls.sql` | RLS 정책 39개 |
| `0004_view_counts.sql` | v_public_shows 에 좋아요 수·공간 평점 추가 |
| `0005_cron.sql` | KOPIS 수집 자동 실행 (Edge Function 배포 후) |
| `0006_show_media.sql` | shows 에 포스터·가격안내 컬럼 추가 + 뷰 갱신 |

## 이미 적용한 뒤 다시 실행하면

`ERROR: 42P07: relation "profiles" already exists` 가 납니다. **정상입니다** —
`create table`은 두 번 실행할 수 없습니다. 다시 올릴 필요가 없다는 뜻이니 무시하세요.

스키마를 바꿔야 할 때는 `APPLY_ALL.sql`을 다시 돌리지 말고,
`migrations/0004_xxx.sql` 처럼 새 파일을 만들어 변경분만 적으세요.

## 적용됐는지 확인

```bash
npm run db:check
```

테이블·뷰·함수 존재 여부와 RLS가 실제로 막는지를 REST로 확인합니다.

## 정책 검증

`tests/rls_test.sql` 을 SQL Editor에 붙여넣고 Run.
`begin ... rollback` 으로 감싸여 있어 몇 번을 돌려도 데이터가 남지 않습니다.
8행이 모두 PASS 여야 합니다.
