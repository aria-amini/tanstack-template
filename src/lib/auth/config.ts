import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { betterAuth, type BetterAuthOptions } from 'better-auth'
import { tanstackStartCookies } from 'better-auth/tanstack-start'

import { createDb } from '@/db/connection'
import { account, session, user, verification } from '@/db/schema'
import { serverEnv as env } from '@/env.server'

const appOrigin = new URL(env.BETTER_AUTH_URL).origin

export const allowedHosts = [
	'127.0.0.1:*',
	'localhost:*',
	'*.localhost',
	'*.localhost:*',
	'*.lvh.ariaamini.com',
	'dota-visualizer-*.up.railway.app',
	'app-dota-visualizer-*.up.railway.app',
]

export function getAuth() {
	const db = createDb()

	const options: BetterAuthOptions = {
		appName: 'dota-visualizer',
		baseURL: {
			allowedHosts,
			protocol: 'auto',
			fallback: appOrigin,
		},
		secret: env.BETTER_AUTH_SECRET,
		database: drizzleAdapter(db, {
			provider: 'pg',
			schema: { account, session, user, verification },
		}),
		emailAndPassword: { enabled: true, autoSignIn: true },
		plugins: [tanstackStartCookies()],
	}

	return betterAuth(options)
}
