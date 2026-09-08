import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

/**
 * ★ base 를 환경변수로 둡니다.
 *
 *   Cloudflare Pages 처럼 루트(/)로 서빙되면 '/' 가 맞습니다. GitHub Pages 의
 *   하위 경로(/<저장소>/)로 서빙할 때만 './' 나 '/near-stage/' 로 바꿉니다.
 *
 *   예전에는 './' 로 고정해 뒀는데, _redirects 의 catch-all 과 겹치면 문제가 됩니다.
 *   누가 /audience/home 같은 깊은 주소를 직접 치면 index.html 이 내려오고, 그 안의
 *   상대 경로가 /audience/assets/... 로 해석돼 화면이 통째로 비어 버립니다.
 *   루트 배포에서는 '/' 가 안전합니다.
 */
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    base: env.VITE_BASE || '/',
    plugins: [react()],
    resolve: {
      alias: { '@': path.resolve(process.cwd(), 'src') },
    },
    server: { port: 5173, host: true },
    build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1200 },
  }
})
