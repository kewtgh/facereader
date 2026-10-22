# frozen_string_literal: true

module FaceReader
  # Keep the existing /posts/page/:num/ URLs, with independent language totals.
  class LanguageArchives < Jekyll::Generator
    safe true
    priority :low

    Pager = Struct.new(:data) do
      def to_liquid
        data
      end
    end

    def generate(site)
      posts = site.posts.docs.reverse.reject { |post| post.data["hidden"] }
      by_language = { "zh" => [], "en" => [] }
      posts.each do |post|
        language = (post.data["locale"] || site.config["locale"]).to_s.tr("_", "-").split("-").first.downcase
        by_language[language]&.push(post)
      end
      site.data["posts_by_language"] = by_language

      template = site.pages.find { |page| page.url == "/posts/" }
      return unless template

      settings = site.config.fetch("archive_pagination")
      per_page = [settings.fetch("per_page").to_i, 1].max
      totals = by_language.transform_values { |items| [(items.size.to_f / per_page).ceil, 1].max }
      (1..totals.values.max).each do |number|
        page = number == 1 ? template : Jekyll::Page.new(site, site.source, template.dir, template.name)
        page.dir = settings.fetch("path").sub(":num", number.to_s) if number > 1
        page.data["language_archives"] = by_language.map do |language, items|
          # A language with fewer pages returns to its first page when selected.
          current = number <= totals[language] ? number : 1
          pagination = {
            "page" => current,
            "per_page" => per_page,
            "posts" => items.slice((current - 1) * per_page, per_page) || [],
            "total_posts" => items.size,
            "total_pages" => totals[language],
            "first_page_path" => template.url,
            "page_path" => settings.fetch("path"),
            "previous_page" => current > 1 ? current - 1 : nil,
            "next_page" => current < totals[language] ? current + 1 : nil
          }
          { "language" => language, "locale" => language == "en" ? "en-US" : "zh-CN",
            "paginator" => pagination, "reset_path" => number == current ? nil : template.url }
        end
        page.pager = Pager.new(page.data["language_archives"].first.fetch("paginator"))
        site.pages << page if number > 1
      end
    end
  end
end
