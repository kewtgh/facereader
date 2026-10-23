#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"
FACEREADER_NODE_VERSION="$(tr -d '\r\n' < .node-version)"
FACEREADER_RUBY_VERSION="$(tr -d '\r\n' < .ruby-version)"

if ! command -v mise >/dev/null 2>&1; then
  echo "mise is missing; run scripts/vercel-install.sh before build." >&2
  exit 1
fi

mise exec "ruby@${FACEREADER_RUBY_VERSION}" -- ruby -v
mise exec "node@${FACEREADER_NODE_VERSION}" -- node -v
LANG=C.UTF-8 LC_ALL=C.UTF-8 BUNDLE_FROZEN=true JEKYLL_ENV=production \
  mise exec "ruby@${FACEREADER_RUBY_VERSION}" "node@${FACEREADER_NODE_VERSION}" -- npm run site:build
