import type { Plugin, TestProjectInlineConfiguration } from 'vite-plus'
import type { BrowserCommand } from 'vite-plus/test/node'

import { mergeOptions } from '../options.ts'
import { canResolve, importPeer } from '../peers.ts'
import { mswWorker, workerModule } from './msw-worker.ts'

type ProjectTest = NonNullable<TestProjectInlineConfiguration['test']>

/** Vitest `test` options for one project. Arrays replace the toolkit values. */
export type ProjectOptions = ProjectTest

export interface TestProject {
	extends: true
	plugins?: Plugin[]
	test: ProjectOptions
}

export const viewports = {
	desktop: { width: 1280, height: 720 },
	mobile: { width: 375, height: 812 },
}

function project(
	defaults: ProjectTest,
	options: ProjectOptions | undefined,
): TestProject {
	return { extends: true, test: mergeOptions(defaults, options) }
}

export function unitProject(options?: ProjectOptions): TestProject {
	return project(
		{
			name: 'unit',
			include: [
				'src/**/*.unit.test.ts',
				'src/**/*.test.unit.ts',
				'tests/**/*.unit.test.ts',
			],
		},
		options,
	)
}

export function serverProject(options?: ProjectOptions): TestProject {
	return project(
		{
			name: 'server',
			include: ['src/**/*.server.test.ts', 'src/**/server.test.ts'],
			testTimeout: 30_000,
			fileParallelism: false,
		},
		options,
	)
}

const resetScreenshotPointer: BrowserCommand = async ({ page }) => {
	await page.mouse.move(0, 0)
}

const resizeBrowserViewport: BrowserCommand<
	[width: number, height: number]
> = async ({ page }, width, height) => {
	await page.setViewportSize({ width, height })
}

/**
 * The browser project: Chromium through Playwright, one instance per
 * viewport. The instance name is the baseline suffix for mobile captures.
 */
export async function browserProject(
	options?: ProjectOptions,
): Promise<TestProject> {
	const { playwright } = await importPeer(
		'@aamini/config/vitest',
		{
			name: '@vitest/browser-playwright',
			specifier: '@vitest/browser-playwright',
		},
		() => import('vite-plus/test/browser-playwright'),
	)

	const browser = project(
		{
			name: 'browser',
			// Docker network changes in server tests abort Chromium module requests.
			sequence: { groupOrder: 1 },
			include: ['src/**/*.test.tsx', 'tests/**/*.test.tsx'],
			fileParallelism: false,
			retry: 0,
			testTimeout: 15_000,
			browser: {
				enabled: true,
				headless: true,
				commands: { resetScreenshotPointer, resizeBrowserViewport },
				instances: [
					{ browser: 'chromium', name: 'desktop', viewport: viewports.desktop },
					{ browser: 'chromium', name: 'mobile', viewport: viewports.mobile },
				],
				provider: playwright({
					launchOptions: {
						channel: 'chromium',
						args: ['--disable-lcd-text', '--headless=new'],
					},
					actionTimeout: 3_000,
				}),
			},
		},
		options,
	)

	if (canResolve(workerModule)) browser.plugins = [mswWorker()]

	return browser
}
