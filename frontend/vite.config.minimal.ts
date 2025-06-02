import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 最小化配置用于调试
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})
