import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url' // 使用 node:url 导入

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/api': {
        // 目标地址通常是 wrangler dev 启动的 Pages Functions 本地服务器
        // 这个地址可能需要用户根据实际情况调整
        target: 'http://localhost:8788', // 假设 wrangler dev 在 8788 端口
        changeOrigin: true,
        // 可选：如果你的 functions 路径不是直接在根目录下的 functions，可能需要 rewrite
        // rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  }
})
