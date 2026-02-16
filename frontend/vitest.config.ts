import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom environment for React components
    environment: 'jsdom',

    // Setup file for global test configuration
    setupFiles: ['./src/test/setup.ts'],

    // Include patterns for test files
    include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],

    // Global test configurations
    globals: true,

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        'src/app/**/layout.tsx',
        'src/app/**/loading.tsx',
        'src/app/**/not-found.tsx',
        'src/app/**/error.tsx',
      ],
    },

    // Mock CSS modules and other assets
    css: false,

    // Timeout settings
    testTimeout: 10000,
    hookTimeout: 10000,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})