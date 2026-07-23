# FaceReader

## Development Runtime

FaceReader builds with Ruby 4.0 and Node.js 24.

- Ruby: use the stable Ruby 4.0 branch from `.ruby-version`.
- Windows: use RubyInstaller Ruby+Devkit 4.0 x64 in a Ruby 4.0 directory.
- Bundler: use Bundler 4.0.16, matching `Gemfile.lock`.
- Node.js: use Node 24.18.0 from `.node-version` or `.nvmrc`.

Install and verify:

```bash
bundle install
npm ci
JEKYLL_ENV=production npm run site:build
npm run site:check
```

## Bilingual Articles

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
