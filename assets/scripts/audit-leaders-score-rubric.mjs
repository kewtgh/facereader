import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const companiesFile = path.join(root, "assets/data/leaders-companies.json");
const rubricFile = path.join(root, "assets/data/leaders-score-rubric.json");

const scoreKeys = [
  "leadership",
  "decision",
  "execution",
  "bench",
  "alignment",
  "coverage",
  "governance"
];
const darwinKeys = ["financial", "moat", "signal"];
const evidenceRank = { C: 1, B: 2, A: 3 };

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function average(values) {
  return values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length;
}

function hasTraceableMaterial(company) {
  return Boolean(company.research_file) || (Array.isArray(company.sources) && company.sources.length > 0);
}

function labelFor(rubric, key) {
  return rubric.dimensions?.[key]?.label || key;
}

const companies = readJson(companiesFile);
const rubric = readJson(rubricFile);
const errors = [];
const warnings = [];

for (const company of companies) {
  if (company.name === "寒武纪") continue;

  const evidence = company.evidence || "C";
  const evidenceScore = evidenceRank[evidence] || 0;
  const minHighEvidence = evidenceRank[rubric.guardrails.score_9_requires.min_evidence] || evidenceRank.B;

  for (const key of scoreKeys) {
    const value = Number(company.scores?.[key]);
    const label = labelFor(rubric, key);

    if (value >= 9) {
      if (evidenceScore < minHighEvidence) {
        errors.push(`${company.name}: ${label}=${value} 但公司证据等级为 ${evidence}，不满足9分证据门槛。`);
      }
      if (rubric.guardrails.score_9_requires.requires_sources_or_research_file && !hasTraceableMaterial(company)) {
        errors.push(`${company.name}: ${label}=${value} 但缺少 sources 或 research_file。`);
      }
    }
  }

  for (const cap of rubric.guardrails.dimension_caps) {
    const value = Number(company.scores?.[cap.dimension]);
    const capValue = cap.max_when_evidence?.[evidence];
    if (Number.isFinite(capValue) && value > capValue) {
      errors.push(`${company.name}: ${labelFor(rubric, cap.dimension)}=${value} 超过 ${evidence} 级证据上限 ${capValue}。${cap.rule}`);
    }
  }

  if (company.darwin) {
    const leadersAverage = average(scoreKeys.map((key) => company.scores[key]));
    const darwinAverage = average(darwinKeys.map((key) => company.darwin[key]));
    const delta = leadersAverage - darwinAverage;
    if (delta > rubric.guardrails.darwin_feedback.review_delta) {
      warnings.push(`${company.name}: LEADERS均分 ${leadersAverage.toFixed(1)} 高于 Darwin ${darwinAverage.toFixed(1)}，偏差 ${delta.toFixed(1)}，需要人工复核。`);
    } else if (delta > rubric.guardrails.darwin_feedback.warn_delta) {
      warnings.push(`${company.name}: LEADERS均分 ${leadersAverage.toFixed(1)} 高于 Darwin ${darwinAverage.toFixed(1)}，偏差 ${delta.toFixed(1)}，建议半年度复核。`);
    }
  }

  const scoreValues = scoreKeys.map((key) => Number(company.scores?.[key]));
  const leadersAverage = average(scoreValues);
  const scoreRange = Math.max(...scoreValues) - Math.min(...scoreValues);
  const flatReview = rubric.guardrails.flat_score_review;
  if (flatReview && leadersAverage >= flatReview.min_average) {
    if (scoreRange <= flatReview.warn_range) {
      warnings.push(`${company.name}: LEADERS均分 ${leadersAverage.toFixed(1)} 且七项完全同分，需复核是否过度依赖财务表现、行业地位或成熟制度惯性。`);
    } else if (scoreRange <= flatReview.review_range && leadersAverage >= 8.8) {
      warnings.push(`${company.name}: LEADERS均分 ${leadersAverage.toFixed(1)} 且七项分差仅 ${scoreRange.toFixed(1)}，建议复核领导者、二三号位和治理证据是否足以支撑高分。`);
    }
  }
}

if (warnings.length) {
  console.warn(`LEADERS rubric audit warnings (${warnings.length}):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}

if (errors.length) {
  console.error(`LEADERS rubric audit failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`LEADERS rubric audit OK: ${companies.length - 1} companies checked, 寒武纪 excluded by request.`);
