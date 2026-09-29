# TanStack application template

This is a full-stack TanStack Start application using React 19, Vite+, Drizzle,
Postgres, Better Auth, Tailwind v4, shadcn, and Varlock. Local services are
provided by Docker Compose (Postgres and MinIO). The dev server runs as a
pitchfork daemon (see `pitchfork.toml`) that auto-starts/stops when entering or
leaving the directory; each jj workspace gets unique ports via
`mise-tasks/setup` (run by `mise run bootstrap`; re-run anytime with
`mise run setup`).

## Local URLs

Caddy terminates TLS on the Tailscale IP at port 443 with publicly trusted
wildcard certificates, then proxies to the Pitchfork proxy on loopback
port 9443. App URLs are portless: `https://<slug>.lvh.ariaamini.com`, aliased as
`https://<slug>.dev.ariaamini.com`. Hostnames are single-level. Slugs flatten
the root directory name (`app.worktree` serves as `app-worktree`). Nested
hostnames (`worktree.app.lvh…`) and direct `:9443` access do not work: the
wildcard certificate covers one level, and the proxy binds loopback only.
`mise run setup` registers the app slug and writes `BASE_URL`. Register a
worktree slug by hand:
`pitchfork proxy add <slug> --daemon dev --dir <workspace-root>`.

The Caddy TLS edge is the global pitchfork daemon `tls`, registered in
`~/.config/pitchfork/config.toml` with `boot_start`; it reads `CF_API_TOKEN`
through varlock (`~/.config/caddy-lab/`). Never run `pitchfork proxy setup`
here — it would grab port 443 from Caddy. After bootstrap, `mise run doctor`
verifies the whole chain: proxy edge, env graph, app response.

## Commands

- `vp dev` — start development (usually managed by pitchfork instead)
- `pitchfork list` / `pitchfork logs dev` / `pitchfork tui` — inspect the dev
  daemon
- `vp check` — format, lint, and type-check
- `vp test run` — run Vitest projects
- `vp run test:ui` — Vitest UI for the browser project. Binds `TAILSCALE_IP`
  when set; otherwise auto-detects the tailnet IP, else loopback. Set your own
  `TAILSCALE_IP` to override. The UI trusts the tailnet: clients can write
  snapshots and baselines but cannot execute commands (`allowWrite` on,
  `allowExec` off).
- `vp run e2e` — run Playwright smoke tests against the workspace proxy
- `vp run compose:up` — start local services
- `vp run db:push` — apply the current schema
- `vp run db:migrate` — run migrations
- `vp run dead-code` — find unused exports with fallow

Use `pnpm` through Vite+ (`vp i`, `vp run <script>`). Secrets and environment
values resolve through Varlock; do not commit generated or local secret files.

## Style rules

### Always build `className` with `cn()`

Compose conditional or combined classes with `cn()` from `cn`. Never interpolate
classes with template literals or string concatenation — an oxlint
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
