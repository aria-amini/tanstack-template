import { resolve } from 'node:path'

import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { varlockVitePlugin } from '@varlock/vite-integration'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import { nitro } from 'nitro/vite'
import { defineConfig, type UserConfig } from 'vite-plus'
import { playwright } from 'vite-plus/test/browser-playwright'

const fmt = {
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
		'tools/oxlint/anti-slop/**',
	],
	overrides: [
		{
			files: ['*.{yaml,yml}'],
			options: { useTabs: false },
		},
	],
} satisfies UserConfig['fmt']

const lint = {
	plugins: [
		'eslint',
		'unicorn',
		'typescript',
		'oxc',
		'react',
		'react-perf',
		'import',
		'jsdoc',
		'jsx-a11y',
		'node',
		'promise',
	],
	jsPlugins: [
		{ name: 'eslint-js', specifier: 'oxlint-plugin-eslint' },
		'@shadcn/lint',
		{ name: 'anti-slop', specifier: './tools/oxlint/anti-slop/index.ts' },
	],
	categories: {},
	options: {
		typeAware: true,
		typeCheck: true,
	},
	rules: {
		'no-empty-pattern': 'off',
		'no-console': ['error', { allow: ['warn', 'error'] }],
		'typescript/consistent-type-assertions': [
			'error',
			{ assertionStyle: 'never' },
		],
		'oxc/no-accumulating-spread': 'error',
		'anti-slop/no-array-filter-map': 'error',
		'anti-slop/no-reduce-accumulator-copy': 'error',
		'anti-slop/no-chained-type-assertions': 'error',
		'anti-slop/no-conditional-empty-object-spread': 'error',
		'anti-slop/no-known-value-widening': 'error',
		'anti-slop/no-object-parameters': 'error',
		'anti-slop/no-reflect-apply': 'error',
		'anti-slop/no-reflect-get': 'error',
		'anti-slop/no-runtime-typeof': 'error',
		'anti-slop/no-shape-in-symbol-names': 'error',
		'anti-slop/no-unknown-parameters': 'error',
		'anti-slop/no-unknown-returns': 'error',
		'anti-slop/no-unknown-type-aliases': 'error',
		'anti-slop/no-unsafe-dictionary-type': 'error',
		'anti-slop/no-widen-then-assert': 'error',
		'anti-slop/require-readable-spacing': 'error',
		'anti-slop/require-safety-comment-for-type-assertion': 'error',
		'eslint-js/no-restricted-syntax': [
			'error',
			{
				selector: 'JSXAttribute[name.name="className"] TemplateLiteral',
				message:
					'Do not build className with template literals. Use cn() from "cn" instead.',
			},
		],
		'shadcn/require-static-classes': 'error',
		'shadcn/no-raw-colors': 'error',
		// The theme declares these utilities in @theme inline, but the rule
		// cannot resolve values declared that way, so they are allow-listed
		// by name.
		'shadcn/no-unknown-classes': [
			'error',
			{
				allow: [
					'text-2xs',
					'text-3xs',
					'text-4xs',
					'text-5xs',
					'leading-display',
					'animate-pending-slide',
				],
			},
		],
		'shadcn/no-arbitrary-values': ['error', { allow: ['layout'] }],
		'shadcn/no-inline-styles': 'error',
		'shadcn/no-restyle': [
			'error',
			{
				allow: ['layout'],
				contracts: [
					{ pattern: '^Card$', allow: ['layout', 'spacing', 'color'] },
					{ pattern: '^Button$', allow: ['layout'] },
				],
			},
		],
	},
	overrides: [
		{
			files: ['src/components/ui/**'],
			rules: {
				'shadcn/require-static-classes': 'off',
				'shadcn/no-restyle': 'off',
				'shadcn/no-arbitrary-values': 'off',
			},
		},
		{
			// The Google logo keeps its four brand fills; they are fixed brand
			// colors, not theme values.
			files: ['src/components/google-auth-button.tsx'],
			rules: {
				'shadcn/no-raw-colors': 'off',
			},
		},
		{
			files: ['scripts/**', 'mise-tasks/**', '**/*.server.ts'],
			rules: {
				'no-console': 'off',
			},
		},
	],
	settings: {
		'jsx-a11y': { components: {}, attributes: {} },
		react: { formComponents: [], linkComponents: [] },
		jsdoc: {
			ignorePrivate: false,
			ignoreInternal: false,
			ignoreReplacesDocs: true,
			overrideReplacesDocs: true,
			augmentsExtendsReplacesDocs: false,
			implementsReplacesDocs: false,
			exemptDestructuredRootsFromChecks: false,
			tagNamePreference: {},
		},
	},
	env: { builtin: true },
	globals: {},
	ignorePatterns: ['**/dist/**', 'tools/oxlint/anti-slop/**'],
} satisfies UserConfig['lint']

const root = import.meta.dirname

export default defineConfig({
	staged: {
		'*': 'vp check --fix',
	},
	root,
	// Pre-bundle the browser test stack at startup; without this each dep is
	// discovered lazily mid-run, and the re-optimization reload aborts
	// whichever test file is loading.
	optimizeDeps: {
		include: [
			'vite-plus/test',
			'vite-plus/test/browser',
			'vitest-browser-react',
			'msw',
			'msw/browser',
		],
	},
	server: { host: '127.0.0.1', port: Number(process.env.APP_PORT ?? 3000) },
	// TanStack Router ships RSC "use client" directives in its dist for RSC
	// compat; this app builds no RSC graph, so the bundling warnings are noise.
	build: {
		rollupOptions: {
			checks: { moduleLevelDirective: false },
		},
	},
	resolve: {
		tsconfigPaths: true,
		dedupe: ['react', 'react-dom'],
		alias: [
			{ find: '@', replacement: resolve(root, 'src') },
			{ find: '@tests', replacement: resolve(root, 'tests') },
		],
	},
	plugins: [
		tanstackStart({
			router: { routeFileIgnorePattern: '(\\.test\\.tsx$|__screenshots__)' },
			server: {
				build: {
					inlineCss: true,
				},
			},
		}),
		...(process.env.VITEST === 'true'
			? []
			: [
					devtools({ injectSource: { enabled: false } }),
					nitro({ sourcemap: true, experimental: { sourcemapMinify: false } }),
				]),
		tailwindcss(),
		viteReact(),
		babel({ presets: [reactCompilerPreset()] }),
		varlockVitePlugin({ ssrInjectMode: 'resolved-env' }),
	],
	fmt,
	lint,
	test: {
		// Headless runs and screenshot baselines work with writes disabled.
		// allowWrite exists for UI clients on the tailnet (snapshot/baseline
		// updates from the browser UI); execution stays disabled.
		api: { allowWrite: true, allowExec: false },
		projects: [
			{
				extends: true,
				test: {
					name: 'unit',
					include: ['src/**/*.unit.test.ts', 'src/**/*.test.unit.ts'],
				},
			},
			{
				extends: true,
				test: {
					name: 'server',
					include: ['src/**/*.server.test.ts', 'src/**/server.test.ts'],
					testTimeout: 30_000,
					fileParallelism: false,
				},
			},
			{
				extends: true,
				test: {
					name: 'browser',
					// Docker network changes in server tests abort Chromium module requests.
					sequence: { groupOrder: 1 },
					include: ['src/**/*.test.tsx', 'tests/**/*.test.tsx'],
					setupFiles: ['./src/styles.css'],
					fileParallelism: false,
					retry: 0,
					testTimeout: 15_000,
					browser: {
						commands: {
							async resetScreenshotPointer({ page }) {
								await page.mouse.move(0, 0)
							},
							async resizeBrowserViewport(
								{ page },
								width: number,
								height: number,
							) {
								await page.setViewportSize({ width, height })
							},
						},
						instances: [
							{
								browser: 'chromium',
								name: 'desktop',
								viewport: { width: 1280, height: 720 },
							},
							{
								browser: 'chromium',
								name: 'mobile',
								viewport: { width: 375, height: 812 },
							},
						],
						provider: playwright({
							launchOptions: { args: ['--disable-lcd-text'] },
							actionTimeout: 3_000,
						}),
						enabled: true,
						headless: true,
					},
				},
			},
		],
	},
})
