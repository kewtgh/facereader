import fs from "node:fs";
import path from "node:path";
import YAML from "yaml";

const WORKFLOW_DIR = path.join(".github", "workflows");
const NODE20_RE = /node-version:\s*['"]?20['"]?/;
const OLD_ACTION_RE = /actions\/(?:checkout@v4|setup-node@v4|github-script@v7)/;
const RAW_JEKYLL_BUILD_RE = /(?:bundle exec\s+)?jekyll build/;

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function workflowFiles() {
  if (!fs.existsSync(WORKFLOW_DIR)) {
    fail(`Workflow directory not found: ${WORKFLOW_DIR}`);
    return [];
  }

  return fs
    .readdirSync(WORKFLOW_DIR)
    .filter((name) => /\.ya?ml$/i.test(name))
    .map((name) => path.join(WORKFLOW_DIR, name))
    .sort();
}

function checkRawText(file, raw) {
  if (NODE20_RE.test(raw)) fail(`${file}: repository Node execution must not select Node 20`);
  if (OLD_ACTION_RE.test(raw)) fail(`${file}: first-party GitHub Action major still uses a Node 20-era boundary`);
  if (/actions\/jekyll-build-pages@/.test(raw)) fail(`${file}: must not use actions/jekyll-build-pages`);

  for (const [lineNo, line] of raw.split(/\r?\n/).entries()) {
    if (RAW_JEKYLL_BUILD_RE.test(line) && !line.includes("site:build")) {
      fail(`${file}:${lineNo + 1}: workflow must use npm run site:build instead of a raw Jekyll build`);
    }
  }
}

function checkWorkflowShape(file, workflow) {
  if (!workflow || typeof workflow !== "object") {
    fail(`${file}: workflow YAML must parse to an object`);
    return;
  }

  if (!workflow.on) fail(`${file}: missing top-level on trigger`);
  if (!workflow.jobs || typeof workflow.jobs !== "object") {
    fail(`${file}: missing top-level jobs`);
    return;
  }

  for (const [jobName, job] of Object.entries(workflow.jobs)) {
    if (!job || typeof job !== "object") {
      fail(`${file}: job ${jobName} must be an object`);
      continue;
    }

    if (!job["runs-on"] && !job.uses) fail(`${file}: job ${jobName} must define runs-on or uses`);
    if (job.steps) {
      for (const [index, step] of asArray(job.steps).entries()) {
        if (!step || typeof step !== "object") {
          fail(`${file}: job ${jobName} step ${index + 1} must be an object`);
          continue;
        }
        if (!step.run && !step.uses) fail(`${file}: job ${jobName} step ${index + 1} must define run or uses`);
      }
    }
  }
}

function checkPagesAuthority(file, workflow) {
  if (path.basename(file) !== "pages.yml" || !workflow?.jobs) return;

  const { build, deploy, algolia } = workflow.jobs;
  if (!build) fail(`${file}: missing build job`);
  if (!deploy) fail(`${file}: missing deploy job`);
  if (!algolia) fail(`${file}: missing algolia job`);

  if (deploy?.needs !== "build") fail(`${file}: deploy job must depend only on build`);
  if (algolia?.needs !== "build") fail(`${file}: algolia job must depend only on build`);

  const buildRuns = asArray(build?.steps).filter((step) => step.run).map((step) => step.run);
  const siteBuilds = buildRuns.filter((run) => /\bnpm run site:build\b/.test(run)).length;
  if (siteBuilds !== 1) fail(`${file}: build job must run exactly one npm run site:build`);

  const allRuns = Object.values(workflow.jobs)
    .flatMap((job) => asArray(job?.steps))
    .filter((step) => step.run)
    .map((step) => step.run);
  const rawBuilds = allRuns.filter((run) => RAW_JEKYLL_BUILD_RE.test(run) && !/\bnpm run site:build\b/.test(run));
  if (rawBuilds.length > 0) fail(`${file}: Pages/Algolia pipeline contains a second raw Jekyll build`);
}

for (const file of workflowFiles()) {
  const raw = fs.readFileSync(file, "utf8");
  checkRawText(file, raw);

  let workflow;
  try {
    workflow = YAML.parse(raw);
  } catch (error) {
    fail(`${file}: YAML parse failed: ${error.message}`);
    continue;
  }

  checkWorkflowShape(file, workflow);
  checkPagesAuthority(file, workflow);
}

if (process.exitCode) process.exit(process.exitCode);
console.log("GitHub Actions workflow validation passed.");
