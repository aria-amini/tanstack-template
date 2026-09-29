import { Moon, Sun } from '@phosphor-icons/react/dist/ssr'
import { cn } from 'cn'
import { createContext, useContext, useState, type ReactNode } from 'react'

import { applyThemeToDocument, writeThemeCookie, type Theme } from '@/lib/theme'
import { useBrowserLayoutEffect } from '@/lib/use-browser-layout-effect'

const ThemeContext = createContext<{
	theme: Theme
	setThemePreference: (theme: Theme) => void
} | null>(null)

export function ThemeProvider({
	preference,
	children,
}: {
	preference: Theme | null
	children: ReactNode
}) {
	const [theme, setThemeState] = useState<Theme>(preference ?? 'light')
	const [mounted, setMounted] = useState(false)

	useBrowserLayoutEffect(() => {
		// Adopt the bootstrap result, including OS detection and legacy migration.
		setThemeState(
			document.documentElement.classList.contains('dark') ? 'dark' : 'light',
		)
		setMounted(true)
	}, [])

	useBrowserLayoutEffect(() => {
		if (!mounted) return
		applyThemeToDocument(theme)
	}, [theme, mounted])

	function setThemePreference(next: Theme) {
		writeThemeCookie(next)
		setThemeState(next)
	}

	return (
		<ThemeContext value={{ theme, setThemePreference }}>
			{children}
		</ThemeContext>
	)
}

export function useTheme() {
	const context = useContext(ThemeContext)

	if (!context) throw new Error('useTheme must be used within ThemeProvider')

	return context
}

/** Console key for the board's night/day rendition; the knob rides the
 * `.dark` class applied by the pre-hydration theme bootstrap, so the visual
 * state is correct before hydration. */
export function ThemeSwitch({ className }: { className?: string }) {
	const { theme, setThemePreference } = useTheme()

	const toggle = () => setThemePreference(theme === 'dark' ? 'light' : 'dark')

	return (
		<button
			type="button"
			role="switch"
			aria-checked={theme === 'dark'}
			aria-label="Dark mode"
			onClick={toggle}
			className={cn(
				'relative flex h-8 w-16 shrink-0 items-center border bg-card shadow-sm outline-none',
				'focus-visible:ring-3 focus-visible:ring-ring/50',
				className,
			)}
		>
			<Moon
				aria-hidden
				className="text-muted-foreground absolute left-1.5 size-3.5"
				weight="bold"
			/>
			<Sun
				aria-hidden
				className="text-muted-foreground absolute right-1.5 size-3.5"
				weight="bold"
			/>
			<span
				aria-hidden
				className="bg-muted ring-border/50 dark:bg-primary absolute top-0.5 bottom-0.5 left-0.5 w-7 shadow-sm ring-1 transition-transform motion-reduce:transition-none dark:translate-x-8"
			/>
		</button>
	)
}
