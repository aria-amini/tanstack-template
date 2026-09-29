import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

import {
	loadHeroBracketWinrates,
	loadHeroMeta,
	loadMatchHistory,
} from './opendota'

export const bracketSchema = z.enum([
	'Herald',
	'Guardian',
	'Crusader',
	'Archon',
	'Legend',
	'Ancient',
	'Divine',
	'Pro',
])

export type BracketName = z.infer<typeof bracketSchema>

export const getMetaPage = createServerFn({ method: 'GET' })
	.validator(
		z.object({
			bracket: bracketSchema.default('Archon'),
		}),
	)
	.handler(async ({ data }) => loadHeroMeta(data.bracket))

export const getStatsPage = createServerFn({ method: 'GET' })
	.validator(z.object({ accountId: z.number().int().positive() }))
	.handler(async ({ data }) => {
		const result = await loadMatchHistory(data.accountId)

		if (!result.ok) return result

		const topHeroes = result.history.heroTallies
			.slice(0, 5)
			.map((tally) => tally.hero)

		const heroBrackets = await loadHeroBracketWinrates(topHeroes)

		return { ok: true as const, history: result.history, heroBrackets }
	})
