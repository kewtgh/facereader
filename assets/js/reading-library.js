const { readSaved, validPath, readingListKey, readingListLimit, readingListBackupBytes, serializeReadingBackup, mergeReadingBackup } = await import("./reading-list-data.mjs" + new URL(import.meta.url).search);

const copy = {
  zh: { exporting: "备份已下载，仅包含收藏文章地址。", importing: "正在导入备份…", imported: (added, skipped) => `已加入 ${added} 篇文章，跳过 ${skipped} 篇不可用文章。`, badBackup: "无法导入，请选择本站导出的阅读列表备份。", tooLarge: "备份文件过大，最多支持 100KB。", importLimit: "合并后超过 100 篇上限，请先移除一些文章。", exportFailed: "无法下载备份，请重试。", save: "稍后阅读", saved: "已加入", addLabel: "加入稍后阅读", removeLabel: "从稍后阅读移除", remove: "移除", empty: "还没有保存文章。在文章页点击「稍后阅读」即可加入。", storage: "浏览器存储不可用，无法保存阅读列表。", limit: "已达到 100 篇上限，请先移除一些文章。", added: "已加入稍后阅读。", removed: "已从阅读列表移除。", count: n => `${n} 篇已保存文章`, stale: "部分已保存文章已不可用。" },
  en: { exporting: "Backup downloaded. It contains saved article URLs only.", importing: "Importing backup…", imported: (added, skipped) => `${added} articles added; ${skipped} unavailable articles skipped.`, badBackup: "Cannot import this file. Choose a FaceReader reading-list backup.", tooLarge: "This backup exceeds the 100KB file limit.", importLimit: "Merging would exceed 100 articles. Remove some articles first.", exportFailed: "The backup could not be downloaded. Please retry.", save: "Read later", saved: "Saved", addLabel: "Save for later", removeLabel: "Remove from reading list", remove: "Remove", empty: "No saved articles yet. Use Read later on an article to add it.", storage: "Browser storage is unavailable. The reading list cannot be saved.", limit: "The list holds 100 articles. Remove some before adding more.", added: "Saved for later.", removed: "Removed from your reading list.", count: n => `${n} saved articles`, stale: "Some saved articles are no longer available." }
};

function init() {
  const save = document.querySelector("[data-fr-save-article]");
  const root = document.querySelector("[data-fr-reading-list]");
  if (!save && !root) return;
  const status = root?.querySelector("[data-fr-library-status]");
  const results = root?.querySelector("[data-fr-library-results]");
  const cleanup = root?.querySelector("[data-fr-clear-unavailable]");
  const templates = new Map([...document.querySelectorAll("template[data-fr-reading-template]")].map(template => [template.dataset.frReadingTemplate, template]));
  let notice = "";
  let importing = false;
  let transferNotice;
  const exportButton = root?.querySelector("[data-fr-reading-export]");
  const importButton = root?.querySelector("[data-fr-reading-import]");
  const importFile = root?.querySelector("[data-fr-reading-file]");
  function updateTransfers() {
    if (!root) return;
    const state = savedState();
    root.querySelector("[data-fr-library-tools]").hidden = false;
    exportButton.disabled = importing || !state.available || !state.urls.length;
    importButton.disabled = importing || !state.available;
    root.setAttribute("aria-busy", String(importing));
    const message = root.querySelector("[data-fr-transfer-status]");
    message.hidden = !transferNotice;
    const value = transferNotice && text(transferNotice.key);
    message.textContent = typeof value === "function" ? value(transferNotice.added, transferNotice.skipped) : value || "";
  }
  const language = () => document.documentElement.getAttribute("data-fr-ui-lang") === "en" ? "en" : "zh";
  const text = key => copy[language()][key];
  function savedState() {
    try { return { urls: readSaved(localStorage.getItem(readingListKey)), available: true }; }
    catch { return { urls: [], available: false }; }
  }
  function store(urls) {
    try { localStorage.setItem(readingListKey, JSON.stringify(urls)); return true; }
    catch { return false; }
  }
  function renderSave() {
    if (!save) return;
    const state = savedState();
    const active = state.urls.includes(save.dataset.frSaveArticle);
    save.hidden = false;
    save.disabled = !state.available;
    save.querySelector("[data-fr-save-label]").textContent = text(active ? "saved" : "save");
    save.setAttribute("aria-pressed", String(active));
    save.setAttribute("aria-label", text(active ? "removeLabel" : "addLabel"));
    save.title = text(active ? "removeLabel" : "addLabel");
    save.closest(".fr-article-save").lang = language() === "en" ? "en" : "zh-CN";
    const announcement = document.querySelector("[data-fr-save-status]");
    const key = !state.available ? "storage" : notice;
    announcement.textContent = text(key) || "";
    announcement.hidden = !key;
    announcement.lang = language();
    announcement.classList.toggle("visually-hidden", ["added", "removed"].includes(key));
  }
  function toggle(url) {
    if (!validPath(url)) return;
    const state = savedState();
    const exists = state.urls.includes(url);
    if (!state.available) notice = "storage";
    else if (!exists && state.urls.length >= readingListLimit) notice = "limit";
    else notice = store(exists ? state.urls.filter(item => item !== url) : [url, ...state.urls]) ? exists ? "removed" : "added" : "storage";
    render();
  }
  function renderList() {
    if (!root) return;
    const state = savedState();
    const urls = state.urls.filter(url => templates.has(url));
    root.lang = language() === "en" ? "en" : "zh-CN";
    status.textContent = !state.available || notice === "storage" ? text("storage") : urls.length ? text("count")(urls.length) : text("empty");
    if (state.urls.length > urls.length) status.textContent += ` ${text("stale")}`;
    cleanup.hidden = !state.available || state.urls.length === urls.length;
    results.replaceChildren(...urls.map((url, index) => {
      const entry = templates.get(url).content.firstElementChild.cloneNode(true);
      const remove = entry.querySelector("[data-fr-saved-remove]");
      const title = entry.querySelector("h3").textContent.trim();
      remove.textContent = text("remove");
      remove.setAttribute("aria-label", `${text("remove")}: ${title}`);
      remove.addEventListener("click", () => {
        toggle(url);
        (results.children[index] || results.lastElementChild)?.querySelector("[data-fr-saved-remove]")?.focus();
        if (!results.children.length) { status.tabIndex = -1; status.focus(); }
      });
      return entry;
    }));
    updateTransfers();
    root.dataset.frReady = "true";
  }
  function render() { renderSave(); renderList(); }
  save?.addEventListener("click", () => toggle(save.dataset.frSaveArticle));
  cleanup?.addEventListener("click", () => {
    notice = store(savedState().urls.filter(url => templates.has(url))) ? "removed" : "storage";
    renderList();
    status.tabIndex = -1;
    status.focus();
  });
  exportButton?.addEventListener("click", () => {
    try {
      const state = savedState();
      if (!state.available) { transferNotice = { key: "storage" }; updateTransfers(); return; }
      const url = URL.createObjectURL(new Blob([serializeReadingBackup(state.urls)], { type: "application/json" }));
      const link = document.createElement("a");
      link.href = url;
      link.download = "facereader-reading-list-" + new Date().toISOString().slice(0, 10) + ".json";
      document.body.appendChild(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      transferNotice = { key: "exporting" };
    } catch { transferNotice = { key: "exportFailed" }; }
    updateTransfers();
  });
  importButton?.addEventListener("click", () => importFile.click());
  importFile?.addEventListener("change", async () => {
    const file = importFile.files?.[0];
    if (!file || importing) return;
    importing = true;
    transferNotice = { key: "importing" }; updateTransfers();
    try {
      if (file.size > readingListBackupBytes) throw new Error("size");
      const raw = await file.text();
      const state = savedState();
      if (!state.available) throw new Error("storage");
      const result = mergeReadingBackup(raw, state.urls, templates);
      if (result.added && !store(result.urls)) throw new Error("storage");
      transferNotice = { key: "imported", added: result.added, skipped: result.skipped };
      renderList();
    } catch (error) {
      transferNotice = { key: ({ size: "tooLarge", limit: "importLimit", storage: "storage" })[error.message] || "badBackup" };
    } finally { importing = false; importFile.value = ""; updateTransfers(); }
  });
  window.addEventListener("storage", event => {
    if (event.key === readingListKey || event.key === null) { notice = ""; render(); }
  });
  document.addEventListener("facereader:ui-language", render);
  render();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
