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
