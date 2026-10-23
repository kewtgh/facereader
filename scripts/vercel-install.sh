#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.local/bin:$PATH"
FACEREADER_NODE_VERSION="$(tr -d '\r\n' < .node-version)"
FACEREADER_RUBY_VERSION="$(tr -d '\r\n' < .ruby-version)"
FACEREADER_NPM_VERSION="$(tr -d '\r\n' < .npm-version)"
FACEREADER_BUNDLER_VERSION="$(tr -d '\r\n' < .bundler-version)"

if ! command -v mise >/dev/null 2>&1; then
  curl -fsSL https://mise.run | sh
fi

mise settings set ruby.compile false
mise install "ruby@${FACEREADER_RUBY_VERSION}"
mise install "node@${FACEREADER_NODE_VERSION}"
mise exec "ruby@${FACEREADER_RUBY_VERSION}" -- ruby -v
mise exec "node@${FACEREADER_NODE_VERSION}" -- node -v
mise exec "ruby@${FACEREADER_RUBY_VERSION}" -- gem update --system 4.0.23 --no-document
mise exec "ruby@${FACEREADER_RUBY_VERSION}" -- gem install bundler -v "${FACEREADER_BUNDLER_VERSION}" --no-document

mise exec "node@${FACEREADER_NODE_VERSION}" -- npm install --global "npm@${FACEREADER_NPM_VERSION}"
mise exec "node@${FACEREADER_NODE_VERSION}" -- npm ci
mise exec "ruby@${FACEREADER_RUBY_VERSION}" -- bundle "_${FACEREADER_BUNDLER_VERSION}_" install
