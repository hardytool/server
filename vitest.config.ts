import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    testTimeout: 30000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary'],
      include: [
        'src/lib/**/*.ts',
        'src/repos/**/*.ts',
        'src/api/**/*.ts',
        'src/config.ts',
        'src/seed-data.ts',
      ],
      exclude: [
        'src/repos/migration.ts',
      ],
      thresholds: {
        'src/lib/steamId.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/emojify.ts': {
          statements: 100,
          branches: 100,
          functions: 100,
          lines: 100,
        },
        'src/lib/csv.ts': {
          statements: 80,
          branches: 100,
          functions: 100,
          lines: 80,
        },
      },
    },
  },
})
