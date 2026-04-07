import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/auth-api': {
        target: 'https://auth.21-school.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/auth-api/, ''),
      },
      '/platform-api': {
        target: 'https://platform.21-school.ru',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/platform-api/, ''),
      },
    },
  },
})
