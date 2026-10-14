import { defineConfig } from 'vite-plus'

export default defineConfig({
	pack: {
		entry: {
			'tanstack/index': 'src/tanstack/index.ts',
			'vite-plus/index': 'src/vite-plus/index.ts',
			'anti-slop/index': 'src/anti-slop/index.ts',
			'vitest/index': 'src/vitest/index.ts',
			'vitest/browser': 'src/vitest/browser.ts',
			'vitest/react': 'src/vitest/react.tsx',
			'vitest/server': 'src/vitest/server.ts',
			'vitest/db': 'src/vitest/db.ts',
			playwright: 'src/playwright.ts',
		},
		dts: true,
		format: ['esm'],
		sourcemap: true,
	},
	test: {
		name: 'config',
		include: ['src/**/*.test.ts'],
		// A standalone Node script that needs the oxlint binary, not a suite.
		exclude: ['src/anti-slop/rules/require-readable-spacing-cli.test.ts'],
		setupFiles: ['src/anti-slop/rule-tester.setup.ts'],
	},
})
