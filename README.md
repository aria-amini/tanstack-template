# Toolkit

Shared app tooling for aria-amini projects: the Copier app templates and the
`@aamini/config` package.

## Templates

| Template   | Contents                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------- |
| `tanstack` | TanStack Start, Better Auth with optional Google OAuth, Sentry, PostHog, Drizzle, Pitchfork |
| `astro`    | Astro, Tailwind CSS, static or Node hosting, optional React islands, Varlock, Pitchfork     |

Scaffold an app:

```bash
copier copy --trust https://github.com/aria-amini/toolkit <dir>
```

Update an existing app:

```bash
cd <dir> && copier update --trust
```

An app made before the monorepo has no `template` answer. On the first update,
Copier asks for it. Answer `tanstack`.

Start a generated app:

```bash
mise run bootstrap
```

Bootstrap installs dependencies, configures the workspace, removes orphaned
Docker resources, migrates the database, and starts the app. Add `--verbose` for
direct command output. Task code lives under `mise-tasks/`.

Scaffold an Astro site:

```sh
copier copy --trust -d template=astro -d app_name=my-site \
  -d site_url=https://example.com https://github.com/aria-amini/toolkit my-site
```

Select `astro_output=node` for server routes. Select `react=true` for React
islands. The Astro template derives its format, markup lint, and layout setup
from `~/apps/pc-tune-ups`. It uses `vp run check` and `vp run build`.
