// Shared build/runtime contract. Invalid records never become plausible zero scores.
import { averageScore, weightedScore } from "./leaders-scoring.mjs";

const requireValue = (condition, message) => { if (!condition) throw new TypeError(message); };
const text = (value) => typeof value === "string" && value.trim().length > 0;
const textList = (value) => Array.isArray(value) && value.every(text);
export async function fetchJson(url, timeout = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error(`Data request failed (${response.status}).`);
    return await response.json();
  } finally { clearTimeout(timer); }
}
export const validDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) &&
  Number.isFinite(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
export function validUrl(value) {
  if (!text(value) || /[\s\\]/.test(value) || value.startsWith("//")) return false;
  if (!value.startsWith("/") && !/^https?:\/\//i.test(value)) return false;
  try {
    const url = new URL(value, "https://facereader.witbacon.com");
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
  } catch { return false; }
}
export function articleReturnUrl(value) {
  const url = new URL(value, "https://facereader.witbacon.com");
  requireValue(validUrl(value) && url.hostname === "facereader.witbacon.com", "Invalid article URL.");
  url.searchParams.set("from", "leaders-scorecard");
  return `${url.pathname}${url.search}${url.hash}`;
}

export function validateModel(model) {
  requireValue(model && text(model.version), "Model version is required.");
  for (const [order, definitions, size] of [[model.dimension_order, model.dimensions, 7], [model.darwin_dimension_order, model.darwin_dimensions, 3]]) {
    requireValue(Array.isArray(order) && order.length === size && new Set(order).size === size &&
      order.every((key) => text(key) && text(definitions?.[key]?.label)), "Invalid model dimensions.");
  }
  const scores = Object.fromEntries(model.dimension_order.map((key) => [key, 5]));
  for (const mode of ["early", "growth", "mature"]) {
    weightedScore(scores, mode, model.dimension_order, model.stage_weights);
    requireValue(Math.abs(model.stage_weights[mode].values.reduce((a, b) => a + b, 0) - 1) < 1e-9, `Weights must sum to one: ${mode}.`);
  }
  for (const level of ["A", "B", "C"]) {
    const coefficient = model.evidence_coefficients?.[level];
    requireValue(typeof coefficient === "number" && Number.isFinite(coefficient) && coefficient > 0 && coefficient <= 1, `Invalid coefficient: ${level}.`);
  }
  for (const bands of [model.rating_bands, model.darwin_rating_bands]) {
    requireValue(Array.isArray(bands) && bands.length > 0 && bands.at(-1)?.min === 0 && bands.every((band, i) =>
      typeof band?.min === "number" && Number.isFinite(band.min) && band.min >= 0 && band.min <= 10 && text(band.label) &&
      (!i || bands[i - 1].min > band.min)), "Invalid rating bands.");
  }
  const feedback = model.guardrails?.darwin_feedback;
  requireValue(typeof feedback?.warn_delta === "number" && Number.isFinite(feedback.warn_delta) && feedback.warn_delta >= 0 &&
    typeof feedback?.review_delta === "number" && Number.isFinite(feedback.review_delta) && feedback.review_delta >= feedback.warn_delta,
  "Invalid Darwin review thresholds.");
}

export function validateDataset(companies, model, today = new Date().toISOString().slice(0, 10)) {
  validateModel(model);
  requireValue(Array.isArray(companies) && companies.length > 0, "Company data must be a nonempty array.");
  const names = new Set();
  for (const company of companies) {
    requireValue(company && text(company.name), "Company name is required.");
    const name = company.name.trim().toLocaleLowerCase().replace(/\s+/g, "");
    requireValue(!names.has(name), `Duplicate company name: ${company.name}.`);
    names.add(name);
    for (const key of ["industry", "stage", "summary", "risk"]) requireValue(text(company[key]), `${company.name}: invalid ${key}.`);
    for (const key of ["aliases", "watch", "industry_tags", "region_tags"]) requireValue(textList(company[key]), `${company.name}: invalid ${key}.`);
    requireValue(validUrl(company.url), `${company.name}: invalid URL.`);
    requireValue(company.sources === undefined || (textList(company.sources) && company.sources.every(validUrl)), `${company.name}: invalid sources.`);
    requireValue(["A", "B", "C"].includes(company.evidence), `${company.name}: invalid evidence.`);
    requireValue(company.last_reviewed === undefined || (validDate(company.last_reviewed) && company.last_reviewed <= today), `${company.name}: invalid or future review date.`);
    averageScore(company.scores, model.dimension_order);
    if (company.darwin !== undefined) {
      averageScore(company.darwin, model.darwin_dimension_order);
      requireValue(text(company.darwin.note), `${company.name}: Darwin note is required.`);
      requireValue(company.darwin.evidence === undefined || ["A", "B", "C"].includes(company.darwin.evidence), `${company.name}: invalid Darwin evidence.`);
    }
  }
}
