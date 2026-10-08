const apiHost = 'https://us.i.posthog.com'

const assetsHost = 'https://us-assets.i.posthog.com'

const assetPrefixes = ['static/', 'array/']

// Cookies and credentials belong to this site, not to PostHog.
const blockedRequestHeaders = [
	'accept-encoding',
	'authorization',
	'connection',
	'content-length',
	'cookie',
	'host',
	'transfer-encoding',
]

const blockedResponseHeaders = [
	'connection',
	'content-encoding',
	'content-length',
	'keep-alive',
	'transfer-encoding',
	'upgrade',
]

/**
 * Build the PostHog URL from the splat of the proxy route. The splat comes
 * from the caller, so never resolve it with `new URL(path, base)`: a leading
 * `//` or `\\` would replace the host and turn the route into an open proxy.
 */
export function resolveUpstreamUrl(splat: string, search: string): URL {
	const path = splat.replace(/^[/\\]+/, '')

	const host = assetPrefixes.some((prefix) => path.startsWith(prefix))
		? assetsHost
		: apiHost

	const url = new URL(`${host}/${path}`)

	if (url.origin !== host) throw new Error('Invalid PostHog path')

	url.search = search

	return url
}

export function filterRequestHeaders(headers: Headers): Headers {
	const filtered = new Headers(headers)

	for (const name of blockedRequestHeaders) filtered.delete(name)

	return filtered
}

export function filterResponseHeaders(headers: Headers): Headers {
	const filtered = new Headers(headers)

	for (const name of blockedResponseHeaders) filtered.delete(name)

	return filtered
}
