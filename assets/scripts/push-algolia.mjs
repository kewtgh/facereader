import fs from "node:fs/promises";
import crypto from "node:crypto";
import algoliasearch from "algoliasearch";

const {
  ALGOLIA_APP_ID,
  ALGOLIA_ADMIN_API_KEY,
  ALGOLIA_INDEX_NAME,
} = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error("Missing env: ALGOLIA_APP_ID / ALGOLIA_ADMIN_API_KEY / ALGOLIA_INDEX_NAME");
  process.exit(1);
}

const inputPath = process.argv[2] || "_site/algolia-records.json";
const raw = await fs.readFile(inputPath, "utf-8");
const pages = JSON.parse(raw);

// —— 关键：按“字节”控制，保守一点，避免 Algolia plan 限制触发 Record too big ——
// 你之前看到 9.765KB 这类阈值报错很典型。:contentReference[oaicite:6]{index=6}
const MAX_BYTES = 8000; // 留余量，避免 metadata + unicode 超限
const MIN_CHUNK_CHARS = 200; // 太短没意义
const MAX_HITS_PER_PAGE = 20; // 防止单页拆太多

function byteLen(s) {
  return Buffer.byteLength(s || "", "utf8");
}

function chunkText(text) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return [];

  // 先按段落/句号做粗切，尽量保持语义块
  const parts = t.split(/(?<=[。！？.!?])\s+/);
  const chunks = [];
  let buf = "";

  for (const part of parts) {
    const candidate = buf ? `${buf} ${part}` : part;

    if (byteLen(candidate) <= MAX_BYTES) {
      buf = candidate;
      continue;
    }

    // buf 已经接近上限了，先落盘
    if (buf && buf.length >= MIN_CHUNK_CHARS) chunks.push(buf);

    // 单个 part 本身就超限：硬切
    if (byteLen(part) > MAX_BYTES) {
      let start = 0;
      while (start < part.length) {
        const slice = part.slice(start, start + 1200); // 字符切片，再靠 byteLen 校准
        // 若 slice 仍超，继续缩
        let s = slice;
        while (byteLen(s) > MAX_BYTES && s.length > 100) s = s.slice(0, Math.floor(s.length * 0.8));
        if (s.length >= MIN_CHUNK_CHARS) chunks.push(s);
        start += slice.length;
        if (chunks.length >= MAX_HITS_PER_PAGE) break;
      }
      buf = "";
    } else {
      buf = part;
    }

    if (chunks.length >= MAX_HITS_PER_PAGE) break;
  }

  if (buf && buf.length >= MIN_CHUNK_CHARS && chunks.length < MAX_HITS_PER_PAGE) chunks.push(buf);
  return chunks;
}

function stableObjectID(url, idx) {
  const h = crypto.createHash("sha1").update(`${url}#${idx}`).digest("hex").slice(0, 16);
  return `${url}#${idx}-${h}`;
}

const records = [];
for (const p of pages) {
  const chunks = chunkText(p.content);

  // 如果 content 很短，就只做 1 条；否则多条 chunk（同一 url）
  if (chunks.length <= 1) {
    records.push({
      ...p,
      objectID: stableObjectID(p.url, 0),
      url: p.url,
      content: (p.content || "").slice(0, 5000),
    });
  } else {
    chunks.forEach((c, i) => {
      records.push({
        ...p,
        objectID: stableObjectID(p.url, i),
        url: p.url,
        content: c,
        chunk: i,
      });
    });
  }
}

console.log(`Prepared ${records.length} records from ${pages.length} pages`);

const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
const index = client.initIndex(ALGOLIA_INDEX_NAME);

// 用 safe 替换：临时索引构建完成后再原子切换（更安全）:contentReference[oaicite:7]{index=7}
await index.replaceAllObjects(records, { safe: true });

console.log("Algolia indexing done.");