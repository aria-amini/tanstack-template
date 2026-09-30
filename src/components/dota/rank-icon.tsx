import { Trophy } from '@phosphor-icons/react/dist/ssr'
import { cn } from 'cn'

import type { BracketName } from '@/lib/dota/server'

// Pro tier has no pub rank medal; OpenDota pro aggregates are not a rank.
const RANK_FILES = {
	Herald: 'herald',
	Guardian: 'guardian',
	Crusader: 'crusader',
	Archon: 'archon',
	Legend: 'legend',
	Ancient: 'ancient',
	Divine: 'divine',
	Pro: null,
} as const satisfies Record<BracketName, string | null>

export function RankIcon({
	bracket,
	className,
}: {
	bracket: BracketName
	className?: string
}) {
	const file = RANK_FILES[bracket]

	if (!file) {
		return <Trophy weight="fill" className={cn('size-5 shrink-0', className)} />
	}

	return (
		<img
			src={`/ranks/${file}.png`}
			alt=""
			loading="lazy"
			width={24}
			height={24}
			className={cn('size-6 shrink-0 object-contain', className)}
		/>
	)
}
