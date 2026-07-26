# frozen_string_literal: true

require "nokogiri"
require "pathname"
require "uri"

SITE_ROOT = Pathname.new(File.expand_path("../_site", __dir__))
RASTER_EXTENSIONS = %w[.gif .jpeg .jpg .png .webp].freeze
CRITICAL_IMAGE_PATHS = %w[
  /assets/img/logo-facereader.png
  /assets/img/hor-photo.png
].freeze
MAX_REPORTED_ERRORS = 100

abort "_site does not exist. Run the Jekyll build first." unless SITE_ROOT.directory?

html_files = SITE_ROOT.glob("**/*.html")
errors = []
stats = {
  html_files: html_files.length,
  images: 0,
  images_without_dimensions: 0,
  images_without_loading: 0,
  inline_script_bytes: 0
}

def add_error(errors, file, message)
  errors << "#{file.relative_path_from(SITE_ROOT)}: #{message}"
end

def relative_local_asset(file, url)
  value = url.to_s.split(/[?#]/, 2).first
  return nil if value.empty? || value.start_with?("data:", "//", "#")
  return nil if value.match?(%r{\A[a-z][a-z0-9+.-]*:}i)

  decoded = URI::DEFAULT_PARSER.unescape(value)
  decoded.start_with?("/") ? SITE_ROOT.join(decoded.delete_prefix("/")) : file.dirname.join(decoded)
rescue ArgumentError
  nil
end

html_files.each do |file|
  html = file.read(encoding: "UTF-8")
  document = Nokogiri::HTML(html)

  ids = Hash.new(0)
  document.css("[id]").each { |node| ids[node["id"]] += 1 unless node["id"].to_s.empty? }
  ids.select { |_id, count| count > 1 }.each_key do |id|
    add_error(errors, file, %(duplicate id="#{id}"))
  end

  document.css("img").each do |image|
    stats[:images] += 1
    add_error(errors, file, "image is missing alt") unless image.key?("alt")

    local_asset = relative_local_asset(file, image["src"])
    raster = local_asset && RASTER_EXTENSIONS.include?(local_asset.extname.downcase)
    if raster && local_asset.file? && (!image.key?("width") || !image.key?("height"))
      stats[:images_without_dimensions] += 1
      add_error(errors, file, "local raster image is missing width/height: #{image['src']}")
    end

    image_path = image["src"].to_s.split(/[?#]/, 2).first
    critical = CRITICAL_IMAGE_PATHS.include?(image_path) ||
      image["loading"] == "eager" || image["fetchpriority"] == "high" ||
      image["class"].to_s.split.any? { |name| %w[page__hero-image site-logo author__avatar].include?(name) }
    unless critical || image.key?("loading")
      stats[:images_without_loading] += 1
      add_error(errors, file, "non-critical image is missing loading: #{image['src']}")
    end
  end

  label_targets = document.css("label[for]").map { |label| label["for"] }.to_h { |id| [id, true] }
  document.css("button, input, select, textarea").each do |control|
    next if control.name == "input" && control["type"].to_s.downcase == "hidden"

    labelled = !control["aria-label"].to_s.strip.empty? ||
      !control["aria-labelledby"].to_s.strip.empty? ||
      !control["title"].to_s.strip.empty? ||
      !control.text.strip.empty? ||
      control.ancestors("label").any? ||
      label_targets[control["id"]]
    add_error(errors, file, "form control has no accessible name: #{control.name}") unless labelled
  end

  document.css(%(a[target="_blank"])).each do |link|
    rel_tokens = link["rel"].to_s.downcase.split
    next if rel_tokens.include?("noopener") || rel_tokens.include?("noreferrer")

    add_error(errors, file, %(target="_blank" link is missing rel="noopener"))
  end

  document.css("script:not([src])").each do |script|
    content = script.content
    stats[:inline_script_bytes] += content.bytesize
    if content.include?("window.FaceReaderUiText")
      add_error(errors, file, "the complete UI dictionary was inlined")
    end
    if content.include?("initAlgoliaInstantSearchOnce")
      add_error(errors, file, "the Algolia initializer was inlined")
    end
  end

  if html.include?("{{") || html.include?("{%")
    add_error(errors, file, "unrendered Liquid syntax remains in generated HTML")
  end
end

[
  ["assets/scripts", "private build scripts were published"],
  ["assets/js/main.min.js.map", "JavaScript source map was published"]
].each do |relative_path, message|
  add_error(errors, SITE_ROOT.join(relative_path), message) if SITE_ROOT.join(relative_path).exist?
end

if errors.any?
  warn "Generated HTML audit failed with #{errors.length} error(s):"
  errors.first(MAX_REPORTED_ERRORS).each { |error| warn "- #{error}" }
  warn "...and #{errors.length - MAX_REPORTED_ERRORS} more." if errors.length > MAX_REPORTED_ERRORS
  exit 1
end

puts [
  "Generated HTML OK:",
  "#{stats[:html_files]} files,",
  "#{stats[:images]} images,",
  "#{stats[:images_without_dimensions]} dimension issues,",
  "#{stats[:images_without_loading]} loading issues,",
  "#{stats[:inline_script_bytes]} inline script bytes."
].join(" ")
