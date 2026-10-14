import { cn } from 'cn'

function LampDot({
	lit,
	pulse = false,
	className,
}: {
	lit: boolean
	pulse?: boolean
	className?: string
}) {
	return (
		<span
			aria-hidden
			className={cn(
				'size-1.5 shrink-0 rounded-full',
				lit ? 'bg-primary shadow-[0_0_6px_var(--primary)]' : 'bg-lamp-ghost',
				lit && pulse && 'lamp-pulse',
				className,
			)}
		/>
	)
}

export { LampDot }
