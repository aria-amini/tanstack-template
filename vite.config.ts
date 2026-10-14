import { defineConfig } from 'vite-plus'

import {
	fmt,
	lint,
	mergeToolkitConfig,
} from './packages/config/src/vite-plus/index.ts'

export default defineConfig(
	mergeToolkitConfig(
		{ fmt, lint: lint('node') },
		{
			fmt: {
				ignorePatterns: [
					'templates/**',
					'packages/*/CHANGELOG.md',
					'packages/config/src/anti-slop/**',
					'.changeset/*.md',
				],
			},
			lint: {
				// The root lints the anti-slop source; apps load the built entry.
				jsPlugins: () => [
					{ name: 'eslint-js', specifier: 'oxlint-plugin-eslint' },
					{
						name: 'anti-slop',
						specifier: './packages/config/src/anti-slop/index.ts',
					},
				],
				ignorePatterns: ['templates/**', 'packages/config/src/anti-slop/**'],
			},
			test: { projects: ['packages/*'] },
		},
	),
)
