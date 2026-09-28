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

# Dependencies
section "Dependencies"
run_task "Installing tools" mise install
run_task "Installing packages" vp i

# Workspace
section "Workspace"
[[ -e .env.local ]] || printf '%s\n' \
	'# Infisical machine-identity client secret.' \
	'# @sensitive' \
	'INFISICAL_CLIENT_SECRET=varlock(prompt)' > .env.local
run_task "Generating ports and proxy URL" mise run setup

# Services
section "Services"
run_task "Cleaning up orphaned stacks" mise run gc
# varlock prompts for the machine secret on fresh clones, so it only runs
# inside a spinner when no prompt is pending
if grep -q 'varlock(prompt)' .env.local 2>/dev/null; then
	task "Loading environment"
	vp exec varlock load
	complete_task "Loading environment"
else
	run_task "Loading environment" vp exec varlock load
fi
run_task "Starting Docker services" vp run compose:up
run_task "Applying database migrations" vp run db:migrate

# Finish
section "Finish"
base_url="$(sed -n 's/^BASE_URL="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' .env.workspace.local 2>/dev/null)"
base_url="${base_url:-$(sed -n 's/^BASE_URL="\{0,1\}\([^"]*\)"\{0,1\}$/\1/p' .env.development.local 2>/dev/null)}"
finish_args=(
	--border rounded --border-foreground 82 --padding "0 3" --margin "1 0"
	"$(gum style --bold --foreground 82 '✓ Bootstrap complete')"
)
[[ -n "$base_url" ]] && finish_args+=("$(gum style --foreground 39 "$base_url")")
gum style "${finish_args[@]}"
