import { PostgreSqlContainer } from '@testcontainers/postgresql'
import { sql } from 'drizzle-orm'
import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { migrate } from 'drizzle-orm/node-postgres/migrator'
import { Pool } from 'pg'
import { test as baseTest, inject } from 'vite-plus/test'

import { resolveFromRoot, rootKey } from './root.ts'

export type TestDatabase = NodePgDatabase & { $client: Pool }

export type Seed = (db: TestDatabase) => Promise<void> | void

export interface DbTestOptions {
	/**
	 * Drizzle migrations. A relative path resolves against the app root that
	 * the TanStack `defineToolkit()` provides, else against the current
	 * working directory. Default: `src/db/migrations`.
	 */
	migrationsFolder?: string
	/** Postgres extensions to create before the migrations run. */
	extensions?: readonly string[]
	/** Default: `postgres:17`. */
	image?: string
}

/**
 * Returns `initDb(seed?)`. Each call gives a test with a `db` fixture: one
 * migrated Postgres container per test file, shared by its tests.
 */
export function createDbTest(options: DbTestOptions = {}) {
	const migrationsPath = options.migrationsFolder ?? 'src/db/migrations'
	const image = options.image ?? 'postgres:17'

	return function initDb(seed?: Seed) {
		return baseTest.extend<{ db: TestDatabase }>({
			db: [
				async ({}, use) => {
					const container = await new PostgreSqlContainer(image).start()

					try {
						const client = new Pool({
							connectionString: container.getConnectionUri(),
						})

						// Postgres ends pooled connections when the container stops.
						// Without a listener those errors become uncaught exceptions
						// that fail the whole run despite passing tests.
						client.on('error', (error) => {
							console.error('test pg pool error:', error.message)
						})

						try {
							const db = drizzle({ client })

							for (const extension of options.extensions ?? []) {
								await db.execute(
									sql`CREATE EXTENSION IF NOT EXISTS ${sql.raw(extension)}`,
								)
							}

							await migrate(db, {
								migrationsFolder: resolveFromRoot(
									inject(rootKey),
									migrationsPath,
								),
							})
							await seed?.(db)
							await use(db)
						} finally {
							await client.end()
						}
					} finally {
						await container.stop()
					}
				},
				{ scope: 'file' },
			],
		})
	}
}
