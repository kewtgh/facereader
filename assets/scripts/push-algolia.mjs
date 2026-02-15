import fs from "node:fs/promises";
import crypto from "node:crypto";
import { algoliasearch } from "algoliasearch";
import YAML from "yaml";

// 1. 环境变量校验
const { ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME, JEKYLL_CONFIG } = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error("❌ 错误: 缺少必要的环境变量 (APP_ID, ADMIN_KEY, INDEX_NAME)");
  process.exit(1);
}

const inputPath = process.argv[2] || "_site/algolia-records.json";

// --- 工具函数 ---
function normalizeText(text) { return (text || "").replace(/\s+/g, " ").trim(); }
function pickString(v, fallback = "") { return typeof v === "string" ? v : fallback; }
function ensureArray(v) { return Array.isArray(v) ? v : []; }
function stableObjectID(url, idx) {
  const h = crypto.createHash("sha1").update(`${url}#${idx}`).digest("hex").slice(0, 16);
  return `${url}#${idx}-${h}`;
}

/**
 * 路径清洗：强制匹配 permalink: /:categories/:title/
 * 移除物理路径标志，如 /_posts/ 或 /_pages/，确保搜索结果 URL 漂亮
 */
function fixPrettyUrl(rawUrl) {
  try {
    const uri = new URL(rawUrl);
    let path = uri.pathname;
    // 移除物理目录名
    path = path.replace(/\/_(posts|pages|documents)\//g, "/"); 
    // 移除日期前缀 (2022-07-17-)
    path = path.replace(/\/\d{4}-\d{2}-\d{2}-/g, "/");
    // 清理双斜杠并移除 index.html
    path = path.replace(/\/+/g, "/").replace(/index\.html$/, "");
    // 补全结尾斜杠
    if (path && !path.endsWith("/")) path += "/";
    return `${uri.origin}${path}`;
  } catch (e) {
    return rawUrl;
  }
}

function safePath(p) { return String(p || "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, ""); }

async function loadExcludePatterns() {
  try {
    const configPath = JEKYLL_CONFIG || "_config.yml";
    const raw = await fs.readFile(configPath, "utf8");
    const cfg = YAML.parse(raw) || {};
    const excludes = cfg.algolia?.files_to_exclude || [];
    return excludes.map(g => {
      let r = String(g).trim().replace(/^\/+/, "").replace(/\./g, "\\.").replace(/\*\*/g, ".*").replace(/\*/g, "[^/]*");
      return new RegExp(`^${r}$`, "i");
    });
  } catch (e) { return []; }
}

function shouldExcludeRecord(rec, patterns) {
  const p = safePath(rec.path);
  // 1. 显式排除 _pages 文件夹
  if (p.includes("docs/_pages/")) return true;
  // 2. 匹配 _config.yml 配置
  if (patterns.some(re => re.test(p))) return true;
  // 3. 基础排除逻辑
  if (/^(assets|images|js|css)(\/|$)/i.test(p)) return true;
  return false;
}

// 2. 执行主函数
(async function main() {
  try {
    console.log(`🔍 正在读取: ${inputPath}...`);
    const rawData = await fs.readFile(inputPath, "utf-8");
    const pages = JSON.parse(rawData);
    const patterns = await loadExcludePatterns();

    // --- 这里是你要求的链式处理逻辑 ---
    const records = pages
      .filter(p => !shouldExcludeRecord(p, patterns)) // 第一步：过滤排除项
      .map(p => {
        const rawUrl = pickString(p.url, "");
        const prettyUrl = fixPrettyUrl(rawUrl); // 第二步：清洗 URL
        const rawContent = normalizeText(pickString(p.content, ""));

        return {
          ...p,
          url: prettyUrl,
          objectID: stableObjectID(prettyUrl, 0),
          content: rawContent.slice(0, 2000), // 第三步：截断防错
          categories: ensureArray(p.categories),
          tags: ensureArray(p.tags)
        };
      });

    console.log(`📦 数据处理完成: 原始 ${pages.length} 条 -> 过滤后 ${records.length} 条`);

    // 3. Algolia v5 推送
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
    
    console.log(`🚀 正在同步至索引: [${ALGOLIA_INDEX_NAME}]...`);
    await client.replaceAllObjects({
      indexName: ALGOLIA_INDEX_NAME,
      objects: records,
    });

    console.log("✅ Algolia 推送成功！URL 已优化，正文已截断。");
  } catch (error) {
    console.error("❌ 执行出错:", error.message);
    process.exit(1);
  }
})();