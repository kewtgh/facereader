# frozen_string_literal: true

require "kramdown"
require "kramdown-parser-gfm"
require "nokogiri"
require "minitest/autorun"
require_relative "footnote_audit"

class FootnotesTest < Minitest::Test
  def render(markdown)
    Nokogiri::HTML.fragment(Kramdown::Document.new(markdown, input: "GFM").to_html)
  end

  def test_rejected_names_and_missing_definitions_are_reported
    document = render("正文。[^口径] 缺失。[^missing]\n\n[^口径]: 中文内容。\n")
    assert_equal ["[^口径]", "[^missing]"], FaceReader::FootnoteAudit.unrendered_markers(document)
  end

  def test_valid_footnotes_and_code_examples_are_not_reported
    document = render("正文。[^method]\n\n`[^example]`\n\n```md\n[^示例]: 示例\n```\n\n[^method]: 中文注释。\n")
    assert_empty FaceReader::FootnoteAudit.unrendered_markers(document)
    assert_equal 1, document.css("a.footnote").size
    assert_includes document.at_css(".footnotes li p").text, "中文注释。"
  end

  def test_both_japan_articles_render_all_sixteen_notes_and_return_links
    %w[2026-10-26-Society-lcer-japan.md 2026-10-26-Society-lcer-japan-en.md].each do |name|
      source = File.read(File.expand_path("../docs/_posts/#{name}", __dir__), encoding: "UTF-8")
      content = source.sub(/\A---\r?\n.*?\r?\n---\r?\n/m, "")
      document = render(content)
      assert_empty FaceReader::FootnoteAudit.unrendered_markers(document), name
      references = document.css("a.footnote")
      notes = document.css(".footnotes > ol > li")
      assert_equal 16, references.size, name
      assert_equal 16, notes.size, name
      references.each do |reference|
        note = notes.find { |item| "##{item['id']}" == reference["href"] }
        refute_nil note, "#{name}: #{reference['href']}"
        return_link = note.at_css("a.reversefootnote")
        refute_nil return_link, name
        assert_equal "##{reference.parent['id']}", return_link["href"], name
      end
    end
  end
end
