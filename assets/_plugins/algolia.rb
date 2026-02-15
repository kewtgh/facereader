# _plugins/algolia.rb
# frozen_string_literal: true

module Jekyll
  module Algolia
    module Hooks
      # record: Hash (将要推送到 Algolia 的对象)
      # node:  Nokogiri::XML::Node (被抽取的 HTML 节点)
      # context: Hash (包含 page/site 等上下文，键可能是 symbol 或 string)
      def self.before_indexing_each(record, node, context)
        # 兼容 symbol/string key
        page = context[:page] || context["page"] || {}
        site = context[:site] || context["site"] || {}

        # 1) 规范化 URL（去掉 #fragment，避免出现“丑链接”）
        url_key = record.key?("url") ? "url" : (record.key?(:url) ? :url : "url")
        if record[url_key].is_a?(String)
          record[url_key] = record[url_key].split("#").first
        end

        # 2) 提取 header.teaser
        header = page["header"] || page[:header] || {}
        teaser = header["teaser"] || header[:teaser]

        if teaser && !teaser.to_s.strip.empty?
          teaser_str = teaser.to_s

          # 3) 转成 absolute url（与你现在 records.json 的 absolute_url 逻辑一致）
          #    site 里通常有 url/baseurl；有些场景只能拿到 config
          site_url = site["url"] || site[:url] || ""
          baseurl  = site["baseurl"] || site[:baseurl] || ""
          base     = (site_url.to_s + baseurl.to_s).gsub(%r!/*\z!, "")

          if teaser_str.start_with?("http://", "https://")
            record["teaser"] = teaser_str
          else
            record["teaser"] = "#{base}/#{teaser_str.sub(%r!\A/!, "")}"
          end
        else
          record["teaser"] = ""
        end

        record
      end
    end
  end
end
