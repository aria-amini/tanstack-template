import type { UserConfig } from 'vite-plus'

export const fmt = {
	singleQuote: true,
	semi: false,
	useTabs: true,
	experimentalTailwindcss: {},
	experimentalSortImports: {},
	printWidth: 80,
	experimentalSortPackageJson: false,
	proseWrap: 'always',
	ignorePatterns: [
		'**/.output',
		'**/.vite',
		'**/dist/**',
		'pnpm-lock.yaml',
		'env.d.ts',
		'**/routeTree.gen.ts',
	],
	overrides: [
		{
			files: ['*.{yaml,yml}'],
			options: { useTabs: false },
		},
	],
} satisfies UserConfig['fmt']
