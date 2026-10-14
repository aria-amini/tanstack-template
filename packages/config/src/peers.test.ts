import { expect, test } from 'vite-plus/test'

import { importPeer, requirePeer } from './peers.ts'

const entry = '@aamini/config/test'

const missing = { name: 'not-installed', specifier: 'not-installed/vite' }

test('importPeer returns the module of an installed peer', async () => {
	const peer = { name: 'vite-plus', specifier: 'vite-plus' }

	await expect(
		importPeer(entry, peer, () => Promise.resolve('loaded')),
	).resolves.toBe('loaded')
})

test('importPeer names a missing peer with the install command', async () => {
	await expect(
		importPeer(entry, missing, () =>
			Promise.reject(new Error('Cannot find package')),
		),
	).rejects.toThrow(
		'@aamini/config/test needs not-installed. Install it with: pnpm add -D not-installed',
	)
})

test('importPeer keeps other errors from an installed peer', async () => {
	const peer = { name: 'vite-plus', specifier: 'vite-plus' }

	await expect(
		importPeer(entry, peer, () => Promise.reject(new Error('plugin crashed'))),
	).rejects.toThrow('plugin crashed')
})

test('requirePeer passes for an installed peer', () => {
	expect(() =>
		requirePeer(entry, { name: 'vite-plus', specifier: 'vite-plus' }),
	).not.toThrow()
})

test('requirePeer names a missing peer with the install command', () => {
	expect(() => requirePeer(entry, missing)).toThrow(
		'Install it with: pnpm add -D not-installed',
	)
})
