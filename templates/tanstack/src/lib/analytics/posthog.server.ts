import { PostHog } from 'posthog-node'

import { serverEnv as env } from '@/env.server'

let posthogClient: PostHog | null = null

export function getPostHogClient() {
	if (!env.VITE_PUBLIC_POSTHOG_KEY) return null

	if (!posthogClient) {
		posthogClient = new PostHog(env.VITE_PUBLIC_POSTHOG_KEY, {
			flushAt: 1,
			flushInterval: 0,
		})
	}

	return posthogClient
}
