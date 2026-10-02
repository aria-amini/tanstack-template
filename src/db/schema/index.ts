import { index, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'

export * from './auth'

export const cacheEntries = pgTable(
	'cache_entries',
	{
		key: text().primaryKey(),
		value: jsonb().notNull(),
		expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	},
	(table) => [index('cache_entries_expires_at_index').on(table.expiresAt)],
)
