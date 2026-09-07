/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  /** 카카오 REST API 키 — client_id 역할이라 브라우저 노출이 정상입니다 */
  readonly VITE_KAKAO_REST_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
