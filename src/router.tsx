import {
	type DehydratedState,
	QueryClientProvider,
	dehydrate,
	hydrate,
} from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import type { TsrSerializable } from '@tanstack/router-core'

import { NotFoundComponent, ServerErrorComponent } from '@/components/errors'
import { getQueryClient } from '@/lib/utils/query'

import { routeTree } from './routeTree.gen'

function PendingProgress() {
	return (
		<output
			aria-label="Loading page"
			className="bg-primary/25 fixed inset-x-0 top-0 z-50 block h-0.5 overflow-hidden"
		>
			<div className="bg-primary animate-pending-slide h-full w-1/4 motion-reduce:animate-none" />
		</output>
	)
}

/**
 * react-query types dehydrated query keys as `unknown`, which the router
 * cannot prove serializable. Dehydrate/hydrate round-trip inside react-query
 * alone, so brand the payload with the router's serializable marker instead
 * of failing validation.
 */
type DehydratedQueryState = Pick<DehydratedState, 'queries'> & TsrSerializable

export const getRouter = () => {
	const queryClient = getQueryClient()

	const dehydratedQueryState = (): DehydratedQueryState => {
		// SAFETY: the brand is a phantom unique-symbol property with no runtime
		// value, so the object literal satisfies DehydratedQueryState without
		// runtime evidence.
		// oxlint-disable-next-line typescript/consistent-type-assertions
		return {
			queries: dehydrate(queryClient, {
				shouldDehydrateQuery: (query) => query.state.status === 'success',
			}).queries,
		} as DehydratedQueryState
	}

	const router = createRouter({
		routeTree,
		scrollRestoration: true,
		defaultPreloadStaleTime: 0,
		defaultPendingMs: 300,
		defaultPendingComponent: PendingProgress,
		context: {
			queryClient,
		},
		defaultErrorComponent: ServerErrorComponent,
		defaultNotFoundComponent: NotFoundComponent,
		Wrap: ({ children }) => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		),
		dehydrate: dehydratedQueryState,
		hydrate: (dehydrated) => {
			hydrate(queryClient, dehydrated)
		},
	})

	return router
}
