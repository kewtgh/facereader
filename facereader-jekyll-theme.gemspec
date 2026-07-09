# encoding: utf-8

require "json"

package_json = JSON.parse(File.read("package.json"))

Gem::Specification.new do |spec|
  spec.name                    = "facereader-jekyll-theme"
  spec.version                 = package_json["version"]
  spec.authors                 = ["FaceReader", "Michael Rose", "iBug"]

  spec.summary                 = %q{FaceReader site theme, deeply customized from Minimal Mistakes 4.28.0.}
  spec.homepage                = "https://facereader.witbacon.com/"
  spec.license                 = "MIT"

  spec.metadata["plugin_type"] = "theme"
  
  spec.files                   = Dir.glob(
    [
      "assets/**/*",
      "_data/**/*",
      "_includes/**/*",
      "_layouts/**/*",
      "_sass/**/*",
      "LICENSE",
      "README*",
      "CHANGELOG*"
    ],
    File::FNM_DOTMATCH
  ).select { |f| File.file?(f) }

  spec.add_runtime_dependency "jekyll", ">= 3.7", "< 5.0"
  spec.add_runtime_dependency "jekyll-paginate", "~> 1.1"
  spec.add_runtime_dependency "jekyll-sitemap", "~> 1.3"
  spec.add_runtime_dependency "jekyll-gist", "~> 1.5"
  spec.add_runtime_dependency "jekyll-feed", "~> 0.1"
  spec.add_runtime_dependency "jekyll-include-cache", "~> 0.1"

  spec.add_development_dependency "bundler"
  spec.add_development_dependency "rake", ">= 12.3.3"
end
