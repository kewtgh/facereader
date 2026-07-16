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

  const $ = (selector) => document.querySelector(selector);
  const normalize = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const escapeHtml = (value) => String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
  const average = (scores) => scoreKeys.reduce((sum, [key]) => sum + Number(scores[key] || 0), 0) / scoreKeys.length;
  const averageDarwin = (scores) => darwinKeys.reduce((sum, [key]) => sum + Number(scores[key] || 0), 0) / darwinKeys.length;
  const tagLabel = (tag, labels) => labels[tag] ? `${tag} / ${labels[tag]}` : tag;
  const tagText = (tags, labels) => (tags && tags.length ? tags.map((tag) => tagLabel(tag, labels)).join("、") : "未标注 / Unlabeled");
  const companyNames = (company) => [company.name].concat(company.aliases || []);
  const byName = (name) => companies.find((company) => company.name === name);

  function modelEntries(order, definitions) {
    return (order || Object.keys(definitions || {})).map((key) => [
      key,
      definitions?.[key]?.label || key
    ]);
  }

  function configureModel(model) {
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

  function localizeUrl(url) {
    return String(url || "").replace(/^https?:\/\/facereader\.witbacon\.com/i, "");
  }

  function addReturnParam(url) {
    const localUrl = localizeUrl(url);
    const separator = localUrl.includes("?") ? "&" : "?";
    return `${localUrl}${separator}from=leaders-scorecard`;
  }

  function showFloatingBack() {
    if (document.querySelector(".leaders-floating-back")) return;
    const link = document.createElement("a");
    link.className = "leaders-floating-back";
    link.href = "#leaders-search";
    link.textContent = "返回评级搜索";
    document.body.appendChild(link);
  }

  function weightedScore(company, mode) {
    const plan = weights[mode] || weights.growth;
    if (!plan || !scoreKeys.length) return 0;
    const values = scoreKeys.map(([key]) => Number(company.scores[key] || 0));
    return values.reduce((sum, score, index) => sum + score * plan.values[index], 0);
  }

  function evidenceAdjustedScore(company, mode) {
    const plan = weights[mode] || weights.growth;
    if (!plan || !scoreKeys.length) return 0;
    const coef = evidenceCoef[company.evidence] ?? evidenceCoef.C ?? 0.7;
    const numerator = scoreKeys.reduce((sum, [key], index) => {
      return sum + Number(company.scores[key] || 0) * plan.values[index] * coef;
    }, 0);
    const denominator = plan.values.reduce((sum, value) => sum + value * coef, 0);
    return numerator / denominator;
  }

  function bandLabel(score, bands, fallback) {
    const match = bands.find((band) => score >= Number(band.min));
    return match ? match.label : fallback;
  }

  function rating(score) {
    return bandLabel(score, ratingBands, "D档：高风险");
  }

  function darwinRating(score) {
    return bandLabel(score, darwinRatingBands, "风险档：先看现金流");
  }

  function deviationLabel(delta) {
    const abs = Math.abs(delta);
    if (abs <= darwinWarnDelta) return "偏差正常";
    if (abs <= darwinReviewDelta) return "需要跟踪";
    return "需要复核参数";
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
    const matches = rankedCompanies(query);
    const best = matches[0];
    return best && best.score >= 72 ? best.company : null;
  }

  function renderBars(company) {
    return scoreKeys.map(([key, label]) => {
      const value = Number(company.scores[key] || 0);
      return `
        <div class="leaders-result__bar">
          <span>${label}</span>
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
          <span>${label}</span>
          <strong>${value.toFixed(1)}</strong>
          <div class="leaders-result__track" aria-hidden="true">
            <i style="width: ${value * 10}%"></i>
          </div>
        </div>
      `;
    }).join("");
  }

  function renderTags(company) {
    const tags = []
      .concat(company.industry_tags || [])
      .concat(company.region_tags || []);
    if (!tags.length) return "";
    return `
      <div class="leaders-result__tags">
        ${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
      </div>
    `;
  }

  function referenceSummary(company) {
    if (company.reference_summary) return company.reference_summary;
    if (company.sources && company.sources.length) {
      return `${company.name}暂无站内企业评析文章，以下公开资料用于支撑当前 LEADERS 与 Darwin 评分：${company.summary}`;
    }
    return `${company.name}暂无站内企业评析文章，当前评分依据企业基础信息、公开风险线索和后续人工复核要求形成。`;
  }

  function renderReferences(company) {
    const links = (company.sources && company.sources.length ? company.sources : [company.url])
      .filter(Boolean)
      .map((source, index) => `
        <li>
          <a href="${escapeHtml(source)}" target="_blank" rel="noopener">参考链接 ${index + 1}</a>
        </li>
      `)
      .join("");

    return `
      <section class="leaders-references" id="leaders-reference-materials">
        <h3>参考链接及摘要</h3>
        <p>${escapeHtml(referenceSummary(company))}</p>
        <ul>${links}</ul>
      </section>
    `;
  }

  function renderResourceLink(company) {
    if (isSiteArticle(company.url)) {
      return `<a class="btn btn--primary" href="${escapeHtml(addReturnParam(company.url))}">查看关联文章</a>`;
    }

    return `<a class="btn btn--primary" href="#leaders-reference-materials" data-show-back="true">查看参考资料</a>`;
  }

  function renderCompareButton(company) {
    if (!$("#leaders-compare")) return "";
    return `<button class="btn leaders-compare-add" type="button" data-compare-company="${escapeHtml(company.name)}">加入对比</button>`;
  }

  function renderDarwinPanel(company, leadersScore) {
    if (!company.darwin) {
      return `
        <section class="leaders-darwin leaders-darwin--empty">
          <h3>Darwin 优质企业评分</h3>
          <p>该企业尚未完成 Darwin 三项复核。下次半年度复盘时，将补充财务硬度、动态护城河和诚实信号评分，并与 LEADERS 分数比较偏差。</p>
        </section>
      `;
    }

    const score = averageDarwin(company.darwin);
    const delta = score - leadersScore;
    const deltaText = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`;

    return `
      <section class="leaders-darwin">
        <div class="leaders-darwin__head">
          <div>
            <h3>Darwin 优质企业评分</h3>
            <p>用财务硬度、动态护城河和诚实信号过滤市场关注度与低成本叙事。</p>
          </div>
          <div class="leaders-darwin__score">
            <span>${score.toFixed(1)}</span>
            <small>${darwinRating(score)}</small>
          </div>
        </div>
        ${renderDarwinBars(company.darwin)}
        <div class="leaders-darwin__compare">
          <div><span>Darwin - LEADERS</span><strong>${deltaText}</strong></div>
          <div><span>偏差判断</span><strong>${deviationLabel(delta)}</strong></div>
          <div><span>证据等级</span><strong>${company.darwin.evidence || company.evidence || "C"}</strong></div>
        </div>
        <p class="leaders-darwin__note">${escapeHtml(company.darwin.note || "等待半年度复核补充说明。")}</p>
      </section>
    `;
  }

  function renderResult(company, mode) {
    const raw = average(company.scores);
    const weighted = weightedScore(company, mode);
    const adjusted = evidenceAdjustedScore(company, mode);
    const plan = weights[mode] || weights.growth;
    const watch = (company.watch || []).map((item) => `<li>${escapeHtml(item)}</li>`).join("");

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
          <div><span>简单平均</span><strong>${raw.toFixed(1)}</strong></div>
          <div><span>${plan.label}加权</span><strong>${weighted.toFixed(1)}</strong></div>
          <div><span>证据等级</span><strong>${company.evidence}</strong></div>
        </div>
        <p class="leaders-result__summary">${escapeHtml(company.summary)}</p>
        ${renderTags(company)}
        <div class="leaders-result__grid">
          <section>
            <h3>LEADERS-7项评分</h3>
            ${renderBars(company)}
            ${renderDarwinPanel(company, adjusted)}
          </section>
          <section>
            <h3>判断与跟踪</h3>
            <p><strong>主要风险：</strong>${escapeHtml(company.risk)}</p>
            <p><strong>未来验证点：</strong></p>
            <ul>${watch}</ul>
            <p class="leaders-result__actions">${renderResourceLink(company)}${renderCompareButton(company)}</p>
          </section>
        </div>
        ${isSiteArticle(company.url) ? "" : renderReferences(company)}
      </article>
    `;

    const referenceLink = document.querySelector("[data-show-back='true']");
    if (referenceLink) {
      referenceLink.addEventListener("click", showFloatingBack);
    }
    const compareButton = document.querySelector("[data-compare-company]");
    if (compareButton) {
      compareButton.addEventListener("click", () => addCompareCompany(compareButton.dataset.compareCompany));
    }
  }

  function renderSuggestions(query) {
    const suggestions = rankedCompanies(query)
      .slice(0, 6)
      .map(({ company }) => `<button type="button" data-company="${escapeHtml(company.name)}">${escapeHtml(company.name)}</button>`)
      .join("");
    if (!suggestions) return "";
    return `
      <div class="leaders-suggestions" aria-label="相近企业">
        <p>你可能想查：</p>
        <div>${suggestions}</div>
      </div>
    `;
  }

  function renderEmpty(query) {
    $("#leaders-result").innerHTML = `
      <article class="leaders-result leaders-result--empty" aria-live="polite">
        <h2>暂未收录：${escapeHtml(query || "该企业")}</h2>
        <p>免费查询库目前覆盖站内评分企业和新增研究企业。你可以尝试输入：寒武纪、商汤科技、摩尔线程、科大讯飞、DeepSeek、宇树科技。</p>
        ${renderSuggestions(query)}
      </article>
    `;
    bindCompanyButtons("#leaders-result");
  }

  function runSearch(event) {
    event.preventDefault();
    const query = $("#leaders-company-input").value;
    const mode = $("#leaders-stage").value;
    const company = findCompany(query);
    if (company) {
      renderResult(company, mode);
    } else {
      renderEmpty(query);
    }
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

  function renderLeadersTable() {
    const tableRoot = $("#leaders-companies-table");
    if (!tableRoot) return;

    const industrySelect = $("#leaders-industry-filter");
    const regionSelect = $("#leaders-region-filter");
    const resetButton = $("#leaders-filter-reset");
    const countEl = $("#leaders-table-count");
    const bodyEl = $("#leaders-table-body");
    if (!industrySelect || !regionSelect || !bodyEl) return;

    renderFilterOptions(industrySelect, uniqueTags("industry_tags"), "全部行业 / All industries", industryLabels);
    renderFilterOptions(regionSelect, uniqueTags("region_tags"), "全部地区 / All regions", regionLabels);

    const applyFilters = () => {
      const industry = industrySelect.value;
      const region = regionSelect.value;
      const filtered = companies.filter((company) => {
        const industryMatched = !industry || (company.industry_tags || []).includes(industry);
        const regionMatched = !region || (company.region_tags || []).includes(region);
        return industryMatched && regionMatched;
      });

      bodyEl.innerHTML = filtered.map((company, index) => {
        const score = average(company.scores);
        const url = company.url || "#";
        return `
          <tr>
            <td data-label="序号">${index + 1}</td>
            <td data-label="企业名称">
              <a href="${escapeHtml(url)}">${escapeHtml(company.name)}</a>
              <small>${escapeHtml((company.aliases || []).slice(0, 4).join(" / "))}</small>
            </td>
            <td data-label="行业 / Industry">${escapeHtml(tagText(company.industry_tags, industryLabels))}</td>
            <td data-label="地区 / Region">${escapeHtml(tagText(company.region_tags, regionLabels))}</td>
            <td data-label="证据等级">${escapeHtml(company.evidence || "C")}</td>
            <td data-label="更新时间">${escapeHtml(company.last_reviewed || "待复核")}</td>
            <td data-label="领袖气质">${Number(company.scores.leadership || 0).toFixed(1)}</td>
            <td data-label="决策力">${Number(company.scores.decision || 0).toFixed(1)}</td>
            <td data-label="实干性">${Number(company.scores.execution || 0).toFixed(1)}</td>
            <td data-label="补位力">${Number(company.scores.bench || 0).toFixed(1)}</td>
            <td data-label="文化契合度">${Number(company.scores.alignment || 0).toFixed(1)}</td>
            <td data-label="岗位完整性">${Number(company.scores.coverage || 0).toFixed(1)}</td>
            <td data-label="治理结构">${Number(company.scores.governance || 0).toFixed(1)}</td>
            <td data-label="平均分"><strong>${score.toFixed(1)}</strong></td>
          </tr>
        `;
      }).join("");

      if (countEl) {
        countEl.textContent = `显示 ${filtered.length} / ${companies.length} 家企业`;
      }
    };

    industrySelect.addEventListener("change", applyFilters);
    regionSelect.addEventListener("change", applyFilters);
    if (resetButton) {
      resetButton.addEventListener("click", () => {
        industrySelect.value = "";
        regionSelect.value = "";
        applyFilters();
      });
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
    if (datalist) {
      datalist.innerHTML = sorted.flatMap((company) => {
        const alias = (company.aliases || []).slice(0, 3).join(" / ");
        const label = [company.industry, alias].filter(Boolean).join(" · ");
        const options = [`<option value="${escapeHtml(company.name)}"${label ? ` label="${escapeHtml(label)}"` : ""}></option>`];
        for (const name of (company.aliases || []).slice(0, 6)) {
          options.push(`<option value="${escapeHtml(name)}" label="${escapeHtml(company.name)}"></option>`);
        }
        return options;
      }).join("");
    }

    inputs.forEach((input, index) => {
      input.value = sorted[index]?.name || "";
      input.addEventListener("input", renderCompare);
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
      compareRoot.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    const target = inputs.find((input) => !input.value) || inputs[0];
    target.value = name;
    renderCompare();
    compareRoot.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function compareMetricRows(selected, mode) {
    const rows = [
      ["阶段加权", (company) => weightedScore(company, mode).toFixed(1)],
      ["证据调整", (company) => evidenceAdjustedScore(company, mode).toFixed(1)],
      ["简单平均", (company) => average(company.scores).toFixed(1)],
      ["Darwin平均", (company) => company.darwin ? averageDarwin(company.darwin).toFixed(1) : "待评分"],
      ["证据等级", (company) => company.evidence || "C"],
      ["更新时间", (company) => company.last_reviewed || "待复核"]
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
          <th>${escapeHtml(label)}</th>
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
      const point = radarGridPoint(index, 1, center, radius);
      const text = radarGridPoint(index, 1.17, center, radius);
      return `
        <line x1="${center}" y1="${center}" x2="${point.x.toFixed(1)}" y2="${point.y.toFixed(1)}"></line>
        <text x="${text.x.toFixed(1)}" y="${text.y.toFixed(1)}">${escapeHtml(label)}</text>
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
        <div class="leaders-compare-radar__chart" aria-label="LEADERS 七项评分雷达图">
          <svg viewBox="0 0 360 360" role="img">
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

    const selected = compareInputs()
      .map((input) => input.value)
      .filter(Boolean)
      .map(compareCompanyFromValue)
      .filter(Boolean)
      .filter((company, index, list) => list.findIndex((item) => item.name === company.name) === index);
    const mode = $("#leaders-stage")?.value || "growth";

    if (selected.length < 2) {
      output.innerHTML = `<p class="leaders-compare__empty">请选择至少两家公司进行横向对比。</p>`;
      return;
    }

    output.innerHTML = `
      <div class="leaders-compare__cards">
        ${selected.map((company) => {
          const adjusted = evidenceAdjustedScore(company, mode);
          const darwin = company.darwin ? averageDarwin(company.darwin) : null;
          const delta = darwin === null ? "" : `${darwin - adjusted >= 0 ? "+" : ""}${(darwin - adjusted).toFixed(1)}`;
          return `
            <article>
              <h3>${escapeHtml(company.name)}</h3>
              <p>${escapeHtml(company.industry)} · ${escapeHtml(company.stage)}</p>
              <strong>${adjusted.toFixed(1)}</strong>
              <span>${escapeHtml(rating(adjusted))}</span>
              ${delta ? `<small>Darwin - LEADERS: ${escapeHtml(delta)}</small>` : `<small>Darwin: 待评分</small>`}
            </article>
          `;
        }).join("")}
      </div>
      <div class="leaders-compare__detail">
        <div class="leaders-compare__table-wrap">
          <table class="leaders-compare__table">
            <thead>
              <tr>
                <th>指标</th>
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

  document.addEventListener("DOMContentLoaded", async () => {
    const root = $("#leaders-scorecard-app");
    if (!root) return;

    try {
      const [companyResponse, modelResponse] = await Promise.all([
        fetch(root.dataset.source),
        fetch(root.dataset.model)
      ]);
      companies = await companyResponse.json();
      configureModel(await modelResponse.json());
      renderExamples();
      renderResult(companies[0], "growth");
      renderLeadersTable();
      fillCompareInputs();
      $("#leaders-search-form").addEventListener("submit", runSearch);
      $("#leaders-stage").addEventListener("change", () => {
        const company = findCompany($("#leaders-company-input").value) || companies[0];
        renderResult(company, $("#leaders-stage").value);
        renderCompare();
      });
    } catch (error) {
      $("#leaders-result").innerHTML = "<p>评分数据加载失败，请稍后再试。</p>";
    }
  });
})();
