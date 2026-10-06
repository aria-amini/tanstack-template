# TanStack Start Template

Copier template for TanStack Start apps: Better Auth with optional Google
OAuth, Sentry, PostHog, Drizzle, Playwright, and Pitchfork-aware dev servers.

Scaffold:

```bash
copier copy https://github.com/aria-amini/tanstack-template <dir>
```

Update an existing app:

```bash
cd <dir> && copier update --trust
```

Start a generated app:

```bash
mise run bootstrap
```

Bootstrap installs dependencies, configures the workspace, removes orphaned
Docker resources, migrates the database, and starts the app. Add `--verbose`
for direct command output. Task code lives under `mise-tasks/`.
