import { createElement, type ComponentType, type ReactNode } from 'react'
import { expect } from 'vite-plus/test'
import { page, server, type Locator } from 'vite-plus/test/browser'
import { render, type RenderResult } from 'vitest-browser-react'

import {
	expectScreenshot,
	waitForPageIdle,
	type ScreenshotOptions,
} from './browser.ts'

export interface PageWrapperProps {
	children: ReactNode
	/** The URL path that the page renders at. */
	path: string
	/** The page component under test. */
	component: ComponentType
}

export interface RenderPageOptions {
	/** The URL path that the page renders at. Default: `/`. */
	path?: string
	/** App providers around the page, for example a router and a query client. */
	wrapper?: ComponentType<PageWrapperProps>
	/** Runs after the reset and before the render, for example to set a theme. */
	setup?: () => Promise<void> | void
	/** An element that is visible once the page is ready to capture. */
	waitFor?: (screen: RenderResult) => Locator
}

export interface RenderedPage {
	screen: RenderResult
	/** Compares the page with its baseline. */
	expectScreenshot: (name: string, options?: ScreenshotOptions) => Promise<void>
}

function PassThrough({ children }: PageWrapperProps) {
	return children
}

/**
 * Renders a page component full width in a clean document at the browser
 * instance viewport.
 */
export async function renderPage(
	component: ComponentType,
	options: RenderPageOptions = {},
): Promise<RenderedPage> {
	const path = options.path ?? '/'
	const Wrapper = options.wrapper ?? PassThrough

	localStorage.clear()
	document.body.replaceChildren()
	await options.setup?.()
	// Syncs the Vitest iframe with the instance viewport before the render.
	await server.commands.resizeBrowserViewport(
		window.innerWidth,
		window.innerHeight,
	)
	await page.viewport(window.innerWidth, window.innerHeight)

	const container = document.body.appendChild(document.createElement('div'))
	container.style.width = '100vw'
	container.style.minHeight = '100vh'

	const screen = await render(createElement(component), {
		container,
		wrapper: ({ children }: { children: ReactNode }) =>
			createElement(Wrapper, { children, path, component }),
	})

	if (options.waitFor) {
		// A cold route's first commit can land past the 1s poll default.
		await expect
			.element(options.waitFor(screen), { timeout: 3_000 })
			.toBeVisible()
	}

	await waitForPageIdle()

	return {
		screen,
		expectScreenshot: (name, screenshotOptions) =>
			expectScreenshot(screen.locator, name, screenshotOptions),
	}
}
