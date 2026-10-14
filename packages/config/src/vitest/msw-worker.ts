import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

import type { Plugin } from 'vite-plus'

export const workerModule = 'msw/mockServiceWorker.js'

/**
 * Serves the MSW service worker script to browser tests from the `msw`
 * package. Vitest 4 served this path itself; Vitest 5 does not. Apps keep the
 * script out of `public/`, so production never ships it.
 */
export function mswWorker(): Plugin {
	const workerPath = fileURLToPath(import.meta.resolve(workerModule))

	return {
		name: 'aamini:msw-worker',
		configureServer(server) {
			server.middlewares.use('/mockServiceWorker.js', (_request, response) => {
				void readFile(workerPath)
					.then((script) => {
						response.setHeader('Content-Type', 'text/javascript')
						response.end(script)
					})
					.catch((error) => {
						server.config.logger.error(
							`Failed to serve mockServiceWorker.js: ${error instanceof Error ? error.message : String(error)}`,
						)
						response.statusCode = 500
						response.end()
					})
			})
		},
	}
}
