import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/dashboard/',
  server: { proxy: { '/materials': 'http://127.0.0.1:8000', '/quizzes': 'http://127.0.0.1:8000', '/practice-sessions': 'http://127.0.0.1:8000' } },
})
