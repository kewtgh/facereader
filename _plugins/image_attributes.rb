# frozen_string_literal: true

require "cgi"
require "pathname"
require "uri"

module FaceReader
  module ImageAttributes
    RASTER_EXTENSIONS = %w[.gif .jpeg .jpg .png .webp].freeze
    JPEG_SOF_MARKERS = [
      0xC0, 0xC1, 0xC2, 0xC3, 0xC5, 0xC6, 0xC7,
      0xC9, 0xCA, 0xCB, 0xCD, 0xCE, 0xCF
    ].freeze

    module_function

    def enhance(site, html)
      return html unless html.include?("<img")

      source_root = Pathname.new(site.source).expand_path
      baseurl = site.config.fetch("baseurl", "").to_s.sub(%r{/$}, "")
      critical_paths = [
        site.config["logo"],
        site.config.dig("author", "avatar")
      ].compact.map { |path| normalize_url_path(path, baseurl) }
      dimension_cache = {}

      html.gsub(/<img\b[^>]*>/i) do |tag|
        enhance_tag(tag, source_root, baseurl, critical_paths, dimension_cache)
      end
    end

    def enhance_tag(tag, source_root, baseurl, critical_paths, dimension_cache)
      src = tag[/\bsrc\s*=\s*(["'])(.*?)\1/i, 2]
      return tag unless src

      normalized_path = normalize_url_path(src, baseurl)
      critical = critical_image?(tag, normalized_path, critical_paths)
      attributes = []

      unless critical || attribute?(tag, "loading")
        attributes << %(loading="lazy")
      end
      attributes << %(decoding="async") unless critical || attribute?(tag, "decoding")

      unless attribute?(tag, "width") && attribute?(tag, "height")
        local_path = local_image_path(normalized_path, source_root)
        if local_path
          width, height = dimension_cache.fetch(local_path.to_s) do
            dimension_cache[local_path.to_s] = dimensions(local_path)
          end
          if width && height
            attributes << %(width="#{width}") unless attribute?(tag, "width")
            attributes << %(height="#{height}") unless attribute?(tag, "height")
          end
        end
      end

      append_attributes(tag, attributes)
    end

    def normalize_url_path(url, baseurl)
      value = CGI.unescapeHTML(url.to_s).split(/[?#]/, 2).first.to_s
      return nil if value.empty? || value.start_with?("data:", "//") || value.match?(%r{\A[a-z][a-z0-9+.-]*:}i)

      value = URI::DEFAULT_PARSER.unescape(value)
      value = value.delete_prefix(baseurl) unless baseurl.empty?
      value
    rescue ArgumentError
      nil
    end

    def local_image_path(url_path, source_root)
      return nil unless url_path

      relative_path = url_path.sub(%r{\A/}, "")
      return nil unless RASTER_EXTENSIONS.include?(File.extname(relative_path).downcase)

      candidate = source_root.join(relative_path).cleanpath
      return nil unless candidate.to_s.start_with?("#{source_root}#{File::SEPARATOR}")
      return nil unless candidate.file?

      candidate
    end

    def critical_image?(tag, normalized_path, critical_paths)
      return true if attribute_value(tag, "loading") == "eager"
      return true if attribute_value(tag, "fetchpriority") == "high"
      return true if critical_paths.include?(normalized_path)

      classes = attribute_value(tag, "class").to_s.split
      (classes & %w[page__hero-image site-logo author__avatar]).any?
    end

    def attribute?(tag, name)
      tag.match?(/\s#{Regexp.escape(name)}(?:\s*=|\s|\/?>)/i)
    end

    def attribute_value(tag, name)
      tag[/\s#{Regexp.escape(name)}\s*=\s*(["'])(.*?)\1/i, 2]
    end

    def append_attributes(tag, attributes)
      return tag if attributes.empty?

      tag.sub(/(\s*\/?>)\z/, " #{attributes.join(' ')}\\1")
    end

    def dimensions(path)
      data = File.binread(path, 64 * 1024)
      case File.extname(path).downcase
      when ".png" then png_dimensions(data)
      when ".gif" then gif_dimensions(data)
      when ".jpg", ".jpeg" then jpeg_dimensions(data)
      when ".webp" then webp_dimensions(data)
      end
    rescue Errno::ENOENT, IOError
      nil
    end

    def png_dimensions(data)
      return nil unless data.start_with?("\x89PNG\r\n\x1A\n".b) && data.bytesize >= 24

      data.byteslice(16, 8).unpack("N2")
    end

    def gif_dimensions(data)
      return nil unless data.match?(/\AGIF8[79]a/n) && data.bytesize >= 10

      data.byteslice(6, 4).unpack("v2")
    end

    def jpeg_dimensions(data)
      return nil unless data.start_with?("\xFF\xD8".b)

      offset = 2
      while offset + 8 < data.bytesize
        offset += 1 while offset < data.bytesize && data.getbyte(offset) == 0xFF
        marker = data.getbyte(offset)
        offset += 1
        next if marker.nil? || marker == 0x01 || marker.between?(0xD0, 0xD9)
        break if offset + 1 >= data.bytesize

        segment_length = data.byteslice(offset, 2).unpack1("n")
        return nil if segment_length < 2 || offset + segment_length > data.bytesize

        if JPEG_SOF_MARKERS.include?(marker)
          height, width = data.byteslice(offset + 3, 4).unpack("n2")
          return [width, height]
        end
        offset += segment_length
      end
      nil
    end

    def webp_dimensions(data)
      return nil unless data.start_with?("RIFF".b) && data.byteslice(8, 4) == "WEBP".b

      case data.byteslice(12, 4)
      when "VP8X".b
        return nil if data.bytesize < 30

        [little_endian_24(data, 24) + 1, little_endian_24(data, 27) + 1]
      when "VP8 ".b
        return nil if data.bytesize < 30 || data.byteslice(23, 3) != "\x9D\x01\x2A".b

        width, height = data.byteslice(26, 4).unpack("v2")
        [width & 0x3FFF, height & 0x3FFF]
      when "VP8L".b
        return nil if data.bytesize < 25 || data.getbyte(20) != 0x2F

        b1, b2, b3, b4 = data.byteslice(21, 4).bytes
        width = 1 + b1 + ((b2 & 0x3F) << 8)
        height = 1 + ((b2 & 0xC0) >> 6) + (b3 << 2) + ((b4 & 0x0F) << 10)
        [width, height]
      end
    end

    def little_endian_24(data, offset)
      b1, b2, b3 = data.byteslice(offset, 3).bytes
      b1 | (b2 << 8) | (b3 << 16)
    end
  end
end

Jekyll::Hooks.register %i[pages documents], :post_render do |document|
  next unless document.output_ext == ".html"

  document.output = FaceReader::ImageAttributes.enhance(document.site, document.output)
end
