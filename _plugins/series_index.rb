# frozen_string_literal: true

# Every series view shares membership, language filtering and reading order.
Jekyll::Hooks.register :site, :post_read do |site|
  definitions = site.data.fetch("series")
  index = definitions.to_h { |id, _| [id, { "zh" => [], "en" => [] }] }
  orders = {}
  site.posts.docs.each do |post|
    id = post.data["series"]
    next unless id

    order = post.data["series_order"]
    language = (post.data["locale"] || site.config["locale"]).to_s.split("-").first
    unless index.key?(id) && index[id].key?(language) && order.is_a?(Integer) && order.positive?
      raise Jekyll::Errors::FatalException, "Invalid series metadata: #{post.path}"
    end
    key = [id, language, order]
    if orders.key?(key)
      raise Jekyll::Errors::FatalException, "Duplicate series order: #{post.path} and #{orders[key]}"
    end
    orders[key] = post.path
    next if post.data["hidden"] == true || post.data["published"] == false
    next if !site.config["future"] && post.date > site.time

    index[id][language] << post
  end
  index.each_value do |languages|
    languages.each_value do |posts|
      posts.sort_by! { |post| post.data.fetch("series_order") }
      posts.each_with_index do |post, position|
        { "series_previous" => position - 1, "series_next" => position + 1 }.each do |field, neighbor|
          post.data.delete(field)
          next unless neighbor >= 0 && neighbor < posts.size

          target = posts[neighbor]
          post.data[field] = { "url" => target.url, "title" => target.data["series_label"] || target.data["title"] }
        end
      end
    end
  end
  site.data["series_index"] = index
end
