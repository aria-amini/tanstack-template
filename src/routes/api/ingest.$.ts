import { createFileRoute } from '@tanstack/react-router'

import {
	filterRequestHeaders,
	filterResponseHeaders,
	resolveUpstreamUrl,
} from '@/lib/analytics/posthog-proxy'

async function proxyPosthogRequest({
	request,
	params,
}: {
	request: Request
	params: { _splat?: string }
}) {
	let upstreamUrl: URL

	try {
		upstreamUrl = resolveUpstreamUrl(
			params._splat ?? '',
			new URL(request.url).search,
		)
	} catch {
		return new Response('Bad Request', { status: 400 })
	}

	const requestInit: RequestInit & { duplex: 'half' } = {
		method: request.method,
		headers: filterRequestHeaders(request.headers),
		body:
			request.method === 'GET' || request.method === 'HEAD'
				? null
				: request.body,
		duplex: 'half',
	}

	const response = await fetch(upstreamUrl, requestInit)

	return new Response(response.body, {
		status: response.status,
		statusText: response.statusText,
		headers: filterResponseHeaders(response.headers),
	})
}

export const Route = createFileRoute('/api/ingest/$')({
	server: {
		handlers: {
			GET: proxyPosthogRequest,
			POST: proxyPosthogRequest,
			PUT: proxyPosthogRequest,
			PATCH: proxyPosthogRequest,
			DELETE: proxyPosthogRequest,
			OPTIONS: proxyPosthogRequest,
			HEAD: proxyPosthogRequest,
		},
	},
})
