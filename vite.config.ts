/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rollupOptions: {
      output: {
        // Long-lived libraries get their own cacheable chunks. Zod is left to
        // automatic splitting so it only loads with the screens that need it.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return 'react'
          if (/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(id)) return 'motion'
          if (/node_modules\/(dexie|dexie-react-hooks)\//.test(id)) return 'dexie'
          return undefined
        },
      },
    },
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
})
