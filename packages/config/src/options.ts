function isPlainObject<T>(value: T): value is T & object {
	return (
		value !== null &&
		value instanceof Object &&
		Object.getPrototypeOf(value) === Object.prototype
	)
}

/** Deep merges toolkit options. Arrays and other values replace. */
export function mergeOptions<T extends object>(
	defaults: T,
	override: T | undefined,
): T {
	if (override === undefined) return defaults

	const merged = { ...defaults, ...override }

	for (const key in override) {
		const preset = defaults[key]
		const value = override[key]

		if (isPlainObject(preset) && isPlainObject(value)) {
			merged[key] = mergeOptions(preset, value)
		}
	}

	return merged
}
