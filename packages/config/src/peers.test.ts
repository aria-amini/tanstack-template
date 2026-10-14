import { expect, test } from 'vite-plus/test'

import { assertPeers } from './peers.ts'

test('passes when every peer resolves', () => {
	expect(() =>
		assertPeers('@aamini/config/test', [
			{ name: 'vite-plus', specifier: 'vite-plus' },
		]),
	).not.toThrow()
})

test('names each missing package once with the install command', () => {
	expect(() =>
		assertPeers('@aamini/config/test', [
			{ name: 'vite-plus', specifier: 'vite-plus' },
			{ name: 'not-installed-a', specifier: 'not-installed-a/vite' },
			{ name: 'not-installed-a', specifier: 'not-installed-a' },
			{ name: 'not-installed-b', specifier: 'not-installed-b' },
		]),
	).toThrow(
		[
			'@aamini/config/test needs these packages:',
			'  - not-installed-a',
			'  - not-installed-b',
			'Install them with: pnpm add -D not-installed-a not-installed-b',
		].join('\n'),
	)
})
