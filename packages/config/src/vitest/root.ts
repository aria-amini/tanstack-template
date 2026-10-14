import { resolve } from 'node:path'

declare module 'vitest' {
	interface ProvidedContext {
		/** The app root. The TanStack `defineToolkit()` provides it. */
		aaminiToolkitRoot?: string
	}
}

export const rootKey = 'aaminiToolkitRoot'

/**
 * Resolves a path against the app root. Without a root, for example when the
 * app does not use `defineToolkit()`, the path resolves against the current
 * working directory.
 */
export function resolveFromRoot(root: string | undefined, path: string) {
	return resolve(root ?? process.cwd(), path)
}
