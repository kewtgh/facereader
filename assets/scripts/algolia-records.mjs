import crypto from "node:crypto";

export function compileGlob(pattern) {
  if (typeof pattern !== "string" || !pattern.trim()) throw new Error("Invalid search exclusion pattern");
  const glob = pattern.trim().replaceAll("\\", "/").replace(/^\/+/, "");
  let expression = "";
  for (let i = 0; i < glob.length; i++) {
    if (glob[i] === "*" && glob[i + 1] === "*") {
      i++;
      if (glob[i + 1] === "/") { expression += "(?:.*/)?"; i++; }
      else expression += ".*";
    } else if (glob[i] === "*") expression += "[^/]*";
    else if (glob[i] === "?") expression += "[^/]";
    else expression += glob[i].replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${expression}$`, "i");
}
function normalizedPath(value) { return value.replaceAll("\\", "/").replace(/^\/+|\/+$/g, ""); }
function text(value) { return value.replace(/\s+/g, " ").trim(); }
function byteSize(value) { return Buffer.byteLength(JSON.stringify(value), "utf8"); }

export function prepareRecords(pages, config) {
  if (!Array.isArray(pages) || !pages.length) throw new Error("Refusing to replace the index with empty or invalid input");
  if (!config || typeof config.url !== "string" || !Array.isArray(config.algolia?.files_to_exclude)) throw new Error("Invalid search configuration");
  const origin = new URL(config.url).origin;
  const patterns = config.algolia.files_to_exclude.map(compileGlob);
  const urls = new Set();
  const records = [];
  for (const page of pages) {
    if (!page || ["url", "path", "title", "content", "description"].some(field => typeof page[field] !== "string") || !page.title.trim() || !page.path.trim()) throw new Error("Invalid search record fields");
    if (page.type !== "post" || !["zh", "en"].includes(page.language) || !Number.isInteger(page.date_ts) || !Number.isFinite(Date.parse(page.date)) ||
      ![page.categories, page.tags].every(values => Array.isArray(values) && values.every(value => typeof value === "string"))) throw new Error("Invalid search record metadata");
    const url = new URL(page.url);
    if (url.origin !== origin || url.username || url.password || url.search || url.hash || !["https:", "http:"].includes(url.protocol)) throw new Error("Invalid search record URL");
    if (urls.has(page.url)) throw new Error("Duplicate search record URL");
    urls.add(page.url);
    const source = normalizedPath(page.path);
    if (patterns.some(pattern => pattern.test(source)) || /^(docs\/_pages|tags|categories|assets|images|js|css)(\/|$)/i.test(source)) continue;
    const hash = crypto.createHash("sha1").update(`${page.url}#0`).digest("hex").slice(0, 16);
    const record = { ...page, objectID: `${page.url}#0-${hash}`, title: text(page.title), description: text(page.description).slice(0, 350), content: "" };
    if (byteSize(record) > 9000) throw new Error("Search metadata exceeds the record size budget");
    const characters = Array.from(text(page.content)).slice(0, 2000);
    let low = 0, high = characters.length;
    while (low < high) {
      const middle = Math.ceil((low + high) / 2);
      record.content = characters.slice(0, middle).join("");
      if (byteSize(record) <= 9000) low = middle;
      else high = middle - 1;
    }
    record.content = characters.slice(0, low).join("");
    records.push(record);
  }
  if (!records.length) throw new Error("Refusing to replace the index after all records were excluded");
  return records;
}
