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
