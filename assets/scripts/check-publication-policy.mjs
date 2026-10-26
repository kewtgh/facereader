import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { prepareRecords } from "./algolia-records.mjs";

const root = path.resolve(process.env.FR_SITE_ROOT || "_site");
const privateFile = process.env.FR_SEARCH_RECORDS || "tmp/build/algolia-records.json";
const robots = await fs.readFile(path.join(root, "robots.txt"), "utf8");
let generic = false;
const rules = [];
for (const raw of robots.split(/\r?\n/)) {
  const line = raw.replace(/#.*/, "").trim();
  const separator = line.indexOf(":");
  if (separator < 0) continue;
  const name = line.slice(0, separator).toLowerCase(), value = line.slice(separator + 1).trim();
  if (name === "user-agent") generic = value === "*";
  else if (generic && ["allow", "disallow"].includes(name) && value) rules.push({ name, value });
}
function matches(rule, value) {
  const end = rule.endsWith("$");
  const pattern = (end ? rule.slice(0, -1) : rule).split("*").map(part => part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*");
  return new RegExp("^" + pattern + (end ? "$" : "")).test(value);
}
function blocked(url) {
  const relevant = rules.filter(rule => matches(rule.value, url)).sort((a,b) => b.value.length - a.value.length || (a.name === "allow" ? -1 : 1));
  return relevant[0]?.name === "disallow";
}
for (const url of ["/category-index.json", "/algolia-records.json", "/gory-index.json", "/nested/any.json", "/nested/any.json?v=1", "/assets/data/leaders-companies.json?x=1&y=2"]) assert.equal(blocked(url), true, url);
for (const url of ["/", "/posts/", "/categories/", "/assets/js/site-ui.js", "/assets/css/main.css", "/feed/zh.xml", "/example.jsonld"]) assert.equal(blocked(url), false, url);
assert.ok(robots.includes("Sitemap: https://facereader.witbacon.com/sitemap.xml"));
async function walk(directory) {
  const output = [];
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) output.push(...await walk(file));
    else output.push(file);
  }
  return output;
}
const files = await walk(root);
const jsonFiles = files.filter(file => path.extname(file).toLowerCase() === ".json");
for (const file of jsonFiles) {
  const url = "/" + path.relative(root, file).replaceAll("\\", "/");
  assert.ok(blocked(url) && blocked(url + "?v=1"), `Public JSON is crawlable: ${url}`);
  JSON.parse(await fs.readFile(file, "utf8"));
}
for (const removed of ["algolia-records.json", "redirects.json", "assets/js/lunr"]) await assert.rejects(fs.access(path.join(root, removed)), { code: "ENOENT" });
const sitemap = await fs.readFile(path.join(root, "sitemap.xml"), "utf8");
for (const match of sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)) assert.equal(new URL(match[1]).pathname.toLowerCase().endsWith(".json"), false, match[1]);
const config = YAML.parse(await fs.readFile("_config.yml", "utf8"));
const records = prepareRecords(JSON.parse(await fs.readFile(privateFile, "utf8")), config);
assert.ok(records.length);
assert.ok(records.every(record => !record.content.includes("{%") && !record.content.includes("{{")));
const catalog = JSON.parse(await fs.readFile(path.join(root, "category-index.json"), "utf8"));
const recordsByUrl = new Map(records.map(record => [new URL(record.url).pathname, record]));
for (const category of Object.values(catalog)) {
  assert.ok(typeof category.name === "string" && Array.isArray(category.posts));
  for (const post of category.posts) {
    assert.ok(["zh", "en"].includes(post.language));
    assert.ok(post.url.startsWith("/") && !post.url.startsWith("//"));
    const target = path.join(root, decodeURIComponent(post.url), "index.html");
    await fs.access(target);
    const searchRecord = recordsByUrl.get(post.url);
    if (searchRecord) assert.equal(searchRecord.language, post.language);
  }
}
const workflow = YAML.parse(await fs.readFile(".github/workflows/pages.yml", "utf8"));
const upload = workflow.jobs.build.steps.find(step => step.with?.name === "algolia-records");
const download = workflow.jobs.algolia.steps.find(step => step.with?.name === "algolia-records");
assert.equal(upload.with.path, "tmp/build/algolia-records.json");
assert.equal(download.with.path, "tmp/build");
const pkg = JSON.parse(await fs.readFile("package.json", "utf8"));
assert.ok(pkg.scripts["algolia:push"].endsWith("tmp/build/algolia-records.json"));
assert.equal((await fs.readFile("assets/math/katex/version.txt", "utf8")).trim(), pkg.devDependencies.katex.replace(/^[^\d]+/, ""));
console.log(`Publication policy passed: ${jsonFiles.length} public JSON assets blocked, ${records.length} private search records, sitemap and CI artifact boundaries verified.`);
