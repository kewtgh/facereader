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

function validTimestamp(value) {
  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})(?:T(\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(Z|[+-]\d{2}:\d{2}))?$/);
  if (!match || !Number.isFinite(Date.parse(String(value)))) return false;
  if (new Date(`${match[1]}T00:00:00Z`).toISOString().slice(0, 10) !== match[1]) return false;
  return !match[2] || (Number(match[2]) < 24 && Number(match[3]) < 60 && Number(match[4]) < 60 &&
    (match[5] === "Z" || (Number(match[5].slice(1, 3)) < 24 && Number(match[5].slice(4)) < 60)));
}

for (const post of posts) {
  const fm = post.frontMatter;
  const locale = fm.locale || defaultLocale;
  const lang = String(locale).slice(0, 2).toLowerCase();
  const translationKey = fm.translation_key;
  const permalink = String(fm.permalink || "");

  for (const key of ["date", "last_modified_at"]) {
    if (fm[key] != null && !validTimestamp(fm[key])) errors.push(`${post.relative}: ${key} must be a valid ISO date or timestamp with a timezone.`);
  }

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
    const lang = String(translation.locale).slice(0, 2).toLowerCase();
    const title = String(translation.frontMatter.title || "").trim();
    if (seenLocales.has(lang)) {
      errors.push(`${key}: duplicate language "${lang}" in ${seenLocales.get(lang)} and ${translation.relative}.`);
    }
    seenLocales.set(lang, translation.relative);
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
