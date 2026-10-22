# frozen_string_literal: true

require "jekyll"
require "minitest/autorun"
require "tmpdir"
require "fileutils"
require_relative "../_plugins/language_archives"

class LanguageArchivesTest < Minitest::Test
  Post = Struct.new(:data)

  def with_site(posts)
    Dir.mktmpdir("facereader-language-archives") do |source|
      FileUtils.mkdir_p(File.join(source, "posts"))
      File.write(File.join(source, "posts/index.html"), "---\nlayout: home\n---\n")
      site = Jekyll::Site.new(Jekyll.configuration(
        "source" => source, "destination" => File.join(source, "_site"),
        "locale" => "zh-CN", "archive_pagination" => { "per_page" => 2, "path" => "/posts/page/:num/" }
      ))
      site.pages << Jekyll::Page.new(site, source, "posts", "index.html")
      site.posts.docs.replace(posts.map { |data| Post.new(data) })
      FaceReader::LanguageArchives.new.generate(site)
      yield site
    end
  end

  def test_filtering_precedes_pagination_and_preserves_order
    posts = [
      { "title" => "old Chinese" },
      { "title" => "English 1", "locale" => "en-US" },
      { "title" => "Chinese 2", "locale" => "zh-CN" },
      { "title" => "English 2", "locale" => "en_GB" },
      { "title" => "Chinese 3", "locale" => "zh-TW" },
      { "title" => "hidden", "locale" => "en-US", "hidden" => true },
      { "title" => "unsupported", "locale" => "fr-FR" }
    ]
    with_site(posts) do |site|
      assert_equal ["/posts/", "/posts/page/2/"], site.pages.map(&:url)
      first, second = site.pages.map { |page| page.data.fetch("language_archives") }
      assert_equal ["Chinese 3", "Chinese 2"], first[0]["paginator"]["posts"].map { |post| post.data["title"] }
      assert_equal ["English 2", "English 1"], first[1]["paginator"]["posts"].map { |post| post.data["title"] }
      assert_equal [3, 2], first.map { |archive| archive["paginator"]["total_posts"] }
      assert_equal [2, 1], first.map { |archive| archive["paginator"]["total_pages"] }
      assert_equal ["old Chinese"], second[0]["paginator"]["posts"].map { |post| post.data["title"] }
      assert_nil second[0]["reset_path"]
      assert_equal "/posts/", second[1]["reset_path"]
      assert_equal 1, second[1]["paginator"]["page"]
      assert_nil first[1]["paginator"]["next_page"]
      assert_equal 1, second[0]["paginator"]["previous_page"]
      assert_nil second[0]["paginator"]["next_page"]
      assert_equal 2, site.pages.last.pager.to_liquid["page"]
    end
  end

  def test_empty_language_and_empty_site_keep_a_first_page
    [[], [{ "title" => "Chinese only" }]].each do |posts|
      with_site(posts) do |site|
        assert_equal 1, site.pages.size
        english = site.pages.first.data["language_archives"][1]["paginator"]
        assert_empty english["posts"]
        assert_equal 1, english["total_pages"]
        assert_nil english["next_page"]
      end
    end
  end
end
