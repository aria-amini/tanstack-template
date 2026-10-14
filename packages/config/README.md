# @aamini/config

Shared Vite+ config for aria-amini apps: framework plugins, format, lint, and
TypeScript.

```bash
pnpm add -D @aamini/config vite-plus oxlint-plugin-eslint
```

## Entry points

| Subpath                | Exports                                                |
| ---------------------- | ------------------------------------------------------ |
| `/tanstack`            | `defineToolkit()`: the complete TanStack Start config  |
| `/vite-plus`           | `fmt`, `lint(framework)`, `mergeToolkitConfig()`       |
| `/vitest`              | `unitProject()`, `serverProject()`, `browserProject()` |
| `/vitest/browser`      | `expectScreenshot()`, `waitForPageIdle()`              |
| `/vitest/react`        | `renderPage()`                                         |
| `/vitest/server`       | `createServerTest()`: MSW server fixture               |
| `/vitest/db`           | `createDbTest()`: Postgres testcontainer and Drizzle   |
| `/playwright`          | `playwrightConfig()`                                   |
| `/anti-slop`           | Oxlint JS plugin. `lint()` registers it.               |
| `/tsconfig/base.json`  | Strict compiler options                                |
| `/tsconfig/react.json` | Base plus React JSX, DOM, and Vite client types        |
| `/tsconfig/astro.json` | Base plus Astro client types                           |

## TanStack Start

```ts
import { defineToolkit } from '@aamini/config/tanstack'

export default defineToolkit({
	root: import.meta.dirname,
	plugins: { devtools: false, nitro: { preset: 'node-server' } },
	config: { server: { port: 4000 } },
})
```

The toolkit owns the framework plugins and their order: `tanstackStart`,
`devtools`, `nitro`, `tailwindcss`, `react`, `reactCompiler`, and `varlock`.
`devtools` and `nitro` do not run under Vitest. Set a key to `false` to remove
that plugin. Set an object to merge options over the toolkit options. App
plugins go in `config.plugins` and run after the toolkit plugins.

The app installs each plugin package that it uses. If an enabled plugin's
package is missing, `defineToolkit()` throws an error with the `pnpm add -D`
command. Set `shadcn: false` to remove the `@shadcn/lint` rules.

### Tests

`defineToolkit()` adds three Vitest projects: `unit`, `server`, and `browser`.
Set `tests.<project>` to `false` to remove a project. Set an object to merge
`test` options over the toolkit options. Arrays replace the toolkit values.

```ts
export default defineToolkit({
	root: import.meta.dirname,
	tests: {
		server: { include: ['src/**/*.test.ts'] },
		browser: { setupFiles: ['./src/app.css'] },
	},
})
```

The `browser` project runs Chromium in two instances: `desktop` (1280×720) and
`mobile` (375×812). Visual tests compare at zero tolerance. Mobile baselines get
a `-mobile` suffix.

```tsx
import { renderPage } from '@aamini/config/vitest/react'

test('home', async () => {
	const page = await renderPage(HomePage, { path: '/', wrapper: AppProviders })

	await page.expectScreenshot('home')
	await page.expectScreenshot('home-full', { fullHeight: true })
})
```

Playwright runs smoke tests only, against any `BASE_URL`:

```ts
import { playwrightConfig } from '@aamini/config/playwright'

export default playwrightConfig({ testDir: './e2e' })
```

## Building blocks

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
