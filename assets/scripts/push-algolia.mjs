import fs from "node:fs/promises";
import crypto from "node:crypto";
import { algoliasearch } from "algoliasearch";
import YAML from "yaml";

// ENV setup
const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_API_KEY,
  ALGOLIA_INDEX_NAME
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error("Missing required env vars");
  process.exit(1);
}

const inputPath = process.argv[2] || "_site/algolia-records.json";

function byteLen(s) {
  return Buffer.byteLength(s || "", "utf8");
}

function normalizeText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}

function stableObjectID(url, idx) {
  const h = crypto.createHash("sha1").update(`${url}#${idx}`).digest("hex").slice(0, 16);
  return `${url}#${idx}-${h}`;
}

function pickString(v, fallback="") {
  return typeof v === "string" ? v : fallback;
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

async function loadExcludePatterns() {
  const raw = await fs.readFile(process.env.JEKYLL_CONFIG || "_config.yml", "utf8");
  const cfg = YAML.parse(raw) || {};
  return (cfg.algolia?.files_to_exclude || []).map(g => {
    let r = String(g).trim().replace(/^[./]+/, "").replace(/[.+^${}()|[\]\\]/g, "\\$&");
    r = r.replace(/\\\*\\\*/g, ".*").replace(/\\\*/g, "[^/]*");
    return new RegExp(`^${r}$`);
  });
}

function safePath(p) {
  return String(p || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

function shouldExcludeRecord(rec, excludeRegexes) {
  const p = safePath(rec.path);
  const urlPath = (() => {
    try { return safePath(new URL(rec.url).pathname); }
    catch { return safePath(rec.url); }
  })();

  if (excludeRegexes.some(re => re.test(p) || re.test(urlPath))) return true;

  if (/^(tags|categories)(\/|$)/.test(urlPath)) return true;
  if (/^(assets|images|js|css)(\/|$)/.test(urlPath)) return true;
  if (/^(sitemap\.xml|feed\.xml|robots\.txt)$/.test(urlPath)) return true;
  if (/\/page\d+\/?$/.test(urlPath)) return true;
  if (/\/posts\/page\d+\/?$/.test(urlPath)) return true;

  return false;
}

(async function main() {
  const raw = await fs.readFile(inputPath, "utf-8");
  let pages = JSON.parse(raw);

  const records = pages.map(p => {
    const url = pickString(p.url, pickString(p.objectID, ""));
    const content = pickString(p.content, "");
    return {
      ...p,
      objectID: stableObjectID(url, 0),
      url,
      title: pickString(p.title, url),
      description: pickString(p.description, ""),
      content: normalizeText(content),
      categories: ensureArray(p.categories),
      tags: ensureArray(p.tags)
    };
  });

  const patterns = await loadExcludePatterns();
  const filtered = records.filter(r => !shouldExcludeRecord(r, patterns));

  console.log(`Prepared ${records.length} → filtered ${filtered.length}`);

  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

  // Correct method to initialize index for v5
  const index = client.initSearchClient().initIndex(ALGOLIA_INDEX_NAME); // Correct initialization

  // Upload the records
  await index.replaceAllObjects(filtered, {
    autoGenerateObjectIDIfNotExist: true
  });

  console.log("✅ Algolia upload complete");
})();
