(function () {
  const scoreKeys = [
    ["leadership", "领袖气质"],
    ["decision", "决策力"],
    ["execution", "实干性"],
    ["bench", "补位力"],
    ["alignment", "文化契合度"],
    ["coverage", "岗位专长完整度"],
    ["governance", "专业化治理结构"]
  ];

  const weights = {
    early: { label: "早期", values: [0.15, 0.2, 0.2, 0.15, 0.1, 0.1, 0.1] },
    growth: { label: "扩张期", values: [0.12, 0.18, 0.18, 0.16, 0.12, 0.12, 0.12] },
    mature: { label: "规模化/成熟期", values: [0.1, 0.15, 0.15, 0.15, 0.15, 0.15, 0.15] }
  };

  const evidenceCoef = { A: 1, B: 0.85, C: 0.7 };
  const darwinKeys = [
    ["financial", "财务硬"],
    ["moat", "动态护城河"],
    ["signal", "诚实信号"]
  ];
  let companies = [];

  const $ = (selector) => document.querySelector(selector);
  const normalize = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, "");
  const average = (scores) => scoreKeys.reduce((sum, [key]) => sum + Number(scores[key] || 0), 0) / scoreKeys.length;
  const averageDarwin = (scores) => darwinKeys.reduce((sum, [key]) => sum + Number(scores[key] || 0), 0) / darwinKeys.length;

  function weightedScore(company, mode) {
    const plan = weights[mode] || weights.growth;
    const values = scoreKeys.map(([key]) => Number(company.scores[key] || 0));
    return values.reduce((sum, score, index) => sum + score * plan.values[index], 0);
  }

  function evidenceAdjustedScore(company, mode) {
    const plan = weights[mode] || weights.growth;
    const coef = evidenceCoef[company.evidence] || evidenceCoef.C;
    const numerator = scoreKeys.reduce((sum, [key], index) => {
      return sum + Number(company.scores[key] || 0) * plan.values[index] * coef;
    }, 0);
    const denominator = plan.values.reduce((sum, value) => sum + value * coef, 0);
    return numerator / denominator;
  }

  function rating(score) {
    if (score >= 8.5) return "A档：系统化优势";
    if (score >= 7.5) return "B+档：稳定有效";
    if (score >= 6.5) return "B档：基本可用";
    if (score >= 5.5) return "C档：存在关键短板";
    return "D档：高风险";
  }

  function darwinRating(score) {
    if (score >= 8.5) return "优质企业：繁殖能力强";
    if (score >= 7.5) return "较优质：护城河可持续";
    if (score >= 6.5) return "观察档：需验证财务质量";
    if (score >= 5.5) return "承压档：真信号不足";
    return "风险档：先看现金流";
  }

  function deviationLabel(delta) {
    const abs = Math.abs(delta);
    if (abs <= 0.5) return "偏差正常";
    if (abs <= 1.2) return "需要跟踪";
    return "需要复核参数";
  }

  function findCompany(query) {
    const needle = normalize(query);
    if (!needle) return null;
    return companies.find((company) => {
      const names = [company.name].concat(company.aliases || []);
      return names.some((name) => normalize(name) === needle);
    }) || companies.find((company) => {
      const names = [company.name].concat(company.aliases || []);
      return names.some((name) => normalize(name).includes(needle) || needle.includes(normalize(name)));
    });
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
            <p>用财务硬度、动态护城河和诚实信号过滤网络热度与低成本叙事。</p>
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
        <p class="leaders-darwin__note">${company.darwin.note || "等待半年度复核补充说明。"}</p>
      </section>
    `;
  }

  function renderResult(company, mode) {
    const raw = average(company.scores);
    const weighted = weightedScore(company, mode);
    const adjusted = evidenceAdjustedScore(company, mode);
    const plan = weights[mode] || weights.growth;
    const watch = (company.watch || []).map((item) => `<li>${item}</li>`).join("");

    $("#leaders-result").innerHTML = `
      <article class="leaders-result" aria-live="polite">
        <div class="leaders-result__head">
          <div>
            <p class="leaders-kicker">${company.industry} · ${company.stage}</p>
            <h2>${company.name}</h2>
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
        <p class="leaders-result__summary">${company.summary}</p>
        <div class="leaders-result__grid">
          <section>
            <h3>LEADERS-7项评分</h3>
            ${renderBars(company)}
            ${renderDarwinPanel(company, adjusted)}
          </section>
          <section>
            <h3>判断与跟踪</h3>
            <p><strong>主要风险：</strong>${company.risk}</p>
            <p><strong>未来验证点：</strong></p>
            <ul>${watch}</ul>
            <p><a href="${company.url}">查看关联资料</a></p>
          </section>
        </div>
      </article>
    `;
  }

  function renderEmpty(query) {
    $("#leaders-result").innerHTML = `
      <article class="leaders-result leaders-result--empty" aria-live="polite">
        <h2>暂未收录：${query || "该企业"}</h2>
        <p>免费查询库目前覆盖站内评分企业和新增研究企业。你可以尝试输入：寒武纪、商汤科技、摩尔线程、科大讯飞、DeepSeek、宇树科技。</p>
        <p>专业版可按行业、阶段和证据材料生成新企业评分卡，并输出内部决策版报告。</p>
      </article>
    `;
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
    const examples = companies
      .slice()
      .sort((a, b) => average(b.scores) - average(a.scores))
      .slice(0, 8)
      .map((company) => `<button type="button" data-company="${company.name}">${company.name}</button>`)
      .join("");
    $("#leaders-examples").innerHTML = examples;
    $("#leaders-examples").addEventListener("click", (event) => {
      const target = event.target.closest("button[data-company]");
      if (!target) return;
      $("#leaders-company-input").value = target.dataset.company;
      $("#leaders-search-form").dispatchEvent(new Event("submit", { cancelable: true }));
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const root = $("#leaders-scorecard-app");
    if (!root) return;

    try {
      const response = await fetch(root.dataset.source);
      companies = await response.json();
      renderExamples();
      renderResult(companies[0], "growth");
      $("#leaders-search-form").addEventListener("submit", runSearch);
      $("#leaders-stage").addEventListener("change", () => {
        const company = findCompany($("#leaders-company-input").value) || companies[0];
        renderResult(company, $("#leaders-stage").value);
      });
    } catch (error) {
      $("#leaders-result").innerHTML = "<p>评分数据加载失败，请稍后再试。</p>";
    }
  });
})();
