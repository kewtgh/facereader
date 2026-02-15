import fs from "node:fs/promises";
import crypto from "node:crypto";
import { algoliasearch } from "algoliasearch";
import YAML from "yaml";

// 1. 环境变量校验
const { ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME, JEKYLL_CONFIG } = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error("❌ 错误: 缺少必要的环境变量");
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
 * 路径清洗：针对 permalink: /:categories/:title/
 * 无论输入是完整 URL 还是相对路径，都强行提取出漂亮链接
 */
function fixPrettyUrl(rawUrl, rawPath) {
  // 如果 URL 为空，则尝试从物理路径构建
  let path = String(rawUrl || rawPath || "");
  
  // 如果是完整 URL，只提取 path 部分
  if (path.startsWith("http")) {
    try {
      path = new URL(path).pathname;
    } catch (e) {
      path = path.replace(/^https?:\/\/[^\/]+/, "");
    }
  }

  // 1. 移除物理目录名
  path = path.replace(/\/_(posts|pages|documents)\//g, "/"); 
  // 2. 移除日期前缀
  path = path.replace(/\/\d{4}-\d{2}-\d{2}-/g, "/");
  // 3. 移除扩展名
  path = path.replace(/\.(html|md)$/, "/");
  // 4. 清理双斜杠并补全结尾斜杠
  path = path.replace(/\/+/g, "/");
  if (path && !path.endsWith("/")) path += "/";
  if (!path.startsWith("/")) path = "/" + path;

  return path;
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
  if (p.includes("docs/_pages/")) return true;
  if (patterns.some(re => re.test(p))) return true;
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

    const records = pages
      .filter(p => !shouldExcludeRecord(p, patterns))
      .map(p => {
        const rawUrl = pickString(p.url, "");
        const rawPath = pickString(p.path, "");
        
        // 核心修复：基于 pathname 重新构建完整的、漂亮的 URL
        const prettyPath = fixPrettyUrl(rawUrl, rawPath);
        const domain = "https://facereader.witbacon.com"; // 你的主站域名
        const finalUrl = `${domain}${prettyPath}`;

        return {
          ...p,
          url: finalUrl,
          objectID: stableObjectID(finalUrl, 0),
          content: normalizeText(pickString(p.content, "")).slice(0, 2000),
          categories: ensureArray(p.categories),
          tags: ensureArray(p.tags)
        };
      });

    console.log(`📦 数据处理完成: 原始 ${pages.length} 条 -> 最终推送 ${records.length} 条`);

    if (records.length === 0) {
      console.warn("⚠️ 没有检测到有效记录，请检查过滤逻辑或 algolia-records.json 内容。");
      return;
    }

    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
    console.log(`🚀 正在同步至索引: [${ALGOLIA_INDEX_NAME}]...`);
    
    await client.replaceAllObjects({
      indexName: ALGOLIA_INDEX_NAME,
      objects: records,
    });

    console.log("✅ Algolia 推送成功！所有记录已强制纠正为漂亮 URL 格式。");
  } catch (error) {
    console.error("❌ 执行出错:", error.message);
    process.exit(1);
  }
})();