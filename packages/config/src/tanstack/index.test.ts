import type { Plugin, PluginOption } from 'vite-plus'
import { describe, expect, expectTypeOf, test } from 'vite-plus/test'

import { defineToolkit, type TanstackToolkitOptions } from './index.ts'

function isPlugin(option: PluginOption): option is Plugin {
	return option instanceof Object && 'name' in option
}

// Vite accepts nested arrays and promises of plugins.
async function pluginNames(option: PluginOption): Promise<string[]> {
	const resolved = await option

	if (Array.isArray(resolved)) {
		const nested = await Promise.all(resolved.map(pluginNames))

		return nested.flat()
	}

	return resolved && isPlugin(resolved) ? [resolved.name] : []
}

describe('defineToolkit', () => {
	test('orders the built-in plugins and skips dev-only plugins under Vitest', async () => {
		const config = await defineToolkit({ root: '/app' })
		const names = await pluginNames(config.plugins)

		const order = [
			'tanstack-react-start:config',
			'@tailwindcss/vite:scan',
			'vite:react-refresh',
			'@rolldown/plugin-babel',
			'varlock',
		].map((name) => names.findIndex((found) => found.startsWith(name)))

		expect(order).not.toContain(-1)
		expect(order).toEqual([...order].sort((a, b) => a - b))
		expect(names.some((name) => name.startsWith('nitro'))).toBe(false)
	})

	test('false removes a built-in plugin', async () => {
		const config = await defineToolkit({ plugins: { tailwindcss: false } })

		expect(
			(await pluginNames(config.plugins)).some((name) =>
				name.startsWith('@tailwindcss'),
			),
		).toBe(false)
	})

	test('app plugins run after the built-in plugins', async () => {
		const config = await defineToolkit({
			config: { plugins: [{ name: 'app-plugin' }] },
		})

		expect((await pluginNames(config.plugins)).at(-1)).toBe('app-plugin')
	})

	test('sets the root aliases and keeps app aliases first', async () => {
		const config = await defineToolkit({
			root: '/app',
			config: {
				resolve: {
					alias: [{ find: '@/mocks', replacement: '/app/__mocks__' }],
				},
			},
		})

		expect(config.resolve?.alias).toEqual([
			{ find: '@/mocks', replacement: '/app/__mocks__' },
			{ find: '@', replacement: '/app/src' },
			{ find: '@tests', replacement: '/app/tests' },
		])
	})

	test('provides the app root to test fixtures', async () => {
		const config = await defineToolkit({ root: '/app' })

		expect(config.test?.provide).toEqual({ aaminiToolkitRoot: '/app' })
	})

	test('adds the shadcn rules unless the app turns them off', async () => {
		const withShadcn = await defineToolkit()
		const withoutShadcn = await defineToolkit({ shadcn: false })

		expect(withShadcn.lint?.jsPlugins).toContain('@shadcn/lint')
		expect(withShadcn.lint?.rules?.['shadcn/no-raw-colors']).toBe('error')
		expect(withoutShadcn.lint?.jsPlugins).not.toContain('@shadcn/lint')
	})

	test('app lint rule entries replace the preset entries', async () => {
		const config = await defineToolkit({
			config: {
				lint: {
					rules: {
						'shadcn/no-restyle': ['error', { allow: ['layout', 'color'] }],
					},
				},
			},
		})

		expect(config.lint?.rules?.['shadcn/no-restyle']).toEqual([
			'error',
			{ allow: ['layout', 'color'] },
		])
	})
})

describe('TanstackToolkitOptions types', () => {
	test('accepts false or plugin options', () => {
		expectTypeOf<{
			plugins: { nitro: false; tanstackStart: { srcDirectory: string } }
		}>().toExtend<TanstackToolkitOptions>()
	})

	test('rejects a plugin that the toolkit does not own', () => {
		expectTypeOf<{
			plugins: { svgr: false }
		}>().not.toExtend<TanstackToolkitOptions>()
	})

	test('rejects true as a plugin setting', () => {
		expectTypeOf<{
			plugins: { nitro: true }
		}>().not.toExtend<TanstackToolkitOptions>()
	})
})
