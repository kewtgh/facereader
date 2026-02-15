/**
 * push-algolia.mjs
 *
 * Usage:
 *   node assets/scripts/push-algolia.mjs _site/algolia-records.json
 *
 * Env required:
 *   ALGOLIA_APP_ID
 *   ALGOLIA_ADMIN_API_KEY
 *   ALGOLIA_INDEX_NAME
 *
 * Notes:
 * - Algolia JS Client v5 has NO initIndex(). All operations are done on the client with indexName passed in.
 *   https://algolia.com/doc/libraries/sdk/upgrade/javascript
 * - replaceAllObjects uses a temporary index. Your API key must have rights for the tmp index as well.
 *   https://algolia.com/doc/libraries/sdk/methods/search/replace-all-objects
 */

import fs from "node:fs/promises";
import crypto from "node:crypto";
import { algoliasearch } from "algoliasearch";
import YAML from "yaml";
import path from "node:path";

const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_API_KEY,
  ALGOLIA_INDEX_NAME,
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error(
    "Missing env vars. Required: ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME"
  );
  process.exit(1);
}

const inputPath = process.argv[2] || "_site/algolia-records.json";

/**
 * Keep records comfortably below typical per-record size limits.
 * You previously saw 9.765KB threshold errors in Crawler; we'll stay conservative.
 */
const MAX_BYTES = Number(process.env.ALGOLIA_MAX_BYTES || 8000);
const MIN_CHUNK_CHARS = Number(process.env.ALGOLIA_MIN_CHUNK_CHARS || 200);
const MAX_HITS_PER_PAGE = Number(process.env.ALGOLIA_MAX_HITS_PER_PAGE || 20);
const BATCH_SIZE = Number(process.env.ALGOLIA_BATCH_SIZE || 1000);

// ---- utils ----
function byteLen(s) {
  return Buffer.byteLength(s || "", "utf8");
}

function normalizeText(text) {
  return (text || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Chunk text by sentence-ish boundaries first, then hard-slice if needed.
 * Goal: each chunk <= MAX_BYTES (utf8).
 */
function chunkText(text) {
  const t = normalizeText(text);
  if (!t) return [];

  // Try to split by punctuation + whitespace (works okay for Chinese & English)
  const parts = t.split(/(?<=[。！？.!?])\s+/);
  const chunks = [];
  let buf = "";

  for (const part of parts) {
    const candidate = buf ? `${buf} ${part}` : part;

    if (byteLen(candidate) <= MAX_BYTES) {
      buf = candidate;
      continue;
    }

    // flush current buffer
    if (buf && buf.length >= MIN_CHUNK_CHARS) chunks.push(buf);

    // if single part itself is too big, hard split
    if (byteLen(part) > MAX_BYTES) {
      let start = 0;
      while (start < part.length && chunks.length < MAX_HITS_PER_PAGE) {
        let slice = part.slice(start, start + 1200);

        // shrink slice until within byte limit
        while (byteLen(slice) > MAX_BYTES && slice.length > 120) {
          slice = slice.slice(0, Math.floor(slice.length * 0.8));
        }

        if (slice.length >= MIN_CHUNK_CHARS) chunks.push(slice);
        start += 1200;
      }
      buf = "";
    } else {
      buf = part;
    }

    if (chunks.length >= MAX_HITS_PER_PAGE) break;
  }

  if (buf && buf.length >= MIN_CHUNK_CHARS && chunks.length < MAX_HITS_PER_PAGE) {
    chunks.push(buf);
  }

  return chunks;
}

function stableObjectID(url, idx) {
  const h = crypto
    .createHash("sha1")
    .update(`${url}#${idx}`)
    .digest("hex")
    .slice(0, 16);
  return `${url}#${idx}-${h}`;
}

function pickString(v, fallback = "") {
  return typeof v === "string" ? v : fallback;
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

// ---- main ----
(async function main() {
  const raw = await fs.readFile(inputPath, "utf-8");
  let pages;
  try {
    pages = JSON.parse(raw);
  } catch (e) {
    console.error(`Failed to parse JSON at ${inputPath}`);
    throw e;
  }

  // Build chunked records
  const records = [];
  for (const p of pages) {
    const url = pickString(p.url, pickString(p.objectID, ""));
    if (!url) continue;

    const content = pickString(p.content, "");
    const chunks = chunkText(content);

    const base = {
      // Keep original fields; your front-end can map headline/title etc.
      ...p,
      url: url,
      title: pickString(p.title, pickString(p.headline, url)),
      description: pickString(p.description, ""),
      categories: ensureArray(p.categories),
      tags: ensureArray(p.tags),
    };

    if (chunks.length <= 1) {
      records.push({
        ...base,
        objectID: stableObjectID(url, 0),
        content: normalizeText(content).slice(0, 5000),
      });
    } else {
      chunks.forEach((c, i) => {
        records.push({
          ...base,
          objectID: stableObjectID(url, i),
          content: c,
          chunk: i,
        });
      });
    }
  }

  // Ensure objectID exists
  const missing = records.find((r) => !r.objectID);
  if (missing) {
    throw new Error(
      `Missing objectID in record: ${JSON.stringify(missing).slice(0, 200)}`
    );
  }

  console.log(`Prepared ${records.length} records from ${pages.length} pages`);
  console.log(
    `Chunking policy: MAX_BYTES=${MAX_BYTES}, MAX_HITS_PER_PAGE=${MAX_HITS_PER_PAGE}, BATCH_SIZE=${BATCH_SIZE}`
  );

  // 读取 _config.yml 中的排除规则
  async function loadExcludePatterns() {
    const configPath = process.env.JEKYLL_CONFIG || "_config.yml";
    const yml = await fs.readFile(configPath, "utf8");
    const cfg = YAML.parse(yml) || {};
    const patterns = cfg?.algolia?.files_to_exclude || [];
    return Array.isArray(patterns) ? patterns : [];
  }

  // glob -> RegExp（支持 *, **）
  function globToRegExp(glob) {
    let g = String(glob || "").trim();
    // 你 _config.yml 里很多 pattern 以 / 开头，Jekyll 的 p.path 不以 / 开头，所以统一去掉前导 /
    g = g.replace(/^[./]+/, "").replace(/^\/+/, "");
    // 转义正则特殊字符
    g = g.replace(/[.+^${}()|[\]\\]/g, "\\$&");
    // ** -> .*
    g = g.replace(/\\\*\\\*/g, ".*");
    // * -> [^/]* (不跨目录)
    g = g.replace(/\\\*/g, "[^/]*");
    return new RegExp(`^${g}$`);
  }

  function safePath(p) {
    return String(p || "").replace(/\\/g, "/").replace(/^\/+/, "");
  }

  function shouldExcludeRecord(rec, excludeRegexes) {
    const p = safePath(rec.path);
    const urlPath = (() => {
      try {
        const u = new URL(rec.url);
        return safePath(u.pathname);
      } catch {
        return safePath(rec.url);
      }
    })();

    // 1) 先用 _config.yml 里的 files_to_exclude 匹配 path / urlPath
    if (excludeRegexes.some((re) => re.test(p) || re.test(urlPath))) return true;

    // 2) 额外兜底：排除常见“非内容页”（你不想手动 search:false 的那些）
    if (/^(tags|categories)(\/|$)/.test(urlPath)) return true;
    if (/^(assets|images|js|css)(\/|$)/.test(urlPath)) return true;
    if (/^(sitemap\.xml|feed\.xml|robots\.txt)$/.test(urlPath)) return true;

    return false;
  }

  // —— 在你 records 生成完成后调用 ——
  // const records = ...;

  const excludePatterns = await loadExcludePatterns();
  const excludeRegexes = excludePatterns.map(globToRegExp);

  // 过滤前/后统计
  const before = records.length;
  const filtered = records.filter((r) => !shouldExcludeRecord(r, excludeRegexes));
  const after = filtered.length;

  console.log(`Exclude patterns loaded: ${excludePatterns.length}`);
  console.log(`Records filtered: ${before} -> ${after} (excluded ${before - after})`);

  // 后面上传用 filtered 而不是 records
  // await client.replaceAllObjects({ indexName: ..., objects: filtered, ... })

  const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);

  // Algolia v5: replaceAllObjects at client-level, pass indexName.
  // It uses a temporary index. Your key must have access to tmp index too.
  // https://algolia.com/doc/libraries/sdk/methods/search/replace-all-objects
  const res = await client.replaceAllObjects(
    {
      indexName: ALGOLIA_INDEX_NAME,
      objects: records,
      batchSize: BATCH_SIZE,
      // Keep existing index config
      scopes: ["settings", "synonyms", "rules"],
      // Wait for tasks so CI only succeeds when indexing is actually done
      waitForTasks: true,
    },
    {
      // Extra safety: ensure moveIndex waits for indexing completion
      // (Some accounts/versions may ignore it, but it's safe to pass)
      queryParameters: { safe: true },
    }
  );

  console.log(
    `Algolia indexing done. Operations: ${Array.isArray(res) ? res.length : "ok"}`
  );
})().catch((err) => {
  console.error(err);
  process.exit(1);
});