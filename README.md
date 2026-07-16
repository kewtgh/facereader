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
