# frozen_string_literal: true

require "jekyll"
require "minitest/autorun"
require_relative "../_plugins/content_catalog"

class ContentCatalogTest < Minitest::Test
  Policy = FaceReader::ContentPolicy
  Post = Struct.new(:data, :date, :url)
  Site = Struct.new(:config, :time)

  def test_visibility_and_language_have_one_policy
    site = Site.new({ "future" => false }, Time.utc(2026, 10, 24))
    post = Post.new({}, Time.utc(2026, 10, 23), "/article/")
    assert Policy.visible?(post, site)
    ["hidden", "published"].each do |key|
      post.data = { key => key == "hidden" }
      refute Policy.visible?(post, site)
    end
    post.data = {}
    post.date = site.time + 1
    refute Policy.visible?(post, site)
    site.config["future"] = true
    assert Policy.visible?(post, site)
    assert_equal "en", Policy.language("EN_gb")
    assert_equal "zh", Policy.language(nil, "zh-CN")
  end

  def test_reading_time_counts_words_and_chinese_with_configurable_rates
    assert_equal 1, Policy.reading_minutes("", {})
    assert_equal 1, Policy.reading_minutes("中" * 300, {})
    assert_equal 2, Policy.reading_minutes("中" * 301, {})
    assert_equal 1, Policy.reading_minutes("word " * 200, {})
    assert_equal 2, Policy.reading_minutes("word " * 201, {})
    assert_equal 2, Policy.reading_minutes("中" * 300 + "word " * 200, {})
    assert_equal 2, Policy.reading_minutes("word " * 300, { "words_per_minute" => 350 }, { "words_per_minute" => 150 })
    assert_equal 2, Policy.reading_minutes("中" * 301, { "chinese_words_per_minute" => 0 })
    assert_equal 1, Policy.reading_minutes("doesn't co-operate well", { "words_per_minute" => "invalid" })
  end

  def test_recommendations_exclude_self_translations_and_other_languages_and_rank_relevance
    make = ->(url, data = {}, age = 0) { Post.new(data, Time.utc(2026, 10, 24) - age, url) }
    current = make.call("/current/", { "tags" => %w[one two], "translation_key" => "paired", "categories" => ["society"] })
    translation = make.call("/en/twin/", { "locale" => "en-US", "translation_key" => "paired" })
    duplicate = make.call("/duplicate/", { "translation_key" => "paired" })
    english = make.call("/en/other/", { "locale" => "en_GB", "tags" => %w[one two] })
    strong = make.call("/strong/", { "tags" => %w[one two] }, 20)
    weak = make.call("/weak/", { "tags" => ["one"] }, 10)
    category = make.call("/category/", { "categories" => ["society"] }, 5)
    recent = make.call("/recent/")
    older = make.call("/old/", {}, 100)
    candidates = [current, older, category, duplicate, weak, recent, strong, translation, english]
    assert_equal [strong, weak, category, recent], Policy.related(current, candidates, "zh-CN")
    assert_empty Policy.related(translation, [current, translation], "zh-CN")
  end
end
