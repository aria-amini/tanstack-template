import { afterEach, expect, test, vi } from 'vite-plus/test'

afterEach(() => {
	vi.unstubAllEnvs()
	vi.resetModules()
})

test.each([
	{ name: 'missing', value: undefined },
	{ name: 'empty', value: '' },
	{ name: 'whitespace', value: '   ' },
])('$name BASE_URL uses the local app port', async ({ value }) => {
	vi.stubEnv('BASE_URL', value)
	vi.stubEnv('APP_PORT', '3100')

	const { default: config } = await import('../playwright.config')

	expect(config.use?.baseURL).toBe('http://localhost:3100')
	expect(config.use?.channel).toBe('chromium')
})

test('a deployment URL overrides the local app port', async () => {
	vi.stubEnv('BASE_URL', '  https://app.example.com  ')
	vi.stubEnv('APP_PORT', '3100')

	const { default: config } = await import('../playwright.config')

	expect(config.use?.baseURL).toBe('https://app.example.com')
})
