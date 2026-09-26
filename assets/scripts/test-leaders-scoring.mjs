import assert from "node:assert/strict";
import fs from "node:fs";
import {
  averageScore,
  darwinLeadersDelta,
  evidenceAdjustedScore,
  scoreBandLabel,
  scoreBreakdown,
  weightedScore
} from "../js/leaders-scoring.mjs";
import { resolveCompany } from "../js/leaders-search.mjs";
import { validateDataset, validateModel, validDate, validUrl, articleReturnUrl, fetchJson } from "../js/leaders-data.mjs";

const model = JSON.parse(fs.readFileSync("assets/data/leaders-score-rubric.json", "utf8"));
const dimensions = model.dimension_order;
const uniformScores = Object.fromEntries(dimensions.map((key) => [key, 8]));

assert.equal(averageScore(uniformScores, dimensions), 8);
assert.equal(weightedScore(uniformScores, "growth", dimensions, model.stage_weights), 8);
assert.equal(
  evidenceAdjustedScore(
    uniformScores,
    "A",
    "growth",
    dimensions,
    model.stage_weights,
    model.evidence_coefficients
  ),
  8
);
assert.equal(
  evidenceAdjustedScore(
    uniformScores,
    "B",
    "growth",
    dimensions,
    model.stage_weights,
    model.evidence_coefficients
  ),
  6.8
);
assert.equal(
  evidenceAdjustedScore(
    uniformScores,
    "C",
    "growth",
    dimensions,
    model.stage_weights,
    model.evidence_coefficients
  ),
  5.6
);
assert.throws(() => evidenceAdjustedScore(uniformScores, "unknown", "growth", dimensions, model.stage_weights, model.evidence_coefficients), TypeError);
assert.throws(() => evidenceAdjustedScore(uniformScores, "A", "growth", dimensions, model.stage_weights, { A: 2 }), TypeError);

const variedScores = {
  leadership: 10,
  decision: 8,
  execution: 6,
  bench: 4,
  alignment: 2,
  coverage: 0,
  governance: 10
};
const expectedGrowth = dimensions.reduce((sum, key, index) => {
  return sum + variedScores[key] * model.stage_weights.growth.values[index];
}, 0);
assert.ok(Math.abs(
  weightedScore(variedScores, "growth", dimensions, model.stage_weights) - expectedGrowth
) < 1e-12);
const doubledWeights = {
  growth: { values: model.stage_weights.growth.values.map((value) => value * 2) }
};
assert.ok(Math.abs(
  weightedScore(variedScores, "growth", dimensions, doubledWeights) - expectedGrowth
) < 1e-12);

assert.throws(() => weightedScore({}, "missing", dimensions, model.stage_weights), TypeError);
assert.throws(() => weightedScore(uniformScores, "growth", [], model.stage_weights), TypeError);
assert.throws(() => weightedScore(uniformScores, "growth", dimensions, { growth: { values: [1] } }), TypeError);
assert.throws(() => averageScore({ ...uniformScores, leadership: "8" }, dimensions), TypeError);
assert.throws(() => averageScore({ ...uniformScores, leadership: undefined }, dimensions), TypeError);
assert.equal(darwinLeadersDelta({ scores: uniformScores, darwin: { financial: 7, moat: 8, signal: 9 } }, dimensions, model.darwin_dimension_order), 0);
assert.equal(darwinLeadersDelta({ scores: uniformScores }, dimensions, model.darwin_dimension_order), null);
const choices = [
  { name: "Samsung Electronics", aliases: ["HBM", "Samsung"] },
  { name: "Micron Technology", aliases: ["HBM", "Micron"] }
];
const rank = () => choices.map((company, index) => ({ company, score: 88 - index }));
assert.equal(resolveCompany(choices, "HBM", rank).reason, "ambiguous");
assert.equal(resolveCompany(choices, "HBM", rank).candidates.length, 2);
assert.equal(resolveCompany(choices, "Micron", rank).company.name, "Micron Technology");
assert.equal(resolveCompany(choices, "Samsung Electronics", rank).company.name, "Samsung Electronics");
assert.equal(resolveCompany(choices, "other", rank).company, null);
const realCompanies = JSON.parse(fs.readFileSync("assets/data/leaders-companies.json", "utf8"));
assert.deepEqual(
  resolveCompany(realCompanies, "HBM", () => []).candidates.map((item) => item.name).sort(),
  ["Micron Technology", "Samsung Electronics"]
);
assert.equal(resolveCompany(realCompanies, "NVIDIA", () => []).company.name, "NVIDIA");
assert.equal(scoreBandLabel(8.5, model.rating_bands, "fallback"), "A档：系统化优势");
assert.equal(scoreBandLabel(8.46, model.rating_bands, "fallback"), "A档：系统化优势");
assert.equal(scoreBandLabel(8.44, model.rating_bands, "fallback"), "B+档：稳定有效");
assert.equal(scoreBandLabel(-1, model.rating_bands, "fallback"), "fallback");

console.log("LEADERS scoring tests passed.");

assert.throws(() => averageScore(uniformScores, ["leadership", "leadership"]), TypeError);
assert.throws(() => averageScore(uniformScores, ["leadership", ""]), TypeError);
assert.equal(scoreBandLabel(11, model.rating_bands, "fallback"), "fallback");
assert.equal(resolveCompany([{ name: "A", aliases: [] }, { name: " A ", aliases: [] }], "a", () => []).reason, "ambiguous");
for (const mode of ["early", "growth", "mature"]) {
  const rows = scoreBreakdown(variedScores, mode, dimensions, model.stage_weights);
  assert.ok(Math.abs(rows.reduce((sum, row) => sum + row.contribution, 0) - weightedScore(variedScores, mode, dimensions, model.stage_weights)) < 1e-12);
}
validateDataset(realCompanies, model);
for (const mutate of [
  (m) => { m.darwin_rating_bands.reverse(); },
  (m) => { m.guardrails.darwin_feedback.review_delta = -1; },
  (m) => { m.evidence_coefficients.C = NaN; },
  (m) => { m.dimension_order[1] = m.dimension_order[0]; }
]) {
  const bad = structuredClone(model); mutate(bad);
  assert.throws(() => validateModel(bad), TypeError);
}
for (const mutate of [
  (c) => { c.sources = "https://example.com"; },
  (c) => { c.aliases = [null]; },
  (c) => { c.url = "javascript:alert(1)"; },
  (c) => { c.last_reviewed = "2999-01-01"; },
  (c) => { c.last_reviewed = "2026-02-30"; },
  (c) => { c.scores.leadership = "9"; }
]) {
  const bad = structuredClone(realCompanies[0]); mutate(bad);
  assert.throws(() => validateDataset([bad], model), TypeError);
}
assert.throws(() => validateDataset({}, model), TypeError);
assert.throws(() => validateDataset([realCompanies[0], realCompanies[0]], model), TypeError);
assert.equal(validDate("2024-02-29"), true);
assert.equal(validDate("2025-02-29"), false);
for (const unsafe of ["//example.com", "/\\example.com", "https://a:b@example.com", "javascript:alert(1)", "https://example.com x"]) assert.equal(validUrl(unsafe), false);
assert.equal(articleReturnUrl("/post/?x=1#part"), "/post/?x=1&from=leaders-scorecard#part");
assert.equal(articleReturnUrl("https://facereader.witbacon.com/post/#part"), "/post/?from=leaders-scorecard#part");
const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async () => ({ ok: false, status: 503 });
  await assert.rejects(fetchJson("/test"), /503/);
  globalThis.fetch = async (_url, { signal }) => new Promise((_resolve, reject) => signal.addEventListener("abort", () => reject(new Error("aborted"))));
  await assert.rejects(fetchJson("/test", 5), /aborted/);
} finally { globalThis.fetch = originalFetch; }
console.log("LEADERS data contract, explanation, URL, and load-failure tests passed.");
