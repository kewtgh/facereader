# frozen_string_literal: true

require "json"

# Read after Jekyll loads _data so every template uses the package version.
Jekyll::Hooks.register :site, :post_read do |site|
  package = JSON.parse(File.read(File.join(site.source, "package.json")))
  site.data.fetch("theme")["version"] = package.fetch("version")
end
