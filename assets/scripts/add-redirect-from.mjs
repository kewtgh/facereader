import fs from "node:fs";
import path from "node:path";

const POSTS_DIR = "docs/_posts";
const exts = new Set([".md", ".markdown", ".html"]);
const DRY_RUN = false;   // 想先预览就改 true
const VERBOSE = true;

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else if (exts.has(path.extname(ent.name).toLowerCase())) out.push(full);
  }
  return out;
}

function splitFrontMatter(text) {
  if (!text.startsWith("---")) return { hasFM: false, fmText: "", body: text };
  const end = text.indexOf("\n---", 3);
  if (end === -1) return { hasFM: false, fmText: "", body: text };
  const fmText = text.slice(3, end).replace(/^\n/, "").trimEnd();
  const body = text.slice(end + 4);
  return { hasFM: true, fmText, body };
}

// ✅ 关键：支持 categories: 后面跟多行 "- xxx"
function parseCategoriesFromFM(fmText) {
  const lines = fmText.split("\n");
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // categories: [a, b]
    let m = line.match(/^categories:\s*\[(.*)\]\s*$/);
    if (m) {
      const inside = m[1].trim();
      if (!inside) return [];
      return inside.split(",").map(s => s.trim()).filter(Boolean);
    }

    // categories: a b c
    m = line.match(/^categories:\s+(.+)\s*$/);
    if (m && !m[1].startsWith("#")) {
      return m[1].split(/\s+/).filter(Boolean);
    }

    // categories:   (multi-line list)
    if (/^categories:\s*$/.test(line)) {
      const cats = [];
      // consume following "- xxx" lines (indented or not)
      for (let j = i + 1; j < lines.length; j++) {
        const l = lines[j];

        // stop if next key begins (e.g. tags:, title:, header:)
        if (/^[A-Za-z0-9_]+:\s*/.test(l) && !/^\s*-/.test(l)) break;

        const item = l.match(/^\s*-\s*(.+?)\s*$/);
        if (item) cats.push(item[1]);
      }
      return cats;
    }
  }
  return [];
}

function parseSlugFromFM(fmText) {
  // 支持 slug: xxx （单行）
  const m = fmText.match(/^slug:\s*(.+)\s*$/m);
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}

function hasRedirectFrom(fmText) {
  return /\nredirect_from:\s*\n/.test("\n" + fmText + "\n");
}

function addRedirectFromBlock(fmText, oldPath) {
  return fmText.replace(/\s*$/, "") + `\nredirect_from:\n  - ${oldPath}\n`;
}

function getSlugFromFilename(file) {
  const base = path.basename(file).replace(/\.(md|markdown|html)$/i, "");
  const m = base.match(/^\d{4}-\d{2}-\d{2}-(.+)$/);
  return (m ? m[1] : base).replace(/\s+/g, "-");
}

function encodeSegments(arr) {
  return arr.map(s => encodeURIComponent(s));
}

const files = walk(POSTS_DIR);
if (!files.length) {
  console.error(`❗ No files found under ${POSTS_DIR}. Check POSTS_DIR path.`);
  process.exit(1);
}

let total = 0, changed = 0, skippedHasRedirect = 0, skippedNoCats = 0, skippedNoFM = 0;

for (const file of files) {
  total++;
  const raw = fs.readFileSync(file, "utf8");
  const { hasFM, fmText, body } = splitFrontMatter(raw);
  if (!hasFM) {
    skippedNoFM++;
    if (VERBOSE) console.log(`SKIP(no front matter): ${file}`);
    continue;
  }

  if (hasRedirectFrom(fmText)) {
    skippedHasRedirect++;
    if (VERBOSE) console.log(`SKIP(has redirect_from): ${file}`);
    continue;
  }

  const cats = parseCategoriesFromFM(fmText);
  if (!cats.length) {
    skippedNoCats++;
    if (VERBOSE) console.log(`SKIP(no categories): ${file}`);
    continue;
  }

  const fmSlug = parseSlugFromFM(fmText);
  const slug = fmSlug || getSlugFromFilename(file);

  // 旧地址：/docs/<cat1>/<cat2>/<...>/<slug>/
  const oldPath = `/docs/${encodeSegments(cats).join("/")}/${encodeURIComponent(slug)}/`;

  const newFmText = addRedirectFromBlock(fmText, oldPath);
  const out = `---\n${newFmText}\n---${body.startsWith("\n") ? "" : "\n"}${body}`;

  if (!DRY_RUN) fs.writeFileSync(file, out, "utf8");
  changed++;
  if (VERBOSE) console.log(`ADD: ${file}\n  -> ${oldPath}`);
}

console.log("\n=== Summary ===");
console.log(`Total scanned: ${total}`);
console.log(`Updated: ${changed}`);
console.log(`Skipped (no front matter): ${skippedNoFM}`);
console.log(`Skipped (already has redirect_from): ${skippedHasRedirect}`);
console.log(`Skipped (no categories): ${skippedNoCats}`);
console.log(DRY_RUN ? "DRY_RUN=true (no files written)" : "DRY_RUN=false (files written)");
