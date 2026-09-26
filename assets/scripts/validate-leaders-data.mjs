import fs from "node:fs";
import path from "node:path";
import { validateDataset } from "../js/leaders-data.mjs";
import { normalizeCompanyName } from "../js/leaders-search.mjs";

const root = process.cwd();
const files = {
  companies: path.join(root, "assets/data/leaders-companies.json"),
  benchmark: path.join(root, "assets/data/darwin-leaders-benchmark.json"),
  rubric: path.join(root, "assets/data/leaders-score-rubric.json")
};

const rubric = JSON.parse(fs.readFileSync(files.rubric, "utf8"));
try {
  validateDataset(JSON.parse(fs.readFileSync(files.companies, "utf8")), rubric);
} catch (error) {
  console.error(`LEADERS data contract failed: ${error.message}`);
  process.exit(1);
}
const scoreKeys = rubric.dimension_order || Object.keys(rubric.dimensions || {});
const darwinKeys = rubric.darwin_dimension_order || Object.keys(rubric.darwin_dimensions || {});
const evidenceLevels = new Set(["A", "B", "C"]);
const allowedIndustryTags = new Set([
  "消费互联网",
  "内容平台",
  "人工智能",
  "企业服务",
  "SaaS",
  "新能源汽车",
  "智能驾驶",
  "汽车制造",
  "物联网",
  "大模型",
  "计算机视觉",
  "金融科技",
  "半导体",
  "芯片设计",
  "AI芯片",
  "ODM",
  "GPU",
  "机器人",
  "动力电池",
  "ICT",
  "云计算",
  "储能"
]);
const allowedRegionTags = new Set([
  "东南亚",
  "中国大陆",
  "台湾",
  "日本",
  "韩国",
  "以色列",
  "阿联酋和沙特",
  "非洲",
  "北美",
  "英国",
  "欧盟",
  "俄罗斯",
  "南美",
  "澳洲"
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function assert(condition, message, errors) {
  if (!condition) errors.push(message);
}

function isScore(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 10;
}

const validUrl = (value) => typeof value === "string" && (
  /^\/(?!\/)/.test(value) || /^https?:\/\/[^\s/]+(?:\/[^\s]*)?$/i.test(value)
);
const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) &&
  new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;

function validateRubric() {
  const errors = [];
  assert(typeof rubric.version === "string" && rubric.version.length > 0, "rubric: missing version.", errors);
  assert(scoreKeys.length === 7 && new Set(scoreKeys).size === scoreKeys.length, "rubric: expected seven unique LEADERS dimensions.", errors);
  assert(darwinKeys.length === 3 && new Set(darwinKeys).size === darwinKeys.length, "rubric: expected three unique Darwin dimensions.", errors);
  for (const key of [...scoreKeys, ...darwinKeys]) {
    assert(Boolean(rubric.dimensions?.[key] || rubric.darwin_dimensions?.[key]), `rubric: missing dimension ${key}.`, errors);
  }
  for (const mode of ["early", "growth", "mature"]) {
    const values = rubric.stage_weights?.[mode]?.values;
    assert(Array.isArray(values) && values.length === scoreKeys.length &&
      values.every((value) => typeof value === "number" && Number.isFinite(value) && value >= 0) &&
      Math.abs(values.reduce((sum, value) => sum + value, 0) - 1) < 1e-9,
    `rubric: invalid ${mode} weights.`, errors);
  }
  for (const level of evidenceLevels) {
    const coefficient = rubric.evidence_coefficients?.[level];
    assert(typeof coefficient === "number" && coefficient > 0 && coefficient <= 1,
      `rubric: invalid ${level} evidence coefficient.`, errors);
  }
  const bands = rubric.rating_bands || [];
  assert(bands.length > 0 && bands.every((band, index) => typeof band.min === "number" &&
    band.min >= 0 && band.min <= 10 && typeof band.label === "string" &&
    (index === 0 || bands[index - 1].min > band.min)), "rubric: invalid rating bands.", errors);
  return errors;
}

function validateCompanies() {
  const errors = [];
  const warnings = [];
  const companies = readJson(files.companies);
  assert(Array.isArray(companies), "leaders-companies.json must be an array.", errors);

  const names = new Set();
  for (const company of companies) {
    const label = company?.name || "<missing name>";
    assert(company.name, `${label}: missing name.`, errors);
    assert(!names.has(company.name), `${label}: duplicate company name.`, errors);
    names.add(company.name);

    assert(Array.isArray(company.aliases), `${label}: aliases must be an array.`, errors);
    assert(company.industry, `${label}: missing industry.`, errors);
    assert(Array.isArray(company.industry_tags), `${label}: industry_tags must be an array.`, errors);
    assert(Array.isArray(company.region_tags), `${label}: region_tags must be an array.`, errors);
    assert(company.industry_tags?.length > 0, `${label}: missing industry_tags.`, errors);
    assert(company.region_tags?.length > 0, `${label}: missing region_tags.`, errors);
    for (const tag of company.industry_tags || []) {
      assert(allowedIndustryTags.has(tag), `${label}: invalid industry tag "${tag}".`, errors);
    }
    for (const tag of company.region_tags || []) {
      assert(allowedRegionTags.has(tag), `${label}: invalid region tag "${tag}".`, errors);
    }
    assert(company.stage, `${label}: missing stage.`, errors);
    assert(validUrl(company.url), `${label}: invalid url.`, errors);
    assert(company.summary, `${label}: missing summary.`, errors);
    assert(company.risk, `${label}: missing risk.`, errors);
    assert(Array.isArray(company.watch), `${label}: watch must be an array.`, errors);
    assert(evidenceLevels.has(company.evidence), `${label}: evidence must be A/B/C.`, errors);
    if (company.last_reviewed) {
      assert(validDate(company.last_reviewed), `${label}: invalid last_reviewed date.`, errors);
      if (validDate(company.last_reviewed) && Date.now() - Date.parse(`${company.last_reviewed}T00:00:00Z`) > 183 * 86400000) {
        warnings.push(`${label}: review older than 183 days (${company.last_reviewed}).`);
      }
    } else warnings.push(`${label}: last_reviewed missing.`);

    for (const key of scoreKeys) {
      assert(company.scores && isScore(company.scores[key]), `${label}: invalid LEADERS score "${key}".`, errors);
    }

    if (company.sources) {
      assert(Array.isArray(company.sources), `${label}: sources must be an array when present.`, errors);
      assert(company.sources.every(Boolean), `${label}: sources cannot contain empty values.`, errors);
      for (const source of company.sources) assert(validUrl(source), `${label}: invalid source URL.`, errors);
    }
    if (!company.sources?.length) warnings.push(`${label}: no public source URL.`);

    if (company.research_file) {
      assert(fs.existsSync(path.join(root, company.research_file)), `${label}: research_file does not exist.`, errors);
    }

    if (company.darwin) {
      for (const key of darwinKeys) {
        assert(isScore(company.darwin[key]), `${label}: invalid Darwin score "${key}".`, errors);
      }
      assert(
        !company.darwin.evidence || evidenceLevels.has(company.darwin.evidence),
        `${label}: Darwin evidence must be A/B/C when present.`,
        errors
      );
      assert(company.darwin.note, `${label}: Darwin note is required when Darwin scores are present.`, errors);
    }
  }

  const aliases = new Map();
  for (const company of companies) {
    for (const alias of new Set((company.aliases || []).map(normalizeCompanyName).filter(Boolean))) {
      if (!aliases.has(alias)) aliases.set(alias, new Set());
      aliases.get(alias).add(company.name);
    }
  }
  for (const [alias, names] of aliases) {
    if (names.size > 1) warnings.push(`Ambiguous alias "${alias}": ${[...names].join(" / ")}.`);
  }
  return { errors, warnings, companies };
}

function validateBenchmark(companies) {
  const errors = [];
  const benchmark = readJson(files.benchmark);
  const companyNames = new Set(companies.map((company) => company.name));

  assert(benchmark.name, "benchmark: missing name.", errors);
  assert(benchmark.name_en, "benchmark: missing English name.", errors);
  assert(benchmark.version, "benchmark: missing version.", errors);
  assert(benchmark.review_cycle, "benchmark: missing review cycle.", errors);
  assert(benchmark.review_cycle_en, "benchmark: missing English review cycle.", errors);
  assert(Array.isArray(benchmark.companies), "benchmark: companies must be an array.", errors);
  assert(benchmark.companies.length === 15, `benchmark: expected 15 companies, got ${benchmark.companies.length}.`, errors);

  const benchmarkNames = new Set();
  for (const item of benchmark.companies) {
    const label = item?.name || "<missing benchmark name>";
    assert(item.name, `${label}: missing benchmark name.`, errors);
    assert(item.name_en, `${label}: missing English benchmark name.`, errors);
    assert(!benchmarkNames.has(item.name), `${label}: duplicate benchmark company.`, errors);
    benchmarkNames.add(item.name);
    assert(companyNames.has(item.name), `${label}: benchmark company is not in leaders-companies.json.`, errors);
    assert(["core", "satellite"].includes(item.tier), `${label}: tier must be core or satellite.`, errors);
    assert(item.info_quality, `${label}: missing info_quality.`, errors);
    assert(item.reason, `${label}: missing selection reason.`, errors);
    assert(item.reason_en, `${label}: missing English selection reason.`, errors);
  }

  return errors;
}

const { errors: companyErrors, warnings, companies } = validateCompanies();
const benchmarkErrors = validateBenchmark(companies);
const errors = [...validateRubric(), ...companyErrors, ...benchmarkErrors];

if (errors.length) {
  console.error(`LEADERS data validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const darwinCount = companies.filter((company) => company.darwin).length;
console.log(`LEADERS data OK: ${companies.length} companies, ${darwinCount} Darwin-scored, 15 benchmark samples.`);
if (warnings.length) {
  console.warn(`LEADERS editorial review queue (${warnings.length}):`);
  for (const warning of warnings) console.warn(`- ${warning}`);
}
