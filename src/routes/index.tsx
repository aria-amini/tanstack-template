import { createFileRoute, Link } from '@tanstack/react-router'
import { cn } from 'cn'
import type { CSSProperties } from 'react'
import { z } from 'zod'

import { BoardHeader, LadderBoard } from '@/components/dota/board-frame'
import { HeroIcon } from '@/components/dota/hero-icon'
import { RankIcon } from '@/components/dota/rank-icon'
import {
	ChannelRail,
	type ChannelItemProps,
} from '@/components/ui/channel-rail'
import { LampDot } from '@/components/ui/lamp'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { getMetaPage, type BracketName } from '@/lib/dota/server'

const BRACKETS: Array<BracketName> = [
	'Herald',
	'Guardian',
	'Crusader',
	'Archon',
	'Legend',
	'Ancient',
	'Divine',
	'Pro',
]

export const Route = createFileRoute('/')({
	validateSearch: z.object({ bracket: z.enum(BRACKETS).optional() }),
	loaderDeps: ({ search: { bracket } }) => ({ bracket }),
	loader: async ({ deps }) =>
		getMetaPage({ data: { bracket: deps.bracket ?? 'Archon' } }),
	component: MetaPage,
})

function WinRateLamp({ winrate }: { winrate: number }) {
	const lit = winrate >= 50

	return (
		<span
			className={cn(
				'inline-flex items-center justify-end gap-2 font-mono text-sm tabular-nums',
				lit ? 'text-primary' : 'text-muted-foreground',
			)}
		>
			<LampDot lit={lit} />
			{winrate}%
		</span>
	)
}

function PickShareGauge({ share, max }: { share: number; max: number }) {
	const fill = max > 0 ? (share / max) * 100 : 0

	return (
		<div className="flex items-center justify-end gap-3">
			<div className="bg-lamp-ghost/50 hidden h-1.5 w-28 lg:block">
				<div
					className="lamp-fill bg-lamp-mid h-full"
					style={{ '--lamp-fill': `${fill}%` }}
				/>
			</div>
			<span className="text-muted-foreground w-12 text-right font-mono text-xs tabular-nums">
				{share}%
			</span>
		</div>
	)
}

function MetaPage() {
	const { bracket } = Route.useSearch()
	const rows = Route.useLoaderData()
	const active: BracketName = bracket ?? 'Archon'

	const channels: Array<ChannelItemProps> = BRACKETS.map((name) => ({
		label: name,
		icon: <RankIcon bracket={name} />,
		active: name === active,
		render: <Link to="/" search={{ bracket: name }} />,
	}))

	const totalPicks = rows.reduce((sum, row) => sum + row.picks, 0)
	const maxShare = Math.max(...rows.map((row) => row.pickShare), 0)

	return (
		<div className="min-h-dvh">
			<BoardHeader active="ladder" />
			<main className="mx-auto w-full max-w-6xl space-y-6 px-6 py-8">
				<div className="flex flex-wrap items-end justify-between gap-4">
					<div className="space-y-2">
						<h1 className="text-4xl leading-none">Pub meta ladder</h1>
						<p className="text-muted-foreground max-w-prose text-sm">
							Current pub meta by rank bracket, from the OpenDota API. Run your
							own matches on the{' '}
							<Link
								to="/stats"
								className="text-primary underline underline-offset-4 hover:no-underline"
							>
								operator desk
							</Link>
							.
						</p>
					</div>
					<p className="label-mono text-muted-foreground">
						Data · OpenDota · {totalPicks.toLocaleString()} picks
					</p>
				</div>

				<ChannelRail aria-label="Rank bracket channel" items={channels} />

				<p className="label-mono text-muted-foreground flex items-center gap-2">
					Win lamp
					<LampDot lit />
					<span className="text-foreground">≥ 50%</span>
					<LampDot lit={false} />
					<span className="text-foreground">under 50%</span>
				</p>

				<LadderBoard
					title={`${active} channel`}
					description={
						active === 'Pro'
							? 'Professional matches; OpenDota publishes no Immortal-tier pub aggregate'
							: 'Sorted by pick count over the tracked match sample'
					}
				>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead className="text-right">#</TableHead>
								<TableHead>Hero</TableHead>
								<TableHead className="text-right">Picks</TableHead>
								<TableHead className="text-right">Pick share</TableHead>
								<TableHead className="text-right">Win rate</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{rows.map((row, index) => {
								const rowStyle: CSSProperties & Record<'--row-i', number> = {
									'--row-i': index,
								}

								return (
									<TableRow key={row.hero} style={rowStyle}>
										<TableCell muted numeric className="text-right">
											{index + 1}
										</TableCell>
										<TableCell strong>
											<span className="flex items-center gap-2">
												<HeroIcon hero={row.hero} />
												{row.hero}
											</span>
										</TableCell>
										<TableCell numeric className="text-right">
											{row.picks.toLocaleString()}
										</TableCell>
										<TableCell>
											<PickShareGauge share={row.pickShare} max={maxShare} />
										</TableCell>
										<TableCell className="text-right">
											<WinRateLamp winrate={row.winrate} />
										</TableCell>
									</TableRow>
								)
							})}
						</TableBody>
					</Table>
				</LadderBoard>
			</main>
		</div>
	)
}
