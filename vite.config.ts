import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  // GitHub Pages처럼 하위 경로(/<저장소>/)로 서빙되는 곳에서도 에셋이 깨지지 않게
  // 상대 경로로 빌드합니다. HashRouter를 쓰기 때문에 라우팅에는 영향이 없습니다.
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(process.cwd(), 'src') },
  },
  server: { port: 5173, host: true },
  build: { outDir: 'dist', sourcemap: false, chunkSizeWarningLimit: 1200 },
})
