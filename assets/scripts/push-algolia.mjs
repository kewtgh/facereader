import fs from "node:fs/promises";
import crypto from "node:crypto";
import { algoliasearch } from "algoliasearch";

const { ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY, ALGOLIA_INDEX_NAME } = process.env;

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_API_KEY || !ALGOLIA_INDEX_NAME) {
  console.error("Missing env: ALGOLIA_APP_ID / ALGOLIA_ADMIN_API_KEY / ALGOLIA_INDEX_NAME");
  process.exit(1);
}

const inputPath = process.argv[2] || "_site/algolia-records.json";
const raw = await fs.readFile(inputPath, "utf-8");
const pages = JSON.parse(raw);

// 保守字节限制，避免 record too big
const MAX_BYTES = 8000;
const MIN_CHUNK_CHARS = 200;
const MAX_HITS_PER_PAGE = 20;

function byteLen(s) {
  return Buffer.byteLength(s || "", "utf8");
}

function chunkText(text) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  if (!t) return [];

  const parts = t.split(/(?<=[。！？.!?])\s+/);
  const chunks = [];
  let buf = "";

  for (const part of parts) {
    const candidate = buf ? `${buf} ${part}` : part;

    if (byteLen(candidate) <= MAX_BYTES) {
      buf = candidate;
      continue;
    }

    if (buf && buf.length >= MIN_CHUNK_CHARS) chunks.push(buf);

    if (byteLen(part) > MAX_BYTES) {
      let start = 0;
      while (start < part.length && chunks.length < MAX_HITS_PER_PAGE) {
        let slice = part.slice(start, start + 1200);
        while (byteLen(slice) > MAX_BYTES && slice.length > 100) {
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

  if (chunks.length <= 1) {
    records.push({
      ...p,
      objectID: stableObjectID(p.url, 0),
      content: (p.content || "").slice(0, 5000),
    });
  } else {
    chunks.forEach((c, i) => {
      records.push({
        ...p,
        objectID: stableObjectID(p.url, i),
        content: c,
        chunk: i,
      });
    });
  }
}

console.log(`Prepared ${records.length} records from ${pages.length} pages`);

console.log("algoliasearch typeof:", typeof algoliasearch);
const client = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_API_KEY);
console.log("client keys:", Object.keys(client));
console.log("client:", client);

// v5: initIndex 在 client.searchClient 上
const index = client.searchClient.initIndex(ALGOLIA_INDEX_NAME);

// 安全替换（原子切换）
await index.replaceAllObjects(records, { safe: true });

console.log("Algolia indexing done.");