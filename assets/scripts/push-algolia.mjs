import fs from "node:fs/promises";
import crypto from "node:crypto";
import { algoliasearch } from "algoliasearch";
import YAML from "yaml";

/**
 * Algolia 数据推送脚本 (适配 Algolia v5 SDK)
 * 作用：读取 Jekyll 生成的 JSON 记录，经过滤后同步至 Algolia 索引。
 */

// 1. 环境变量校验
const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_API_KEY,
  ALGOLIA_INDEX_NAME,
  JEKYLL_CONFIG
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error("❌ 错误: 缺少必要的环境变量 (ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME)");
  process.exit(1);
}

// 输入文件路径，默认为 Jekyll 编译后的路径
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

// 2. 加载 _config.yml 中的排除规则
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
    console.warn("⚠️ 未找到 _config.yml 或解析失败，将跳过自定义排除规则。");
    return [];
  }
}

// 3. 记录过滤逻辑
function shouldExcludeRecord(rec, excludeRegexes) {
  const p = safePath(rec.path);
  const urlPath = (() => {
    try { return safePath(new URL(rec.url).pathname); }
    catch { return safePath(rec.url); }
  })();

  // 匹配自定义规则
  if (excludeRegexes.some(re => re.test(p) || re.test(urlPath))) return true;

  // 匹配默认排除项
  if (/^(tags|categories)(\/|$)/.test(urlPath)) return true;
  if (/^(assets|images|js|css)(\/|$)/.test(urlPath)) return true;
  if (/^(sitemap\.xml|feed\.xml|robots\.txt)$/.test(urlPath)) return true;
  if (/\/page\d+\/?$/.test(urlPath)) return true;
  if (/\/posts\/page\d+\/?$/.test(urlPath)) return true;

  return false;
}

// 4. 执行推送
(async function main() {
  try {
    console.log(`🔍 正在读取数据文件: ${inputPath}...`);
    const raw = await fs.readFile(inputPath, "utf-8");
    let pages = JSON.parse(raw);

    const records = pages.map(p => {
      const url = pickString(p.url, pickString(p.objectID, ""));
      return {
        ...p,
        objectID: stableObjectID(url, 0),
        url,
        title: pickString(p.title, url),
        description: pickString(p.description, ""),
        content: normalizeText(pickString(p.content, "")),
        categories: ensureArray(p.categories),
        tags: ensureArray(p.tags)
      };
    });

    const patterns = await loadExcludePatterns();
    const filtered = records.filter(r => !shouldExcludeRecord(r, patterns));

    console.log(`📦 数据处理完成: 原始 ${records.length} 条 -> 过滤后 ${filtered.length} 条`);

    // 初始化 Algolia 客户端 (v5 语法)
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
    
    // 初始化 SearchClient 进而获取 Index 实例
    const index = client.initSearchClient().initIndex(ALGOLIA_INDEX_NAME);

    console.log(`🚀 正在上传至索引: [${ALGOLIA_INDEX_NAME}]...`);

    // 原子化全量替换
    await index.replaceAllObjects(filtered, {
      autoGenerateObjectIDIfNotExist: true
    });

    console.log("✅ Algolia 数据上传成功！");
  } catch (error) {
    console.error("❌ 执行过程中出错:");
    console.error(error);
    process.exit(1);
  }
})();