import { defineConfig } from 'vite-plus'

export default defineConfig({
	pack: {
		entry: {
			'vite-plus/index': 'src/vite-plus/index.ts',
			'anti-slop/index': 'src/anti-slop/index.ts',
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
