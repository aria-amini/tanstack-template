import { mergeProps } from '@base-ui/react/merge-props'
import { useRender } from '@base-ui/react/use-render'
import { cn } from 'cn'

import { LampDot } from '@/components/ui/lamp'

type ChannelItemProps = {
	label: string
	active?: boolean
	render?: useRender.ComponentProps<'a'>['render']
} & Omit<useRender.ComponentProps<'a'>, 'className' | 'render'>

function ChannelItem({ label, active, render, ...rest }: ChannelItemProps) {
	return useRender({
		defaultTagName: 'a',
		render,
		props: mergeProps<'a'>(
			{
				'aria-current': active ? 'page' : undefined,
				className: cn(
					'label-mono relative inline-flex h-9 items-center gap-2 border-r px-4 transition-colors last:border-r-0 outline-none focus-visible:bg-muted',
					active
						? 'bg-primary text-primary-foreground'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground',
				),
			},
			{
				...rest,
				children: (
					<>
						{active ? <LampDot lit /> : null}
						{label}
					</>
				),
			},
		),
	})
}

function ChannelRail({
	'aria-label': ariaLabel,
	items,
	className,
}: {
	'aria-label'?: string
	items: Array<ChannelItemProps>
	className?: string
}) {
	return (
		<nav
			aria-label={ariaLabel}
			className={cn(
				'inline-flex flex-wrap border bg-card shadow-sm',
				className,
			)}
		>
			{items.map(({ ...item }) => (
				<ChannelItem key={item.label} {...item} />
			))}
		</nav>
	)
}

export { ChannelRail, type ChannelItemProps }
