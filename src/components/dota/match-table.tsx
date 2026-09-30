import { cn } from 'cn'

import { HeroIcon } from '@/components/dota/hero-icon'
import { LampDot } from '@/components/ui/lamp'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import type { MatchRecord } from '@/lib/dota/opendota'

function ResultLamp({ won }: { won: boolean }) {
	return (
		<span
			className={cn(
				'label-mono inline-flex items-center gap-2',
				won ? 'text-foreground' : 'text-muted-foreground',
			)}
		>
			<LampDot lit={won} />
			{won ? 'Win' : 'Loss'}
		</span>
	)
}

export function MatchTable({ matches }: { matches: Array<MatchRecord> }) {
	return (
		<div className="bg-card shadow-card max-h-[26rem] overflow-y-auto border">
			<Table>
				<TableHeader variant="sticky">
					<TableRow>
						<TableHead>Date</TableHead>
						<TableHead>Hero</TableHead>
						<TableHead>Result</TableHead>
						<TableHead className="text-right">K/D/A</TableHead>
						<TableHead className="text-right">GPM</TableHead>
						<TableHead className="text-right">XPM</TableHead>
						<TableHead className="text-right">Duration</TableHead>
						<TableHead>Mode</TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{matches.map((match) => (
						<TableRow key={match.matchId}>
							<TableCell muted numeric>
								{match.playedAt}
							</TableCell>
							<TableCell strong>
								<span className="flex items-center gap-2">
									<HeroIcon hero={match.hero} />
									{match.hero}
								</span>
							</TableCell>
							<TableCell>
								<ResultLamp won={match.won} />
							</TableCell>
							<TableCell numeric className="text-right">
								{match.kills}/{match.deaths}/{match.assists}
								<span className="text-muted-foreground ml-2 text-xs">
									{match.kda}
								</span>
							</TableCell>
							<TableCell numeric muted className="text-right">
								{match.gpm}
							</TableCell>
							<TableCell numeric muted className="text-right">
								{match.xpm}
							</TableCell>
							<TableCell numeric muted className="text-right">
								{match.durationLabel}
							</TableCell>
							<TableCell muted>{match.mode}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
		</div>
	)
}
