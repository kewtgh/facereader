# frozen_string_literal: true

require "jekyll"
require "minitest/autorun"
require_relative "../_plugins/series_index"

class SeriesIndexTest < Minitest::Test
  Post = Struct.new(:path, :url, :date, :data)
  Site = Struct.new(:data, :posts, :config, :time)

  def post(order, **options)
    metadata = { "series" => "sample", "series_order" => order, "locale" => "zh-CN", "title" => "Article #{order}" }.merge(options.transform_keys(&:to_s))
    Post.new("article-#{order}", "/article-#{order}/", Time.utc(2020), metadata)
  end

  def build(posts, future: false)
    site = Site.new({ "series" => { "sample" => {} } }, Struct.new(:docs).new(posts), { "locale" => "zh-CN", "future" => future }, Time.utc(2026))
    Jekyll::Hooks.trigger(:site, :post_read, site)
    site
  end

  def test_visible_order_language_and_neighbors_across_gaps
    first = post(10)
    last = post(30, series_label: "Short title")
    english = post(10, locale: "en")
    hidden = post(20, hidden: true)
    unpublished = post(40, published: false)
    future = post(50)
    future.date = Time.utc(2030)
    site = build([last, hidden, english, future, unpublished, first])
    assert_equal [first, last], site.data["series_index"]["sample"]["zh"]
    assert_equal [english], site.data["series_index"]["sample"]["en"]
    assert_equal({ "url" => last.url, "title" => "Short title" }, first.data["series_next"])
    assert_equal first.url, last.data["series_previous"]["url"]
    refute first.data.key?("series_previous")
    refute last.data.key?("series_next")
    assert_equal [future], build([future], future: true).data["series_index"]["sample"]["zh"]
  end

  def test_invalid_membership_and_duplicate_positions_fail_build
    [post(0), post("1"), post(1, series: "missing"), post(1, locale: "fr")].each do |invalid|
      assert_raises(Jekyll::Errors::FatalException) { build([invalid]) }
    end
    assert_raises(Jekyll::Errors::FatalException) { build([post(1), post(1)]) }
  end
end
