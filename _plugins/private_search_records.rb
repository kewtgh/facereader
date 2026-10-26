# frozen_string_literal: true

require "json"
require "fileutils"
require_relative "content_catalog"

# Synchronization input is a build artifact, never a page or published asset.
Jekyll::Hooks.register :site, :post_write do |site|
  converter = site.find_converter_instance(Jekyll::Converters::Markdown)
  origin = site.config.fetch("url").delete_suffix("/")
  baseurl = site.config.fetch("baseurl", "")
  records = Array(site.data["visible_posts"]).reject { |post| post.data["search"] == false }.map do |post|
    canonical = "#{origin}#{baseurl}#{post.url}"
    teaser = (post.data["header"] || {})["teaser"] || site.config["teaser"]
    teaser = "#{origin}#{baseurl}#{teaser}" if teaser.to_s.start_with?("/")
    categories = Array(post.data["categories"])
    tags = Array(post.data["tags"])
    { "objectID" => canonical, "path" => post.relative_path, "type" => "post",
      "title" => FaceReader::ContentPolicy.plain_text(post.data["title"], converter),
      "description" => post.data["catalog_excerpt"],
      "content" => FaceReader::ContentPolicy.plain_text(post.content, converter),
      "url" => canonical, "date" => post.date.iso8601, "date_ts" => post.date.to_i,
      "year" => post.date.year, "categories" => categories, "tags" => tags,
      "category_text" => categories.join(" "), "tag_text" => tags.join(" "),
      "language" => post.data["article_language"], "teaser" => teaser }
  end
  directory = File.join(site.source, "tmp", "build")
  FileUtils.mkdir_p(directory)
  File.write(File.join(directory, "algolia-records.json"), JSON.generate(records))
end
