import assert from "node:assert/strict";
import fs from "node:fs";
import {
  averageScore,
  darwinLeadersDelta,
  evidenceAdjustedScore,
  scoreBandLabel,
  weightedScore
} from "../js/leaders-scoring.mjs";
import { resolveCompany } from "../js/leaders-search.mjs";

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
