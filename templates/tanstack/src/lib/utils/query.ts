import { QueryClient } from '@tanstack/react-query'

let browserQueryClient: QueryClient | undefined

export function getQueryClient(): QueryClient {
	// The server renders many requests in one process; a shared client would
	// leak one visitor's query cache into another visitor's HTML.
	if (typeof window === 'undefined') {
		return new QueryClient()
	}

	browserQueryClient ??= new QueryClient()

	return browserQueryClient
}
