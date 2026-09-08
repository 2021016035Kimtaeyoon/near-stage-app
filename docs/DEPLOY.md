# 배포 (Cloudflare Pages)

이 문서만 따라 하면 배포됩니다. 순서를 지켜주세요 — 3번을 빼먹으면 배포는 되지만
로그인이 안 됩니다.

---

## 0. 배포 전 반드시 채울 것

### 운영자 정보

`src/config/legal.ts` 의 `OPERATOR` 가 비어 있으면 약관 화면 맨 위에 경고가 뜹니다.
연락처 없는 개인정보처리방침은 법적으로 미비합니다.

```ts
export const OPERATOR = {
  name: '',            // ← 운영자 이름 또는 팀 이름
  email: '',           // ← 문의·개인정보 관련 연락처
  privacyOfficer: '',  // ← 비우면 name 을 씁니다
} as const
```

---

## 1. GitHub 저장소에 올리기

Cloudflare Pages 는 GitHub 저장소를 보고 자동 빌드합니다.

```bash
git remote add origin https://github.com/<계정>/<저장소>.git
git push -u origin real-service
```

`.env.local` 은 `.gitignore` 에 있어 올라가지 않습니다. **키는 다음 단계에서
Cloudflare 에 따로 넣습니다.**

---

## 2. Cloudflare Pages 프로젝트 만들기

<https://dash.cloudflare.com/> → **Workers & Pages** → **Create** → **Pages** →
**Connect to Git**

| 항목 | 값 |
| --- | --- |
| Framework preset | `Vite` |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Production branch | `real-service` |

### 환경변수 (Settings → Environment variables → Production)

**★ Vite 환경변수는 빌드할 때 코드에 박힙니다.** 여기 넣지 않으면 배포된 앱이
서버에 접속하지 못합니다. 값은 로컬 `.env.local` 과 같습니다.

| 이름 | 설명 |
| --- | --- |
| `VITE_SUPABASE_URL` | Supabase 프로젝트 URL |
| `VITE_SUPABASE_ANON_KEY` | anon public 키 — **프론트 노출이 정상입니다.** 보안은 RLS 가 담당합니다 |
| `VITE_KAKAO_REST_API_KEY` | 카카오 REST API 키 (로그인 교환용) |
| `VITE_KAKAO_JS_KEY` | 카카오 JavaScript 키 (주소 좌표 변환용) |
| `VITE_SITE_URL` | 배포 주소. **끝에 슬래시 없이** (예: `https://near-stage.pages.dev`) |

> `service_role` 키는 **절대** 넣지 마세요. 프론트에 들어가면 RLS 가 전부 무력화됩니다.

`VITE_SITE_URL` 은 첫 배포 주소를 받은 뒤에 채우고 **한 번 더 배포**해야 합니다.
카카오톡 공유 미리보기(OG 태그)가 이 값을 씁니다.

---

## 3. 배포 주소를 각 서비스에 등록 (이걸 빼면 로그인이 안 됩니다)

배포 주소를 `https://<이름>.pages.dev` 라고 하겠습니다.

### ① Supabase — Auth 리다이렉트 허용 목록

<https://supabase.com/dashboard/project/rbsywpjywbylmuacrkkh/auth/url-configuration>

- **Site URL**: `https://<이름>.pages.dev`
- **Redirect URLs** 에 추가:
  - `https://<이름>.pages.dev`
  - `https://<이름>.pages.dev/**`

기존 `http://localhost:5250` 항목은 지우지 마세요. 로컬 개발이 막힙니다.

### ② 카카오 — Redirect URI (여러 개 등록 가능)

<https://developers.kakao.com/console/app> → 내 앱 → **카카오 로그인** →
**Redirect URI**

추가: `https://<이름>.pages.dev/`

> 슬래시로 끝나야 합니다. 앱이 `window.location.origin + BASE_URL` 을 보내는데
> `BASE_URL` 이 `/` 이기 때문입니다.

### ③ 카카오 — JavaScript 키 사이트 도메인 (**하나만 등록 가능**)

같은 콘솔 → **앱 설정 → 플랫폼 → Web → 사이트 도메인**

현재 `https://2021016035kimtaeyoon.github.io` 로 되어 있습니다. 이걸
`https://<이름>.pages.dev` 로 **교체**하세요.

**교체하지 않아도 서비스는 돌아갑니다.** 주소 → 좌표 변환이 카카오 대신
OpenStreetMap 으로 넘어갈 뿐입니다(정확도가 조금 낮습니다). 로그인은 ②번과
별개라 영향받지 않습니다.

### ④ 구글 — 승인된 리디렉션 URI

<https://console.cloud.google.com/apis/credentials>

이미 등록된 `https://rbsywpjywbylmuacrkkh.supabase.co/auth/v1/callback` 그대로
두면 됩니다. **구글은 우리 도메인이 아니라 Supabase 콜백을 봅니다.**
추가 작업 없습니다.

### ⑤ 카카오 — 사이트 도메인 (메시지 링크에도 씁니다)

참석 예정 확인 메시지 안의 링크 도메인이 **카카오 콘솔의 사이트 도메인에 등록돼
있어야** 합니다. 등록되지 않은 주소를 넣으면 카카오가 전송을 거절합니다.

③번에서 사이트 도메인을 배포 주소로 바꾸면 이것도 함께 해결됩니다.

### ⑥ Edge Function — 허용 출처

`kakao-oidc` 와 `kakao-memo` **두 함수 모두** `ALLOWED_ORIGINS` 에 배포 주소를
추가하고 재배포하세요. 없으면 카카오 로그인의 토큰 교환과 확인 메시지 전송이
CORS 로 막힙니다.

<https://supabase.com/dashboard/project/rbsywpjywbylmuacrkkh/functions>

---

## 4. 배포 후 확인 (순서대로)

| 확인 | 방법 |
| --- | --- |
| 화면이 뜨는가 | `https://<이름>.pages.dev/#/landing` |
| 서버에 붙는가 | 지도에 공연이 뜨는지. 안 뜨면 2번 환경변수 |
| 카카오 로그인 | 마이 → 로그인. 실패하면 3-①②⑤ |
| 구글 로그인 | 같은 화면에서 |
| 카톡 공유 미리보기 | 링크를 나에게 보내보기. 이미지가 안 나오면 `VITE_SITE_URL` 확인 |
| 약관 | `#/legal/terms` 에 경고가 없어야 함 (0번) |

---

## 왜 Cloudflare Pages 인가

- 무료 플랜에 대역폭 제한이 없습니다. 클립(영상)을 쓰는 서비스라 이게 중요합니다.
- HTTPS 가 기본이고, 카카오·구글 로그인이 HTTPS 를 요구합니다.
- `_headers` · `_redirects` 파일로 응답 헤더와 라우팅을 저장소 안에서 관리합니다.

## 알려진 제약

- **Supabase 무료 플랜은 7일간 요청이 없으면 프로젝트를 일시정지**합니다. 정지되면
  앱이 데이터를 못 읽습니다. 대시보드에서 다시 켜면 복구됩니다.
- **Storage 무료 용량 1GB**. 클립이 30MB 짜리면 30~300개에서 찹니다.
  `supabase/migrations/0014_artist_clips.sql` 에 조일 자리를 적어뒀습니다.
- **`VITE_*` 환경변수는 빌드에 박히므로 값을 바꾸면 반드시 재배포**해야 합니다.
