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
function normalizeText(text) {
  return (text || "").replace(/\s+/g, " ").trim();
}
function stableObjectID(url, idx) {
  const h = crypto.createHash("sha1").update(`${url}#${idx}`).digest("hex").slice(0, 16);
  return `${url}#${idx}-${h}`;
}
function pickString(v, fallback = "") { return typeof v === "string" ? v : fallback; }
function ensureArray(v) { return Array.isArray(v) ? v : []; }

// 路径标准化：移除首尾斜杠，统一使用正斜杠
function safePath(p) {
  return String(p || "").replace(/\\/g, "/").replace(/^\/+|\/+$/g, "");
}

// 2. 加载并转换排除规则
async function loadExcludePatterns() {
  try {
    const configPath = JEKYLL_CONFIG || "_config.yml";
    const raw = await fs.readFile(configPath, "utf8");
    const cfg = YAML.parse(raw) || {};
    const excludes = cfg.algolia?.files_to_exclude || [];
    
    return excludes.map(g => {
      // 处理通配符，特别是像 /docs/_pages/*.* 这样的路径
      let r = String(g).trim()
        .replace(/^\/+/, "")                   // 移除开头的斜杠
        .replace(/\./g, "\\.")                 // 转义点号
        .replace(/\*\*/g, ".*")                // ** 匹配任意路径
        .replace(/\*/g, "[^/]*");              // * 匹配单层文件名
      return new RegExp(`^${r}$`, "i");
    });
  } catch (e) {
    console.warn("⚠️ 配置文件读取失败，使用默认过滤。");
    return [];
  }
}

// 3. 过滤逻辑实现
function shouldExcludeRecord(rec, patterns) {
  const p = safePath(rec.path); // 使用源文件路径进行匹配 (如 docs/_pages/terms.md)
  
  // 匹配 _config.yml 中的规则
  if (patterns.some(re => re.test(p))) return true;

  // 默认内置硬编码过滤 (作为双重保险)
  if (p.startsWith("docs/_pages/")) return true;
  if (/^(tags|categories|assets|images|js|css)(\/|$)/i.test(p)) return true;
  if (/\/(page\d+|posts\/page\d+)\/?$/i.test(rec.url)) return true;

  return false;
}

// 4. 执行主函数
(async function main() {
  try {
    console.log(`🔍 正在读取: ${inputPath}...`);
    const raw = await fs.readFile(inputPath, "utf-8");
    let pages = JSON.parse(raw);

    const patterns = await loadExcludePatterns();

    const records = pages
      .filter(p => !shouldExcludeRecord(p, patterns)) // 先过滤，减少处理开销
      .map(p => {
        const url = pickString(p.url, "");
        const rawContent = normalizeText(pickString(p.content, ""));
        return {
          ...p,
          objectID: stableObjectID(url, 0),
          content: rawContent.slice(0, 2000) // 解决 Record too big 问题
        };
      });

    console.log(`📦 数据处理: 原始 ${pages.length} -> 过滤后 ${records.length}`);

    // Algolia v5 修正后的调用
    const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
    
    console.log(`🚀 正在推送至索引: [${ALGOLIA_INDEX_NAME}]...`);
    await client.replaceAllObjects({
      indexName: ALGOLIA_INDEX_NAME,
      objects: records,
    });

    console.log("✅ Algolia 推送成功！已排除 _pages 文件夹。");
  } catch (error) {
    console.error("❌ 执行失败:", error.message);
    process.exit(1);
  }
})();