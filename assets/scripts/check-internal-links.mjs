import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const siteDir = path.join(root, "_site");
const siteHost = "facereader.witbacon.com";

const ignoredPrefixes = [
  "/assets/",
  "/feed.xml",
  "/sitemap.xml",
  "/robots.txt",
  "/algolia-records.json",
  "/site.xml",
  "/site.webmanifest"
];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, files);
    else files.push(fullPath);
  }
  return files;
}

function toPosix(value) {
  return value.replace(/\\/g, "/");
}

function decodePathname(value) {
  try {
    return decodeURI(value);
  } catch {
    return value;
  }
}

function normalizePathname(value) {
  let pathname = decodePathname(value.split("#")[0].split("?")[0]);
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  pathname = pathname.replace(/\/+/g, "/");
  return pathname;
}

function pageUrlForFile(file) {
  const rel = toPosix(path.relative(siteDir, file));
  if (rel === "index.html") return "/";
  return `/${rel.replace(/index\.html$/, "")}`;
}

function existingTargets(files) {
  const targets = new Set(["/"]);
  for (const file of files) {
    const rel = toPosix(path.relative(siteDir, file));
    const pathname = normalizePathname(`/${rel}`);
    targets.add(pathname);
    if (pathname.endsWith("/index.html")) targets.add(pathname.replace(/index\.html$/, ""));
  }
  return targets;
}

function shouldIgnore(rawHref, pathname) {
  if (!rawHref || rawHref.startsWith("#")) return true;
  if (rawHref.includes("${")) return true;
  if (/^(mailto:|tel:|javascript:|data:)/i.test(rawHref)) return true;
  return ignoredPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(prefix));
}

function resolveHref(rawHref, currentPageUrl) {
  if (/^https?:\/\//i.test(rawHref)) {
    const url = new URL(rawHref);
    if (url.hostname !== siteHost) return null;
    return normalizePathname(url.pathname);
  }

  if (rawHref.startsWith("//")) return null;
  if (rawHref.startsWith("/")) return normalizePathname(rawHref);

  const base = new URL(`https://${siteHost}${currentPageUrl}`);
  return normalizePathname(new URL(rawHref, base).pathname);
}

function hasTarget(targets, pathname) {
  if (targets.has(pathname)) return true;
  if (!pathname.endsWith("/") && targets.has(`${pathname}/`)) return true;
  if (pathname.endsWith("/") && targets.has(`${pathname}index.html`)) return true;
  return false;
}

if (!fs.existsSync(siteDir)) {
  console.error("_site does not exist. Run the Jekyll build first.");
  process.exit(1);
}

const allFiles = walk(siteDir);
const htmlFiles = allFiles.filter((file) => file.endsWith(".html"));
const targets = existingTargets(allFiles);
const misses = [];
const hrefPattern = /\bhref=["']([^"']+)["']/g;

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const currentPageUrl = pageUrlForFile(file);
  let match;
  while ((match = hrefPattern.exec(html))) {
    const rawHref = match[1].trim();
    let pathname;
    try {
      pathname = resolveHref(rawHref, currentPageUrl);
    } catch {
      misses.push({ file, href: rawHref, reason: "invalid URL" });
      continue;
    }

    if (!pathname || shouldIgnore(rawHref, pathname)) continue;
    if (!hasTarget(targets, pathname)) misses.push({ file, href: rawHref, pathname, reason: "missing target" });
  }
}

if (misses.length) {
  console.error(`Internal link check failed with ${misses.length} missing link(s):`);
  for (const miss of misses.slice(0, 80)) {
    console.error(`- ${toPosix(path.relative(siteDir, miss.file))} -> ${miss.href} (${miss.reason})`);
  }
  if (misses.length > 80) console.error(`...and ${misses.length - 80} more.`);
  process.exit(1);
}

console.log(`Internal links OK: ${htmlFiles.length} HTML files checked.`);
