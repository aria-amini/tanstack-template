import {
	CartesianGrid,
	Bar,
	BarChart,
	Cell,
	Line,
	LineChart,
	Pie,
	PieChart,
	XAxis,
	YAxis,
} from 'recharts'

import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
	type ChartConfig,
} from '@/components/ui/chart'
import type { HeroBracketWinrate, MatchHistory } from '@/lib/dota/opendota'

const winLossConfig = {
	wins: { label: 'Wins', color: 'var(--chart-1)' },
	losses: { label: 'Losses', color: 'var(--chart-4)' },
} satisfies ChartConfig

const winRateConfig = {
	winRate: { label: 'KDA', color: 'var(--chart-1)' },
} satisfies ChartConfig

export function WinLossDonut({ history }: { history: MatchHistory }) {
	const data = [
		{ name: 'Wins', key: 'wins' as const, value: history.summary.wins },
		{ name: 'Losses', key: 'losses' as const, value: history.summary.losses },
	]

	return (
		<div className="relative mx-auto aspect-square max-h-56">
			<ChartContainer config={winLossConfig} className="aspect-square">
				<PieChart>
					<ChartTooltip content={<ChartTooltipContent hideLabel />} />
					<Pie
						data={data}
						dataKey="value"
						nameKey="name"
						innerRadius="72%"
						paddingAngle={2}
						strokeWidth={0}
					>
						{data.map((entry) => (
							<Cell key={entry.key} fill={`var(--color-${entry.key})`} />
						))}
					</Pie>
				</PieChart>
			</ChartContainer>
			<div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
				<p className="text-primary font-mono text-3xl leading-none tabular-nums">
					{history.summary.winRate}%
				</p>
				<p className="label-mono text-muted-foreground mt-1.5">
					{history.summary.matches} matches
				</p>
			</div>
		</div>
	)
}

export function KdaTrend({ history }: { history: MatchHistory }) {
	const data = [...history.matches]
		.reverse()
		.map((match, index) => ({ game: index + 1, kda: match.kda }))

	return (
		<ChartContainer config={winRateConfig} className="aspect-auto h-56 w-full">
			<LineChart
				accessibilityLayer
				data={data}
				margin={{ left: -16, right: 12 }}
			>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="game"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<YAxis tickLine={false} axisLine={false} tickMargin={8} />
				<ChartTooltip content={<ChartTooltipContent indicator="line" />} />
				<Line
					dataKey="kda"
					type="monotone"
					stroke="var(--color-winRate)"
					strokeWidth={2}
					dot={false}
				/>
			</LineChart>
		</ChartContainer>
	)
}

export function BracketWinrateChart({
	heroes,
}: {
	heroes: Array<HeroBracketWinrate>
}) {
	const config = Object.fromEntries(
		heroes.map((hero, index) => [
			hero.hero,
			{ label: hero.hero, color: `var(--chart-${(index % 5) + 1})` },
		]),
	) satisfies ChartConfig

	const data = heroes[0]?.brackets.map(({ bracket }, index) => ({
		bracket,
		...Object.fromEntries(
			heroes.map((hero) => [hero.hero, hero.brackets[index]?.winrate]),
		),
	}))

	return (
		<ChartContainer config={config} className="aspect-auto h-64 w-full">
			<LineChart
				accessibilityLayer
				data={data ?? []}
				margin={{ left: -16, right: 12 }}
			>
				<CartesianGrid vertical={false} />
				<XAxis
					dataKey="bracket"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
				/>
				<YAxis
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					tickFormatter={(value) => `${value}%`}
				/>
				<ChartTooltip content={<ChartTooltipContent indicator="line" />} />
				<ChartLegend content={<ChartLegendContent />} />
				{heroes.map((hero) => (
					<Line
						key={hero.hero}
						dataKey={hero.hero}
						type="monotone"
						stroke={`var(--color-${hero.hero})`}
						strokeWidth={2}
						dot={false}
					/>
				))}
			</LineChart>
		</ChartContainer>
	)
}

export function HeroBreakdown({ history }: { history: MatchHistory }) {
	const data = history.heroTallies.map((tally) => ({
		hero: tally.hero,
		wins: tally.wins,
		losses: tally.games - tally.wins,
	}))

	return (
		<ChartContainer config={winLossConfig} className="aspect-auto h-64 w-full">
			<BarChart
				accessibilityLayer
				layout="vertical"
				data={data}
				margin={{ left: 16, right: 12 }}
				barSize={14}
			>
				<CartesianGrid horizontal={false} />
				<XAxis type="number" tickLine={false} axisLine={false} tickMargin={8} />
				<YAxis
					type="category"
					dataKey="hero"
					tickLine={false}
					axisLine={false}
					tickMargin={8}
					width={92}
				/>
				<ChartTooltip content={<ChartTooltipContent indicator="line" />} />
				<Bar dataKey="wins" stackId="games" fill="var(--color-wins)" />
				<Bar dataKey="losses" stackId="games" fill="var(--color-losses)" />
			</BarChart>
		</ChartContainer>
	)
}
