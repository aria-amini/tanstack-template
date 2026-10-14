import type { UserConfig } from 'vite-plus'

type LintConfig = NonNullable<UserConfig['lint']>

export type Framework = 'react' | 'astro' | 'node'

const basePlugins = [
	'eslint',
	'unicorn',
	'typescript',
	'oxc',
	'import',
	'jsdoc',
	'node',
	'promise',
] satisfies LintConfig['plugins']

const frameworkPlugins = {
	react: ['react', 'react-perf', 'jsx-a11y'],
	astro: ['jsx-a11y'],
	node: [],
} satisfies Record<Framework, LintConfig['plugins']>

const antiSlopRules = {
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
} satisfies LintConfig['rules']

const reactRules = {
	'eslint-js/no-restricted-syntax': [
		'error',
		{
			selector: 'JSXAttribute[name.name="className"] TemplateLiteral',
			message:
				'Do not build className with template literals. Use cn() from "cn" instead.',
		},
	],
} satisfies LintConfig['rules']

const frameworkRules = {
	react: reactRules,
	astro: {},
	node: {},
} satisfies Record<Framework, LintConfig['rules']>

const browserSettings = {
	'jsx-a11y': { components: {}, attributes: {} },
	react: { formComponents: [], linkComponents: [] },
}

const frameworkSettings = {
	react: browserSettings,
	astro: browserSettings,
	node: {},
} satisfies Record<Framework, LintConfig['settings']>

/** Oxlint preset for one framework. Every app shares the base and anti-slop rules. */
export function lint(framework: Framework) {
	return {
		plugins: [...basePlugins, ...frameworkPlugins[framework]],
		jsPlugins: [
			{ name: 'eslint-js', specifier: 'oxlint-plugin-eslint' },
			{ name: 'anti-slop', specifier: '@aamini/config/anti-slop' },
		],
		categories: {},
		options: {
			maxWarnings: 0,
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
			...antiSlopRules,
			...frameworkRules[framework],
		},
		overrides: [
			{
				files: ['mise-tasks/**', 'scripts/**', '**/*.server.ts'],
				rules: { 'no-console': 'off' },
			},
		],
		settings: {
			...frameworkSettings[framework],
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
		ignorePatterns: ['**/dist/**', '**/.output/**'],
	} satisfies LintConfig
}
