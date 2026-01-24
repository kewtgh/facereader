import fs from "node:fs";
import path from "node:path";

/**
 * 扫描 _posts 里的 Front Matter tags，并按规则生成 _data/tag-groups.yml
 * 兼容 GitHub Pages（不依赖 Jekyll 插件）
 */

const POSTS_DIRS = ["docs/_posts"];
const RULES_FILE = path.join("assets", "scripts", "tag-groups.rules.json");
const OUT_FILE = path.join("_data", "tag-groups.yml");

// ---------- helpers ----------
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(md|markdown|html)$/i.test(name)) out.push(p);
  }
  return out;
}

function stripBom(s) {
  return s && s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function parseFrontMatter(content) {
  // 支持 BOM、CRLF/LF，按行找 --- 分隔更稳
  content = stripBom(content);
  const lines = content.split(/\r?\n/);
  if (lines[0]?.trim() !== "---") return null;

  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i;
      break;
    }
  }
  if (end === -1) return null;
  return lines.slice(1, end).join("\n");
}

function extractTags(fm) {
  if (!fm) return [];

  // 允许 tags/tag/Tags/TAG 等（大小写不敏感）
  const lines = fm.split("\n");
  let idx = -1;
  let firstVal = "";

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(tags?)\s*:\s*(.*)\s*$/i);
    if (m) {
      idx = i;
      firstVal = (m[2] || "").trim();
      break;
    }
  }
  if (idx === -1) return [];

  // 1) tags: [a, b]
  if (firstVal.startsWith("[") && firstVal.endsWith("]")) {
    const inside = firstVal.slice(1, -1);
    return inside
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.replace(/^['"]|['"]$/g, ""));
  }

  // 2) tags: a, b（支持中文逗号）
  if (firstVal && !firstVal.startsWith("-")) {
    return firstVal
      .split(/[,，]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.replace(/^['"]|['"]$/g, ""));
  }

  // 3) tags:
  //    - a
  //    - b
  const out = [];
  for (let j = idx + 1; j < lines.length; j++) {
    const line = lines[j];

    // 遇到下一个 front matter key 就停止（例如 categories:、sidebar: 等）
    if (/^\s*[A-Za-z0-9_-]+\s*:\s*.*$/.test(line) && !/^\s*-\s+/.test(line)) {
      break;
    }

    const m = line.match(/^\s*-\s*(.+?)\s*$/);
    if (m) {
      const v = m[1].trim().replace(/^['"]|['"]$/g, "");
      if (v) out.push(v);
    }
  }
  return out;
}


function escapeYmlStr(s) {
  // 统一用双引号，避免冒号、#、中文等导致 YAML 歧义
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function sortNatural(a, b) {
  return a.localeCompare(b, "zh-Hans-CN-u-co-pinyin", { numeric: true, sensitivity: "base" });
}

function loadRules() {
  if (!fs.existsSync(RULES_FILE)) {
    throw new Error(`Rules file not found: ${RULES_FILE}`);
  }
  return JSON.parse(fs.readFileSync(RULES_FILE, "utf8"));
}

function pickGroup(tag, rules) {
  for (const g of rules.groups) {
    const exact = g.match?.exact || [];
    if (exact.includes(tag)) return g.key;

    const regexList = g.match?.regex || [];
    for (const r of regexList) {
      const re = new RegExp(r, "i");
      if (re.test(tag)) return g.key;
    }
  }
  return rules.defaultGroup;
}

// ---------- main ----------
const rules = loadRules();

// 1) collect tag counts
const counts = new Map();
for (const dir of POSTS_DIRS) {
  for (const file of walk(dir)) {
    const content = fs.readFileSync(file, "utf8");
    const fm = parseFrontMatter(content);
    const tags = extractTags(fm);
    for (const t of tags) {
      counts.set(t, (counts.get(t) || 0) + 1);
    }
  }
}

// debug

const scannedFiles = POSTS_DIRS.flatMap(d => walk(d));
console.log("POSTS_DIRS =", POSTS_DIRS);
console.log("posts scanned =", scannedFiles.length);
console.log("unique tags =", counts.size);
if (scannedFiles.length > 0) console.log("sample post =", scannedFiles[0]);

if (counts.size === 0) {
  throw new Error(
    `No tags found. Refuse to overwrite ${OUT_FILE}. ` +
    `Check POSTS_DIRS and front matter tags format.`
  );
}

// 2) init groups
const groupMap = new Map();
for (const g of rules.groups) {
  groupMap.set(g.key, {
    title_zh: g.title_zh,
    title_en: g.title_en,
    tags: []
  });
}
// default group must exist
if (!groupMap.has(rules.defaultGroup)) {
  groupMap.set(rules.defaultGroup, {
    title_zh: rules.defaultGroup,
    title_en: rules.defaultGroup,
    tags: []
  });
}

// 3) assign tags
for (const tag of counts.keys()) {
  const key = pickGroup(tag, rules);
  groupMap.get(key).tags.push(tag);
}

// 4) sort tags in each group (by count desc, then natural)
for (const [key, g] of groupMap.entries()) {
  g.tags.sort((a, b) => {
    const ca = counts.get(a) || 0;
    const cb = counts.get(b) || 0;
    if (cb !== ca) return cb - ca;
    return sortNatural(a, b);
  });
}

// 5) output YAML in the exact structure your tags page expects:
//    leadership: {title_zh,title_en,tags: [...] } etc. :contentReference[oaicite:3]{index=3}
let yml = "";
for (const g of rules.groups) {
  const data = groupMap.get(g.key);
  if (!data) continue;
  yml += `${g.key}:\n`;
  yml += `  title_zh: ${escapeYmlStr(data.title_zh)}\n`;
  yml += `  title_en: ${escapeYmlStr(data.title_en)}\n`;
  yml += `  tags:\n`;
  for (const t of data.tags) {
    yml += `    - ${escapeYmlStr(t)}\n`;
  }
}

// ensure output dir
fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
fs.writeFileSync(OUT_FILE, yml, "utf8");

console.log(`✅ Generated ${OUT_FILE} (${counts.size} tags)`);
