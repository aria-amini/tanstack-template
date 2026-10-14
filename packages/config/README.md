# @aamini/config

Shared Vite+ format, lint, and TypeScript config for aria-amini apps.

```bash
pnpm add -D @aamini/config vite-plus oxlint-plugin-eslint
```

## Entry points

| Subpath                | Exports                                          |
| ---------------------- | ------------------------------------------------ |
| `/vite-plus`           | `fmt`, `lint(framework)`, `mergeToolkitConfig()` |
| `/anti-slop`           | Oxlint JS plugin. `lint()` registers it.         |
| `/tsconfig/base.json`  | Strict compiler options                          |
| `/tsconfig/react.json` | Base plus React JSX, DOM, and Vite client types  |
| `/tsconfig/astro.json` | Base plus Astro client types                     |

## Usage

```ts
import { fmt, lint, mergeToolkitConfig } from '@aamini/config/vite-plus'
import { defineConfig } from 'vite-plus'

export default defineConfig(
	mergeToolkitConfig(
		{ fmt, lint: lint('react') },
		{
			fmt: {
				ignorePatterns: (preset) => [...preset, 'src/generated/**'],
			},
			lint: { rules: { 'no-console': 'off' } },
		},
	),
)
```

```json
{
	"extends": "@aamini/config/tsconfig/react.json",
	"include": ["**/*.ts", "**/*.tsx"]
}
```

## Merge rules

`mergeToolkitConfig(preset, config)` merges the app config over the preset.

- A function value replaces the preset value at the same path. It receives the
  preset value. This applies only where the preset sets a non-function value.
- A lint rule entry replaces the preset entry.
- Other values go to `mergeConfig` from Vite+. Objects merge deep, arrays
  append, and scalars replace.
