import { mergeConfig, type UserConfig } from 'vite-plus'

// Any function type is assignable to this signature, whatever it returns.
type AnyFunction = (...args: never[]) => void

type Replacer<T> = (preset: T) => T

type OverrideValue<T> = T extends AnyFunction
	? T
	: T extends readonly unknown[]
		? T
		: T extends object
			? { [K in keyof T]?: ConfigOverride<T[K]> }
			: T

/**
 * A partial override of `T`. Any value that the preset sets can also be a
 * function that receives the preset value and returns its replacement.
 */
export type ConfigOverride<T> = [NonNullable<T>] extends [AnyFunction]
	? T
	: OverrideValue<NonNullable<T>> | Replacer<NonNullable<T>>

/** App-owned Vite+ config. The toolkit merges it over the preset. */
export type ToolkitConfig = OverrideValue<UserConfig>

type ConfigNode = { [key: string]: ConfigValue }

type ConfigValue =
	| ConfigNode
	| readonly ConfigValue[]
	| string
	| number
	| boolean
	| bigint
	| symbol
	| null
	| undefined
	| ((...args: never[]) => ConfigValue)

function isConfigNode(
	value: ConfigValue | UserConfig | ToolkitConfig | Replacer<UserConfig>,
): value is ConfigNode {
	if (value === null || Array.isArray(value)) return false

	return Object.getPrototypeOf(value) === Object.prototype
}

function isReplacer(
	value: ConfigValue,
): value is (preset: ConfigValue) => ConfigValue {
	return value instanceof Function
}

/**
 * Applies the replacer functions in `override` to `preset`. Returns the
 * updated preset and the override without the applied replacers.
 *
 * A function counts as a replacer only when the preset holds a non-function
 * value at the same path. Other functions, for example a new browser command
 * or a replacement for a preset command, stay plain values for `mergeConfig`.
 */
function applyReplacers(
	preset: ConfigNode,
	override: ConfigNode,
	path: readonly string[],
): [ConfigNode, ConfigNode] {
	const nextPreset = { ...preset }
	const rest: ConfigNode = {}

	for (const [key, value] of Object.entries(override)) {
		const current = preset[key]

		if (isReplacer(value) && current !== undefined && !isReplacer(current)) {
			nextPreset[key] = value(current)
			continue
		}

		// Oxlint rule entries are tuples such as ['error', options]. Array
		// concatenation from mergeConfig would corrupt them, so they replace.
		if (path.at(-1) === 'rules' && Array.isArray(value)) {
			nextPreset[key] = value
			continue
		}

		if (isConfigNode(value) && current !== undefined && isConfigNode(current)) {
			const [childPreset, childRest] = applyReplacers(current, value, [
				...path,
				key,
			])

			nextPreset[key] = childPreset
			rest[key] = childRest
			continue
		}

		rest[key] = value
	}

	return [nextPreset, rest]
}

/**
 * Merges an app override into a toolkit preset. Replacer functions run
 * first. `mergeConfig` from Vite+ merges the rest: objects merge deep, arrays
 * append, and scalars replace.
 */
export function mergeToolkitConfig(
	preset: UserConfig,
	override: ToolkitConfig | Replacer<UserConfig> = {},
): UserConfig {
	if (override instanceof Function) return override(preset)

	if (!isConfigNode(preset) || !isConfigNode(override)) {
		throw new TypeError('Toolkit config must be a plain object')
	}

	const [nextPreset, rest] = applyReplacers(preset, override, [])

	return mergeConfig(nextPreset, rest)
}
