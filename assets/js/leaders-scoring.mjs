function scoreKeys(dimensions) {
  return (dimensions || []).map((dimension) => (
    Array.isArray(dimension) ? dimension[0] : dimension
  )).filter(Boolean);
}

function finiteScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? score : 0;
}

export function averageScore(scores, dimensions) {
  const keys = scoreKeys(dimensions);
  if (!keys.length) return 0;
  return keys.reduce((sum, key) => sum + finiteScore(scores?.[key]), 0) / keys.length;
}

export function weightedScore(scores, mode, dimensions, stageWeights) {
  const keys = scoreKeys(dimensions);
  const plan = stageWeights?.[mode] || stageWeights?.growth;
  const values = plan?.values || [];
  if (!keys.length || values.length !== keys.length) return 0;

  const weightTotal = values.reduce((sum, value) => sum + finiteScore(value), 0);
  if (weightTotal <= 0) return 0;

  const weightedTotal = keys.reduce((sum, key, index) => {
    return sum + finiteScore(scores?.[key]) * finiteScore(values[index]);
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
  const fallback = finiteScore(evidenceCoefficients?.C) || 0.7;
  const coefficient = finiteScore(evidenceCoefficients?.[evidence]) || fallback;
  return Math.max(0, Math.min(10, weighted * coefficient));
}

export function scoreBandLabel(score, bands, fallback) {
  const match = (bands || []).find((band) => finiteScore(score) >= finiteScore(band.min));
  return match?.label || fallback;
}
