/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        globals: true,
        environment: 'jsdom',
        include: ['**/*.test.ts'],
        deps: {
            // Handle ESM modules properly
            interopDefault: true
        },
        // Avoid browser API stubbing issues
        environmentOptions: {
            jsdom: {
                resources: 'usable'
            }
        },
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            reportsDirectory: './coverage',
            exclude: [
                'node_modules/**',
                'dist/**',
                '**/*.d.ts',
                '**/*.test.ts',
                'vitest.config.ts'
            ]
        }
    },
}) 