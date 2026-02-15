import fs from "node:fs/promises";
import crypto from "node:crypto";
import { algoliasearch } from "algoliasearch";
import YAML from "yaml";

/**
 * Algolia 数据推送脚本 - 最终修正版
 * 1. 适配 Algolia v5 SDK 语法
 * 2. 自动截断超长正文，防止 "Record too big" 错误
 */

// 1. 环境变量校验
const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_API_KEY,
  ALGOLIA_INDEX_NAME,
  JEKYLL_CONFIG
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error("❌ 错误: 缺少必要的环境变量 (APP_ID, ADMIN_KEY, INDEX_NAME)");
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

// 4. 执行推送逻辑
(async function main() {
  try {
    console.log(`🔍 正在读取数据: ${inputPath}...`);
    const raw = await fs.readFile(inputPath, "utf-8");
    let pages = JSON.parse(raw);

    // 处理并过滤记录
    const records = pages.map(p => {
      const url = pickString(p.url, pickString(p.objectID, ""));
      const rawContent = normalizeText(pickString(p.content, ""));
      
      return {
        ...p,
        objectID: stableObjectID(url, 0),
        url,
        title: pickString(p.title, url),
        description: pickString(p.description, ""),
        // ✨ 重点：截断内容至 2000 字符，确保不超 10KB 限制
        content: rawContent.slice(0, 2000), 
        categories: ensureArray(p.categories),
        tags: ensureArray(p.tags)
      };
    });

    const patterns = await loadExcludePatterns();
    const filtered = records.filter(r => !shouldExcludeRecord(r, patterns));

    console.log(`📦 数据准备完成: 原始 ${records.length} 条 -> 过滤后 ${filtered.length} 条`);

    // --- Algolia v5 客户端调用 ---
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
    
    console.log(`🚀 正在同步至 Algolia 索引: [${ALGOLIA_INDEX_NAME}]...`);

    // 使用 v5 标准的原子替换方法
    await client.replaceAllObjects({
      indexName: ALGOLIA_INDEX_NAME,
      objects: filtered,
    });

    console.log("✅ Algolia 推送成功！内容已安全截断并完成同步。");
  } catch (error) {
    console.error("❌ 推送失败:");
    console.error(error.message);
    process.exit(1);
  }
})();