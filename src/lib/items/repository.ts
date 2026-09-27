import { and, eq } from 'drizzle-orm'

import { createDb } from '@/db/connection'
import { items } from '@/db/schema'

type Database = ReturnType<typeof createDb>

export async function listItemsForUser(
	userId: string,
	database: Database = createDb(),
) {
	return database.select().from(items).where(eq(items.userId, userId))
}

export async function createItemForUser(
	userId: string,
	name: string,
	database: Database = createDb(),
) {
	const [item] = await database
		.insert(items)
		.values({ id: crypto.randomUUID(), name, userId, createdAt: new Date() })
		.returning()

	return item
}

export async function deleteItemForUser(
	userId: string,
	id: string,
	database: Database = createDb(),
) {
	await database
		.delete(items)
		.where(and(eq(items.id, id), eq(items.userId, userId)))
}
