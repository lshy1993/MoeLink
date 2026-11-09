import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

function buildStamp(date: Date): string {
  const pad = (v: number) => String(v).padStart(2, '0')
  return [
    date.getFullYear(),
    pad(date.getMonth() + 1),
    pad(date.getDate()),
    '-',
    pad(date.getHours()),
    pad(date.getMinutes()),
  ].join('')
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const now = new Date()
  const isDev = mode === 'development'
  const buildVersion = process.env.VITE_BUILD_VERSION || (isDev ? 'dev' : buildStamp(now))

  return {
    plugins: [vue(), vueDevTools()],
    define: {
      __BUILD_VERSION__: JSON.stringify(buildVersion),
      __BUILD_TIME__: JSON.stringify(now.toISOString()),
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173, // 这里设置端口号
      host: true,
      allowedHosts: ['moelink.site', 'www.moelink.site'],
      proxy: {
        '/api': {
          target: process.env.VITE_API_URL || 'http://localhost:8020',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
        },
      },
    },
  }
})
