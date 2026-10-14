import { expect } from 'vite-plus/test'
import { page, server, type Locator } from 'vite-plus/test/browser'

declare module 'vitest/browser' {
	interface BrowserCommands {
		resetScreenshotPointer: () => Promise<void>
		resizeBrowserViewport: (width: number, height: number) => Promise<void>
	}
}

export interface ScreenshotOptions {
	/** Grows the viewport to the full target height before the capture. */
	fullHeight?: boolean
}

// Matches Tailwind's `md` breakpoint, which the mobile instance falls below.
const mobileWidth = 768

/** Waits for fonts and two animation frames, so layout and paint settle. */
export async function waitForPageIdle() {
	await document.fonts.ready
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
	await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
}

// Vitest scales its iframe to fit the browser window. Resize both so tall
// captures stay at one CSS pixel per image pixel.
async function resizeViewport(width: number, height: number) {
	await server.commands.resizeBrowserViewport(width, height)
	await page.viewport(width, height)
}

function targetElement(target: Locator | HTMLElement) {
	return target instanceof HTMLElement ? target : target.element()
}

async function growToFullHeight(element: Element) {
	const width = window.innerWidth
	const minHeight = window.innerHeight
	let height = 0

	// Viewport-relative content can keep growing after each resize.
	for (let attempt = 0; attempt < 5; attempt++) {
		await resizeViewport(
			width,
			Math.max(minHeight, Math.ceil(element.scrollHeight)),
		)
		await waitForPageIdle()

		const next = Math.ceil(element.scrollHeight)

		if (next === height) break

		height = next
	}
}

// Vitest renders tests in an iframe that paints only the viewport, so a
// capture past it comes out white. Playwright captures the page pixels under
// an element, so a transparent fixed frame clips the capture to the viewport.
function viewportClip(element: Element) {
	const rect = element.getBoundingClientRect()

	if (
		rect.top >= 0 &&
		rect.left >= 0 &&
		rect.bottom <= window.innerHeight &&
		rect.right <= window.innerWidth
	) {
		return undefined
	}

	const top = Math.max(rect.top, 0)
	const left = Math.max(rect.left, 0)
	const frame = document.createElement('div')

	Object.assign(frame.style, {
		position: 'fixed',
		top: `${top}px`,
		left: `${left}px`,
		width: `${Math.min(rect.right, window.innerWidth) - left}px`,
		height: `${Math.min(rect.bottom, window.innerHeight) - top}px`,
		pointerEvents: 'none',
	})

	return document.body.appendChild(frame)
}

/**
 * Compares the target with its baseline at zero tolerance. The capture stops
 * at the viewport unless `fullHeight` is set. Each browser instance pins its
 * own viewport. Mobile baselines get a `-mobile` suffix.
 */
export async function expectScreenshot(
	target: Locator | HTMLElement,
	name: string,
	options: ScreenshotOptions = {},
) {
	const element = targetElement(target)
	const suffix = window.innerWidth < mobileWidth ? '-mobile' : ''
	const viewport = { width: window.innerWidth, height: window.innerHeight }
	let clip: HTMLElement | undefined

	try {
		if (options.fullHeight) await growToFullHeight(element)

		await expect
			.poll(() =>
				Array.from(element.querySelectorAll('img')).every(
					(image) => image.complete,
				),
			)
			.toBe(true)
		await server.commands.resetScreenshotPointer()
		await waitForPageIdle()

		if (!options.fullHeight) clip = viewportClip(element)

		await expect
			.element(clip ?? element)
			.toMatchScreenshot(`${name}${suffix}.png`, {
				screenshotOptions: {
					animations: 'disabled',
					caret: 'hide',
					scale: 'css',
				},
				comparatorOptions: {
					allowedMismatchedPixelRatio: 0,
					allowedMismatchedPixels: 0,
				},
			})
	} finally {
		clip?.remove()

		if (options.fullHeight)
			await resizeViewport(viewport.width, viewport.height)
	}
}
