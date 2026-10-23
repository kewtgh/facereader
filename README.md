# FaceReader

## Development Runtime

FaceReader builds with Ruby 4.0.9 and Node.js 24.22.1 LTS.

- Ruby: use the stable version in `.ruby-version`; `Gemfile` reads that file.
- Windows: use a matching RubyInstaller Ruby+Devkit x64 release. While its
  installer trails a new Ruby patch, use Linux/WSL or a container with the pinned Ruby.
- Bundler: use 4.0.23 from `.bundler-version`, matching `Gemfile.lock`.
- Node.js: use 24.22.1 LTS from `.node-version` or `.nvmrc`.
- npm: use 12.2.1 from `.npm-version` and `package.json#packageManager`.

Install and verify:

```bash
bundle install
npm ci
JEKYLL_ENV=production npm run site:build
npm run site:check
```

`site:check` validates LEADERS scoring and data, the shared content catalog,
reading duration, local search and saved-URL contracts, bilingual UI metadata,
GitHub Actions workflows, Sass warnings, internal links, generated HTML
accessibility, image dimensions/loading attributes, and production artifact
exclusions. Run it after a successful build before publishing.

The Pages workflow runs `site:check` before uploading the deployment artifact.
For browser regressions, build first and run `npm run site:browser` with an
the npm-locked Playwright and its Chromium (`npx playwright install --only-shell chromium`). Set `PLAYWRIGHT_MODULE` to its module path
and `CHROMIUM_EXECUTABLE` to the browser executable when they are not installed
locally. The suite starts a local-only server, blocks external requests, tests
responsive pages and failure/retry flows, and saves screenshots under
`tmp/browser-regression/`. It does not install browsers or publish anything.
`FR_BROWSER_OUTPUT` selects another screenshot directory. `FR_SITE_ROOT` can
select a separately built site, and `FR_READING_ONLY=1` runs only the new reading
and privacy checks during development; release validation runs the complete suite.
The Pages build installs Chromium and runs the complete suite before uploading.
Set `FR_TEST_SEARCH_CDN=1` to additionally load the pinned public search libraries
and verify search rendering against mocked responses; this never queries the live index.
`FR_SEARCH_FIXTURES` may point to a directory containing `algolia.js`,
`instantsearch.js` and `instantsearch.css` from those pinned URLs to exercise
the same libraries without browser network access.

Browser-facing JavaScript belongs in `assets/js`. Build-only validation and
deployment utilities belong in `assets/scripts`, which is excluded from the
published site. `bundle exec rake js` regenerates `assets/js/main.min.js`
without publishing a source map.
The bundle uses npm-locked jQuery 4.0, Magnific Popup 1.2, Gumshoe 5.1.2 and
Smooth Scroll 16.1.3. The original jQuery FitVids source follows its stable v1.2.0
tag (whose upstream copyright header still says 1.1). Run `npm ci` before regenerating it. Third-party notices
are at `/THIRD_PARTY_NOTICES/`.

Enhanced search loads the Algolia 5.60.0 lite client, InstantSearch.js 4.120.0, and
InstantSearch.css 8.24.1 from pinned CDN URLs. After updating those URLs, update
the CDN allowlist in `assets/scripts/test-site-browser.mjs` and run the browser
suite with `FR_TEST_SEARCH_CDN=1` to check mocked search results.

Ruby dependencies resolve to the latest stable versions allowed by the Jekyll
plugin dependency graph. Jekyll 4.4 requires JSON 2.x, Liquid 4.x, Rouge 4.x,
and terminal-table 3.x; jemoji requires html-pipeline 2.x, jekyll-gist
requires Octokit 4.x, and IRB requires Prism 1.x. Newer incompatible major
versions remain excluded. Runtime and registry checks for this release are in
`docs/audits/implementation-plan-2026-10-24.md`.

Maintain the FaceReader version only in `package.json`; run
`npm install --package-lock-only` to synchronize npm's lockfile after changing it.
At build time, `_plugins/site_version.rb` exposes that version as
`site.data.theme.version` for page notices, copyright banners, and asset cache
parameters. The JavaScript bundle's Liquid banner is also resolved by Jekyll,
so a version bump does not require regenerating the bundle. Run
`npm run site:check` before pushing.

Custom styles are organized as Sass modules under `_sass/minimal-mistakes/`.
`_custom.scss` loads them in cascade order; Jekyll still emits one minified
`assets/css/main.css`, so the source split adds no browser requests. Run
`npm run site:css:budget` after a build to check its compressed size.

## Local Discovery and Reading List

`/search/` searches titles, summaries, tags and topics in the browser without
Algolia, a search CDN, or a paid API. Submit a query or change the language/topic
to update its shareable URL; Back/Forward restores the selection. The article
language can be shared with `?lang=en` or `?lang=zh`, independently of the
remembered interface language. Changing the interface language updates the
article filter. Results load in batches of 12 with explicit retry and empty states.

`_plugins/content_catalog.rb` builds `/article-index.json` from visible, published
articles. It omits full bodies, hidden posts and `search: false` records. The same
content policy supplies language archives, series visibility, reading duration
and up to four recommendations in the article's language, excluding its translation
group. Reading duration counts Han characters and other words separately, honors
site/article reading rates and rounds up. The article progress bar measures the
body rather than recommendations, comments or the footer.

Article pages offer Read later. `/reading-list/` stores up to 100 explicitly
saved article URLs in `facereader.readingList.v1` in localStorage, supports removal
and cross-tab updates, and reports unavailable storage. It does not record browsing
history, synchronize accounts, or cache article bodies. Lists belong to each
browser and domain; clearing browser data removes them. Rendering resolves saved
URLs against the current catalog and never trusts saved HTML or external URLs.

The existing mixed `/feed.xml` remains available. `/feed/zh.xml` and `/feed/en.xml`
provide the latest 20 visible articles in each language with summaries and canonical
article links. Both feeds are discoverable from the head and footer.

## Optional Analytics and Comments

Google Analytics is off by default. Footer Privacy settings stores an explicit
choice in `facereader.analyticsConsent.v1`; Save and reload applies or withdraws it.
Global Privacy Control and Do Not Track keep analytics off. Browser storage failures
keep it off, and a cross-tab preference change reloads other pages to apply it.
Local search and the reading list do not load analytics. Analytics configuration
on other pages strips query parameters and fragments from page and referrer URLs.
Disqus loads only when the reader presses Load Disqus comments on the current
article, with a visible retry if the script fails. This choice does not persist to
other articles. `/terms/` describes these controls and the local preferences;
hosting and other CDN resource requests remain separate from optional analytics.

## Bilingual Articles

The interface remembers manual language choices. On a first visit, device IANA
time zones for mainland China, Taiwan, Hong Kong, Macau, and Singapore default
to Chinese; other time zones default to English. If time-zone detection is
unavailable, the browser language (Chinese or English), then the page default,
is used. This runs locally without a geolocation service.

The homepage's recent updates and `/posts/` use article `locale` metadata
(missing metadata inherits `site.locale`). They exclude hidden posts and show
only the selected interface language. `_plugins/language_archives.rb` filters
before paginating, retaining `/posts/page/:num/` with independent language
totals. Selecting a language without the current page returns to `/posts/`.
Without JavaScript these two lists show Chinese articles.

FaceReader supports paired Chinese and English article versions through front matter.
Keep the existing Chinese URL unchanged, and give both language versions the same
`translation_key`:

```yaml
locale: zh-CN
translation_key: why-dictators-dont-fall
```

```yaml
locale: en-US
translation_key: why-dictators-dont-fall
permalink: /en/society/why-dictators-dont-fall/
```

When two posts share a `translation_key`, the site generates a visible language
switcher on both articles and emits SEO `hreflang` alternates. Validate new
language metadata with:

```bash
npm run i18n:validate
```

English posts are listed at `/en/posts/`. A page-level English button should be
disabled until a matching English post exists for the current `translation_key`.

## Editorial Navigation

The reading map at `/categories/` groups existing Jekyll categories into six
reader-facing pillars. Edit `_data/editorial_pillars.yml` to change the mapping;
do not rename historical categories or permalinks. A post can override the
inferred pillar with its front matter ID, for example `pillar: society`.

For a curated series, define its display names and destination in
`_data/series.yml`, then mark each article:

```yaml
series: lcer
series_order: 1
series_label: 中国：上海与南京
```

`series` identifies the reading path, `series_order` is a positive integer
unique within that series and article language, and `series_label` is an
optional short title. `_plugins/series_index.rb` supplies one ordered list to
the series page, article navigation, previous/next links, and mobile series
dialog. Hidden and unpublished articles are excluded. Invalid series IDs or
duplicate positions stop the build.

Articles no longer use `sidebar` or hand-maintained navigation URL lists.
`_data/navigation.yml` contains the main menu and menus used by ordinary pages.
On desktop and mobile, the floating series button opens a translucent panel
with the complete list in the article's language, highlights the current
article, and keeps the reading position.
On mobile, articles with a series share one reading-navigation button with
TOC and series tabs. It opens on the TOC every time; the other floating button
returns to the top. Articles without a series keep their TOC button.

Chinese and English entries use the same series ID and order but are shown in
separate language lists. Articles without these fields keep working normally.
The `/posts/` entry selections are maintained in `_data/start_here.yml`.

The timeline and tag results share `_includes/reading-card.html`. Cards use
`header.teaser`, then `header.overlay_image`, then the site teaser when available.
The tags page has a searchable, grouped directory and shows results in batches
of 12. Tag links use `?tag=`, support browser history, and filter published,
visible articles. Tags outside `_data/tag-groups.yml` appear under More keywords.

## Popular Articles

Add an article to `/most_popular/` from its canonical post file in
`docs/_posts`:

```yaml
most_popular: true
```

The popular-articles page reads these posts directly and links to their canonical
URLs. Do not copy article content into `docs/_most_popular`; that collection is
reserved for standalone resources such as the company review table and the RSS
guide.

## Markdown Reading Styles

Article front matter supplies the page title, so article bodies should normally
start with `##`. Heading levels have distinct visual roles: `##` starts a major
section, `###` starts a subsection, and `####` through `######` provide
progressively quieter detail. Do not skip levels only to obtain a visual style.

Use Markdown semantics instead of inline colors:

```markdown
**Key conclusion**

*Contextual emphasis*

> A quotation or cited passage.

Term with a footnote.[^1]

[^1]: Footnote text and source details.
```

Bold text uses the warm key-conclusion treatment, emphasis uses the secondary
teal treatment, links remain blue, and explicit `<mark>highlight</mark>` output
uses the light-gold marker treatment. These distinctions are applied to both
Chinese and English reading views; English emphasis remains italic.

Nested lists acquire different markers and colors automatically. Keep the
indentation structurally valid rather than inserting symbols manually:

```markdown
- First level
    - Second level
        - Third level
            - Fourth level

1. First level
    1. Second level
        1. Third level
            1. Fourth level
```

A normal thematic break spans the reading column:

```markdown
---
```

Use the short decorative variant only where a lighter pause is intended:

```markdown
---
{: .hr--short}
```

Blockquotes, footnote references, footnote bodies, and return links are styled
automatically. Do not add background colors or layout HTML around them.
On mobile, tapping a footnote opens its content beside the reference without
changing the URL or reading position. Close it with the close button, an
outside tap, or Escape. Desktop hover previews and click-to-footnote links
remain available, as do the original footnotes when JavaScript is unavailable.

For mathematical notation, add `math: true` to the article front matter.
Kramdown uses `$$t=43$$` for inline math and a separate `$$` line above and
below a display equation. Do not write `\(...\)` or `\[...\]` directly in
Markdown: its escape processing removes their backslashes. Kramdown preserves
the `$$` content and emits the delimiters consumed by the local KaTeX renderer.
Only opted-in pages load KaTeX; equations include accessible MathML and long
display equations scroll within the reading column. Code blocks and currency
amounts outside math are not processed.

KaTeX 0.19.0 is served from `assets/math/katex/`, including its fonts and MIT
license. After updating the npm dependency, run `npm run math:vendor` and
commit the regenerated assets before building the site.

Use fenced code blocks and always declare the language when it is known. Rouge
then supplies syntax highlighting, while long lines remain horizontally
scrollable on narrow screens:

````markdown
```ruby
def score(company)
  company.leaders_average
end
```
````

Use single backticks for inline identifiers and commands. Do not add manual
background colors, borders, or nested `<pre>` elements; standard code blocks,
optional Rouge line numbers, and inline code share the site reading styles.

## Interface Styles

Homepage Hero actions are declared in `index.html` and styled through
`.page__hero-actions`. On mobile, the two actions intentionally form a centered,
equal-width column. Keep their translated labels concise and do not add
per-button alignment or width styles in the page front matter.

## GitHub Pages

GitHub Pages must use **GitHub Actions** as its build source. Do not switch Pages
back to "Deploy from a branch"; the native Pages build cannot compile this
project's Dart Sass `@use` entrypoint. The Pages workflow validates the compiled
CSS before uploading `_site` and checks the deployed CSS after deployment.

GitHub Pages is the production authority and serves `facereader.witbacon.com`.
Vercel deploys the same repository as a mainland-China mirror at
`faceread.witbacon.com`; it does not own a separate content tree or build mode.
Keep internal links root-relative so readers remain on the host they opened,
while canonical, sitemap, and feed URLs continue to use the Pages domain.

## Algolia search protection

The GitHub Pages build reapplies the browser search-key restrictions before a
production artifact can be built or deployed. Limits and allowed production
origins are configured under `algolia` in `_config.yml`. The key is restricted
to the production index, search-only access, a per-IP hourly query budget, and
a maximum hit count.
Frontend search also suppresses empty and short queries, debounces typing, and
caches repeated requests. Referrer checks are an additional filter only because
HTTP referrers can be spoofed.

`ALGOLIA_SEARCH_API_KEY` must be configured as both a GitHub Actions repository
secret and a Vercel environment variable. `_plugins/algolia_search_key_env.rb`
injects it only while Jekyll builds the site, so the value isn't stored in this
repository. This is a browser search-only key and will still be visible in the
rendered JavaScript; never use or inject the Algolia Admin API key. After moving
to the environment secret, rotate the previously committed search key in the
Algolia dashboard and revoke the old key.
