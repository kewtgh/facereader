/**
 * gen-tag-groups.mjs
 * -------------------
 * Generate `_data/tag-groups.yml` from post front matter tags, using rules:
 *   assets/scripts/tag-groups.rules.json
 *
 * ✅ Supports:
 *  - force (whitelist, highest priority)
 *  - match.exact / match.regex
 *  - match.exclude.exact / match.exclude.regex (negative match)
 *  - normalize (ascii lowercase + collapse spaces + fullwidth->halfwidth) for matching
 *
 * ✅ If a tag does NOT match the 5 groups, it will NOT be shown (not written into tag-groups.yml)
 *
 * ✅ Also outputs:
 *  - `_data/tag-unmatched.yml` : tags not matched by any rule (so hidden)
 *  - `_data/tag-normalization-report.yml` : normalization collisions (e.g. Cronyism vs cronyism)
 */

import fs from "node:fs";
import path from "node:path";

// -------------------- paths --------------------
const RULES_FILE = path.join("assets", "scripts", "tag-groups.rules.json");
const OUT_GROUPS_FILE = path.join("_data", "tag-groups.yml");
const OUT_UNMATCHED_FILE = path.join("_data", "tag-unmatched.yml");
const OUT_NORMALIZE_REPORT_FILE = path.join("_data", "tag-normalization-report.yml");

// Auto-detect common post dirs (GitHub Actions safe)
const POSTS_DIRS = ["_posts", "docs/_posts", "content/_posts", "blog/_posts"].filter((d) =>
  fs.existsSync(d)
);

// -------------------- filesystem helpers --------------------
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

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

// -------------------- front matter parsing --------------------
function stripBom(s) {
  return s && s.charCodeAt(0) === 0xfeff ? s.slice(1) : s;
}

function parseFrontMatter(content) {
  // Robust parsing for LF/CRLF/BOM. We ONLY read the YAML front matter block.
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

/**
 * Supports:
 *   tags: [a, b]
 *   tags: a, b   (also Chinese comma)
 *   tags:
 *     - a
 *     - b
 * Also supports `tag:` singular.
 */
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

  // 1) tags: [a, b]
  if (firstVal.startsWith("[") && firstVal.endsWith("]")) {
    const inside = firstVal.slice(1, -1);
    return inside
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^['"]|['"]$/g, ""));
  }

  // 2) tags: a, b  (including Chinese comma)
  if (firstVal && !firstVal.startsWith("-")) {
    return firstVal
      .split(/[,，]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => s.replace(/^['"]|['"]$/g, ""));
  }

  // 3) tags:
  //    - a
  //    - b
  const out = [];
  for (let j = idx + 1; j < lines.length; j++) {
    const line = lines[j];

    // Stop at next YAML key (e.g., title:, categories:, etc.)
    if (/^\s*[A-Za-z0-9_-]+\s*:\s*.*$/.test(line) && !/^\s*-\s+/.test(line)) break;

    const m = line.match(/^\s*-\s*(.+?)\s*$/);
    if (m) {
      const v = m[1].trim().replace(/^['"]|['"]$/g, "");
      if (v) out.push(v);
    }
  }
  return out;
}

// -------------------- YAML helpers --------------------
function escapeYmlStr(s) {
  return `"${String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function sortByCountThenLocale(a, b, counts) {
  const ca = counts.get(a) || 0;
  const cb = counts.get(b) || 0;
  if (cb !== ca) return cb - ca;
  return a.localeCompare(b, "zh-Hans-CN-u-co-pinyin", { numeric: true, sensitivity: "base" });
}

// -------------------- normalization --------------------
function fullwidthToHalfwidth(str) {
  let out = "";
  for (const ch of str) {
    const code = ch.charCodeAt(0);
    if (code === 0x3000) out += String.fromCharCode(0x20); // fullwidth space
    else if (code >= 0xff01 && code <= 0xff5e) out += String.fromCharCode(code - 0xfee0);
    else out += ch;
  }
  return out;
}

function collapseSpaces(str) {
  return str.replace(/\s+/g, " ").trim();
}

function isMostlyAscii(str) {
  return /^[\x00-\x7F]+$/.test(str);
}

/**
 * Normalization is ONLY used for matching (not altering the displayed tags),
 * so it won't break your Jekyll tag keys.
 */
function normalizeForKey(raw, normalizeCfg) {
  let s = String(raw ?? "").trim();
  if (!s) return "";

  if (normalizeCfg?.fullwidthToHalfwidth) s = fullwidthToHalfwidth(s);
  if (normalizeCfg?.collapseSpaces) s = collapseSpaces(s);

  // Lowercase only ASCII tags
  if (normalizeCfg?.asciiLowercase && isMostlyAscii(s)) s = s.toLowerCase();

  return s;
}

// -------------------- rules matching --------------------
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
  // exact has higher priority inside a group
  if (matchAnyExact(tagNorm, include.exact, normalizeCfg)) return true;
  if (matchAnyRegex(tagDisplay, tagNorm, include.regex)) return true;
  return false;
}

function loadRules() {
  if (!fs.existsSync(RULES_FILE)) {
    throw new Error(`Rules file not found: ${RULES_FILE}`);
  }
  const rules = JSON.parse(fs.readFileSync(RULES_FILE, "utf8"));
  if (!Array.isArray(rules.groups) || rules.groups.length === 0) {
    throw new Error(`Rules file must contain a non-empty "groups" array: ${RULES_FILE}`);
  }
  return rules;
}

/**
 * Returns:
 *  - groupKey (one of rules.groups[*].key) when matched
 *  - null when NOT matched (=> do NOT show on tags page)
 *
 * IMPORTANT: This fulfills "no others, no fallback".
 */
function pickGroup(tagDisplay, tagNorm, rules) {
  const allowed = new Set((rules.groups || []).map((g) => g.key));

  // 1) force: highest priority (but must point to an allowed group)
  const force = rules.force || {};
  if (Object.prototype.hasOwnProperty.call(force, tagDisplay)) {
    const k = force[tagDisplay];
    return allowed.has(k) ? k : null;
  }

  // 2) evaluate each group with exclude/include
  for (const g of rules.groups || []) {
    const include = g.match || {};
    const exclude = include.exclude || null;

    if (isExcluded(tagDisplay, tagNorm, exclude, rules.normalize)) continue;
    if (isIncluded(tagDisplay, tagNorm, include, rules.normalize)) return g.key;
  }

  // 3) No default group
  return null;
}

// -------------------- main --------------------
const rules = loadRules();

// Collect tag counts from posts
const counts = new Map(); // display tag -> count
const normKeyOfDisplay = new Map(); // display -> normalizedKey (for matching)
const seenVariants = new Map(); // normalizedKey -> Set(variants) (for report)

const scannedFiles = POSTS_DIRS.flatMap((d) => walk(d));
console.log("POSTS_DIRS =", POSTS_DIRS);
console.log("posts scanned =", scannedFiles.length);

if (scannedFiles.length === 0) {
  throw new Error(
    `No posts found. Checked dirs: ${JSON.stringify(POSTS_DIRS)}. ` +
      `Fix POSTS_DIRS or your repo structure.`
  );
}

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
    "No tags found in scanned posts. Refuse to overwrite outputs. " +
      "Check your post front matter `tags:` field."
  );
}

// Initialize output groups map (ONLY the declared groups)
const groupMap = new Map();
for (const g of rules.groups) {
  groupMap.set(g.key, { title_zh: g.title_zh, title_en: g.title_en, tags: [] });
}

// Assign tags: only keep those matched to the 5 groups; otherwise skip (hidden)
const unmatchedHidden = []; // tags that are hidden (not matched)
for (const display of counts.keys()) {
  const norm = normKeyOfDisplay.get(display) || normalizeForKey(display, rules.normalize);
  const key = pickGroup(display, norm, rules);

  if (!key) {
    unmatchedHidden.push(display);
    continue; // not written to tag-groups.yml
  }

  // Safety: key must exist in groupMap
  if (!groupMap.has(key)) {
    // If force pointed to a missing group, pickGroup returns null, so this shouldn't happen
    unmatchedHidden.push(display);
    continue;
  }

  groupMap.get(key).tags.push(display);
}

// Sort tags in each group
for (const g of rules.groups) {
  const data = groupMap.get(g.key);
  data.tags.sort((a, b) => sortByCountThenLocale(a, b, counts));
}

// Write _data/tag-groups.yml (only declared groups + matched tags)
let yml = "";
for (const g of rules.groups) {
  const data = groupMap.get(g.key);
  yml += `${g.key}:\n`;
  yml += `  title_zh: ${escapeYmlStr(data.title_zh)}\n`;
  yml += `  title_en: ${escapeYmlStr(data.title_en)}\n`;
  yml += `  tags:\n`;
  for (const t of data.tags) {
    yml += `    - ${escapeYmlStr(t)}\n`;
  }
}

ensureDir(OUT_GROUPS_FILE);
fs.writeFileSync(OUT_GROUPS_FILE, yml, "utf8");
console.log(`✅ Wrote ${OUT_GROUPS_FILE}`);

// Write _data/tag-unmatched.yml (hidden tags)
unmatchedHidden.sort((a, b) => sortByCountThenLocale(a, b, counts));

let unmatchedYml =
  `# Tags NOT shown on /tags/ because they do not match any declared group rules\n` +
  `# You can fix by adding to rules.force / match.exact / match.regex\n` +
  `unmatched:\n`;

for (const t of unmatchedHidden) {
  unmatchedYml += `  - tag: ${escapeYmlStr(t)}\n`;
  unmatchedYml += `    count: ${(counts.get(t) || 0)}\n`;
}

ensureDir(OUT_UNMATCHED_FILE);
fs.writeFileSync(OUT_UNMATCHED_FILE, unmatchedYml, "utf8");
console.log(`✅ Wrote ${OUT_UNMATCHED_FILE} (${unmatchedHidden.length} tags)`);

// Write normalization report: collisions (multiple variants normalize to same key)
const collisions = [];
for (const [k, set] of seenVariants.entries()) {
  if (set.size >= 2) {
    const vars = [...set].sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0));
    collisions.push({ key: k, variants: vars });
  }
}

let normYml =
  `# Tags with multiple variants that normalize to the same key\n` +
  `# (case/space/fullwidth differences). Consider unifying tags in posts.\n` +
  `normalized_collisions:\n`;

for (const c of collisions) {
  normYml += `  - normalized_key: ${escapeYmlStr(c.key)}\n`;
  normYml += `    variants:\n`;
  for (const v of c.variants) {
    normYml += `      - tag: ${escapeYmlStr(v)}\n`;
    normYml += `        count: ${(counts.get(v) || 0)}\n`;
  }
}

ensureDir(OUT_NORMALIZE_REPORT_FILE);
fs.writeFileSync(OUT_NORMALIZE_REPORT_FILE, normYml, "utf8");
console.log(`✅ Wrote ${OUT_NORMALIZE_REPORT_FILE} (${collisions.length} collision groups)`);

console.log("Done.");
