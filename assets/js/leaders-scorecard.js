import {
  averageScore,
  evidenceAdjustedScore as calculateEvidenceAdjustedScore,
  darwinLeadersDelta,
  scoreBandLabel,
  scoreBreakdown,
  weightedScore as calculateWeightedScore
} from "./leaders-scoring.mjs";
import { normalizeCompanyName, resolveCompany } from "./leaders-search.mjs";
import { validateDataset, articleReturnUrl, fetchJson } from "./leaders-data.mjs";

(function () {
  const hotCompanyNames = [
    "NVIDIA",
    "OpenAI",
    "Microsoft",
    "Apple",
    "Tesla",
    "Meta",
    "字节跳动",
    "华为",
    "宁德时代",
    "DeepSeek"
  ];
  const industryLabels = {
    "半导体": "Semiconductors",
    "储能": "Energy Storage",
    "大模型": "Foundation Models",
    "动力电池": "Power Batteries",
    "机器人": "Robotics",
    "计算机视觉": "Computer Vision",
    "金融科技": "FinTech",
    "内容平台": "Content Platforms",
    "企业服务": "Enterprise Services",
    "汽车制造": "Automotive Manufacturing",
    "人工智能": "Artificial Intelligence",
    "物联网": "IoT",
    "消费互联网": "Consumer Internet",
    "芯片设计": "Chip Design",
    "新能源汽车": "New Energy Vehicles",
    "云计算": "Cloud Computing",
    "智能驾驶": "Autonomous Driving",
    "AI芯片": "AI Chips",
    "GPU": "GPU",
    "ICT": "ICT",
    "ODM": "ODM",
    "SaaS": "SaaS"
  };
  const regionLabels = {
    "阿联酋和沙特": "UAE and Saudi Arabia",
    "北美": "North America",
    "东南亚": "Southeast Asia",
    "韩国": "South Korea",
    "南美": "South America",
    "欧盟": "European Union",
    "日本": "Japan",
    "台湾": "Taiwan",
    "英国": "United Kingdom",
    "中国大陆": "Mainland China"
  };
  const ui = {
    zh: {
      allIndustries: "全部行业",
      allRegions: "全部地区",
      unlabeled: "未标注",
      backToSearch: "返回评级搜索",
      referenceLink: "参考链接",
      referencesTitle: "参考链接及摘要",
      relatedArticle: "查看关联文章",
      referenceMaterials: "查看参考资料",
      sourceContext: "以下是关联资料链接；资料本身不等于对每项分数的独立验证。",
      addCompare: "加入对比",
      copyQueryLink: "复制查询链接",
      queryLinkCopied: "查询链接已复制",
      queryLinkCopyFailed: "无法自动复制，请复制浏览器地址栏中的链接",
      darwinTitle: "Darwin 优质企业评分",
      darwinEmpty: "该企业尚未完成 Darwin 三项复核。下次半年度复盘时，将补充财务硬度、动态护城河和诚实信号评分，并与 LEADERS 分数比较偏差。",
      darwinIntro: "用财务硬度、动态护城河和诚实信号过滤市场关注度与低成本叙事。",
      darwinDelta: "Darwin - LEADERS 简单均分",
      ambiguousCompany: "该名称对应多家公司，请选择具体企业：",
      compareUnresolved: "以下对比项尚未匹配到唯一企业，请改用企业全名：",
      reportPrint: "打印 / 保存 PDF",
      reportTitle: "企业管理评分简报",
      reviewDate: "最近复核",
      reviewMissing: "未标注复核日期",
      reviewOverdue: "已超过半年度复核周期",
      modelVersion: "模型版本",
      noSources: "尚无可公开追溯的原始资料链接；请勿将本评分视为已独立核证。",
      profileScope: "这是企业层面的管理评估，不是个人领导者档案；评分仅供研究讨论，不构成投资、招聘或准入建议。",
      reportGenerated: "简报生成日期",
      deviation: "偏差判断",
      evidence: "证据等级",
      pendingReview: "等待半年度复核补充说明。",
      simpleAverage: "简单平均",
      weightedSuffix: "加权",
      leaders7: "LEADERS-7项评分",
      judgmentTracking: "判断与跟踪",
      mainRisk: "主要风险：",
      watchPoints: "未来验证点：",
      suggestionsLabel: "相近企业",
      suggestionsIntro: "你可能想查：",
      notCovered: "暂未收录：",
      unknownCompany: "该企业",
      notCoveredHint: "免费查询库目前覆盖站内评分企业和新增研究企业。你可以尝试输入：寒武纪、商汤科技、摩尔线程、科大讯飞、DeepSeek、宇树科技。",
      tableCount: (start, end, filtered) => `显示 ${start}-${end} / ${filtered} 家企业`,
      tableEmpty: "没有符合筛选条件的企业。",
      pagePrevious: "上一页",
      pageNext: "下一页",
      pageStatus: (current, total) => `第 ${current} / ${total} 页`,
      loadFailure: "评分数据加载失败，请稍后再试。",
      retry: "重新加载",
      loading: "正在加载评分数据…",
      welcome: "输入企业名称或选择下方示例，查看博客中的评分与说明。",
      calculation: "这些分数如何计算？",
      weight: "权重",
      contribution: "加权贡献",
      score: "分值",
      calculationNote: "加权分为各项贡献之和，再乘证据系数。下方三种阶段仅改变模型权重，不代表企业事实变化，也不是预测概率。",
      coefficient: "证据系数",
      compareFull: "对比栏已满，请先清空一个输入框；不会自动替换你选择的企业。",
      noCompare: "请选择至少两家公司进行横向对比。",
      metric: "指标",
      stageWeighted: "阶段加权",
      evidenceAdjusted: "证据调整",
      darwinAverage: "Darwin平均",
      updated: "更新时间",
      pendingScore: "待评分",
      pendingReviewShort: "待复核",
      radarLabel: "LEADERS 七项评分雷达图",
      radarDescription: "所选企业在 LEADERS 七项评分上的对比图，详细数值见相邻表格。",
      deviationNormal: "偏差正常",
      deviationWatch: "需要跟踪",
      deviationReview: "需要复核参数",
      defaultRating: "D档：高风险",
      defaultDarwinRating: "风险档：先看现金流",
      noArticleSummary: (name, summary) => `${name}暂无站内企业评析文章，以下公开资料用于支撑当前 LEADERS 与 Darwin 评分：${summary}`,
      noArticleFallback: (name) => `${name}暂无站内企业评析文章，当前评分依据企业基础信息、公开风险线索和后续人工复核要求形成。`
    },
    en: {
      allIndustries: "All industries",
      allRegions: "All regions",
      unlabeled: "Unlabeled",
      backToSearch: "Back to rating search",
      referenceLink: "Reference link",
      referencesTitle: "Reference links and summary",
      relatedArticle: "View related article",
      referenceMaterials: "View reference materials",
      sourceContext: "Related material links are listed below; they do not independently verify every score.",
      addCompare: "Add to comparison",
      copyQueryLink: "Copy query link",
      queryLinkCopied: "Query link copied",
      queryLinkCopyFailed: "Automatic copy failed. Copy the URL from the browser address bar.",
      darwinTitle: "Darwin quality-company score",
      darwinEmpty: "This company has not completed the three Darwin review dimensions yet. The next half-year review will add scores for financial hardness, dynamic moat, and honest signals, then compare them with the LEADERS score.",
      darwinIntro: "Filters market attention and low-cost narratives through financial hardness, dynamic moat, and honest signals.",
      darwinDelta: "Darwin - LEADERS simple mean",
      ambiguousCompany: "This name refers to multiple companies. Choose one:",
      compareUnresolved: "These comparison entries do not identify a unique company. Use full company names:",
      reportPrint: "Print / save PDF",
      reportTitle: "Company management score brief",
      reviewDate: "Last reviewed",
      reviewMissing: "Review date not recorded",
      reviewOverdue: "Past the semiannual review cycle",
      modelVersion: "Model version",
      noSources: "No publicly traceable primary source link is recorded; this score has not been independently verified here.",
      profileScope: "This is a company-level management assessment, not a personal leader profile. It is for research discussion, not investment, hiring, or admission advice.",
      reportGenerated: "Brief generated",
      deviation: "Deviation",
      evidence: "Evidence",
      pendingReview: "Waiting for the next half-year review note.",
      simpleAverage: "Simple average",
      weightedSuffix: "weighted",
      leaders7: "LEADERS-7 scores",
      judgmentTracking: "Judgment and tracking",
      mainRisk: "Main risk: ",
      watchPoints: "Future validation points:",
      suggestionsLabel: "Similar companies",
      suggestionsIntro: "You may want to search:",
      notCovered: "Not covered yet: ",
      unknownCompany: "this company",
      notCoveredHint: "The free lookup currently covers rated companies on this site and newly researched companies. Try: Cambricon, SenseTime, Moore Threads, iFLYTEK, DeepSeek, or Unitree.",
      tableCount: (start, end, filtered) => `Showing ${start}-${end} of ${filtered} companies`,
      tableEmpty: "No companies match the current filters.",
      pagePrevious: "Previous",
      pageNext: "Next",
      pageStatus: (current, total) => `Page ${current} of ${total}`,
      loadFailure: "Rating data failed to load. Please try again later.",
      retry: "Try again",
      loading: "Loading rating data…",
      welcome: "Enter a company name or choose an example to read the blog's scores and notes.",
      calculation: "How are these scores calculated?",
      weight: "Weight",
      contribution: "Contribution",
      score: "Score",
      calculationNote: "Contributions sum to the weighted score, then the evidence coefficient is applied. Stage scenarios change model weights, not company facts; they are not probabilities.",
      coefficient: "Evidence coefficient",
      compareFull: "Comparison is full. Clear an input first; your choices will not be replaced automatically.",
      noCompare: "Select at least two companies for comparison.",
      metric: "Metric",
      stageWeighted: "Stage-weighted",
      evidenceAdjusted: "Evidence-adjusted",
      darwinAverage: "Darwin average",
      updated: "Updated",
      pendingScore: "Pending",
      pendingReviewShort: "Pending review",
      radarLabel: "LEADERS seven-dimension radar chart",
      radarDescription: "Comparison of the selected companies across seven LEADERS dimensions. Exact values are available in the adjacent table.",
      deviationNormal: "Normal deviation",
      deviationWatch: "Needs tracking",
      deviationReview: "Needs parameter review",
      defaultRating: "D: high risk",
      defaultDarwinRating: "Risk tier: check cash flow first",
      noArticleSummary: (name, summary) => `${name} does not yet have a site article. The public materials below support the current LEADERS and Darwin scores: ${summary}`,
      noArticleFallback: (name) => `${name} does not yet have a site article. The current score is based on basic company information, public risk signals, and follow-up manual review requirements.`
    }
  };
  const dimensionLabels = {
    zh: {
      leadership: "领袖气质",
      decision: "决策力",
      execution: "实干性",
      bench: "补位力",
      alignment: "文化契合度",
      coverage: "岗位专长完整度",
      governance: "专业化治理结构",
      financial: "资本回报韧性",
      moat: "动态护城河",
      signal: "诚实信号"
    },
    en: {
      leadership: "Leadership",
      decision: "Decision-making",
      execution: "Execution",
      bench: "Executive bench",
      alignment: "Alignment",
      coverage: "Role coverage",
      governance: "Governance",
      financial: "Capital-return resilience",
      moat: "Dynamic moat",
      signal: "Honest signals"
    }
  };
  const stageLabels = {
    zh: { early: "早期", growth: "扩张期", mature: "规模化/成熟期" },
    en: { early: "Early-stage", growth: "Growth-stage", mature: "Mature-stage" }
  };
  const ratingLabels = {
    en: {
      "A档：系统化优势": "A: systematic advantage",
      "B+档：稳定有效": "B+: stable and effective",
      "B档：基本可用": "B: basically workable",
      "C档：存在关键短板": "C: key weaknesses",
      "D档：高风险": "D: high risk",
      "优质企业：繁殖能力强": "Quality company: strong compounding capacity",
      "较优质：护城河可持续": "Strong quality: sustainable moat",
      "观察档：需验证财务质量": "Watch tier: verify financial quality",
      "承压档：真信号不足": "Pressure tier: insufficient true signals",
      "风险档：先看现金流": "Risk tier: check cash flow first"
    }
  };
  const compareColors = ["#205e75", "#b86b1b", "#5f6f52"];
  let companies = [];
  let scoreKeys = [];
  let weights = {};
  let evidenceCoef = {};
  let ratingBands = [];
  let darwinKeys = [];
  let darwinRatingBands = [];
  let darwinWarnDelta = 0.5;
  let darwinReviewDelta = 1.2;
  let modelVersion = "";
  let comparisonFull = false;
  const tablePageSize = 25;
  let tablePage = 1;

  const $ = (selector) => document.querySelector(selector);
  const smoothBehavior = () =>
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  const lang = () => (document.documentElement.getAttribute("data-fr-ui-lang") || "zh").slice(0, 2) === "en" ? "en" : "zh";
  const t = (key, ...args) => {
    const value = ui[lang()][key] ?? ui.zh[key] ?? key;
    return typeof value === "function" ? value(...args) : value;
  };
  const localizedDimensionLabel = (key, fallback) => dimensionLabels[lang()][key] || fallback || key;
  const localizedStageLabel = (key, fallback) => stageLabels[lang()][key] || fallback || key;
  const localizedRatingLabel = (label) => lang() === "en" ? (ratingLabels.en[label] || label) : label;
  const normalize = normalizeCompanyName;
  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  const average = (scores) => averageScore(scores, scoreKeys);
  const averageDarwin = (scores) => averageScore(scores, darwinKeys);
  const tagLabel = (tag, labels) => lang() === "en" ? (labels[tag] || tag) : tag;
  const tagText = (tags, labels) => (tags && tags.length ? tags.map((tag) => tagLabel(tag, labels)).join(lang() === "en" ? ", " : "、") : t("unlabeled"));
  const companyNames = (company) => [company.name].concat(company.aliases || []);
  const byName = (name) => companies.find((company) => company.name === name);

  function modelEntries(order, definitions) {
    return (order || Object.keys(definitions || {})).map((key) => [
      key,
      definitions?.[key]?.label || key
    ]);
  }

  function configureModel(model) {
    modelVersion = model.version || "—";
    scoreKeys = modelEntries(model.dimension_order, model.dimensions);
    darwinKeys = modelEntries(model.darwin_dimension_order, model.darwin_dimensions);
    weights = model.stage_weights || {};
    evidenceCoef = model.evidence_coefficients || {};
    ratingBands = model.rating_bands || [];
    darwinRatingBands = model.darwin_rating_bands || [];
    darwinWarnDelta = Number(model.guardrails?.darwin_feedback?.warn_delta ?? darwinWarnDelta);
    darwinReviewDelta = Number(model.guardrails?.darwin_feedback?.review_delta ?? darwinReviewDelta);
  }

  function isSiteArticle(url) {
    return /^\//.test(url || "") || /^https?:\/\/facereader\.witbacon\.com\//.test(url || "");
  }

  function addReturnParam(url) {
    return articleReturnUrl(url);
  }

  function validMode(value) {
    return Object.prototype.hasOwnProperty.call(weights, value) ? value : "growth";
  }

  function readSearchState() {
    const params = new URLSearchParams(window.location.search);
    return {
      company: params.get("company") || "",
      mode: validMode(params.get("stage") || "growth")
    };
  }

  function syncSearchUrl(companyName, mode, push) {
    const url = new URL(window.location.href);
    if (companyName) url.searchParams.set("company", companyName);
    else url.searchParams.delete("company");
    url.searchParams.set("stage", validMode(mode));
    url.hash = "leaders-search";

    const next = `${url.pathname}${url.search}${url.hash}`;
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (next === current) return;
    window.history[push ? "pushState" : "replaceState"](null, "", next);
  }

  async function copyText(value) {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(value);
        return true;
      } catch (error) {
        // Fall through to the selection-based copy path.
      }
    }

    const helper = document.createElement("textarea");
    helper.value = value;
    helper.setAttribute("readonly", "");
    helper.style.position = "fixed";
    helper.style.opacity = "0";
    document.body.appendChild(helper);
    helper.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }
    helper.remove();
    return copied;
  }

  function showFloatingBack() {
    if (document.querySelector(".leaders-floating-back")) return;
    const link = document.createElement("a");
    link.className = "leaders-floating-back";
    link.href = "#leaders-search";
    link.textContent = t("backToSearch");
    document.body.appendChild(link);
  }

  function weightedScore(company, mode) {
    return calculateWeightedScore(company.scores, mode, scoreKeys, weights);
  }

  function evidenceAdjustedScore(company, mode) {
    return calculateEvidenceAdjustedScore(
      company.scores,
      company.evidence,
      mode,
      scoreKeys,
      weights,
      evidenceCoef
    );
  }

  function bandLabel(score, bands, fallback) {
    return scoreBandLabel(score, bands, fallback);
  }

  function rating(score) {
    return localizedRatingLabel(bandLabel(score, ratingBands, t("defaultRating")));
  }

  function darwinRating(score) {
    return localizedRatingLabel(bandLabel(score, darwinRatingBands, t("defaultDarwinRating")));
  }

  function deviationLabel(delta) {
    const abs = Math.round(Math.abs(delta) * 10) / 10;
    if (abs <= darwinWarnDelta) return t("deviationNormal");
    if (abs <= darwinReviewDelta) return t("deviationWatch");
    return t("deviationReview");
  }

  function orderedCharScore(haystack, needle) {
    let index = -1;
    let gaps = 0;
    for (const char of needle) {
      const next = haystack.indexOf(char, index + 1);
      if (next === -1) return 0;
      gaps += next - index - 1;
      index = next;
    }
    return Math.max(0, 66 - gaps * 3);
  }

  function levenshtein(a, b) {
    if (!a || !b) return Math.max(a.length, b.length);
    const row = Array.from({ length: b.length + 1 }, (_, index) => index);
    for (let i = 1; i <= a.length; i += 1) {
      let prev = row[0];
      row[0] = i;
      for (let j = 1; j <= b.length; j += 1) {
        const temp = row[j];
        row[j] = a[i - 1] === b[j - 1]
          ? prev
          : Math.min(prev + 1, row[j] + 1, row[j - 1] + 1);
        prev = temp;
      }
    }
    return row[b.length];
  }

  function matchScore(name, query) {
    const target = normalize(name);
    const needle = normalize(query);
    if (!target || !needle) return 0;
    if (target === needle) return 100;
    if (/^[a-z0-9]+$/.test(needle) && needle.length < 3) return 0;
    if (target.includes(needle)) return Math.max(78, 96 - (target.length - needle.length));
    if (needle.includes(target)) return Math.max(72, 88 - (needle.length - target.length));

    const ordered = orderedCharScore(target, needle);
    const maxLength = Math.max(target.length, needle.length);
    const distance = maxLength <= 24 ? levenshtein(target, needle) : maxLength;
    const edit = Math.max(0, Math.round(78 * (1 - distance / maxLength)));
    return Math.max(ordered, edit);
  }

  function rankedCompanies(query) {
    const needle = normalize(query);
    if (!needle) return [];
    return companies
      .map((company) => ({
        company,
        score: Math.max(...companyNames(company).map((name) => matchScore(name, needle)))
      }))
      .filter((item) => item.score >= 52)
      .sort((a, b) => b.score - a.score || average(b.company.scores) - average(a.company.scores));
  }

  function findCompany(query) {
    return resolveCompany(companies, query, rankedCompanies).company;
  }

  function renderBars(company) {
    return scoreKeys.map(([key, label]) => {
      const value = Number(company.scores[key] || 0);
      return `
        <div class="leaders-result__bar">
          <span>${escapeHtml(localizedDimensionLabel(key, label))}</span>
          <strong>${value.toFixed(1)}</strong>
          <div class="leaders-result__track" aria-hidden="true">
            <i style="width: ${value * 10}%"></i>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderDarwinBars(darwin) {
    return darwinKeys.map(([key, label]) => {
      const value = Number(darwin[key] || 0);
      return `
        <div class="leaders-result__bar leaders-result__bar--darwin">
          <span>${escapeHtml(localizedDimensionLabel(key, label))}</span>
          <strong>${value.toFixed(1)}</strong>
          <div class="leaders-result__track" aria-hidden="true">
            <i style="width: ${value * 10}%"></i>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderTags(company) {
    const tags = (company.industry_tags || []).map((tag) => tagLabel(tag, industryLabels))
      .concat((company.region_tags || []).map((tag) => tagLabel(tag, regionLabels)));
    if (!tags.length) return "";
    return `
      <div class="leaders-result__tags">
        ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      </div>
    `;
  }

  function referenceSummary(company) {
    if (company.reference_summary) return company.reference_summary;
    return company.sources?.length ? t("sourceContext") : t("noSources");
  }

  function renderReferences(company) {
    const links = (company.sources || [])
      .filter(Boolean)
      .map((source, index) => `
        <li>
          <a href="${escapeHtml(source)}" target="_blank" rel="noopener">${t("referenceLink")} ${index + 1}</a>
        </li>
      `)
      .join("");

    return `
      <section class="leaders-references" id="leaders-reference-materials">
        <h3>${t("referencesTitle")}</h3>
        <p>${escapeHtml(referenceSummary(company))}</p>
        ${links ? `<ul>${links}</ul>` : ""}
      </section>
    `;
  }

  function renderResourceLink(company) {
    if (isSiteArticle(company.url)) {
      return `<a class="btn btn--primary" href="${escapeHtml(addReturnParam(company.url))}">${t("relatedArticle")}</a>`;
    }

    return company.sources?.length
      ? `<a class="btn btn--primary" href="#leaders-reference-materials" data-show-back="true">${t("referenceMaterials")}</a>`
      : "";
  }

  function renderCompareButton(company) {
    if (!$("#leaders-compare")) return "";
    return `<button class="btn leaders-compare-add" type="button" data-compare-company="${escapeHtml(company.name)}">${t("addCompare")}</button>`;
  }

  function renderCopyQueryButton() {
    return `
      <button class="btn leaders-copy-query" type="button" data-copy-query>${t("copyQueryLink")}</button>
      <span class="leaders-copy-query__status" role="status" aria-live="polite"></span>
    `;
  }

  function renderDarwinPanel(company) {
    if (!company.darwin) {
      return `
        <section class="leaders-darwin leaders-darwin--empty">
          <h3>${t("darwinTitle")}</h3>
          <p>${t("darwinEmpty")}</p>
        </section>
      `;
    }

    const score = averageDarwin(company.darwin);
    const delta = darwinLeadersDelta(company, scoreKeys, darwinKeys);
    const deltaText = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`;

    return `
      <section class="leaders-darwin">
        <div class="leaders-darwin__head">
          <div>
            <h3>${t("darwinTitle")}</h3>
            <p>${t("darwinIntro")}</p>
          </div>
          <div class="leaders-darwin__score">
            <span>${score.toFixed(1)}</span>
            <small>${darwinRating(score)}</small>
          </div>
        </div>
        ${renderDarwinBars(company.darwin)}
        <div class="leaders-darwin__compare">
          <div><span>${t("darwinDelta")}</span><strong>${deltaText}</strong></div>
          <div><span>${t("deviation")}</span><strong>${deviationLabel(delta)}</strong></div>
          <div><span>${t("evidence")}</span><strong>${company.darwin.evidence || company.evidence || "C"}</strong></div>
        </div>
        <p class="leaders-darwin__note">${escapeHtml(company.darwin.note || t("pendingReview"))}</p>
      </section>
    `;
  }

  function renderCalculation(company, mode) {
    const rows = scoreBreakdown(company.scores, mode, scoreKeys, weights);
    return `<details class="leaders-calculation">
      <summary>${t("calculation")}</summary>
      <p>${t("calculationNote")}</p>
      <div class="leaders-calculation__scroll" tabindex="0" role="region" aria-label="${t("calculation")}">
        <table><thead><tr><th scope="col">${t("metric")}</th><th scope="col">${t("score")}</th><th scope="col">${t("weight")}</th><th scope="col">${t("contribution")}</th></tr></thead>
        <tbody>${rows.map((row) => `<tr><th scope="row">${escapeHtml(localizedDimensionLabel(row.key))}</th><td>${row.score.toFixed(1)}</td><td>${(row.weight * 100).toFixed(0)}%</td><td>${row.contribution.toFixed(3)}</td></tr>`).join("")}</tbody></table>
      </div>
      <p>${t("coefficient")}: ${evidenceCoef[company.evidence]} · ${t("evidenceAdjusted")}: ${weightedScore(company, mode).toFixed(3)} × ${evidenceCoef[company.evidence]} = ${evidenceAdjustedScore(company, mode).toFixed(1)}</p>
      <ul>${["early", "growth", "mature"].map((stage) => `<li>${localizedStageLabel(stage)}: ${t("stageWeighted")} ${weightedScore(company, stage).toFixed(1)} · ${t("evidenceAdjusted")} ${evidenceAdjustedScore(company, stage).toFixed(1)}</li>`).join("")}</ul>
    </details>`;
  }

  function renderResult(company, mode) {
    const raw = average(company.scores);
    const weighted = weightedScore(company, mode);
    const adjusted = evidenceAdjustedScore(company, mode);
    const plan = weights[mode] || weights.growth;
    const watch = (company.watch || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");
    const reviewDate = company.last_reviewed || t("reviewMissing");
    const reviewAge = company.last_reviewed
      ? (Date.now() - Date.parse(`${company.last_reviewed}T00:00:00Z`)) / 86400000
      : null;
    const reviewWarning = reviewAge !== null && reviewAge > 183 ? ` · ${t("reviewOverdue")}` : "";
    const generated = new Date().toISOString().slice(0, 10);

    $("#leaders-result").innerHTML = `
      <article class="leaders-result" aria-live="polite">
        <div class="leaders-result__head">
          <div>
            <p class="leaders-kicker">${escapeHtml(company.industry)} · ${escapeHtml(company.stage)}</p>
            <h2>${escapeHtml(company.name)}</h2>
          </div>
          <div class="leaders-result__grade">
            <span>${adjusted.toFixed(1)}</span>
            <small>${rating(adjusted)}</small>
          </div>
        </div>
        <div class="leaders-metrics">
          <div><span>${t("simpleAverage")}</span><strong>${raw.toFixed(1)}</strong></div>
          <div><span>${localizedStageLabel(mode, plan.label)} ${t("weightedSuffix")}</span><strong>${weighted.toFixed(1)}</strong></div>
          <div><span>${t("evidenceAdjusted")}</span><strong>${adjusted.toFixed(1)}</strong></div>
          <div><span>${t("evidence")}</span><strong>${company.evidence}</strong></div>
        </div>
        ${renderCalculation(company, mode)}
        <p class="leaders-result__summary">${escapeHtml(company.summary)}</p>
        <p class="leaders-result__provenance">${t("modelVersion")}: ${escapeHtml(modelVersion)} · ${t("reviewDate")}: ${escapeHtml(reviewDate)}${reviewWarning}</p>
        <p class="leaders-result__scope">${t("profileScope")}</p>
        ${renderTags(company)}
        <div class="leaders-result__grid">
          <section>
            <h3>${t("leaders7")}</h3>
            ${renderBars(company)}
            ${renderDarwinPanel(company)}
          </section>
          <section>
            <h3>${t("judgmentTracking")}</h3>
            <p><strong>${t("mainRisk")}</strong>${escapeHtml(company.risk)}</p>
            <p><strong>${t("watchPoints")}</strong></p>
            <ul>${watch}</ul>
            <p class="leaders-result__actions">${renderResourceLink(company)}${renderCompareButton(company)}${renderCopyQueryButton()}<button class="btn" type="button" data-print-report>${t("reportPrint")}</button></p>
          </section>
        </div>
        ${renderReferences(company)}
      </article>
      <section class="leaders-print-report" aria-label="${t("reportTitle")}">
        <h1>${t("reportTitle")} · ${escapeHtml(company.name)}</h1>
        <p>${t("modelVersion")}: ${escapeHtml(modelVersion)} · ${t("reviewDate")}: ${escapeHtml(reviewDate)}${reviewWarning} · ${t("reportGenerated")}: ${generated}</p>
        <p>${t("evidence")}: ${escapeHtml(company.evidence)} · ${t("simpleAverage")}: ${raw.toFixed(1)} · ${localizedStageLabel(mode, plan.label)} ${t("weightedSuffix")}: ${weighted.toFixed(1)} · ${t("evidenceAdjusted")}: ${adjusted.toFixed(1)} (${rating(adjusted)})</p>
        <h2>${t("leaders7")}</h2>
        <ul>${scoreKeys.map(([key, label]) => `<li>${escapeHtml(localizedDimensionLabel(key, label))}: ${company.scores[key].toFixed(1)}</li>`).join("")}</ul>
        ${company.darwin ? `<p>${t("darwinTitle")}: ${averageDarwin(company.darwin).toFixed(1)} · ${t("darwinDelta")}: ${darwinLeadersDelta(company, scoreKeys, darwinKeys).toFixed(1)}</p>` : ""}
        <p>${escapeHtml(company.summary)}</p>
        <h2>${t("judgmentTracking")}</h2>
        <p>${t("mainRisk")}${escapeHtml(company.risk)}</p>
        <p>${t("watchPoints")}</p><ul>${watch}</ul>
        <h2>${t("referencesTitle")}</h2>
        <p>${escapeHtml(referenceSummary(company))}</p>
        <ol>${(company.sources || []).map((source) => `<li>${escapeHtml(source)}</li>`).join("")}</ol>
        ${isSiteArticle(company.url) ? `<p>${t("relatedArticle")}: ${escapeHtml(company.url)}</p>` : ""}
        <p>${t("profileScope")}</p>
      </section>
    `;
    $("[data-print-report]")?.addEventListener("click", () => window.print());

    const referenceLink = document.querySelector("[data-show-back='true']");
    if (referenceLink) {
      referenceLink.addEventListener("click", showFloatingBack);
    }
    const compareButton = document.querySelector("[data-compare-company]");
    if (compareButton) {
      compareButton.addEventListener("click", () => addCompareCompany(compareButton.dataset.compareCompany));
    }
    const copyButton = document.querySelector("[data-copy-query]");
    if (copyButton) {
      copyButton.addEventListener("click", async () => {
        syncSearchUrl(company.name, mode, false);
        const copied = await copyText(window.location.href);
        const status = copyButton.parentElement.querySelector(".leaders-copy-query__status");
        if (status) status.textContent = copied ? t("queryLinkCopied") : t("queryLinkCopyFailed");
      });
    }
  }

  function renderSuggestions(query) {
    const suggestions = rankedCompanies(query)
      .slice(0, 6)
      .map(({ company }) => `<button type="button" data-company="${escapeHtml(company.name)}">${escapeHtml(company.name)}</button>`)
      .join("");
    if (!suggestions) return "";
    return `
      <div class="leaders-suggestions" aria-label="${t("suggestionsLabel")}">
        <p>${t("suggestionsIntro")}</p>
        <div>${suggestions}</div>
      </div>
    `;
  }

  function renderEmpty(query) {
    const resolution = resolveCompany(companies, query, rankedCompanies);
    const candidates = resolution.candidates.length ? resolution.candidates : rankedCompanies(query).slice(0, 6).map((item) => item.company);
    $("#leaders-result").innerHTML = `
      <article class="leaders-result leaders-result--empty" aria-live="polite">
        <h2>${resolution.reason === "ambiguous" ? t("ambiguousCompany") : `${t("notCovered")}${escapeHtml(query || t("unknownCompany"))}`}</h2>
        <p>${resolution.reason === "ambiguous" ? "" : t("notCoveredHint")}</p>
        <div class="leaders-suggestions"><div>${candidates.map((company) => `<button type="button" data-company="${escapeHtml(company.name)}">${escapeHtml(company.name)}</button>`).join("")}</div></div>
      </article>
    `;
    bindCompanyButtons("#leaders-result");
  }

  function renderWelcome() {
    $("#leaders-result").innerHTML = `<p role="status">${t("welcome")}</p>`;
  }

  function runSearch(event) {
    event.preventDefault();
    const query = $("#leaders-company-input").value;
    const mode = $("#leaders-stage").value;
    const company = findCompany(query);
    if (company) {
      $("#leaders-company-input").value = company.name;
      renderResult(company, mode);
      syncSearchUrl(company.name, mode, true);
    } else {
      renderEmpty(query);
      syncSearchUrl(query, mode, true);
    }
  }

  function restoreSearchFromUrl() {
    const input = $("#leaders-company-input");
    const stage = $("#leaders-stage");
    if (!input || !stage || !companies.length) return;

    const state = readSearchState();
    stage.value = state.mode;
    input.value = state.company;
    if (!state.company) {
      renderWelcome();
    } else {
      const company = findCompany(state.company);
      if (company) renderResult(company, state.mode);
      else renderEmpty(state.company);
    }
    renderCompare();
  }

  function renderExamples() {
    const hotCompanies = hotCompanyNames
      .map((name) => findCompany(name))
      .filter(Boolean);
    const fallbackCompanies = companies
      .filter((company) => !hotCompanies.includes(company))
      .sort((a, b) => average(b.scores) - average(a.scores));
    const examples = hotCompanies
      .concat(fallbackCompanies)
      .slice(0, 10)
      .map((company) => `<button type="button" data-company="${escapeHtml(company.name)}">${escapeHtml(company.name)}</button>`)
      .join("");
    $("#leaders-examples").innerHTML = examples;
    bindCompanyButtons("#leaders-examples");
  }

  function bindCompanyButtons(scopeSelector) {
    const scope = $(scopeSelector);
    if (!scope || scope.dataset.companyButtonsBound) return;
    scope.dataset.companyButtonsBound = "true";
    scope.addEventListener("click", (event) => {
      const target = event.target.closest("button[data-company]");
      if (!target) return;
      $("#leaders-company-input").value = target.dataset.company;
      $("#leaders-search-form").dispatchEvent(new Event("submit", { cancelable: true }));
    });
  }

  function uniqueTags(key) {
    return Array.from(new Set(companies.flatMap((company) => company[key] || []))).sort((a, b) => {
      return a.localeCompare(b, "zh-Hans-CN");
    });
  }

  function renderFilterOptions(select, tags, label, labels) {
    select.innerHTML = [`<option value="">${escapeHtml(label)}</option>`]
      .concat(tags.map((tag) => `<option value="${escapeHtml(tag)}">${escapeHtml(tagLabel(tag, labels))}</option>`))
      .join("");
  }

  function tablePageNumbers(current, total) {
    const pages = new Set([1, total, current - 1, current, current + 1]);
    if (current <= 3) {
      pages.add(2);
      pages.add(3);
    }
    if (current >= total - 2) {
      pages.add(total - 1);
      pages.add(total - 2);
    }
    return Array.from(pages)
      .filter((page) => page >= 1 && page <= total)
      .sort((a, b) => a - b);
  }

  function renderLeadersTable() {
    const tableRoot = $("#leaders-companies-table");
    if (!tableRoot) return;

    const industrySelect = $("#leaders-industry-filter");
    const regionSelect = $("#leaders-region-filter");
    const queryInput = $("#leaders-table-query");
    const resetButton = $("#leaders-filter-reset");
    const countEl = $("#leaders-table-count");
    const bodyEl = $("#leaders-table-body");
    if (!industrySelect || !regionSelect || !bodyEl) return;
    let paginationEl = tableRoot.querySelector(".leaders-table__pagination");
    if (!paginationEl) {
      paginationEl = document.createElement("nav");
      paginationEl.className = "leaders-table__pagination";
      paginationEl.setAttribute("aria-label", lang() === "en" ? "Company table pagination" : "企业评分表分页");
      tableRoot.querySelector(".leaders-table__wrap")?.insertAdjacentElement("afterend", paginationEl);
    }

    const currentIndustry = industrySelect.value;
    const currentRegion = regionSelect.value;
    const industryTags = uniqueTags("industry_tags");
    const regionTags = uniqueTags("region_tags");
    renderFilterOptions(industrySelect, industryTags, t("allIndustries"), industryLabels);
    renderFilterOptions(regionSelect, regionTags, t("allRegions"), regionLabels);
    if (industryTags.includes(currentIndustry)) industrySelect.value = currentIndustry;
    if (regionTags.includes(currentRegion)) regionSelect.value = currentRegion;

    const applyFilters = () => {
      const industry = industrySelect.value;
      const region = regionSelect.value;
      const query = normalize(queryInput?.value);
      const filtered = companies.filter((company) => {
        const industryMatched = !industry || (company.industry_tags || []).includes(industry);
        const regionMatched = !region || (company.region_tags || []).includes(region);
        const queryMatched = !query || companyNames(company).some((name) => normalize(name).includes(query));
        return industryMatched && regionMatched && queryMatched;
      });
      const totalPages = Math.max(1, Math.ceil(filtered.length / tablePageSize));
      tablePage = Math.max(1, Math.min(tablePage, totalPages));
      const pageStart = (tablePage - 1) * tablePageSize;
      const pageItems = filtered.slice(pageStart, pageStart + tablePageSize);

      bodyEl.innerHTML = pageItems.length ? pageItems.map((company, index) => {
        const score = average(company.scores);
        const reportUrl = new URL(window.location.href);
        reportUrl.searchParams.set("company", company.name);
        reportUrl.searchParams.set("stage", $("#leaders-stage")?.value || "growth");
        reportUrl.hash = "leaders-search";
        const url = `${reportUrl.pathname}${reportUrl.search}${reportUrl.hash}`;
        return `
          <tr>
            <td data-label="${lang() === "en" ? "#" : "序号"}">${pageStart + index + 1}</td>
            <td data-label="${lang() === "en" ? "Company" : "企业名称"}">
              <a href="${escapeHtml(url)}">${escapeHtml(company.name)}</a>
              <small>${escapeHtml((company.aliases || []).slice(0, 4).join(" / "))}</small>
            </td>
            <td data-label="${lang() === "en" ? "Industry" : "行业"}">${escapeHtml(tagText(company.industry_tags, industryLabels))}</td>
            <td data-label="${lang() === "en" ? "Region" : "地区"}">${escapeHtml(tagText(company.region_tags, regionLabels))}</td>
            <td data-label="${t("evidence")}">${escapeHtml(company.evidence || "C")}</td>
            <td data-label="${t("updated")}">${escapeHtml(company.last_reviewed || t("pendingReviewShort"))}</td>
            <td data-label="${localizedDimensionLabel("leadership", "领袖气质")}">${Number(company.scores.leadership || 0).toFixed(1)}</td>
            <td data-label="${localizedDimensionLabel("decision", "决策力")}">${Number(company.scores.decision || 0).toFixed(1)}</td>
            <td data-label="${localizedDimensionLabel("execution", "实干性")}">${Number(company.scores.execution || 0).toFixed(1)}</td>
            <td data-label="${localizedDimensionLabel("bench", "补位力")}">${Number(company.scores.bench || 0).toFixed(1)}</td>
            <td data-label="${localizedDimensionLabel("alignment", "文化契合度")}">${Number(company.scores.alignment || 0).toFixed(1)}</td>
            <td data-label="${localizedDimensionLabel("coverage", "岗位完整性")}">${Number(company.scores.coverage || 0).toFixed(1)}</td>
            <td data-label="${localizedDimensionLabel("governance", "治理结构")}">${Number(company.scores.governance || 0).toFixed(1)}</td>
            <td data-label="${lang() === "en" ? "Average" : "平均分"}"><strong>${score.toFixed(1)}</strong></td>
          </tr>
        `;
      }).join("") : `<tr><td colspan="14">${t("tableEmpty")}</td></tr>`;

      if (countEl) {
        countEl.textContent = filtered.length
          ? t("tableCount", pageStart + 1, pageStart + pageItems.length, filtered.length, companies.length)
          : t("tableEmpty");
      }
      tableRoot.setAttribute("aria-busy", "false");

      if (paginationEl) {
        const pageButtons = tablePageNumbers(tablePage, totalPages)
          .map((page, index, list) => {
            const gap = index > 0 && page - list[index - 1] > 1 ? `<span class="leaders-table__pagination-gap">...</span>` : "";
            return `${gap}<button type="button" data-page="${page}" aria-current="${page === tablePage ? "page" : "false"}">${page}</button>`;
          })
          .join("");
        paginationEl.hidden = filtered.length <= tablePageSize;
        paginationEl.setAttribute("aria-label", lang() === "en" ? "Company table pagination" : "企业评分表分页");
        paginationEl.innerHTML = `
          <button type="button" data-page="prev" ${tablePage <= 1 ? "disabled" : ""}>${t("pagePrevious")}</button>
          <span class="leaders-table__pagination-pages">${pageButtons}</span>
          <button type="button" data-page="next" ${tablePage >= totalPages ? "disabled" : ""}>${t("pageNext")}</button>
          <span class="leaders-table__pagination-status">${t("pageStatus", tablePage, totalPages)}</span>
        `;
        paginationEl.onclick = (event) => {
          const button = event.target.closest("button[data-page]");
          if (!button || button.disabled) return;
          const action = button.dataset.page;
          if (action === "prev") tablePage -= 1;
          else if (action === "next") tablePage += 1;
          else tablePage = Number(action) || tablePage;
          applyFilters();
          tableRoot.querySelector(".leaders-table__wrap")?.scrollTo({ top: 0, left: 0, behavior: smoothBehavior() });
        };
      }
    };

    if (!tableRoot.dataset.filtersBound) {
      industrySelect.addEventListener("change", () => {
        tablePage = 1;
        applyFilters();
      });
      regionSelect.addEventListener("change", () => {
        tablePage = 1;
        applyFilters();
      });
      queryInput?.addEventListener("input", () => {
        tablePage = 1;
        applyFilters();
      });
      tableRoot.dataset.filtersBound = "true";
    }
    if (resetButton && !resetButton.dataset.resetBound) {
      resetButton.addEventListener("click", () => {
        tablePage = 1;
        industrySelect.value = "";
        regionSelect.value = "";
        if (queryInput) queryInput.value = "";
        applyFilters();
      });
      resetButton.dataset.resetBound = "true";
    }
    applyFilters();
  }

  function compareInputSelectors() {
    return ["#leaders-compare-a", "#leaders-compare-b", "#leaders-compare-c"];
  }

  function compareInputs() {
    return compareInputSelectors()
      .map((selector) => $(selector))
      .filter(Boolean);
  }

  function compareCompanyFromValue(value) {
    return byName(value) || findCompany(value);
  }

  function fillCompareInputs() {
    const compareRoot = $("#leaders-compare");
    if (!compareRoot) return;

    const inputs = compareInputs();
    const datalist = $("#leaders-compare-options");
    const sorted = [...companies].sort((a, b) => average(b.scores) - average(a.scores) || a.name.localeCompare(b.name, "zh-Hans-CN"));
    const aliasCounts = new Map();
    for (const company of companies) for (const alias of company.aliases || []) {
      const key = normalize(alias);
      aliasCounts.set(key, (aliasCounts.get(key) || 0) + 1);
    }
    if (datalist) {
      datalist.innerHTML = sorted.flatMap((company) => {
        const alias = (company.aliases || []).slice(0, 3).join(" / ");
        const label = [company.industry, alias].filter(Boolean).join(" · ");
        const options = [`<option value="${escapeHtml(company.name)}"${label ? ` label="${escapeHtml(label)}"` : ""}></option>`];
        for (const name of (company.aliases || []).slice(0, 6)) {
          if (aliasCounts.get(normalize(name)) === 1) {
            options.push(`<option value="${escapeHtml(name)}" label="${escapeHtml(company.name)}"></option>`);
          }
        }
        return options;
      }).join("");
    }

    inputs.forEach((input) => {
      input.addEventListener("input", () => { comparisonFull = false; renderCompare(); });
      input.addEventListener("change", renderCompare);
      input.addEventListener("blur", () => {
        const company = compareCompanyFromValue(input.value);
        if (company) input.value = company.name;
        renderCompare();
      });
    });

    const clearButton = $("#leaders-compare-clear");
    if (clearButton) {
      clearButton.addEventListener("click", () => {
        comparisonFull = false;
        inputs.forEach((input) => { input.value = ""; });
        renderCompare();
      });
    }

    renderCompare();
  }

  function addCompareCompany(name) {
    const compareRoot = $("#leaders-compare");
    if (!compareRoot || !name) return;
    const inputs = compareInputs();
    if (!inputs.length) return;

    const existing = inputs.find((input) => compareCompanyFromValue(input.value)?.name === name);
    if (existing) {
      compareRoot.scrollIntoView({ behavior: smoothBehavior(), block: "start" });
      return;
    }

    const target = inputs.find((input) => !input.value.trim());
    if (!target) {
      comparisonFull = true;
      renderCompare();
      compareRoot.scrollIntoView({ behavior: smoothBehavior(), block: "start" });
      inputs[inputs.length - 1].focus({ preventScroll: true });
      return;
    }
    comparisonFull = false;
    target.value = name;
    renderCompare();
    compareRoot.scrollIntoView({ behavior: smoothBehavior(), block: "start" });
  }

  function compareMetricRows(selected, mode) {
    const rows = [
      [t("stageWeighted"), (company) => weightedScore(company, mode).toFixed(1)],
      [t("evidenceAdjusted"), (company) => evidenceAdjustedScore(company, mode).toFixed(1)],
      [t("simpleAverage"), (company) => average(company.scores).toFixed(1)],
      [t("darwinAverage"), (company) => company.darwin ? averageDarwin(company.darwin).toFixed(1) : t("pendingScore")],
      [t("evidence"), (company) => company.evidence || "C"],
      [t("updated"), (company) => company.last_reviewed || t("pendingReviewShort")]
    ];

    return rows.map(([label, getter], rowIndex) => {
      const values = selected.map(getter);
      const numericValues = rowIndex < 4 ? values.map((value) => Number.parseFloat(value)) : [];
      const finiteValues = numericValues.filter(Number.isFinite);
      const best = finiteValues.length ? Math.max(...finiteValues) : null;

      return `
        <tr>
          <th>${escapeHtml(label)}</th>
          ${selected.map((company, index) => {
            const value = values[index];
            const numericValue = numericValues[index];
            const bestClass = best !== null && Number.isFinite(numericValue) && numericValue === best ? ` class="is-best"` : "";
            return `<td${bestClass}>${escapeHtml(value)}</td>`;
          }).join("")}
        </tr>
      `;
    }).join("");
  }

  function compareScoreRows(selected) {
    return scoreKeys.map(([key, label]) => {
      const values = selected.map((company) => Number(company.scores[key] || 0));
      const best = Math.max(...values);

      return `
        <tr>
          <th>${escapeHtml(localizedDimensionLabel(key, label))}</th>
          ${selected.map((company, index) => {
            const value = values[index];
            const bestClass = value === best ? ` class="is-best"` : "";
            return `<td${bestClass}>${value.toFixed(1)}</td>`;
          }).join("")}
        </tr>
      `;
    }).join("");
  }

  function radarPoint(index, value, center, radius) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index / scoreKeys.length);
    const distance = radius * Math.max(0, Math.min(10, Number(value) || 0)) / 10;
    return {
      x: center + Math.cos(angle) * distance,
      y: center + Math.sin(angle) * distance
    };
  }

  function radarGridPoint(index, ratio, center, radius) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * index / scoreKeys.length);
    return {
      x: center + Math.cos(angle) * radius * ratio,
      y: center + Math.sin(angle) * radius * ratio
    };
  }

  function renderCompareRadar(selected) {
    const center = 180;
    const radius = 118;
    const rings = [0.25, 0.5, 0.75, 1]
      .map((ratio) => {
        const points = scoreKeys.map((_, index) => radarGridPoint(index, ratio, center, radius));
        return `<polygon points="${points.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ")}"></polygon>`;
      })
      .join("");
    const axes = scoreKeys.map(([, label], index) => {
      const key = scoreKeys[index][0];
      const point = radarGridPoint(index, 1, center, radius);
      const text = radarGridPoint(index, 1.17, center, radius);
      return `
        <line x1="${center}" y1="${center}" x2="${point.x.toFixed(1)}" y2="${point.y.toFixed(1)}"></line>
        <text x="${text.x.toFixed(1)}" y="${text.y.toFixed(1)}">${escapeHtml(localizedDimensionLabel(key, label))}</text>
      `;
    }).join("");
    const shapes = selected.map((company, index) => {
      const color = compareColors[index % compareColors.length];
      const points = scoreKeys
        .map(([key], scoreIndex) => radarPoint(scoreIndex, company.scores[key], center, radius))
        .map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`)
        .join(" ");
      return `<polygon class="leaders-compare-radar__shape" points="${points}" style="--series-color: ${color};"></polygon>`;
    }).join("");
    const legend = selected.map((company, index) => `
      <span><i style="background:${compareColors[index % compareColors.length]}"></i>${escapeHtml(company.name)}</span>
    `).join("");

    return `
      <div class="leaders-compare-radar">
        <div class="leaders-compare-radar__chart">
          <svg viewBox="0 0 360 360" role="img">
            <title>${escapeHtml(t("radarLabel"))}</title>
            <desc>${escapeHtml(t("radarDescription"))}</desc>
            <g class="leaders-compare-radar__grid">${rings}${axes}</g>
            <g>${shapes}</g>
          </svg>
        </div>
        <div class="leaders-compare-radar__legend">${legend}</div>
      </div>
    `;
  }

  function renderCompare() {
    const output = $("#leaders-compare-output");
    if (!output) return;

    const inputs = compareInputs().map((input) => input.value.trim()).filter(Boolean);
    const unresolved = inputs.filter((value) => !compareCompanyFromValue(value));
    const notice = (comparisonFull ? `<p role="status">${t("compareFull")}</p>` : "") + (unresolved.length
      ? `<p class="leaders-compare__empty" role="status">${t("compareUnresolved")} ${escapeHtml(unresolved.join(" / "))}</p>`
      : "");
    const selected = inputs
      .map(compareCompanyFromValue)
      .filter(Boolean)
      .filter((company, index, list) => list.findIndex((item) => item.name === company.name) === index);
    const mode = $("#leaders-stage")?.value || "growth";

    if (selected.length < 2) {
      output.innerHTML = `${notice}<p class="leaders-compare__empty">${t("noCompare")}</p>`;
      return;
    }

    output.innerHTML = `${notice}
      <div class="leaders-compare__cards">
        ${selected.map((company) => {
          const adjusted = evidenceAdjustedScore(company, mode);
          const darwin = company.darwin ? averageDarwin(company.darwin) : null;
          const gap = darwin === null ? null : darwinLeadersDelta(company, scoreKeys, darwinKeys);
          const delta = gap === null ? "" : `${gap >= 0 ? "+" : ""}${gap.toFixed(1)}`;
          return `
            <article>
              <h3>${escapeHtml(company.name)}</h3>
              <p>${escapeHtml(company.industry)} · ${escapeHtml(company.stage)}</p>
              <strong>${adjusted.toFixed(1)}</strong>
              <span>${escapeHtml(rating(adjusted))}</span>
              ${delta ? `<small>${t("darwinDelta")}: ${escapeHtml(delta)}</small>` : `<small>Darwin: ${t("pendingScore")}</small>`}
            </article>
          `;
        }).join("")}
      </div>
      <div class="leaders-compare__detail">
        <div class="leaders-compare__table-wrap">
          <table class="leaders-compare__table">
            <thead>
              <tr>
                <th>${t("metric")}</th>
                ${selected.map((company) => `<th>${escapeHtml(company.name)}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${compareMetricRows(selected, mode)}
              ${compareScoreRows(selected)}
            </tbody>
          </table>
        </div>
        ${renderCompareRadar(selected)}
      </div>
    `;
  }

  function refreshLanguageState() {
    if (!companies.length) return;
    renderExamples();
    const { company: query, mode } = readSearchState();
    const company = query ? findCompany(query) : null;
    if (!query) renderWelcome();
    else if (company) {
      renderResult(company, mode);
    } else {
      renderEmpty(query);
    }
    renderLeadersTable();
    renderCompare();
    document.querySelectorAll(".leaders-floating-back").forEach((link) => {
      link.textContent = t("backToSearch");
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const root = $("#leaders-scorecard-app");
    if (!root) return;
    window.addEventListener("beforeprint", () => {
      const report = $(".leaders-print-report");
      if (!report) return;
      document.querySelector("#leaders-print-only")?.remove();
      const copy = report.cloneNode(true);
      copy.id = "leaders-print-only";
      document.body.append(copy);
      document.body.classList.add("leaders-printing");
    });
    window.addEventListener("afterprint", () => {
      document.body.classList.remove("leaders-printing");
      document.querySelector("#leaders-print-only")?.remove();
    });

    let loadState = "loading";
    const controls = document.querySelectorAll("#leaders-search-form input, #leaders-search-form select, #leaders-search-form button, .leaders-compare__selectors input, .leaders-compare__selectors button, .leaders-table__toolbar input, .leaders-table__toolbar select, .leaders-table__toolbar button");
    function renderLoadState() {
      const failed = loadState === "error";
      const message = failed ? t("loadFailure") : t("loading");
      $("#leaders-result").innerHTML = `<p role="status">${message}</p>${failed ? `<button type="button" class="btn" data-retry-load>${t("retry")}</button>` : ""}`;
      $("#leaders-table-count").textContent = message;
      $("#leaders-table-body").innerHTML = `<tr><td colspan="14">${message}</td></tr>`;
      $("#leaders-compare-output").textContent = message;
      root.setAttribute("aria-busy", failed ? "false" : "true");
      $("#leaders-companies-table").setAttribute("aria-busy", failed ? "false" : "true");
      $("[data-retry-load]")?.addEventListener("click", loadApplication);
    }
    document.addEventListener("facereader:ui-language", () => {
      if (loadState === "ready") refreshLanguageState();
      else renderLoadState();
    });
    async function loadApplication() {
      loadState = "loading";
      controls.forEach((control) => { control.disabled = true; });
      renderLoadState();
      try {
        const modelUrl = root.dataset.model || "/assets/data/leaders-score-rubric.json";
        const [loadedCompanies, loadedModel] = await Promise.all([
          fetchJson(root.dataset.source),
          fetchJson(modelUrl)
        ]);
        validateDataset(loadedCompanies, loadedModel);
        companies = loadedCompanies;
        configureModel(loadedModel);
        renderExamples();
        renderLeadersTable();
        fillCompareInputs();
        $("#leaders-search-form").addEventListener("submit", runSearch);
        $("#leaders-stage").addEventListener("change", () => {
          const query = readSearchState().company;
          const company = query ? findCompany(query) : null;
          const mode = $("#leaders-stage").value;
          if (!query) renderWelcome();
          else if (company) renderResult(company, mode);
          else renderEmpty(query);
          syncSearchUrl(query ? (company?.name || query) : "", mode, true);
          renderLeadersTable();
          renderCompare();
        });
        window.addEventListener("popstate", restoreSearchFromUrl);
        restoreSearchFromUrl();
        loadState = "ready";
        root.setAttribute("aria-busy", "false");
        controls.forEach((control) => { control.disabled = false; });
      } catch (error) {
        companies = [];
        loadState = "error";
        renderLoadState();
      }
    }
    loadApplication();
  });
})();
