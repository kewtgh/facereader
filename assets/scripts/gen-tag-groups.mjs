import fs from "node:fs";
import path from "node:path";

const POSTS_DIRS = ["_posts", "docs/_posts"].filter(d => fs.existsSync(d));

const RULES_FILE = path.join("assets", "scripts", "tag-groups.rules.json");
const OUT_GROUPS_FILE = path.join("_data", "tag-groups.yml");
const OUT_UNMATCHED_FILE = path.join("_data", "tag-unmatched.yml");
const OUT_NORMALIZE_REPORT_FILE = path.join("_data", "tag-normalization-report.yml");

// ---------- utils ----------
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

  const lines = fm.split("\n");
  let idx = -1;
  let firstVal = "";

  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^\s*(tags?)\s*:\s*(.*)\s*$/i); // tags / tag
    if (m) {
      idx = i;
      firstVal = (m[2] || "").trim();
      break;
    }
  }
  if (idx === -1) return [];

  // tags: [a, b]
  if (firstVal.startsWith("[") && firstVal.endsWith("]")) {
    const inside = firstVal.slice(1, -1);
    return inside
      .split(",")
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.replace(/^['"]|['"]$/g, ""));
  }

  // tags: a, b (also Chinese comma)
  if (firstVal && !firstVal.startsWith("-")) {
    return firstVal
      .split(/[,，]/)
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => s.replace(/^['"]|['"]$/g, ""));
  }

  // tags:
  //  - a
  //  - b
  const out = [];
  for (let j = idx + 1; j < lines.length; j++) {
    const line = lines[j];

    // next front matter key
    if (/^\s*[A-Za-z0-9_-]+\s*:\s*.*$/.test(line) && !/^\s*-\s+/.test(line)) break;

    const m = line.match(/^\s*-\s*(.+?)\s*$/);
    if (m) {
      const v = m[1].trim().replace(/^['"]|['"]$/g, "");
      if (v) out.push(v);
    }
  }
  return out;
}

function escapeYmlStr(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function sortByCountThenLocale(a, b, counts) {
  const ca = counts.get(a) || 0;
  const cb = counts.get(b) || 0;
  if (cb !== ca) return cb - ca;
  return a.localeCompare(b, "zh-Hans-CN-u-co-pinyin", { numeric: true, sensitivity: "base" });
}

// ---------- normalization (for matching / dedupe reporting) ----------
function fullwidthToHalfwidth(str) {
  // Convert fullwidth ASCII range to halfwidth
  let out = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    // fullwidth space
    if (code === 0x3000) out += String.fromCharCode(0x20);
    // fullwidth ASCII
    else if (code >= 0xff01 && code <= 0xff5e) out += String.fromCharCode(code - 0xfee0);
    else out += ch;
  }
  return out;
}

function collapseSpaces(str) {
  return str.replace(/\s+/g, " ").trim();
}

function isMostlyAscii(str) {
  // if every char is ASCII
  return /^[\x00-\x7F]+$/.test(str);
}

function normalizeForKey(raw, normalizeCfg) {
  let s = String(raw ?? "").trim();
  if (!s) return "";

  if (normalizeCfg?.fullwidthToHalfwidth) s = fullwidthToHalfwidth(s);
  if (normalizeCfg?.collapseSpaces) s = collapseSpaces(s);

  // only lower-case for ASCII-only tags to avoid breaking Chinese
  if (normalizeCfg?.asciiLowercase && isMostlyAscii(s)) s = s.toLowerCase();

  return s;
}

// ---------- matching helpers ----------
function matchAnyExact(tagNorm, exactList, normalizeCfg) {
  if (!Array.isArray(exactList) || exactList.length === 0) return false;
  for (const x of exactList) {
    if (tagNorm === normalizeForKey(x, normalizeCfg)) return true;
  }
  return false;
}

function matchAnyRegex(tagDisplay, tagNorm, regexList) {
  if (!Array.isArray(regexList) || regexList.length === 0) return false;
  for (const r of regexList) {
    const re = new RegExp(r, "i");
    if (re.test(tagDisplay) || re.test(tagNorm)) return true;
  }
  return false;
}

function isExcluded(tagDisplay, tagNorm, exclude, normalizeCfg) {
  if (!exclude) return false;
  if (matchAnyExact(tagNorm, exclude.exact, normalizeCfg)) return true;
  if (matchAnyRegex(tagDisplay, tagNorm, exclude.regex)) return true;
  return false;
}

function isIncluded(tagDisplay, tagNorm, include, normalizeCfg) {
  if (!include) return false;

  // exact has higher priority (whitelist)
  if (matchAnyExact(tagNorm, include.exact, normalizeCfg)) return true;
  if (matchAnyRegex(tagDisplay, tagNorm, include.regex)) return true;
  return false;
}

function loadRules() {
  if (!fs.existsSync(RULES_FILE)) {
    throw new Error(`Rules file not found: ${RULES_FILE}`);
  }
  return JSON.parse(fs.readFileSync(RULES_FILE, "utf8"));
}

function pickGroup(tagDisplay, tagNorm, rules) {
  // 1) force mapping (whitelist highest priority)
  const force = rules.force || {};
  if (Object.prototype.hasOwnProperty.call(force, tagDisplay)) return force[tagDisplay];

  // 2) group matching with exclude
  for (const g of rules.groups || []) {
    const include = g.match || {};
    const exclude = include.exclude || null;

    if (isExcluded(tagDisplay, tagNorm, exclude, rules.normalize)) continue;
    if (isIncluded(tagDisplay, tagNorm, include, rules.normalize)) return g.key;
  }

  // 3) fallback
  return rules.defaultGroup || "others";
}

// ---------- main ----------
const rules = loadRules();

// collect tag counts
const counts = new Map(); // display tag -> count (keep original display)
const seenVariants = new Map(); // normKey -> Set(display variants)
const normKeyOfDisplay = new Map(); // display -> normKey

const scannedFiles = POSTS_DIRS.flatMap(d => walk(d));
console.log("POSTS_DIRS =", POSTS_DIRS);
console.log("posts scanned =", scannedFiles.length);

for (const file of scannedFiles) {
  const content = fs.readFileSync(file, "utf8");
  const fm = parseFrontMatter(content);
  const tags = extractTags(fm);
  for (const t of tags) {
    const display = String(t).trim();
    if (!display) continue;

    counts.set(display, (counts.get(display) || 0) + 1);

    const k = normalizeForKey(display, rules.normalize);
    normKeyOfDisplay.set(display, k);
    if (!seenVariants.has(k)) seenVariants.set(k, new Set());
    seenVariants.get(k).add(display);
  }
}

console.log("unique tags =", counts.size);

if (counts.size === 0) {
  throw new Error(
    "No tags found. Refuse to overwrite outputs. " +
    "Check POSTS_DIRS and front matter tags format."
  );
}

// init output structure
const groupMap = new Map();
for (const g of rules.groups || []) {
  groupMap.set(g.key, { title_zh: g.title_zh, title_en: g.title_en, tags: [] });
}
// ensure default group exists
if (!groupMap.has(rules.defaultGroup)) {
  groupMap.set(rules.defaultGroup, {
    title_zh: rules.defaultGroup,
    title_en: rules.defaultGroup,
    tags: []
  });
}

// assign tags
const assigned = new Map(); // display tag -> groupKey
const matchedAnyRule = new Set(); // display tag that matched some group include or force (not fallback)
const unmatchedFallback = []; // display tags that fell to defaultGroup due to no match

for (const display of counts.keys()) {
  const norm = normKeyOfDisplay.get(display) || normalizeForKey(display, rules.normalize);

  // determine if matched any rule (force or include)
  let isForce = rules.force && Object.prototype.hasOwnProperty.call(rules.force, display);
  let anyInclude = false;
  if (isForce) {
    anyInclude = true;
  } else {
    for (const g of rules.groups || []) {
      const include = g.match || {};
      const exclude = include.exclude || null;
      if (isExcluded(display, norm, exclude, rules.normalize)) continue;
      if (isIncluded(display, norm, include, rules.normalize)) {
        anyInclude = true;
        break;
      }
    }
  }

  const key = pickGroup(display, norm, rules);
  assigned.set(display, key);

  if (anyInclude) matchedAnyRule.add(display);
  else if (key === (rules.defaultGroup || "others")) unmatchedFallback.push(display);

  if (!groupMap.has(key)) {
    // if rule returns a key not declared in groups, create it (safety)
    groupMap.set(key, { title_zh: key, title_en: key, tags: [] });
  }
  groupMap.get(key).tags.push(display);
}

// sort tags inside each group
for (const [key, g] of groupMap.entries()) {
  g.tags.sort((a, b) => sortByCountThenLocale(a, b, counts));
}

// ---------- write tag-groups.yml (your site consumption) ----------
let yml = "";
for (const g of rules.groups || []) {
  const data = groupMap.get(g.key) || { title_zh: g.title_zh, title_en: g.title_en, tags: [] };
  yml += `${g.key}:\n`;
  yml += `  title_zh: ${escapeYmlStr(data.title_zh)}\n`;
  yml += `  title_en: ${escapeYmlStr(data.title_en)}\n`;
  yml += `  tags:\n`;
  for (const t of data.tags) {
    yml += `    - ${escapeYmlStr(t)}\n`;
  }
}
fs.mkdirSync(path.dirname(OUT_GROUPS_FILE), { recursive: true });
fs.writeFileSync(OUT_GROUPS_FILE, yml, "utf8");
console.log(`✅ Wrote ${OUT_GROUPS_FILE}`);

// ---------- write unmatched list (fell back to defaultGroup with no rule match) ----------
unmatchedFallback.sort((a, b) => sortByCountThenLocale(a, b, counts));

let unmatchedYml = `# Tags that fell back to defaultGroup="${rules.defaultGroup}" because no rule matched\n`;
unmatchedYml += `# format: - tag: "xxx"  count: N\nunmatched:\n`;
for (const t of unmatchedFallback) {
  unmatchedYml += `  - tag: ${escapeYmlStr(t)}\n`;
  unmatchedYml += `    count: ${(counts.get(t) || 0)}\n`;
}
fs.writeFileSync(OUT_UNMATCHED_FILE, unmatchedYml, "utf8");
console.log(`✅ Wrote ${OUT_UNMATCHED_FILE} (${unmatchedFallback.length} tags)`);

// ---------- write normalization report (variants that normalize to same key) ----------
const collisions = [];
for (const [k, set] of seenVariants.entries()) {
  if (set.size >= 2) {
    // sort variants by count desc
    const vars = [...set].sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0));
    collisions.push({ key: k, variants: vars });
  }
}

let normYml = `# Tags with multiple variants that normalize to the same key (case/space/fullwidth differences)\n`;
normYml += `# You may want to unify these tags in posts to avoid duplicates in the UI.\n`;
normYml += `normalized_collisions:\n`;
for (const c of collisions) {
  normYml += `  - normalized_key: ${escapeYmlStr(c.key)}\n`;
  normYml += `    variants:\n`;
  for (const v of c.variants) {
    normYml += `      - tag: ${escapeYmlStr(v)}\n`;
    normYml += `        count: ${(counts.get(v) || 0)}\n`;
  }
}
fs.writeFileSync(OUT_NORMALIZE_REPORT_FILE, normYml, "utf8");
console.log(`✅ Wrote ${OUT_NORMALIZE_REPORT_FILE} (${collisions.length} collision groups)`);

console.log("Done.");
