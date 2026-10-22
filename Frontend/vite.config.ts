import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import apiConfig from '../shared/api-config.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      [apiConfig.apiPrefix]: {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})
