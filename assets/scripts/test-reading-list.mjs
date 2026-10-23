import assert from "node:assert/strict";
import { readSaved, validPath, readingListLimit } from "../js/reading-list-data.mjs";
for (const value of ["//evil.example/", "/\\evil", "/%2fevil", "/\n/evil", "javascript:alert(1)", "/x?q=1"]) assert.equal(validPath(value), false, value);
assert.equal(validPath("/人格成长/领导力/"), true);
assert.deepEqual(readSaved('{"not":"an array"}'), []);
assert.deepEqual(readSaved("broken"), []);
assert.deepEqual(readSaved(JSON.stringify(["/one/", "/one/", "//evil.example/", 1, "/two/"])), ["/one/", "/two/"]);
assert.equal(readSaved(JSON.stringify(Array.from({ length: readingListLimit + 5 }, (_, i) => `/post/${i}/`))).length, readingListLimit);
console.log("Reading-list storage, malformed values, duplicate removal and URL boundaries passed.");
