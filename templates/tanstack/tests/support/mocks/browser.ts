import { vi } from 'vite-plus/test'

// The minimal session shape the UI reads; tests only model those fields.
interface MockSession {
	user: { id: string; name?: string; email?: string }
	session: { id: string }
}

const authState = vi.hoisted<{ session: MockSession | null }>(() => ({
	session: null,
}))

export type { MockSession }

export function setMockSession(session: MockSession | null) {
	authState.session = session
}

vi.mock('@/lib/auth/client', () => ({
	authClient: {
		useSession: () => ({ data: authState.session, isPending: false }),
		signIn: {
			email: vi.fn(),
			social: vi.fn(),
		},
		signUp: {
			email: vi.fn(async () => ({ error: null })),
		},
		requestPasswordReset: vi.fn(),
		resetPassword: vi.fn(),
		signOut: vi.fn(),
	},
}))

vi.mock('@/lib/auth/functions', () => ({
	getCurrentSession: () => authState.session,
	redirectAuthenticatedUsers: () => undefined,
	redirectUnauthenticatedUsers: () => ({ session: authState.session }),
}))

vi.mock('@/lib/auth/session', () => ({
	getCurrentSession: () => Promise.resolve(authState.session),
}))

vi.mock('@/routes/__root', async () => {
	const React = await import('react')

	const { Outlet, createRootRouteWithContext } =
		await import('@tanstack/react-router')

	return {
		Route: createRootRouteWithContext()({
			component: () => React.createElement(Outlet),
		}),
	}
})
