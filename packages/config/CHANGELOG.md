# @aamini/config

## 0.2.0

### Minor Changes

- d239eb2: Add `@aamini/config/tanstack`. Its `defineToolkit()` returns the complete
  TanStack Start config, with the framework plugins in a fixed order.
- 250407b: Add the test entries: `/vitest` project builders, `/vitest/browser` screenshot
  helpers, `/vitest/react` `renderPage()`, `/vitest/server` and `/vitest/db`
  fixtures, and `/playwright`. The TanStack `defineToolkit()` adds the `unit`,
  `server`, and `browser` projects.

## 0.1.0

### Minor Changes

- 2b0777e: Rebuild `@aamini/config` for Vite+ 1.x. The `/vite-plus` entry exports `fmt`,
  `lint(framework)`, and `mergeToolkitConfig()`. The `/anti-slop` entry is the
  Oxlint plugin. The `/tsconfig/base.json`, `react.json`, and `astro.json` files
  hold the strict compiler options.
