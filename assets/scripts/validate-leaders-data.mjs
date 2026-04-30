import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const files = {
  companies: path.join(root, "assets/data/leaders-companies.json"),
  benchmark: path.join(root, "assets/data/darwin-leaders-benchmark.json")
};

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
  return Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= 10;
}

function validateCompanies() {
  const errors = [];
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
    assert(company.url, `${label}: missing url.`, errors);
    assert(company.summary, `${label}: missing summary.`, errors);
    assert(company.risk, `${label}: missing risk.`, errors);
    assert(Array.isArray(company.watch), `${label}: watch must be an array.`, errors);
    assert(evidenceLevels.has(company.evidence), `${label}: evidence must be A/B/C.`, errors);

    for (const key of scoreKeys) {
      assert(company.scores && isScore(company.scores[key]), `${label}: invalid LEADERS score "${key}".`, errors);
    }

    if (company.sources) {
      assert(Array.isArray(company.sources), `${label}: sources must be an array when present.`, errors);
      assert(company.sources.every(Boolean), `${label}: sources cannot contain empty values.`, errors);
    }

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

  return { errors, companies };
}

function validateBenchmark(companies) {
  const errors = [];
  const benchmark = readJson(files.benchmark);
  const companyNames = new Set(companies.map((company) => company.name));

  assert(benchmark.name, "benchmark: missing name.", errors);
  assert(benchmark.version, "benchmark: missing version.", errors);
  assert(Array.isArray(benchmark.companies), "benchmark: companies must be an array.", errors);
  assert(benchmark.companies.length === 15, `benchmark: expected 15 companies, got ${benchmark.companies.length}.`, errors);

  const benchmarkNames = new Set();
  for (const item of benchmark.companies) {
    const label = item?.name || "<missing benchmark name>";
    assert(item.name, `${label}: missing benchmark name.`, errors);
    assert(!benchmarkNames.has(item.name), `${label}: duplicate benchmark company.`, errors);
    benchmarkNames.add(item.name);
    assert(companyNames.has(item.name), `${label}: benchmark company is not in leaders-companies.json.`, errors);
    assert(["core", "satellite"].includes(item.tier), `${label}: tier must be core or satellite.`, errors);
    assert(item.info_quality, `${label}: missing info_quality.`, errors);
    assert(item.reason, `${label}: missing selection reason.`, errors);
  }

  return errors;
}

const { errors: companyErrors, companies } = validateCompanies();
const benchmarkErrors = validateBenchmark(companies);
const errors = [...companyErrors, ...benchmarkErrors];

if (errors.length) {
  console.error(`LEADERS data validation failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

const darwinCount = companies.filter((company) => company.darwin).length;
console.log(`LEADERS data OK: ${companies.length} companies, ${darwinCount} Darwin-scored, 15 benchmark samples.`);
