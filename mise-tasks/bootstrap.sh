#!/usr/bin/env bash
#MISE description="Bootstrap a fresh clone"

set -euo pipefail

# Headless bootstrap has no keyring/TPM; skip varlock's native encryption
# helper, which otherwise prints backend probes on every run.
export _VARLOCK_FORCE_FILE_ENCRYPTION_FALLBACK=1

cd "$(dirname "$0")/.."

if ! command -v gum &> /dev/null; then
	echo "gum is required (installed by the dotfiles install script)" >&2
	exit 1
fi

verbose=false
if [[ "${1:-}" == "--verbose" ]]; then
	verbose=true
elif [[ -n "${1:-}" ]]; then
	gum style --foreground 196 "Usage: mise run bootstrap [--verbose]" >&2
	exit 2
fi

app_name="$(basename "$(pwd)")"

gum style \
	--border double --border-foreground 212 --padding "1 3" --margin "1 0" \
	--align center --width 44 \
	"$(gum style --bold --foreground 212 "$app_name")" \
	"workspace bootstrap"

section_total=4
section_current=0
current_section="bootstrap"
trap 'gum style --foreground 196 --bold "✗ Failed during: $current_section (exit $?)" >&2' ERR
section() {
	section_current=$((section_current + 1))
	current_section="$1"
	gum style --margin "1 0 0 0" --bold --foreground 99 "▸ [$section_current/$section_total] $1"
}
task() {
	gum style --bold --foreground 245 "  $1"
}
complete_task() {
	gum style --foreground 82 "  ✓ $1"
}
run_task() {
	local title="$1"
	shift
	if [[ "$verbose" == true ]]; then
		task "$title"
		"$@"
	else
		gum spin --show-error --title "  $title..." -- "$@"
	fi
	complete_task "$title"
}
verify_app() {
	local url="$1"
	local attempts=30
	for ((i = 1; i <= attempts; i++)); do
		if curl -skf -o /dev/null "$url"; then
			return 0
		fi
		sleep 1
	done
	gum style --foreground 196 "App did not answer at $url after ${attempts}s" >&2
	return 1
}

# Dependencies
section "Dependencies"
run_task "Install tools (mise i)" mise install
run_task "Install packages (vp i)" vp i

# Workspace
section "Workspace"
run_task "Generating ports and proxy URL" mise run setup

# Services
section "Services"
run_task "Cleaning up orphaned stacks" mise run gc
run_task "Loading environment" vp exec varlock load
run_task "Starting Docker services" vp run compose:up
run_task "Applying database migrations" vp run db:migrate

# Finish
section "Finish"
base_url="$(sed -n 's/^BASE_URL="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' .env.workspace.local 2>/dev/null)"
base_url="${base_url:-$(sed -n 's/^BASE_URL="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' .env.development.local 2>/dev/null)}"

# Headless workspaces (herdr panes, CI) never trigger pitchfork's cd hook,
# so the daemon must be started explicitly.
if [[ -f pitchfork.toml ]] && command -v pitchfork &> /dev/null; then
	run_task "Starting dev daemon" pitchfork start dev
fi

# Bootstrap only succeeds when the URL a human will open actually answers.
# Called directly: gum spin can only exec external commands, not functions.
if [[ -n "$base_url" ]]; then
	task "Verify app responds"
	verify_app "$base_url"
	complete_task "Verify app responds"
fi

finish_args=(
	--border rounded --border-foreground 82 --padding "0 3" --margin "1 0"
	"$(gum style --bold --foreground 82 '✓ Bootstrap complete')"
)
[[ -n "$base_url" ]] && finish_args+=("$(gum style --foreground 39 "$base_url")")
gum style "${finish_args[@]}"
