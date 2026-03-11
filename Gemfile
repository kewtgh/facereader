source "https://rubygems.org"

# 如果不在做 gem 主题/插件发布，通常不需要 gemspec
# gemspec

group :jekyll_plugins do
  gem "github-pages"
end

gem "csv"
gem "bigdecimal"
gem "ostruct"

group :development do
  # Ruby 3 以后 webrick 不再默认附带；本地 serve 需要
  gem "webrick", "~> 1.8"
end

# Windows 下监听文件变化（可选；如果不用 --livereload 或监听也可删）
gem "wdm", ">= 0.1.1", platforms: :windows

# Ruby 里这两个一般是标准库/默认库，不建议写在 Gemfile（除非确实遇到缺失报错）
# gem "fiddle"

# GitHub Pages 当前依赖 Faraday v2，需要显式补上 retry middleware
gem "faraday-retry", "~> 2.2"
