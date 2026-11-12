import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import apiConfig from '../shared/api-config.json' with { type: 'json' }

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    proxy: {
      [apiConfig.apiPrefix]: {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
})