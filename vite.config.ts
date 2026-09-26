import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import manifest from './public/manifest.json' with  { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), crx({ manifest })],
  base: './', // 상대 경로 설정 추가
})
