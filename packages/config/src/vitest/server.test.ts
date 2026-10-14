import { http, HttpResponse } from 'msw'
import { expect } from 'vite-plus/test'

import { createServerTest } from './server.ts'

const test = createServerTest([
	http.get('https://api.example.com/status', () =>
		HttpResponse.json({ status: 'up' }),
	),
])

test('serves the initial handlers', async () => {
	const response = await fetch('https://api.example.com/status')

	expect(await response.json()).toEqual({ status: 'up' })
})

test('a test can add a handler', async ({ server }) => {
	server.use(
		http.get('https://api.example.com/status', () =>
			HttpResponse.json({ status: 'down' }),
		),
	)

	const response = await fetch('https://api.example.com/status')

	expect(await response.json()).toEqual({ status: 'down' })
})

test('handlers from an earlier test reset', async () => {
	const response = await fetch('https://api.example.com/status')

	expect(await response.json()).toEqual({ status: 'up' })
})
