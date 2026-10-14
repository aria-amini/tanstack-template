import { afterEach, expect, test, vi } from 'vite-plus/test'

import { playwrightConfig } from './playwright.ts'

afterEach(() => {
	vi.unstubAllEnvs()
})

test.each([
	{ name: 'missing', value: undefined },
	{ name: 'empty', value: '' },
	{ name: 'whitespace', value: '   ' },
])('$name BASE_URL uses the local app port', ({ value }) => {
	vi.stubEnv('BASE_URL', value)
	vi.stubEnv('APP_PORT', '3100')

	const config = playwrightConfig({ testDir: './e2e' })

	expect(config.use?.baseURL).toBe('http://localhost:3100')
	expect(config.use?.channel).toBe('chromium')
})

test('a deployment URL overrides the local app port', () => {
	vi.stubEnv('BASE_URL', '  https://app.example.com  ')
	vi.stubEnv('APP_PORT', '3100')

	const config = playwrightConfig({ testDir: './e2e' })

	expect(config.use?.baseURL).toBe('https://app.example.com')
})

test('an explicit baseURL wins over the environment', () => {
	vi.stubEnv('BASE_URL', 'https://app.example.com')

	const config = playwrightConfig({
		testDir: './e2e',
		baseURL: 'http://127.0.0.1:4000',
	})

	expect(config.use?.baseURL).toBe('http://127.0.0.1:4000')
})

test('passes the web server through', () => {
	const config = playwrightConfig({
		testDir: './e2e',
		webServer: { command: 'vp preview', port: 4173 },
	})

	expect(config.webServer).toEqual({ command: 'vp preview', port: 4173 })
	expect(config.testDir).toBe('./e2e')
})
