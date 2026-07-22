# frozen_string_literal: true

# Keep the browser search key out of the repository. The rendered JavaScript
# still contains this search-only key because a static site must send it to the
# browser; the Admin API key must never be injected here.
Jekyll::Hooks.register :site, :after_init do |site|
  search_key = ENV.fetch("ALGOLIA_SEARCH_API_KEY", "").strip
  algolia = site.config["algolia"] ||= {}

  if search_key.empty?
    if Jekyll.env == "production"
      Jekyll.logger.abort_with(
        "Algolia:",
        "ALGOLIA_SEARCH_API_KEY is required for a production build"
      )
    end
    next
  end

  algolia["search_only_api_key"] = search_key
end
