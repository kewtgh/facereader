import assert from "node:assert/strict";
import fs from "node:fs";
import {
  averageScore,
  evidenceAdjustedScore,
  scoreBandLabel,
  weightedScore
} from "../js/leaders-scoring.mjs";

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
assert.equal(
  evidenceAdjustedScore(
    uniformScores,
    "unknown",
    "growth",
    dimensions,
    model.stage_weights,
    model.evidence_coefficients
  ),
  5.6
);
assert.equal(
  evidenceAdjustedScore(
    uniformScores,
    "A",
    "growth",
    dimensions,
    model.stage_weights,
    { A: 2, C: 0.7 }
  ),
  10
);

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

assert.equal(weightedScore({}, "missing", dimensions, model.stage_weights), 0);
assert.equal(weightedScore(uniformScores, "growth", [], model.stage_weights), 0);
assert.equal(
  weightedScore(uniformScores, "growth", dimensions, { growth: { values: [1] } }),
  0
);
assert.equal(scoreBandLabel(8.5, model.rating_bands, "fallback"), "A档：系统化优势");
assert.equal(scoreBandLabel(-1, model.rating_bands, "fallback"), "fallback");

console.log("LEADERS scoring tests passed.");
