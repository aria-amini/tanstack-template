import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from 'cn'
import * as React from 'react'

function Table({ className, ...props }: React.ComponentProps<'table'>) {
	return (
		<div
			data-slot="table-container"
			className="relative w-full overflow-x-auto"
		>
			<table
				data-slot="table"
				className={cn('w-full caption-bottom text-sm', className)}
				{...props}
			/>
		</div>
	)
}

function TableHeader({
	className,
	variant = 'default',
	...props
}: React.ComponentProps<'thead'> & { variant?: 'default' | 'sticky' }) {
	return (
		<thead
			data-slot="table-header"
			data-variant={variant}
			className={cn(
				'[&_tr]:border-b',
				variant === 'sticky' && 'sticky top-0 z-10 bg-card',
				className,
			)}
			{...props}
		/>
	)
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
	return (
		<tbody
			data-slot="table-body"
			className={cn('[&_tr:last-child]:border-0', className)}
			{...props}
		/>
	)
}

function TableFooter({ className, ...props }: React.ComponentProps<'tfoot'>) {
	return (
		<tfoot
			data-slot="table-footer"
			className={cn(
				'border-t bg-muted/50 font-medium [&>tr]:last:border-b-0',
				className,
			)}
			{...props}
		/>
	)
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
	return (
		<tr
			data-slot="table-row"
			className={cn(
				'border-b border-border/60 transition-colors hover:bg-primary/5 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted',
				className,
			)}
			{...props}
		/>
	)
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
	return (
		<th
			data-slot="table-head"
			className={cn(
				'h-10 px-3 text-left align-middle font-mono text-xs font-normal tracking-[0.1em] whitespace-nowrap text-muted-foreground uppercase [&:has([role=checkbox])]:pr-0',
				className,
			)}
			{...props}
		/>
	)
}

const tableCellVariants = cva('', {
	variants: {
		numeric: {
			true: 'font-mono text-sm tabular-nums',
		},
		strong: {
			true: 'font-medium',
		},
		muted: {
			true: 'text-muted-foreground',
		},
	},
})

type TableCellProps = React.ComponentProps<'td'> &
	VariantProps<typeof tableCellVariants>

function TableCell({
	className,
	numeric,
	strong,
	muted,
	...props
}: TableCellProps) {
	return (
		<td
			data-slot="table-cell"
			data-numeric={numeric}
			className={cn(
				'px-3 py-2.5 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0',
				tableCellVariants({ numeric, strong, muted }),
				className,
			)}
			{...props}
		/>
	)
}

function TableCaption({
	className,
	...props
}: React.ComponentProps<'caption'>) {
	return (
		<caption
			data-slot="table-caption"
			className={cn('mt-4 text-sm text-muted-foreground', className)}
			{...props}
		/>
	)
}

export {
	Table,
	TableHeader,
	TableBody,
	TableFooter,
	TableHead,
	TableRow,
	TableCell,
	TableCaption,
}
