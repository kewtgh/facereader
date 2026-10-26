# frozen_string_literal: true

module FaceReader
  module FootnoteAudit
    # Valid footnotes have already become links. Visible Markdown markers mean
    # the parser rejected the name or could not find the matching definition.
    def self.unrendered_markers(article)
      article.xpath(".//text()[not(ancestor::code or ancestor::pre or ancestor::script or ancestor::style)]")
             .flat_map { |node| node.text.scan(/\[\^[^\]\n]+\]/) }.uniq
    end
  end
end
