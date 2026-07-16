import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const root = process.cwd();
const postsDir = path.join(root, "docs/_posts");
const uiTextFile = path.join(root, "_data/ui-text.yml");
const siteConfigFile = path.join(root, "_config.yml");
const frontMatterPattern = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/;
const translationKeyPattern = /^[a-z0-9][a-z0-9-]*$/;

function readYaml(file) {
  return YAML.parse(fs.readFileSync(file, "utf8"));
}

function readPostFiles(dir) {
  return fs.readdirSync(dir)
    .filter((name) => /\.(md|markdown)$/i.test(name))
    .map((name) => path.join(dir, name));
}

function parseFrontMatter(file) {
  const body = fs.readFileSync(file, "utf8");
  const match = body.match(frontMatterPattern);
  if (!match) return {};
  return YAML.parse(match[1]) || {};
}

const uiText = readYaml(uiTextFile);
const siteConfig = readYaml(siteConfigFile);
const defaultLocale = siteConfig.locale || "zh-CN";
const supportedLocales = new Set(Object.keys(uiText));
const posts = readPostFiles(postsDir).map((file) => ({
  file,
  relative: path.relative(root, file).replaceAll("\\", "/"),
  frontMatter: parseFrontMatter(file)
}));

const errors = [];
const warnings = [];
const groups = new Map();

for (const post of posts) {
  const fm = post.frontMatter;
  const locale = fm.locale || defaultLocale;
  const lang = String(locale).slice(0, 2);
  const translationKey = fm.translation_key;
  const permalink = String(fm.permalink || "");

  if (!supportedLocales.has(locale) && !supportedLocales.has(lang)) {
    errors.push(`${post.relative}: locale "${locale}" has no _data/ui-text.yml entry.`);
  }

  if (lang === "en" && permalink && !permalink.startsWith("/en/")) {
    errors.push(`${post.relative}: English post permalink must start with /en/.`);
  }

  if (translationKey) {
    if (typeof translationKey !== "string" || !translationKeyPattern.test(translationKey)) {
      errors.push(`${post.relative}: translation_key must use lowercase letters, numbers, and hyphens.`);
    }
    if (!groups.has(translationKey)) groups.set(translationKey, []);
    groups.get(translationKey).push({ ...post, locale });
  } else if (lang === "en") {
    errors.push(`${post.relative}: English post must set translation_key.`);
  }
}

for (const [key, translations] of groups) {
  const seenLocales = new Map();
  const seenTitles = new Map();
  const seenLangs = new Set();
  for (const translation of translations) {
    const lang = String(translation.locale).slice(0, 2);
    const title = String(translation.frontMatter.title || "").trim();
    if (seenLocales.has(translation.locale)) {
      errors.push(`${key}: duplicate locale "${translation.locale}" in ${seenLocales.get(translation.locale)} and ${translation.relative}.`);
    }
    seenLocales.set(translation.locale, translation.relative);
    seenLangs.add(lang);

    if (title) {
      const normalizedTitle = title.toLowerCase();
      if (seenTitles.has(normalizedTitle)) {
        warnings.push(`${key}: "${translation.relative}" and "${seenTitles.get(normalizedTitle)}" use the same title; verify the translated title is intentional.`);
      }
      seenTitles.set(normalizedTitle, translation.relative);
    }
  }

  if (translations.length === 1) {
    warnings.push(`${translations[0].relative}: translation_key "${key}" has only one language version.`);
  } else if (!seenLangs.has("zh") || !seenLangs.has("en")) {
    warnings.push(`${key}: translation group should include both Chinese and English versions.`);
  }
}

if (warnings.length) {
  console.warn(`i18n validation warnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error(`i18n validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`i18n validation OK: ${posts.length} posts checked, ${groups.size} translation group(s).`);
