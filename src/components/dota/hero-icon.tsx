import { cn } from 'cn'

import { heroIconSrc } from '@/lib/dota/heroes'

export function HeroIcon({
	hero,
	className,
}: {
	hero: string
	className?: string
}) {
	return (
		<img
			src={heroIconSrc(hero)}
			alt=""
			loading="lazy"
			width={24}
			height={24}
			className={cn('size-6 shrink-0 rounded-sm', className)}
		/>
	)
}
