export interface Peer {
	/** The npm package that the app installs. */
	name: string
	/** The module that the entry imports from the package. */
	specifier: string
}

/** Resolves from this package, so pnpm sees each declared peer. */
export function canResolve(specifier: string) {
	try {
		import.meta.resolve(specifier)

		return true
	} catch {
		return false
	}
}

function missingPeer(entry: string, peer: Peer, cause?: Error) {
	return new Error(
		`${entry} needs ${peer.name}. Install it with: pnpm add -D ${peer.name}`,
		{ cause },
	)
}

/**
 * Imports a peer module. If the app did not install the peer, the error names
 * the package and the command that installs it.
 */
export async function importPeer<T>(
	entry: string,
	peer: Peer,
	load: () => Promise<T>,
): Promise<T> {
	try {
		return await load()
	} catch (error) {
		if (error instanceof Error && !canResolve(peer.specifier)) {
			throw missingPeer(entry, peer, error)
		}

		throw error
	}
}

/** Checks a peer that another tool loads, for example a Babel or Oxlint plugin. */
export function requirePeer(entry: string, peer: Peer) {
	if (!canResolve(peer.specifier)) throw missingPeer(entry, peer)
}
