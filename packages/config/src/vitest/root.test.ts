import { expect, test } from 'vite-plus/test'

import { resolveFromRoot } from './root.ts'

test('a relative path resolves against the provided root', () => {
	expect(resolveFromRoot('/apps/web', 'src/db/migrations')).toBe(
		'/apps/web/src/db/migrations',
	)
})

test('an absolute path ignores the root', () => {
	expect(resolveFromRoot('/apps/web', '/data/migrations')).toBe(
		'/data/migrations',
	)
})

test('without a root, a relative path resolves against the cwd', () => {
	expect(resolveFromRoot(undefined, 'src/db/migrations')).toBe(
		`${process.cwd()}/src/db/migrations`,
	)
})
