import fs from "node:fs/promises";
import crypto from "node:crypto";
import { algoliasearch } from "algoliasearch";
import YAML from "yaml";

// 1. 环境变量校验
const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_API_KEY,
  ALGOLIA_INDEX_NAME,
  JEKYLL_CONFIG
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error("❌ 错误: 缺少必要的环境变量");
  process.exit(1);
}

const inputPath = process.argv[2] || "_site/algolia-records.json";

// --- 辅助工具函数 ---
function normalizeText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}
function stableObjectID(url, idx) {
  const h = crypto.createHash("sha1").update(`${url}#${idx}`).digest("hex").slice(0, 16);
  return `${url}#${idx}-${h}`;
}
function pickString(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}
function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}
function safePath(p) {
  return String(p || "").replace(/\\/g, "/").replace(/^\/+/, "");
}

async function loadExcludePatterns() {
  try {
    const configPath = JEKYLL_CONFIG || "_config.yml";
    const raw = await fs.readFile(configPath, "utf8");
    const cfg = YAML.parse(raw) || {};
    return (cfg.algolia?.files_to_exclude || []).map(g => {
      let r = String(g).trim().replace(/^[./]+/, "").replace(/[.+^${}()|[\]\\]/g, "\\$&");
      r = r.replace(/\\\*\\\*/g, ".*").replace(/\\\*/g, "[^/]*");
      return new RegExp(`^${r}$`);
    });
  } catch (err) {
    return [];
  }
}

function shouldExcludeRecord(rec, excludeRegexes) {
  const p = safePath(rec.path);
  const urlPath = (() => {
    try { return safePath(new URL(rec.url).pathname); }
    catch { return safePath(rec.url); }
  })();
  if (excludeRegexes.some(re => re.test(p) || re.test(urlPath))) return true;
  if (/^(tags|categories|assets|images|js|css)(\/|$)/.test(urlPath)) return true;
  if (/^(sitemap\.xml|feed\.xml|robots\.txt)$/.test(urlPath)) return true;
  if (/\/(page\d+|posts\/page\d+)\/?$/.test(urlPath)) return true;
  return false;
}

// 4. 执行推送
(async function main() {
  try {
    console.log(`🔍 正在读取: ${inputPath}...`);
    const raw = await fs.readFile(inputPath, "utf-8");
    let pages = JSON.parse(raw);

    const records = pages.map(p => {
      const url = pickString(p.url, pickString(p.objectID, ""));
      return {
        ...p,
        objectID: stableObjectID(url, 0),
        url,
        title: pickString(p.title, url),
        content: normalizeText(pickString(p.content, "")),
        categories: ensureArray(p.categories),
        tags: ensureArray(p.tags)
      };
    });

    const patterns = await loadExcludePatterns();
    const filtered = records.filter(r => !shouldExcludeRecord(r, patterns));

    console.log(`📦 数据处理: 原始 ${records.length} -> 过滤后 ${filtered.length}`);

    // --- Algolia v5 修正后的调用方式 ---
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

    console.log(`🚀 正在同步至索引: [${ALGOLIA_INDEX_NAME}]...`);

    // 在 v5 中，直接使用 client 上的方法，指定 indexName 即可
    await client.replaceAllObjects({
      indexName: ALGOLIA_INDEX_NAME,
      objects: filtered,
    });

    console.log("✅ Algolia 推送成功！");
  } catch (error) {
    console.error("❌ 执行失败:");
    console.error(error.message);
    process.exit(1);
  }
})();