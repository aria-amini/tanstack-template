import { describe, expect, test } from 'vitest'

import {
	filterRequestHeaders,
	filterResponseHeaders,
	resolveUpstreamUrl,
} from '@/lib/analytics/posthog-proxy'

describe('resolveUpstreamUrl', () => {
	test('sends API paths to the PostHog API host', () => {
		expect(resolveUpstreamUrl('e/', '?ip=1').href).toBe(
			'https://us.i.posthog.com/e/?ip=1',
		)
		expect(resolveUpstreamUrl('flags/', '?v=2').href).toBe(
			'https://us.i.posthog.com/flags/?v=2',
		)
	})

	test.each(['static/array.js', 'array/phc_key/config.js'])(
		'sends %s to the assets host',
		(path) => {
			expect(resolveUpstreamUrl(path, '').origin).toBe(
				'https://us-assets.i.posthog.com',
			)
		},
	)

	test.each([
		'//evil.example/x',
		'///evil.example/x',
		'\\\\evil.example/x',
		'/\\evil.example/x',
		'//evil.example@us.i.posthog.com/x',
	])('keeps %s on the PostHog host', (path) => {
		expect(resolveUpstreamUrl(path, '').hostname).toBe('us.i.posthog.com')
	})

	test('does not climb out of the path with dot segments', () => {
		expect(resolveUpstreamUrl('../../x', '').href).toBe(
			'https://us.i.posthog.com/x',
		)
	})

	test('ignores a query string that the splat carries', () => {
		expect(resolveUpstreamUrl('e/?a=1', '?b=2').search).toBe('?b=2')
	})
})

describe('header filters', () => {
	test('strips cookies and credentials before the request leaves', () => {
		const headers = filterRequestHeaders(
			new Headers({
				cookie: 'session=secret',
				authorization: 'Bearer secret',
				host: 'example.com',
				'accept-encoding': 'gzip',
				'content-type': 'application/json',
				'x-forwarded-for': '203.0.113.7',
			}),
		)

		expect([...headers.keys()].sort()).toEqual([
			'content-type',
			'x-forwarded-for',
		])
	})

	test('strips encoding and hop-by-hop headers from the response', () => {
		const headers = filterResponseHeaders(
			new Headers({
				'content-encoding': 'gzip',
				'content-length': '10',
				'transfer-encoding': 'chunked',
				'content-type': 'application/json',
			}),
		)

		expect([...headers.keys()]).toEqual(['content-type'])
	})
})
