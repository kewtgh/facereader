# FaceReader Dependency Modernization Audit - 2026-07

## Scope

Task: `FACEREADER_DEPENDENCY_MODERNIZATION_AUDIT_EXECUTION_CLOSURE`

Baseline HEAD: `69db572e3fea9263106c4acf8bcbec2ca7b64718`
Baseline branch: `main`
Baseline project version: `6.9.6`
Baseline worktree: clean

README/AGENTS status: no `README`/`README.md` or `AGENTS.md` existed at baseline.

## Runtime Baseline

- Local Node before change: `v22.22.3`
- Local npm before change: `10.9.8`
- Local Ruby before change: `ruby 4.0.1 (x64-mingw-ucrt)`
- Local RubyInstaller before change: `4.0.1-1`
- RubyGems before change: `4.0.6`
- Bundler before change: `4.0.3`
- Project Jekyll before change: `jekyll 3.9.0`
- Ruby dependency authority before change: `github-pages 223`
- Liquid before change: `4.0.3`
- Sass converter before change: `jekyll-sass-converter 1.5.2` / Ruby Sass 3.7.4
- npm lock before change: `algoliasearch 5.52.1`, `yaml 2.9.0`, `uglify-js 3.19.3`

## Target Versions

- Node target: `24.18.0`, from the official Node `latest-v24.x` line.
- Ruby target: stable Ruby 4.0 branch via `.ruby-version` = `4.0`.
- CI Ruby target: `ruby/setup-ruby` reads `.ruby-version`; expected to resolve the current stable Ruby 4.0 patch.
- Official Ruby latest seen during audit: `4.0.6`.
- RubyInstaller latest seen during audit: `4.0.5-1`; local machine currently has `4.0.1-1`.
- Official Docker `ruby:4.0` image seen during audit: `ruby 4.0.5`.
- Bundler target: `4.0.16`.
- Jekyll target: `4.4.1`.
- Sass target: `jekyll-sass-converter 3.1.0` with `sass-embedded 1.101.0`.
- Algolia SDK target: `algoliasearch 5.55.2`.

Sources checked:

- https://nodejs.org/download/release/latest-v24.x/
- https://www.ruby-lang.org/en/downloads/releases/
- https://rubyinstaller.org/downloads/
- https://rubygems.org/gems/bundler
- npm registry via `npm view`
- RubyGems via `bundle outdated`

## Changes Executed

- Added `.node-version` and `.nvmrc` with `24.18.0`.
- Added `.ruby-version` with `4.0`.
- Tightened `package.json` engines to `>=24.0.0 <25`.
- Updated `algoliasearch` from `^5.48.1` to `^5.55.2`.
- Removed `github-pages` from `Gemfile`.
- Added explicit Jekyll 4 dependencies used by this site:
  `jekyll`, `jekyll-archives`, `jekyll-default-layout`, `jekyll-feed`,
  `jekyll-gist`, `jekyll-include-cache`, `jekyll-optional-front-matter`,
  `jekyll-paginate`, `jekyll-redirect-from`, `jekyll-seo-tag`,
  `jekyll-sitemap`, `jekyll-titles-from-headings`, `jemoji`,
  `kramdown-parser-gfm`.
- Kept explicit `faraday-retry` because `jekyll-gist`/`octokit` uses Faraday v2.
- Updated development gems: `listen`, `rake`, `webrick`.
- Added `json` as an explicit Ruby dependency.
- Regenerated `Gemfile.lock` with Bundler `4.0.16`.
- Preserved both lock platforms: `x64-mingw-ucrt` and `x86_64-linux`.
- Updated GitHub Actions Ruby to read `.ruby-version`.
- Updated GitHub Actions Node to read `.node-version`.
- Updated CI Bundler pin to `4.0.16`.
- Updated Vercel commands to Bundler `4.0.16` and the canonical `site:build` entry.
- Removed the command-line `-r./_plugins/liquid_taint_compat.rb` shim from `site:build`.
- Kept `_plugins/liquid_taint_compat.rb`, but reclassified it as a Ruby 4 / Liquid 4 compatibility plugin loaded by Jekyll.
- Added `README.md` with canonical runtime requirements and excluded it from site output.
- Added `docs/audits` to the Jekyll exclude list so audit records do not become public site pages under `jekyll-optional-front-matter`.

## Compatibility Findings

- Jekyll 4.4.1 still depends on Liquid 4.0.3.
- Liquid 4.0.3 still calls `Object#tainted?`, removed in Ruby 4.0.
- A build without `_plugins/liquid_taint_compat.rb` failed with:
  `undefined method 'tainted?' for an instance of String`.
- Therefore the shim is still required, but it is no longer tied to the old Jekyll 3 command wrapper.
- Jekyll 3/github-pages had implicitly loaded no-front-matter/default-layout/title plugins.
- Without explicitly adding those plugins under Jekyll 4, 18 existing URLs disappeared.
- Adding `jekyll-optional-front-matter`, `jekyll-default-layout`, and
  `jekyll-titles-from-headings` restored the URL set exactly.
- Jekyll 4 Sass uses `sass-embedded`, which starts a child process. The restricted sandbox blocked this with `Open3.popen3: Permission denied`; normal outside-sandbox execution passed.
- Dart Sass now emits deprecation warnings for legacy Minimal Mistakes Sass syntax. These are warnings only and did not change URLs or fail the build.

## Build Output Comparison

Baseline output was rebuilt in an isolated worktree at baseline HEAD.

| Metric | Before | After | Result |
| --- | ---: | ---: | --- |
| `_site` files | 553 | 553 | unchanged |
| HTML pages | 240 | 240 | unchanged |
| sitemap `<loc>` count | 129 | 129 | unchanged |
| feed entries | 10 | 10 | unchanged |
| Algolia records | 98 | 98 | unchanged |
| CNAME | `facereader.witbacon.com` | `facereader.witbacon.com` | unchanged |
| Missing URLs | 0 | 0 | unchanged |
| Added URLs | 0 | 0 | unchanged |

Representative unchanged page hashes:

- `index.html`
- `404.html`
- `posts/page/2/index.html`
- `docs/阅相识人/企业剖析/AI/AI-4Paradigm(1)/index.html`
- `阅相识人/企业剖析/ai/AI-4Paradigm(1)/index.html`
- `社会杂论/politics-whydictatorwontfall/index.html`
- `categories/faceread/index.html`
- `sitemap.xml`
- `CNAME`

Expected differences:

- `assets/css/main.css` changed because Jekyll 4 uses Sass Embedded instead of Ruby Sass.
- `feed.xml` hash changed while entry count stayed at 10.
- `assets/js/main.min.js` in the current worktree reflects existing generated output state; no JS source change was made.

## Validation Results

Commands executed:

- `node -v`: local PATH returned `v22.22.3`.
- `npm -v`: `10.9.8`.
- `npx -y -p node@24.18.0 node -v`: `v24.18.0`.
- `ruby -v`: `ruby 4.0.1 (x64-mingw-ucrt)`.
- `gem -v`: `4.0.6`.
- `bundle _4.0.16_ -v`: `4.0.16`.
- `bundle _4.0.16_ install`: pass.
- isolated clean `BUNDLE_PATH` install: pass.
- native gem install in clean path: pass for `eventmachine`, `http_parser.rb`, `bigdecimal`, `json`, `racc`, `wdm`, `nokogiri`, `sass-embedded`.
- `bundle _4.0.16_ check`: pass.
- `bundle _4.0.16_ exec jekyll -v`: `jekyll 4.4.1`.
- `npm ci`: pass, with expected engine warning because local PATH is Node 22.
- `npm audit --audit-level=moderate`: pass, 0 vulnerabilities.
- `npm run leaders:validate`: pass.
- `npm run leaders:audit`: pass, 25 existing review warnings.
- `npm run actions:lint`: pass.
- `JEKYLL_ENV=production npm run site:build`: pass under outside-sandbox execution.
- `_site/index.html`, `_site/algolia-records.json`, `_site/CNAME`: present.
- `_site/CNAME`: `facereader.witbacon.com`.
- `npm run site:links`: pass, 240 HTML files checked.
- `npm run site:check`: pass.
- Linux Docker validation with `ruby:4.0`: pass.
- Linux Docker Ruby: `ruby 4.0.5 (x86_64-linux)`.
- Linux Docker RubyGems: `4.0.10`.
- Linux Docker Bundler: `4.0.16`.
- Linux Docker Jekyll: `4.4.1`.
- Linux Docker Node: `v24.18.0`.
- Linux Docker npm: `11.16.0`.
- Linux Docker checks passed: clean `bundle install`, `bundle check`, `bundle exec jekyll -v`, `npm ci`, `leaders:validate`, `leaders:audit`, `actions:lint`, production `site:build`, `site:links`, `site:check`.
- Workflow grep for Node 20 selections: none.
- Workflow grep for `actions/checkout@v4`, `setup-node@v4`, artifact v4 actions: none.
- Pages/Algolia raw Jekyll authority check: only `package.json` `site:build` owns `jekyll build`.

## CI and Deployment Shape

Pages workflow remains:

```text
build
├── deploy
└── algolia
```

- Build authority: `npm run site:build`.
- Jekyll environment: `JEKYLL_ENV=production`.
- Pages artifact path: `_site`.
- Algolia artifact: `_site/algolia-records.json` uploaded as `algolia-records`, then downloaded by the `algolia` job.
- Pages deploy depends only on `build`.
- Algolia depends only on `build`; Pages deploy does not depend on Algolia success.
- Tag generation remains a separate repository-mutating PR workflow.

Action/runtime versions:

- `actions/checkout@v7`
- `actions/setup-node@v6`
- `actions/configure-pages@v6`
- `actions/upload-pages-artifact@v5`
- `actions/deploy-pages@v5`
- `actions/upload-artifact@v7`
- `actions/download-artifact@v8`
- `actions/github-script@v8`
- `ruby/setup-ruby@v1`
- Bundler pin: `4.0.16`

## Deferred / Follow-Up

- System PATH Node is still `v22.22.3`; the repository and CI are set to Node `24.18.0`. Local Node 24 was verified through `npx node@24.18.0`, but the user's global Node installation was not modified.
- Local RubyInstaller is `4.0.1-1`; RubyInstaller downloads page showed `4.0.5-1`, while Ruby official releases showed `4.0.6`. The repo uses `.ruby-version` = `4.0` so CI can resolve the current Ruby 4.0 patch and Windows can remain on an available RubyInstaller 4.0 patch.
- Official Ruby latest is `4.0.6`, but `ruby:4.0.6` had no available `linux/amd64` manifest in Docker during validation. The available `ruby:4.0` image resolved to Ruby `4.0.5`; Linux validation passed on that Ruby 4.0 patch. CI reads `.ruby-version` = `4.0` and should use the newest Ruby 4.0 patch supported by `ruby/setup-ruby`.
- Sass deprecation warnings are deferred. They are caused by inherited Minimal Mistakes Sass syntax under Dart Sass and do not currently fail the build.

## Final State

- `github-pages` aggregation gem removed.
- Jekyll upgraded from `3.9.0` to `4.4.1`.
- Bundler upgraded from `4.0.3` to `4.0.16`.
- Node target upgraded to `24.18.0`.
- Ruby canonical runtime changed to Ruby 4.0 branch.
- URLs, sitemap count, HTML count, CNAME, feed entry count, and Algolia record count are preserved.
