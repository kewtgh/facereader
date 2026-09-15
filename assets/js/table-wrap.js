document.addEventListener("DOMContentLoaded", () => {
  const body = document.body;
  const contentTables = document.querySelectorAll(
    ".page__content table:not(.rouge-table):not(.fr-score-table):not(.table-wrap):not(.leaders-benchmark__table):not(.leaders-compare__table)"
  );

  contentTables.forEach((table) => {
    if (
      table.closest(
        ".highlight, .highlighter-rouge, .fr-score-card, .leaders-scorecard, .leaders-table, .leaders-table__wrap, .leaders-compare__table-wrap"
      ) || table.parentElement?.classList.contains("fr-table-scroll")
    ) {
      return;
    }

    const wrapper = document.createElement("div");
    const isEnglish = document.documentElement.lang.toLowerCase().startsWith("en");
    wrapper.className = "fr-table-scroll";
    wrapper.tabIndex = 0;
    wrapper.setAttribute("role", "region");
    wrapper.setAttribute(
      "aria-label",
      isEnglish ? "Scrollable article table" : "可横向滚动的文章表格"
    );

    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
    table.classList.add("fr-content-table");
  });

  // 评分总表继续使用原有的专用滚动和排序逻辑。
  if (!body.classList.contains("score-table")) return;

  const scope = document.querySelector(".initial-content") || document;

  // 找到表格：优先找已经带 class 的，否则拿第一个 table 并补上 class
  const table = scope.querySelector("table.table-wrap") || scope.querySelector("table");
  if (!table) return;

  table.classList.add("table-wrap");

  // ✅ 开关：只有 body 上有 sort-by-score 才进行排序
  const shouldSort = body.classList.contains("sort-by-score");
  if (!shouldSort) return;

  const tbody = table.tBodies && table.tBodies[0];
  if (!tbody) return;

  const rows = Array.from(tbody.rows);
  if (rows.length <= 1) return;

  const parseScore = (tr) => {
    const lastCell = tr.cells[tr.cells.length - 1];
    if (!lastCell) return Number.NEGATIVE_INFINITY;
    const txt = (lastCell.textContent || "").replace(/\s+/g, "").trim();
    const num = Number.parseFloat(txt);
    return Number.isFinite(num) ? num : Number.NEGATIVE_INFINITY;
  };

  // 稳定降序：分数相同按原顺序
  const decorated = rows.map((tr, idx) => ({ tr, idx, score: parseScore(tr) }));
  decorated.sort((a, b) => (b.score - a.score) || (a.idx - b.idx));

  // 重新挂载
  const frag = document.createDocumentFragment();
  for (const item of decorated) frag.appendChild(item.tr);
  tbody.appendChild(frag);

  // 重排第一列序号（如果第一列是序号）
  for (let i = 0; i < tbody.rows.length; i++) {
    const firstCell = tbody.rows[i].cells[0];
    if (firstCell) firstCell.textContent = String(i + 1);
  }
});
