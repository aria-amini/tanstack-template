export interface Peer {
	/** The npm package that the app installs. */
	name: string
	/** The module that the entry imports from the package. */
	specifier: string
}

/**
 * Throws one error that names every peer package that the entry cannot
 * resolve, with the command that installs them.
 */
export function assertPeers(entry: string, peers: readonly Peer[]) {
	const missing = [
		...new Set(
			peers.flatMap((peer) => (canResolve(peer.specifier) ? [] : [peer.name])),
		),
	]

	if (missing.length === 0) return

	const list = missing.map((name) => `  - ${name}`).join('\n')

	throw new Error(
		`${entry} needs these packages:\n${list}\nInstall them with: pnpm add -D ${missing.join(' ')}`,
	)
}

function canResolve(specifier: string) {
	try {
		import.meta.resolve(specifier)

		return true
	} catch {
		return false
	}
}
