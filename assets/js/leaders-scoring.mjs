function scoreKeys(dimensions) {
  if (!Array.isArray(dimensions)) throw new TypeError("Scoring dimensions must be an array.");
  const keys = dimensions.map((dimension) => (
    Array.isArray(dimension) ? dimension[0] : dimension
  ));
  if (!keys.length || keys.some((key) => typeof key !== "string" || !key.trim()) || new Set(keys).size !== keys.length) {
    throw new TypeError("Scoring dimensions must be nonempty and unique.");
  }
  return keys;
}

function finiteScore(value) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0 || value > 10) {
    throw new TypeError("Scores must be finite numbers between 0 and 10.");
  }
  return value;
}

export function averageScore(scores, dimensions) {
  const keys = scoreKeys(dimensions);
  if (!keys.length) throw new TypeError("Scoring dimensions are required.");
  return keys.reduce((sum, key) => sum + finiteScore(scores?.[key]), 0) / keys.length;
}

export function weightedScore(scores, mode, dimensions, stageWeights) {
  const keys = scoreKeys(dimensions);
  const plan = stageWeights?.[mode];
  const values = plan?.values || [];
  if (!keys.length || values.length !== keys.length) throw new TypeError("Invalid scoring mode or weights.");

  const weightTotal = values.reduce((sum, value) => {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      throw new TypeError("Weights must be nonnegative finite numbers.");
    }
    return sum + value;
  }, 0);
  if (weightTotal <= 0) throw new TypeError("Weights must have a positive total.");

  const weightedTotal = keys.reduce((sum, key, index) => {
    return sum + finiteScore(scores?.[key]) * values[index];
  }, 0);
  return weightedTotal / weightTotal;
}

export function evidenceAdjustedScore(
  scores,
  evidence,
  mode,
  dimensions,
  stageWeights,
  evidenceCoefficients
) {
  const weighted = weightedScore(scores, mode, dimensions, stageWeights);
  const coefficient = evidenceCoefficients?.[evidence];
  if (typeof coefficient !== "number" || !Number.isFinite(coefficient) || coefficient < 0 || coefficient > 1) {
    throw new TypeError("A valid evidence level and coefficient are required.");
  }
  return Math.max(0, Math.min(10, weighted * coefficient));
}

export function scoreBandLabel(score, bands, fallback) {
  if (typeof score !== "number" || !Number.isFinite(score) || score < 0 || score > 10) return fallback;
  // Grades follow the same one-decimal precision readers see in the UI.
  const displayedScore = Math.round((score + Number.EPSILON) * 10) / 10;
  const match = (bands || []).find((band) => displayedScore >= band.min);
  return match?.label || fallback;
}

// Cross-model deltas use unadjusted dimension means; stage/evidence-adjusted
// grades remain separate and are not directly comparable to Darwin's mean.
export function darwinLeadersDelta(company, leaderDimensions, darwinDimensions) {
  if (!company?.darwin) return null;
  return averageScore(company.darwin, darwinDimensions) - averageScore(company.scores, leaderDimensions);
}

export function scoreBreakdown(scores, mode, dimensions, stageWeights) {
  // Use the same validation and normalization as the displayed weighted score.
  weightedScore(scores, mode, dimensions, stageWeights);
  const keys = scoreKeys(dimensions);
  const values = stageWeights[mode].values;
  const total = values.reduce((sum, value) => sum + value, 0);
  return keys.map((key, index) => ({ key, score: scores[key], weight: values[index] / total,
    contribution: scores[key] * values[index] / total }));
}
