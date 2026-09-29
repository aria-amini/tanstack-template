import { type QueryClient } from '@tanstack/react-query'
import {
	ClientOnly,
	HeadContent,
	Outlet,
	ScriptOnce,
	Scripts,
	createRootRouteWithContext,
} from '@tanstack/react-router'
import { type ReactNode } from 'react'

import { ThemeProvider, ThemeSwitch } from '@/components/theme-switch'
import { createThemeBootstrapScript, getThemePreference } from '@/lib/theme'

import '../styles.css'

export const Route = createRootRouteWithContext<{
	queryClient: QueryClient
}>()({
	beforeLoad: () => ({ theme: getThemePreference() }),
	head: () => ({
		meta: [
			{ charSet: 'utf-8' },
			{
				name: 'viewport',
				content: 'width=device-width, initial-scale=1, viewport-fit=cover',
			},
			{ title: 'dota-visualizer' },
		],
	}),
	component: RootComponent,
	shellComponent: DocumentShell,
})

function DocumentShell({ children }: { children: ReactNode }) {
	const { theme } = Route.useRouteContext()

	return (
		<html lang="en" suppressHydrationWarning className={theme ?? undefined}>
			<head>
				<HeadContent />
			</head>
			<body className="flex min-h-dvh min-w-80 flex-col font-sans">
				<ScriptOnce>{createThemeBootstrapScript(theme)}</ScriptOnce>
				<ThemeProvider preference={theme}>{children}</ThemeProvider>
				<Scripts />
			</body>
		</html>
	)
}

function RootComponent() {
	return (
		<>
			<div className="flex-1">
				<Outlet />
			</div>
			<ClientOnly fallback={null}>
				<div className="fixed right-4 bottom-4 z-50">
					<ThemeSwitch />
				</div>
			</ClientOnly>
		</>
	)
}
