import type { RequestHandler } from 'msw'
import { setupServer, type SetupServer } from 'msw/node'
import { test as baseTest } from 'vite-plus/test'

/**
 * A test with an MSW server fixture for one worker. Unhandled requests pass
 * through. Handlers that a test adds with `server.use()` reset after it.
 */
export function createServerTest(handlers: readonly RequestHandler[] = []) {
	const server = setupServer(...handlers)

	return baseTest.extend<{ server: SetupServer; _resetHandlers: void }>({
		server: [
			async ({}, use) => {
				server.listen({ onUnhandledRequest: 'bypass' })
				await use(server)
				server.close()
			},
			{ auto: true, scope: 'worker' },
		],
		_resetHandlers: [
			async ({ server }, use) => {
				await use()
				server.resetHandlers()
			},
			{ auto: true },
		],
	})
}
