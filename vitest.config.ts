import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['test/unit/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['util/**', 'common/**', 'components/**', 'pages/**'],
      exclude: ['**/*.d.ts', 'pages/api/**', 'pages/_*.tsx'],
    },
  },
  resolve: {
    alias: [{ find: /^@\/(.*)$/, replacement: path.resolve(__dirname, '$1') }],
  },
})
