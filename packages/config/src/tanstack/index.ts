import { resolve } from 'node:path'

import type tailwindcss from '@tailwindcss/vite'
import type { devtools } from '@tanstack/devtools-vite'
import type { tanstackStart } from '@tanstack/react-start/plugin/vite'
import type { varlockVitePlugin } from '@varlock/vite-integration'
import type { reactCompilerPreset } from '@vitejs/plugin-react'
import type viteReact from '@vitejs/plugin-react'
import type { nitro } from 'nitro/vite'
import type { PluginOption, UserConfig } from 'vite-plus'

import { mergeOptions } from '../options.ts'
import { canResolve, importPeer, requirePeer, type Peer } from '../peers.ts'
import { fmt } from '../vite-plus/fmt.ts'
import { lint } from '../vite-plus/lint.ts'
import { mergeToolkitConfig, type ToolkitConfig } from '../vite-plus/merge.ts'
import {
	browserProject,
	serverProject,
	unitProject,
	type ProjectOptions,
} from '../vitest/index.ts'
import { rootKey } from '../vitest/root.ts'

// Any function type is assignable to this signature, whatever it returns.
type Options<T extends (...args: never[]) => void> = NonNullable<
	Parameters<T>[0]
>

/** `false` removes the plugin. An object merges over the toolkit options. */
type PluginSetting<T> = false | T

export interface TanstackPlugins {
	tanstackStart?: PluginSetting<Options<typeof tanstackStart>>
	/** Dev only. Vitest runs without it. */
	devtools?: PluginSetting<Options<typeof devtools>>
	/** Dev and build only. Vitest runs without it. */
	nitro?: PluginSetting<Options<typeof nitro>>
	tailwindcss?: PluginSetting<Options<typeof tailwindcss>>
	react?: PluginSetting<Options<typeof viteReact>>
	reactCompiler?: PluginSetting<Options<typeof reactCompilerPreset>>
	varlock?: PluginSetting<Options<typeof varlockVitePlugin>>
}

/** `false` removes the project. An object merges over the toolkit options. */
export interface TanstackTests {
	unit?: false | ProjectOptions
	server?: false | ProjectOptions
	/** Vitest browser mode, `desktop` and `mobile` instances. */
	browser?: false | ProjectOptions
}

export interface TanstackToolkitOptions {
	/** The app root. Pass `import.meta.dirname` from `vite.config.ts`. */
	root?: string
	plugins?: TanstackPlugins
	/** Adds the `@shadcn/lint` rules. */
	shadcn?: boolean
	tests?: TanstackTests
	/** Vite+ config merged last. App plugins in `config.plugins` run after the toolkit plugins. */
	config?: ToolkitConfig
}

const entry = '@aamini/config/tanstack'

const peers = {
	tanstackStart: {
		name: '@tanstack/react-start',
		specifier: '@tanstack/react-start/plugin/vite',
	},
	devtools: {
		name: '@tanstack/devtools-vite',
		specifier: '@tanstack/devtools-vite',
	},
	nitro: { name: 'nitro', specifier: 'nitro/vite' },
	tailwindcss: { name: '@tailwindcss/vite', specifier: '@tailwindcss/vite' },
	react: { name: '@vitejs/plugin-react', specifier: '@vitejs/plugin-react' },
	babel: {
		name: '@rolldown/plugin-babel',
		specifier: '@rolldown/plugin-babel',
	},
	reactCompiler: {
		name: 'babel-plugin-react-compiler',
		specifier: 'babel-plugin-react-compiler',
	},
	varlock: {
		name: '@varlock/vite-integration',
		specifier: '@varlock/vite-integration',
	},
	shadcn: { name: '@shadcn/lint', specifier: '@shadcn/lint' },
} satisfies Record<string, Peer>

type PluginDefaults = Required<{
	[K in keyof TanstackPlugins]: Exclude<TanstackPlugins[K], false | undefined>
}>

const pluginDefaults: PluginDefaults = {
	tanstackStart: {
		router: { routeFileIgnorePattern: '(\\.test\\.tsx$|__screenshots__)' },
		server: { build: { inlineCss: true } },
	},
	devtools: { injectSource: { enabled: false } },
	nitro: { sourcemap: true, experimental: { sourcemapMinify: false } },
	tailwindcss: {},
	react: {},
	reactCompiler: {},
	varlock: { ssrInjectMode: 'resolved-env' },
}

const shadcnLint = {
	jsPlugins: ['@shadcn/lint'],
	rules: {
		'shadcn/require-static-classes': 'error',
		'shadcn/no-raw-colors': 'error',
		'shadcn/no-unknown-classes': 'error',
		'shadcn/no-arbitrary-values': ['error', { allow: ['layout'] }],
		'shadcn/no-inline-styles': 'error',
		'shadcn/no-restyle': ['error', { allow: ['layout'] }],
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
	],
} satisfies UserConfig['lint']

function pluginOptions<T extends object>(
	defaults: T,
	setting: PluginSetting<T> | undefined,
) {
	if (setting === false) return undefined

	return mergeOptions(defaults, setting)
}

/**
 * Builds the TanStack plugins in the toolkit order. Each import runs only
 * when its plugin is on, so an app never loads a plugin that it removes.
 */
async function tanstackPlugins(plugins: TanstackPlugins) {
	const underVitest = process.env.VITEST === 'true'
	const result: PluginOption[] = []

	const startOptions = pluginOptions(
		pluginDefaults.tanstackStart,
		plugins.tanstackStart,
	)

	if (startOptions) {
		const { tanstackStart } = await importPeer(
			entry,
			peers.tanstackStart,
			() => import('@tanstack/react-start/plugin/vite'),
		)

		result.push(tanstackStart(startOptions))
	}

	const devtoolsOptions = pluginOptions(
		pluginDefaults.devtools,
		plugins.devtools,
	)

	if (devtoolsOptions && !underVitest) {
		const { devtools } = await importPeer(
			entry,
			peers.devtools,
			() => import('@tanstack/devtools-vite'),
		)

		result.push(devtools(devtoolsOptions))
	}

	const nitroOptions = pluginOptions(pluginDefaults.nitro, plugins.nitro)

	if (nitroOptions && !underVitest) {
		const { nitro } = await importPeer(
			entry,
			peers.nitro,
			() => import('nitro/vite'),
		)

		result.push(nitro(nitroOptions))
	}

	const tailwindOptions = pluginOptions(
		pluginDefaults.tailwindcss,
		plugins.tailwindcss,
	)

	if (tailwindOptions) {
		const { default: tailwindcss } = await importPeer(
			entry,
			peers.tailwindcss,
			() => import('@tailwindcss/vite'),
		)

		result.push(tailwindcss(tailwindOptions))
	}

	const reactOptions = pluginOptions(pluginDefaults.react, plugins.react)

	if (reactOptions) {
		const { default: viteReact } = await importPeer(
			entry,
			peers.react,
			() => import('@vitejs/plugin-react'),
		)

		result.push(viteReact(reactOptions))
	}

	const compilerOptions = pluginOptions(
		pluginDefaults.reactCompiler,
		plugins.reactCompiler,
	)

	if (compilerOptions) {
		// Babel loads the compiler plugin by name, after this config resolves.
		requirePeer(entry, peers.reactCompiler)

		const { reactCompilerPreset } = await importPeer(
			entry,
			peers.react,
			() => import('@vitejs/plugin-react'),
		)

		const { default: babel } = await importPeer(
			entry,
			peers.babel,
			() => import('@rolldown/plugin-babel'),
		)

		result.push(babel({ presets: [reactCompilerPreset(compilerOptions)] }))
	}

	const varlockOptions = pluginOptions(pluginDefaults.varlock, plugins.varlock)

	if (varlockOptions) {
		const { varlockVitePlugin } = await importPeer(
			entry,
			peers.varlock,
			() => import('@varlock/vite-integration'),
		)

		result.push(varlockVitePlugin(varlockOptions))
	}

	return result
}

async function testProjects(tests: TanstackTests) {
	const projects = []

	if (tests.unit !== false) projects.push(unitProject(tests.unit))

	if (tests.server !== false) projects.push(serverProject(tests.server))

	if (tests.browser !== false) {
		projects.push(
			await browserProject(
				mergeOptions<ProjectOptions>(
					{ setupFiles: ['./src/styles.css'] },
					tests.browser,
				),
			),
		)
	}

	return projects
}

// Pre-bundles the browser test stack at startup. Without it, Vite discovers
// each dependency mid-run, and the re-optimization reload aborts the test
// file that is loading.
function browserTestDeps() {
	const deps = ['vite-plus/test', 'vite-plus/test/browser']

	for (const optional of ['vitest-browser-react', 'msw', 'msw/browser']) {
		if (canResolve(optional)) deps.push(optional)
	}

	return deps
}

/** The complete Vite+ config for a TanStack Start app. */
export async function defineToolkit(
	options: TanstackToolkitOptions = {},
): Promise<UserConfig> {
	const root = options.root ?? process.cwd()
	const shadcn = options.shadcn !== false
	const tests = options.tests ?? {}

	// Oxlint loads the shadcn rules by name when it lints.
	if (shadcn) requirePeer(entry, peers.shadcn)

	const preset: UserConfig = {
		root,
		staged: { '*': 'vp check --fix' },
		server: { host: '127.0.0.1', port: Number(process.env.APP_PORT ?? 3000) },
		// TanStack Router ships RSC "use client" directives in its dist for RSC
		// compat. These apps build no RSC graph, so the bundling warnings are
		// noise.
		build: { rollupOptions: { checks: { moduleLevelDirective: false } } },
		resolve: {
			tsconfigPaths: true,
			dedupe: ['react', 'react-dom'],
			alias: [
				{ find: '@', replacement: resolve(root, 'src') },
				{ find: '@tests', replacement: resolve(root, 'tests') },
			],
		},
		plugins: await tanstackPlugins(options.plugins ?? {}),
		fmt,
		lint: lint('react'),
		test: {
			// Headless runs and screenshot baselines work with writes disabled.
			// allowWrite serves UI clients on the tailnet, which update snapshots
			// and baselines from the browser UI. Execution stays disabled.
			api: { allowWrite: true, allowExec: false },
			// Test fixtures resolve app paths against this root, not the cwd.
			provide: { [rootKey]: root },
			projects: await testProjects(tests),
		},
	}

	if (tests.browser !== false) {
		preset.optimizeDeps = { include: browserTestDeps() }
	}

	const withShadcn = shadcn
		? mergeToolkitConfig(preset, { lint: shadcnLint })
		: preset

	return mergeToolkitConfig(withShadcn, options.config)
}
