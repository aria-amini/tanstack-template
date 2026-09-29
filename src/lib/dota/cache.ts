import { sql } from 'drizzle-orm'

import { db } from '@/db'

export async function cachedJson<T>(
	key: string,
	ttlSeconds: number,
	load: () => Promise<T>,
): Promise<T> {
	try {
		const hit = await db.execute<{ value: T }>(
			sql`select value from cache_entries where key = ${key} and expires_at > now() limit 1`,
		)

		const row = hit.rows[0]

		if (row) return row.value
	} catch {
		// Cache is best-effort; fall through to a direct load when Postgres
		// is unreachable or the table is missing.
	}

	const value = await load()
	const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

	try {
		await db.execute(
			sql`insert into cache_entries (key, value, expires_at)
				values (${key}, ${JSON.stringify(value)}::jsonb, ${expiresAt})
				on conflict (key) do update
				set value = excluded.value, expires_at = excluded.expires_at`,
		)
	} catch {
		// Serving uncached data beats failing the request.
	}

	return value
}
