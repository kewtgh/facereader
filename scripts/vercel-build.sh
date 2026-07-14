#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"

if ! command -v mise >/dev/null 2>&1; then
  echo "mise is missing; run scripts/vercel-install.sh before build." >&2
  exit 1
fi

mise exec ruby@4.0 -- ruby -v
mise exec node@24.18.0 -- node -v
LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FROZEN=true JEKYLL_ENV=production \
  mise exec ruby@4.0 node@24.18.0 -- npm run site:build
