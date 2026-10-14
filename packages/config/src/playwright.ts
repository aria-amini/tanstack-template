import {
	defineConfig,
	devices,
	type PlaywrightTestConfig,
} from '@playwright/test'

export interface PlaywrightOptions {
	testDir: string
	/** Default: `BASE_URL`, then the local app on `APP_PORT` (3000). */
	baseURL?: string
	webServer?: PlaywrightTestConfig['webServer']
}

function defaultBaseURL() {
	return (
		process.env.BASE_URL?.trim() ||
		`http://localhost:${process.env.APP_PORT ?? '3000'}`
	)
}

const launchOptions = { args: ['--disable-lcd-text', '--headless=new'] }

/** Smoke tests against a running app. Runs against any `BASE_URL`. */
export function playwrightConfig(options: PlaywrightOptions) {
	const baseURL = options.baseURL ?? defaultBaseURL()

	const config: PlaywrightTestConfig = {
		testDir: options.testDir,
		outputDir: '.playwright/test-results',
		fullyParallel: true,
		workers: process.env.CI ? 1 : '50%',
		forbidOnly: Boolean(process.env.CI),
		retries: process.env.CI ? 3 : 0,
		reporter: [['html', { open: 'never', outputFolder: '.playwright/report' }]],
		use: {
			baseURL,
			channel: 'chromium',
			ignoreHTTPSErrors: !process.env.CI && baseURL.startsWith('https://'),
			trace: 'retain-on-first-failure',
			screenshot: 'on',
			video: 'retain-on-failure',
		},
		timeout: 15_000,
		expect: { timeout: 5_000 },
		projects: [
			{
				name: 'chromium',
				use: { ...devices['Desktop Chrome'], launchOptions },
			},
			{
				name: 'mobile',
				use: {
					...devices['Desktop Chrome'],
					viewport: { width: 320, height: 800 },
					launchOptions,
				},
			},
		],
	}

	if (options.webServer) config.webServer = options.webServer

	return defineConfig(config)
}
