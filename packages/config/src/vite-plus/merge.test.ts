import type { UserConfig } from 'vite-plus'
import { describe, expect, expectTypeOf, test } from 'vite-plus/test'

import { fmt } from './fmt.ts'
import { lint } from './lint.ts'
import { mergeToolkitConfig, type ToolkitConfig } from './merge.ts'

describe('mergeToolkitConfig', () => {
	test('deep merges objects and replaces scalars', () => {
		const merged = mergeToolkitConfig(
			{ server: { host: '127.0.0.1', port: 3000 } },
			{ server: { port: 4000 } },
		)

		expect(merged.server).toMatchObject({ host: '127.0.0.1', port: 4000 })
	})

	test('appends arrays', () => {
		const merged = mergeToolkitConfig(
			{ fmt: { ignorePatterns: ['dist/**'] } },
			{ fmt: { ignorePatterns: ['generated/**'] } },
		)

		expect(merged.fmt?.ignorePatterns).toEqual(['dist/**', 'generated/**'])
	})

	test('a replacer function receives the preset value and replaces it', () => {
		const merged = mergeToolkitConfig(
			{ fmt },
			{
				fmt: {
					ignorePatterns: (preset) =>
						preset.filter((pattern) => pattern !== 'env.d.ts'),
				},
			},
		)

		expect(merged.fmt?.ignorePatterns).not.toContain('env.d.ts')
		expect(merged.fmt?.ignorePatterns).toContain('**/dist/**')
		expect(merged.fmt?.singleQuote).toBe(true)
	})

	test('lint rule entries replace the preset entry', () => {
		const merged = mergeToolkitConfig(
			{ lint: lint('react') },
			{
				lint: {
					rules: {
						'no-console': ['error', { allow: ['info'] }],
						'oxc/no-accumulating-spread': 'off',
					},
				},
			},
		)

		expect(merged.lint?.rules?.['no-console']).toEqual([
			'error',
			{ allow: ['info'] },
		])
		expect(merged.lint?.rules?.['oxc/no-accumulating-spread']).toBe('off')
		expect(merged.lint?.rules?.['no-empty-pattern']).toBe('off')
	})

	test('a function without a preset value stays a plain value', () => {
		async function openDialog() {}

		const merged = mergeToolkitConfig(
			{ test: { browser: { commands: {} } } },
			{ test: { browser: { commands: { openDialog } } } },
		)

		expect(merged.test?.browser?.commands?.openDialog).toBe(openDialog)
	})

	test('app plugins append after preset plugins', () => {
		const merged = mergeToolkitConfig(
			{ plugins: [{ name: 'preset' }] },
			{ plugins: [{ name: 'app' }] },
		)

		expect(merged.plugins).toEqual([{ name: 'preset' }, { name: 'app' }])
	})

	test('a root replacer replaces the whole config', () => {
		const merged = mergeToolkitConfig({ root: '/app' }, (preset) => ({
			...preset,
			base: '/docs/',
		}))

		expect(merged).toEqual({ root: '/app', base: '/docs/' })
	})

	test('does not mutate the preset', () => {
		const preset = { fmt: { ignorePatterns: ['dist/**'] } }

		mergeToolkitConfig(preset, { fmt: { ignorePatterns: () => [] } })

		expect(preset.fmt.ignorePatterns).toEqual(['dist/**'])
	})
})

describe('ToolkitConfig types', () => {
	test('accepts UserConfig values', () => {
		expectTypeOf<{ server: { port: number } }>().toExtend<ToolkitConfig>()
	})

	test('types replacer parameters from the preset value', () => {
		expectTypeOf<{
			fmt: { ignorePatterns: (preset: string[]) => string[] }
		}>().toExtend<ToolkitConfig>()
	})

	test('rejects wrong value types', () => {
		expectTypeOf<{ server: { port: string } }>().not.toExtend<ToolkitConfig>()
		expectTypeOf<{
			fmt: { ignorePatterns: (preset: string[]) => number }
		}>().not.toExtend<ToolkitConfig>()
	})

	test('returns a Vite+ UserConfig', () => {
		expectTypeOf(mergeToolkitConfig).returns.toEqualTypeOf<UserConfig>()
	})
})
