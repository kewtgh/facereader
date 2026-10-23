# frozen_string_literal: true

require "nokogiri"

module FaceReader
  module ContentPolicy
    module_function

    def language(locale, default = "zh-CN")
      (locale || default).to_s.tr("_", "-").split("-").first.to_s.downcase
    end

    def visible?(post, site)
      !post.data["hidden"] && post.data["published"] != false &&
        (site.config["future"] || !post.respond_to?(:date) || post.date <= site.time)
    end

    def positive_rate(value, fallback)
      rate = Float(value, exception: false)
      rate && rate.finite? && rate.positive? ? rate : fallback
    end

    def reading_minutes(text, config, data = {})
      chinese = text.scan(/\p{Han}/).size
      words = text.gsub(/\p{Han}/, " ").scan(/[\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*/).size
      chinese_rate = positive_rate(data["chinese_words_per_minute"], positive_rate(config["chinese_words_per_minute"], 300))
      word_rate = positive_rate(data["words_per_minute"], positive_rate(config["words_per_minute"], 200))
      [(chinese.to_f / chinese_rate + words.to_f / word_rate).ceil, 1].max
    end

    def related(post, candidates, default_locale)
      language = language(post.data["locale"], default_locale)
      candidates.reject do |candidate|
        candidate == post || language(candidate.data["locale"], default_locale) != language ||
          (post.data["translation_key"] && candidate.data["translation_key"] == post.data["translation_key"])
      end.sort_by do |candidate|
        shared = (Array(post.data["tags"]) & Array(candidate.data["tags"])).size
        same_category = (Array(post.data["categories"]) & Array(candidate.data["categories"])).any?
        relevance = shared >= 2 ? 3 : shared == 1 ? 2 : same_category ? 1 : 0
        [-relevance, -candidate.date.to_f, candidate.url]
      end.first(4)
    end
  end

  class ContentCatalog < Jekyll::Generator
    safe true
    priority :high

    def generate(site)
      converter = site.find_converter_instance(Jekyll::Converters::Markdown)
      plain = lambda do |value|
        fragment = Nokogiri::HTML.fragment(converter.convert(value.to_s.gsub(/\{%.*?%\}|\{\{.*?\}\}/m, "")))
        fragment.css("script, style").remove
        fragment.text.gsub(/\s+/, " ").strip
      end
      posts = site.posts.docs.reverse.select { |post| ContentPolicy.visible?(post, site) }
      by_language = { "zh" => [], "en" => [] }
      posts.each do |post|
        language = ContentPolicy.language(post.data["locale"], site.config["locale"])
        by_language[language]&.push(post)
        post.data["reading_minutes"] = ContentPolicy.reading_minutes(plain.call(post.content), site.config, post.data)
        post.data["article_language"] = language
        post.data["catalog_excerpt"] = plain.call(post.data["excerpt"])[0, 240]
      end
      site.data["posts_by_language"] = by_language
      posts.each { |post| post.data["related_articles"] = ContentPolicy.related(post, posts, site.config["locale"]) }
    end
  end
end
