import { describe, expect, test } from 'vite-plus/test'

import {
	browserProject,
	serverProject,
	unitProject,
	viewports,
} from './index.ts'

describe('test projects', () => {
	test('unit and server projects extend the root config', () => {
		expect(unitProject()).toMatchObject({
			extends: true,
			test: { name: 'unit' },
		})
		expect(serverProject()).toMatchObject({
			extends: true,
			test: { name: 'server', fileParallelism: false, testTimeout: 30_000 },
		})
	})

	test('app options replace arrays and keep the other defaults', () => {
		const project = serverProject({ include: ['src/**/*.test.ts'] })

		expect(project.test.include).toEqual(['src/**/*.test.ts'])
		expect(project.test.testTimeout).toBe(30_000)
	})

	test('the browser project runs desktop and mobile Chromium instances', async () => {
		const project = await browserProject({ setupFiles: ['./src/app.css'] })

		expect(project.test.setupFiles).toEqual(['./src/app.css'])
		expect(project.test.browser?.instances).toEqual([
			{ browser: 'chromium', name: 'desktop', viewport: viewports.desktop },
			{ browser: 'chromium', name: 'mobile', viewport: viewports.mobile },
		])
		expect(Object.keys(project.test.browser?.commands ?? {})).toEqual([
			'resetScreenshotPointer',
			'resizeBrowserViewport',
		])
	})
})
