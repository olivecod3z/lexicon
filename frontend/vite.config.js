import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The dashboard's live home is dashboard.lexycon.site. The combined root site
  // explicitly supplies /dashboard/ during its separate hosting build.
  base: process.env.VITE_BASE_PATH || '/',
  server: { proxy: { '/materials': 'http://127.0.0.1:8000', '/quizzes': 'http://127.0.0.1:8000', '/practice-sessions': 'http://127.0.0.1:8000' } },
})
