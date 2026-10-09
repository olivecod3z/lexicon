import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
const authFixture = fileURLToPath(new URL('./auth-fixture.js', import.meta.url))
export default defineConfig({
  root: fileURLToPath(new URL('../../', import.meta.url)),
  plugins: [{ name: 'isolated-release-auth-fixture', enforce: 'pre', resolveId(source) {
    if (source === 'firebase/auth' || source === './firebase' || source === '../firebase') return authFixture
  } }, react()],
  server: { host: '127.0.0.1', port: 4176, strictPort: true,
    proxy: Object.fromEntries(['/account', '/courses', '/materials', '/reviews', '/practice-sessions', '/fixture'].map(path => [path, 'http://127.0.0.1:8176'])) },
})
