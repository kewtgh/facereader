(() => {
  "use strict";

  const root = document.querySelector("#darwin-leaders-benchmark");
  const rows = document.querySelector("#leaders-benchmark-rows");
  const summary = document.querySelector("#leaders-benchmark-summary");
  if (!root || !rows || !summary) return;

  const ui = {
    zh: {
      samples: "样本数量",
      reviewCycle: "复盘频率",
      version: "版本",
      core: "核心",
      satellite: "卫星",
      normal: "正常",
      track: "跟踪",
      review: "复核",
      pending: "待评分",
      missing: "待补",
      loadError: "样本池加载失败，请稍后再试。"
    },
    en: {
      samples: "Samples",
      reviewCycle: "Review cycle",
      version: "Version",
      core: "Core",
      satellite: "Satellite",
      normal: "Normal",
      track: "Track",
      review: "Review",
      pending: "Pending",
      missing: "Pending",
      loadError: "The benchmark pool could not be loaded. Please try again later."
    }
  };

  let benchmarkState = null;
  let loadFailed = false;

  const language = () =>
    document.documentElement.getAttribute("data-fr-ui-lang") === "en" ? "en" : "zh";
  const t = (key) => ui[language()][key];
  const escapeHTML = (value) =>
    String(value ?? "").replace(/[&<>"']/g, (char) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    }[char]));
  const average = (values) => {
    const validValues = values.map(Number).filter(Number.isFinite);
    return validValues.length
      ? validValues.reduce((sum, value) => sum + value, 0) / validValues.length
      : null;
  };

  const actionKey = (delta, warnDelta, reviewDelta) => {
    const absoluteDelta = Math.abs(delta);
    if (absoluteDelta <= warnDelta) return "normal";
    if (absoluteDelta <= reviewDelta) return "track";
    return "review";
  };

  const finishLoading = () => root.setAttribute("aria-busy", "false");
  const renderError = () => {
    rows.innerHTML = `<tr><td colspan="8">${escapeHTML(t("loadError"))}</td></tr>`;
    finishLoading();
  };

  const render = () => {
    if (!benchmarkState) return;

    const { data, companyMap, leadersScore, darwinScore, warnDelta, reviewDelta } =
      benchmarkState;
    const lang = language();

    rows.innerHTML = data.companies.map((company) => {
      const source = companyMap.get(company.name);
      const leaders = source ? leadersScore(source) : null;
      const darwin = source ? darwinScore(source) : null;
      const delta = Number.isFinite(leaders) && Number.isFinite(darwin) ? darwin - leaders : null;
      const action = delta !== null ? actionKey(delta, warnDelta, reviewDelta) : "pending";
      const deltaText = delta !== null ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}` : t("missing");
      const companyName = lang === "en" ? company.name_en || company.name : company.name;
      const reason = lang === "en" ? company.reason_en || company.reason : company.reason;
      const evidence = source?.darwin?.evidence || source?.evidence || "";

      return `<tr>
        <td><strong>${escapeHTML(companyName)}</strong>${evidence ? `<small>${escapeHTML(evidence)}</small>` : ""}</td>
        <td>${escapeHTML(company.tier === "core" ? t("core") : t("satellite"))}</td>
        <td><span class="leaders-benchmark__quality">${escapeHTML(company.info_quality)}</span></td>
        <td>${leaders !== null ? leaders.toFixed(1) : escapeHTML(t("missing"))}</td>
        <td>${darwin !== null ? darwin.toFixed(1) : escapeHTML(t("missing"))}</td>
        <td><span class="leaders-benchmark__delta leaders-benchmark__delta--${action}">${escapeHTML(deltaText)}</span></td>
        <td>${escapeHTML(t(action))}</td>
        <td>${escapeHTML(reason)}</td>
      </tr>`;
    }).join("");

    const reviewCycle = lang === "en"
      ? data.review_cycle_en || data.review_cycle
      : data.review_cycle;
    summary.innerHTML = `
      <div><span>${escapeHTML(t("samples"))}</span><strong>${data.companies.length}</strong></div>
      <div><span>${escapeHTML(t("reviewCycle"))}</span><strong>${escapeHTML(reviewCycle)}</strong></div>
      <div><span>${escapeHTML(t("version"))}</span><strong>${escapeHTML(data.version)}</strong></div>
    `;
    finishLoading();
  };

  document.addEventListener("facereader:ui-language", () => {
    if (benchmarkState) render();
    if (loadFailed) renderError();
  });

  const load = async () => {
    try {
      const [benchmarkResponse, companyResponse, modelResponse] = await Promise.all([
        fetch(root.dataset.source),
        fetch(root.dataset.companies),
        fetch(root.dataset.model)
      ]);
      if (!benchmarkResponse.ok || !companyResponse.ok || !modelResponse.ok) {
        throw new Error("Benchmark data request failed.");
      }

      const [data, companies, model] = await Promise.all([
        benchmarkResponse.json(),
        companyResponse.json(),
        modelResponse.json()
      ]);
      if (!Array.isArray(data?.companies) || !Array.isArray(companies)) {
        throw new TypeError("Benchmark data has an invalid shape.");
      }

      const scoreKeys = model.dimension_order || Object.keys(model.dimensions || {});
      const darwinKeys =
        model.darwin_dimension_order || Object.keys(model.darwin_dimensions || {});
      if (!scoreKeys.length || !darwinKeys.length) {
        throw new TypeError("The scoring model has no dimensions.");
      }

      const leadersScore = (company) =>
        average(scoreKeys.map((key) => company.scores?.[key]));
      const darwinScore = (company) =>
        company.darwin ? average(darwinKeys.map((key) => company.darwin[key])) : null;
      const warnDelta = Number(model.guardrails?.darwin_feedback?.warn_delta ?? 0.5);
      const reviewDelta = Number(model.guardrails?.darwin_feedback?.review_delta ?? 1.2);
      const companyMap = new Map(companies.map((company) => [company.name, company]));

      benchmarkState = {
        data,
        companyMap,
        leadersScore,
        darwinScore,
        warnDelta,
        reviewDelta
      };
      render();
    } catch (error) {
      loadFailed = true;
      renderError();
    }
  };

  load();
})();
