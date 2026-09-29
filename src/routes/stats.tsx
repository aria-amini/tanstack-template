import { createFileRoute, ClientOnly } from '@tanstack/react-router'
import { cn } from 'cn'
import { useState, type ReactNode } from 'react'
import { z } from 'zod'

import { BoardHeader } from '@/components/dota/board-frame'
import {
	BracketWinrateChart,
	HeroBreakdown,
	KdaTrend,
	WinLossDonut,
} from '@/components/dota/charts'
import { MatchTable } from '@/components/dota/match-table'
import { Button } from '@/components/ui/button'
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { getStatsPage } from '@/lib/dota/server'

// Router JSON-parses search values, so `?account=123` arrives as a number.
const searchSchema = z.object({
	account: z.coerce.number().int().positive().optional(),
})

export const Route = createFileRoute('/stats')({
	validateSearch: searchSchema,
	loaderDeps: ({ search: { account } }) => ({ account }),
	loader: async ({ deps }) => {
		if (!deps.account) return null

		return getStatsPage({ data: { accountId: deps.account } })
	},
	component: StatsPage,
})

function readout(value: number): string {
	return Number.isFinite(value) ? String(value) : '—'
}

function AccountForm({ accountId }: { accountId: number | undefined }) {
	const navigate = Route.useNavigate()
	const [value, setValue] = useState(accountId ? String(accountId) : '')

	return (
		<form
			className="flex gap-2"
			onSubmit={(event) => {
				event.preventDefault()
				const trimmed = value.trim()
				void navigate({
					to: '/stats',
					search: /^\d+$/.test(trimmed) ? { account: Number(trimmed) } : {},
				})
			}}
		>
			<Input
				value={value}
				onChange={(event) => setValue(event.target.value)}
				placeholder="32-bit Dota account ID"
				inputMode="numeric"
				className="max-w-72"
			/>
			<Button type="submit">Analyze</Button>
		</form>
	)
}

function GaugeModule({
	label,
	value,
	hint,
	lit = false,
}: {
	label: string
	value: string
	hint?: string
	lit?: boolean
}) {
	return (
		<div className="bg-card p-4">
			<p className="label-mono text-muted-foreground">{label}</p>
			<p
				className={cn(
					'mt-2 font-mono text-2xl leading-none tabular-nums',
					lit ? 'text-primary' : 'text-foreground',
				)}
			>
				{value}
			</p>
			{hint ? (
				<p className="text-muted-foreground mt-1.5 text-xs">{hint}</p>
			) : null}
		</div>
	)
}

function EmptyState({ children }: { children: ReactNode }) {
	return (
		<Card className="relative py-10">
			<CardContent>
				<div className="text-muted-foreground text-center text-sm">
					{children}
				</div>
			</CardContent>
		</Card>
	)
}

function StatsPage() {
	const { account } = Route.useSearch()
	const result = Route.useLoaderData()

	return (
		<div className="min-h-dvh">
			<BoardHeader active="operator" />
			<main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
				<div className="space-y-4">
					<h1 className="text-4xl leading-none">Operator desk</h1>
					<p className="text-muted-foreground max-w-prose text-sm">
						Recent matches from the OpenDota API. Find your 32-bit account ID on
						opendota.com or your Steam profile URL.
					</p>
					<AccountForm accountId={account} />
				</div>

				{!account ? (
					<EmptyState>
						<p>Enter an account ID, or pull up a pro player:</p>
						<div className="mt-4 flex justify-center gap-2">
							<Button
								variant="outline"
								render={
									<a
										href="/stats?account=70388657"
										aria-label="Load Dendi stats"
									/>
								}
							>
								Dendi
							</Button>
							<Button
								variant="outline"
								render={
									<a
										href="/stats?account=105248644"
										aria-label="Load Miracle stats"
									/>
								}
							>
								Miracle-
							</Button>
						</div>
					</EmptyState>
				) : !result ? null : !result.ok ? (
					<EmptyState>
						{result.error === 'not-found'
							? 'No matches found for that account ID. Check the ID and retry.'
							: result.error === 'rate-limited'
								? 'OpenDota rate limit hit. Wait a minute and retry.'
								: 'OpenDota is unreachable right now. Try again later.'}
					</EmptyState>
				) : result.history.matches.length === 0 ? (
					<EmptyState>This account has no public matches.</EmptyState>
				) : (
					<>
						<div className="bg-border shadow-card grid grid-cols-2 gap-px border md:grid-cols-5">
							<GaugeModule
								label="Record"
								value={`${result.history.summary.wins}–${result.history.summary.losses}`}
								hint={`${result.history.summary.matches} matches`}
							/>
							<GaugeModule
								label="Win rate"
								value={`${result.history.summary.winRate}%`}
								lit
							/>
							<GaugeModule
								label="Avg K/D/A"
								value={`${readout(result.history.summary.avgKills)}/${readout(result.history.summary.avgDeaths)}/${readout(result.history.summary.avgAssists)}`}
							/>
							<GaugeModule
								label="Avg GPM"
								value={readout(result.history.summary.avgGpm)}
							/>
							<GaugeModule
								label="Avg XPM"
								value={readout(result.history.summary.avgXpm)}
							/>
						</div>

						<div className="grid gap-6 md:grid-cols-3">
							<Card>
								<CardHeader>
									<CardTitle>Win rate</CardTitle>
									<CardDescription>Wins lit against losses</CardDescription>
								</CardHeader>
								<CardContent>
									<ClientOnly fallback={<Spinner />}>
										<WinLossDonut history={result.history} />
									</ClientOnly>
								</CardContent>
							</Card>
							<Card className="md:col-span-2">
								<CardHeader>
									<CardTitle>KDA trend</CardTitle>
									<CardDescription>Oldest to newest match</CardDescription>
								</CardHeader>
								<CardContent>
									<ClientOnly fallback={<Spinner />}>
										<KdaTrend history={result.history} />
									</ClientOnly>
								</CardContent>
							</Card>
						</div>

						<Card>
							<CardHeader>
								<CardTitle>Most played heroes</CardTitle>
								<CardDescription>Wins lit against losses</CardDescription>
							</CardHeader>
							<CardContent>
								<ClientOnly fallback={<Spinner />}>
									<HeroBreakdown history={result.history} />
								</ClientOnly>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Bracket winrates</CardTitle>
								<CardDescription>
									Global pub winrates per rank bracket, Herald through Immortal
								</CardDescription>
							</CardHeader>
							<CardContent>
								<ClientOnly fallback={<Spinner />}>
									<BracketWinrateChart heroes={result.heroBrackets} />
								</ClientOnly>
							</CardContent>
						</Card>

						<section className="space-y-3">
							<h2 className="text-xl">Match history</h2>
							<MatchTable matches={result.history.matches} />
						</section>
					</>
				)}
			</main>
		</div>
	)
}
