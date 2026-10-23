import assert from "node:assert/strict";
import { findArticles, normalize, readSaved, validPath, validateCatalog, readingListLimit } from "../js/catalog-search.mjs";

const make = (url, title, language = "en", extras = {}) => ({ url, title, language, date: "2026-10-24", tags: [], categories: [], excerpt: "", minutes: 2, ...extras });
const posts = [make("/en/title/", "Leadership and trust"), make("/en/tag/", "A company", "en", { tags: ["Leadership"] }),
  make("/en/excerpt/", "Another company", "en", { excerpt: "Leadership in a team" }), make("/zh/", "领导力与信任", "zh", { categories: ["管理"] })];
assert.equal(normalize("  ＡＩ  TEAM "), "ai team");
assert.deepEqual(findArticles(posts, { query: "leadership", language: "en" }).map(post => post.url), ["/en/title/", "/en/tag/", "/en/excerpt/"]);
assert.deepEqual(findArticles(posts, { query: "leadership trust", language: "en" }).map(post => post.url), ["/en/title/"]);
assert.deepEqual(findArticles(posts, { query: "领导力", category: "管理", language: "zh" }).map(post => post.url), ["/zh/"]);
assert.deepEqual(findArticles(posts, { query: "unknown", language: "en" }), []);
assert.deepEqual(findArticles(posts, { category: "管理", language: "en" }), []);
assert.equal(findArticles(posts, { query: "", language: "en" }).length, 3);
assert.equal(validateCatalog({ version: 1, posts }), posts);
assert.throws(() => validateCatalog({ version: 1, posts: [...posts, posts[0]] }));
assert.throws(() => validateCatalog({ version: 1, posts: [make("https://evil.example/", "unsafe")] }));
assert.throws(() => validateCatalog({ version: 1, posts: [make("/invalid-date/", "Invalid date", "en", { date: "2026-02-30" })] }));
for (const value of ["//evil.example/", "/\\evil", "/%2fevil", "/\n/evil", "javascript:alert(1)", "/x?q=1"]) assert.equal(validPath(value), false, value);
assert.equal(validPath("/人格成长/领导力/"), true);
assert.deepEqual(readSaved('{"not":"an array"}'), []);
assert.deepEqual(readSaved("broken"), []);
assert.deepEqual(readSaved(JSON.stringify(["/one/", "/one/", "//evil.example/", 1, "/two/"])), ["/one/", "/two/"]);
assert.equal(readSaved(JSON.stringify(Array.from({ length: readingListLimit + 5 }, (_, i) => `/post/${i}/`))).length, readingListLimit);
console.log("Catalog ranking, bilingual filtering, malformed records and bounded saved URLs passed.");
