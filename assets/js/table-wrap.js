document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(".score-table")) return;

  const scope = document.querySelector(".initial-content") || document;
  const table = scope.querySelector("table");
  if (!table) return;
  if (table.closest(".table-wrap")) return;

  const wrap = document.createElement("div");
  wrap.className = "table-wrap";
  table.parentNode.insertBefore(wrap, table);
  wrap.appendChild(table);
});

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(".score-table")) return;

  const scope = document.querySelector(".initial-content") || document;
  const table = scope.querySelector("table.table-wrap") || scope.querySelector("table");
  if (!table) return;

  // 若你仍有包裹逻辑：确保 table 有 table-wrap class（没有就加，方便统一样式）
  table.classList.add("table-wrap");

  const tbody = table.tBodies && table.tBodies[0];
  if (!tbody) return;

  const rows = Array.from(tbody.rows);
  if (rows.length <= 1) return;

  const parseScore = (tr) => {
    const lastCell = tr.cells[tr.cells.length - 1];
    if (!lastCell) return Number.NEGATIVE_INFINITY;

    // 取纯文本，去掉空格/不可见字符
    const txt = (lastCell.textContent || "").replace(/\s+/g, "").trim();

    // 提取数字（兼容 "8.9", "8", "8.90"）
    const num = Number.parseFloat(txt);
    return Number.isFinite(num) ? num : Number.NEGATIVE_INFINITY;
  };

  // 降序排序；分数相同则保持原顺序（稳定性：用 idx）
  const decorated = rows.map((tr, idx) => ({ tr, idx, score: parseScore(tr) }));
  decorated.sort((a, b) => (b.score - a.score) || (a.idx - b.idx));

  // 重新挂载
  const frag = document.createDocumentFragment();
  for (const item of decorated) frag.appendChild(item.tr);
  tbody.appendChild(frag);

  // 重排第一列序号（如果第一列确实是序号）
  for (let i = 0; i < tbody.rows.length; i++) {
    const firstCell = tbody.rows[i].cells[0];
    if (firstCell) firstCell.textContent = String(i + 1);
  }
});