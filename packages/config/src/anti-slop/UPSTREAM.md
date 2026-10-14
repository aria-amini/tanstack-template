# Upstream

- Source: https://github.com/dmmulroy/anti-slop
- Commit: c44ef22ca116d0ba62a3ff663a0bd13a3f3fa40b (main, 2026-09)
- Installed: entire `src/` tree copied to `packages/config/src/anti-slop/`, including
  `vendor/eslint-stylistic/` with its LICENSE and provenance.
- Dependency: rule sources import `vite-plus/lint/plugins`, so the plugin API
  always matches the Oxlint version that vite-plus bundles. Upstream imports
  `@oxlint/plugins` directly.
- Deviations: none to rule source. Effect plugin is vendored but not
  registered; this repository does not depend on Effect. Assertion rules
  overlap with the pre-existing `typescript/consistent-type-assertions:
  never` policy; both are kept. `no-module-mocking` is vendored but
  intentionally not enabled; the team rejected the dependency-seam policy
  for now and may revisit it.
- Local adaptations: `shared/dictionary-types.ts` rewritten to satisfy this
  repository's `noUncheckedIndexedAccess`/`exactOptionalPropertyTypes`
  compiler options (semantics unchanged). Vendored `*.test.ts` files are
  excluded from `tsconfig.json`; they import `vite-plus/lint/plugins-dev`
  in place of upstream `oxlint/plugins-dev`.
- Tests: Vitest runs the `RuleTester` suites through
  `rule-tester.setup.ts`. `require-readable-spacing-cli.test.ts` is a
  standalone Node script that needs the `oxlint` binary, so Vitest excludes
  it.
