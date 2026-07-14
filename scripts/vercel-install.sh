#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"

if ! command -v mise >/dev/null 2>&1; then
  curl -fsSL https://mise.run | sh
fi

mise settings set ruby.compile false
mise install ruby@4.0
mise install node@24.18.0
mise exec ruby@4.0 -- ruby -v
mise exec node@24.18.0 -- node -v
mise exec ruby@4.0 -- gem install bundler -v 4.0.16

mise exec node@24.18.0 -- npm ci
mise exec ruby@4.0 -- bundle _4.0.16_ install
