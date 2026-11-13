import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)), 'server-only': fileURLToPath(new URL('./tests/server-only-stub.ts', import.meta.url)) } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['./tests/global-setup.ts'],
    testTimeout: 30000,
    hookTimeout: 60000,
    fileParallelism: false,
  },
})
