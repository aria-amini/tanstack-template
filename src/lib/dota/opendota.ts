import { cachedJson } from './cache'

const OPEN_DOTA_API = 'https://api.opendota.com/api'

const RADIANT_SLOT = 0

const MATCH_HISTORY_LIMIT = 50

// OpenDota splits public matches into rank brackets 1-8, low to high.
const BRACKET_TIERS = [
	{ level: 1, name: 'Herald' },
	{ level: 2, name: 'Guardian' },
	{ level: 3, name: 'Crusader' },
	{ level: 4, name: 'Archon' },
	{ level: 5, name: 'Legend' },
	{ level: 6, name: 'Ancient' },
	{ level: 7, name: 'Divine' },
	{ level: 8, name: 'Immortal' },
] as const

type BracketLevel = (typeof BRACKET_TIERS)[number]['level']

const HERO_STATS_TTL_SECONDS = 60 * 60

const HEROES_TTL_SECONDS = 24 * 60 * 60

const MATCH_HISTORY_TTL_SECONDS = 5 * 60

export type OpenDotaMatch = {
	match_id: number
	player_slot: number
	radiant_win: boolean
	duration: number
	game_mode: number
	start_time: number
	hero_id: number
	kills: number
	deaths: number
	assists: number
	gold_per_min: number
	xp_per_min: number
	leaver_status?: number
	party_size?: number
}

type OpenDotaHero = {
	id: number
	localized_name: string
	primary_attr: string
}

type GameModeConstants = Record<string, { localized_name?: string }>

export type MatchRecord = {
	matchId: number
	hero: string
	heroAttr: 'str' | 'agi' | 'int' | 'univers'
	won: boolean
	kills: number
	deaths: number
	assists: number
	kda: number
	gpm: number
	xpm: number
	durationLabel: string
	mode: string
	playedAt: string
}

export type MatchSummary = {
	matches: number
	wins: number
	losses: number
	winRate: number
	avgKills: number
	avgDeaths: number
	avgAssists: number
	avgGpm: number
	avgXpm: number
}

export type HeroTally = {
	hero: string
	attr: MatchRecord['heroAttr']
	games: number
	wins: number
}

export type MatchHistory = {
	accountId: number
	summary: MatchSummary
	matches: Array<MatchRecord>
	heroTallies: Array<HeroTally>
}

export type MatchHistoryError = 'not-found' | 'rate-limited' | 'unavailable'

export type MatchHistoryResult =
	| { ok: true; history: MatchHistory }
	| { ok: false; error: MatchHistoryError }

export type Bracket = (typeof BRACKET_TIERS)[number]['name']

export type HeroBracketWinrate = {
	hero: string
	attr: MatchRecord['heroAttr']
	brackets: Array<{ bracket: Bracket; winrate: number | null; picks: number }>
}

export type MetaRow = {
	hero: string
	attr: MatchRecord['heroAttr']
	picks: number
	pickShare: number
	winrate: number
}

type HeroStatRow = { id: number; pro_pick: number; pro_win: number } & {
	[K in `${BracketLevel}_pick` | `${BracketLevel}_win`]: number
}

const heroCache = new Map<string, Map<number, OpenDotaHero>>()

const gameModeCache = new Map<string, Map<number, string>>()

class HttpError extends Error {
	constructor(public reason: MatchHistoryError) {
		super(reason)
	}
}

async function fetchJson<T>(path: string): Promise<T> {
	const response = await fetch(`${OPEN_DOTA_API}${path}`, {
		signal: AbortSignal.timeout(15_000),
	})

	if (response.status === 404) {
		throw new HttpError('not-found')
	}

	if (response.status === 429) {
		throw new HttpError('rate-limited')
	}

	if (!response.ok) {
		throw new HttpError('unavailable')
	}

	// OpenDota returns `any` from json(); the generic pins the documented shape.
	const data: T = await response.json()

	return data
}

async function heroMap(): Promise<Map<number, OpenDotaHero>> {
	const cached = heroCache.get('heroes')

	if (cached) return cached

	const heroes = await cachedJson('heroes', HEROES_TTL_SECONDS, () =>
		fetchJson<Array<OpenDotaHero>>('/heroes'),
	)

	const map = new Map(heroes.map((hero) => [hero.id, hero]))
	heroCache.set('heroes', map)

	return map
}

async function gameModeMap(): Promise<Map<number, string>> {
	const cached = gameModeCache.get('modes')

	if (cached) return cached

	const modes = await fetchJson<GameModeConstants>('/constants/game_mode')

	const map = new Map(
		Object.entries(modes).map(([id, mode]) => [
			Number(id),
			mode.localized_name ?? 'Unknown',
		]),
	)

	gameModeCache.set('modes', map)

	return map
}

function heroAttr(attr: string | undefined): MatchRecord['heroAttr'] {
	return attr === 'str' ||
		attr === 'agi' ||
		attr === 'int' ||
		attr === 'univers'
		? attr
		: 'univers'
}

function formatDuration(totalSeconds: number): string {
	const minutes = Math.floor(totalSeconds / 60)
	const seconds = totalSeconds % 60

	return `${minutes}:${String(seconds).padStart(2, '0')}`
}

function kda(kills: number, deaths: number, assists: number): number {
	return Number(((kills + assists) / Math.max(deaths, 1)).toFixed(2))
}

function average(total: number, count: number): number {
	return count === 0 ? 0 : Math.round((total / count) * 10) / 10
}

export async function loadMatchHistory(
	accountId: number,
): Promise<MatchHistoryResult> {
	try {
		const [heroes, modes, matches] = await Promise.all([
			heroMap(),
			gameModeMap(),
			cachedJson(`player-matches:${accountId}`, MATCH_HISTORY_TTL_SECONDS, () =>
				fetchJson<Array<OpenDotaMatch>>(
					`/players/${accountId}/matches?limit=${MATCH_HISTORY_LIMIT}&significant=0`,
				),
			),
		])

		const records = matches.map((match): MatchRecord => {
			const hero = heroes.get(match.hero_id)

			return {
				matchId: match.match_id,
				hero: hero?.localized_name ?? `Hero ${match.hero_id}`,
				heroAttr: heroAttr(hero?.primary_attr),
				won: (match.player_slot === RADIANT_SLOT) === match.radiant_win,
				kills: match.kills,
				deaths: match.deaths,
				assists: match.assists,
				kda: kda(match.kills, match.deaths, match.assists),
				gpm: match.gold_per_min,
				xpm: match.xp_per_min,
				durationLabel: formatDuration(match.duration),
				mode: modes.get(match.game_mode) ?? 'Unknown',
				playedAt: new Date(match.start_time * 1000).toISOString().slice(0, 10),
			}
		})

		const wins = records.filter((match) => match.won).length

		const tallyMap = new Map<string, HeroTally>()

		for (const match of records) {
			const tally = tallyMap.get(match.hero) ?? {
				hero: match.hero,
				attr: match.heroAttr,
				games: 0,
				wins: 0,
			}

			tally.games += 1

			if (match.won) tally.wins += 1
			tallyMap.set(match.hero, tally)
		}

		return {
			ok: true,
			history: {
				accountId,
				summary: {
					matches: records.length,
					wins,
					losses: records.length - wins,
					winRate:
						records.length === 0
							? 0
							: Math.round((wins / records.length) * 100),
					avgKills: average(
						records.reduce((sum, m) => sum + m.kills, 0),
						records.length,
					),
					avgDeaths: average(
						records.reduce((sum, m) => sum + m.deaths, 0),
						records.length,
					),
					avgAssists: average(
						records.reduce((sum, m) => sum + m.assists, 0),
						records.length,
					),
					avgGpm: average(
						records.reduce((sum, m) => sum + m.gpm, 0),
						records.length,
					),
					avgXpm: average(
						records.reduce((sum, m) => sum + m.xpm, 0),
						records.length,
					),
				},
				matches: records,
				heroTallies: [...tallyMap.values()]
					.sort((a, b) => b.games - a.games)
					.slice(0, 8),
			},
		}
	} catch (error) {
		if (error instanceof HttpError) return { ok: false, error: error.reason }

		return { ok: false, error: 'unavailable' }
	}
}

function heroStatRows(): Promise<Array<HeroStatRow>> {
	return cachedJson('heroStats', HERO_STATS_TTL_SECONDS, () =>
		fetchJson<Array<HeroStatRow>>('/heroStats'),
	)
}

export async function loadHeroBracketWinrates(
	heroNames: ReadonlyArray<string>,
): Promise<Array<HeroBracketWinrate>> {
	const [heroes, rows] = await Promise.all([heroMap(), heroStatRows()])

	const rowsByHeroId = new Map(rows.map((row) => [row.id, row]))

	const heroesByName = new Map(
		[...heroes.values()].map((hero) => [
			hero.localized_name.toLowerCase(),
			hero,
		]),
	)

	const result: Array<HeroBracketWinrate> = []

	for (const name of heroNames) {
		const hero = heroesByName.get(name.toLowerCase())
		const row = hero && rowsByHeroId.get(hero.id)

		if (!hero || !row) continue

		result.push({
			hero: hero.localized_name,
			attr: heroAttr(hero.primary_attr),
			brackets: BRACKET_TIERS.map(({ level, name }) => {
				const picks = row[`${level}_pick`]
				const wins = row[`${level}_win`]

				return {
					bracket: name,
					picks,
					winrate: picks === 0 ? null : Math.round((wins / picks) * 1000) / 10,
				}
			}),
		})
	}

	return result
}

export type MetaBracket = Bracket | 'Pro'

export async function loadHeroMeta(
	bracket: MetaBracket,
): Promise<Array<MetaRow>> {
	const [heroes, rows] = await Promise.all([heroMap(), heroStatRows()])
	const tier = BRACKET_TIERS.find((entry) => entry.name === bracket)

	// OpenDota leaves the Immortal bucket (tier 8) empty; pro matches are the
	// top tier it actually publishes.
	if (!tier && bracket !== 'Pro') return []

	const picksOf = (row: HeroStatRow): number => {
		if (bracket === 'Pro') return row.pro_pick

		return tier ? row[`${tier.level}_pick`] : 0
	}

	const winsOf = (row: HeroStatRow): number => {
		if (bracket === 'Pro') return row.pro_win

		return tier ? row[`${tier.level}_win`] : 0
	}

	const totalPicks = rows.reduce((sum, row) => sum + picksOf(row), 0)

	const meta: Array<MetaRow> = []

	for (const row of rows) {
		const hero = heroes.get(row.id)
		const picks = picksOf(row)
		const wins = winsOf(row)

		if (!hero || picks === 0) continue

		meta.push({
			hero: hero.localized_name,
			attr: heroAttr(hero.primary_attr),
			picks,
			pickShare: Math.round((picks / totalPicks) * 1000) / 10,
			winrate: Math.round((wins / picks) * 1000) / 10,
		})
	}

	return meta.sort((a, b) => b.picks - a.picks)
}
