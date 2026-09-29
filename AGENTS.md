# dota-visualizer

Full-stack TanStack Start app: React 19, Vite+, Drizzle, Postgres, Better
Auth, Tailwind v4, shadcn, Varlock. Docker Compose runs Postgres and MinIO.

The dev server is a pitchfork daemon (`pitchfork.toml`). `mise run bootstrap`
starts it and verifies the app URL. Interactive shells auto-start it on `cd`.
Each jj workspace gets unique ports from `mise-tasks/setup`; re-run anytime
with `mise run setup`.

## Local URLs

Caddy terminates TLS on the Tailscale IP at 443 and proxies to the pitchfork
proxy on loopback 9443. URLs are portless: `https://<slug>.lvh.ariaamini.com`
(`.dev.` aliases `.lvh.`). Worktree slugs flatten to `<app>-<worktree>`, for
example `dota-visualizer-my-task`. Nested hostnames (`worktree.app.lvh…`) and
direct `:9443` access do not work: the wildcard cert covers one level, and the
proxy binds loopback only.

`mise run setup` registers the workspace slug and writes `BASE_URL`.
Never run `pitchfork proxy setup` here — it would grab port 443 from the
global Caddy TLS edge.

## Commands

- `pitchfork list` / `pitchfork logs dev` / `pitchfork tui` — inspect the dev daemon
- `vp check` — format, lint, and type-check
- `vp test run` — run Vitest projects
- `vp run test:ui` — Vitest UI in the browser. Clients can write snapshots and
  baselines, but cannot execute commands (`allowWrite` on, `allowExec` off).
- `vp run e2e` — run Playwright smoke tests against the workspace proxy
- `vp run compose:up` — start local services
- `vp run db:push` — apply the current schema
- `vp run db:migrate` — run migrations
- `vp run dead-code` — find unused exports with fallow

Use `pnpm` through Vite+ (`vp i`, `vp run <script>`). Secrets resolve through
Varlock; never commit generated or local secret files.

## Style rules

### Always build `className` with `cn()`

Compose conditional or combined classes with `cn()`. Never interpolate classes
with template literals or string concatenation — an oxlint
`no-restricted-syntax` rule rejects template literals in `className`.

Bad:

```tsx
const className = `flex border-2 ${active ? 'bg-kitchen-yolk' : 'bg-card'} ${
	disabled ? 'opacity-35' : ''
}`
return <Link className={`${className} focus-visible:outline-2`} />
```

Good:

```tsx
const className = cn(
	'flex border-2',
	active ? 'bg-kitchen-yolk' : 'bg-card',
	disabled && 'opacity-35',
)
return <Link className={cn(className, 'focus-visible:outline-2')} />
```
