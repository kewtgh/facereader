import { readSaved, validPath, readingListKey, readingListLimit } from "./reading-list-data.mjs";

const copy = {
  zh: { save: "稍后阅读", saved: "已加入", addLabel: "加入稍后阅读", removeLabel: "从稍后阅读移除", remove: "移除", empty: "还没有保存文章。在文章页点击「稍后阅读」即可加入。", storage: "浏览器存储不可用，无法保存阅读列表。", limit: "已达到 100 篇上限，请先移除一些文章。", added: "已加入稍后阅读。", removed: "已从阅读列表移除。", count: n => `${n} 篇已保存文章`, stale: "部分已保存文章已不可用。" },
  en: { save: "Read later", saved: "Saved", addLabel: "Save for later", removeLabel: "Remove from reading list", remove: "Remove", empty: "No saved articles yet. Use Read later on an article to add it.", storage: "Browser storage is unavailable. The reading list cannot be saved.", limit: "The list holds 100 articles. Remove some before adding more.", added: "Saved for later.", removed: "Removed from your reading list.", count: n => `${n} saved articles`, stale: "Some saved articles are no longer available." }
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
  window.addEventListener("storage", event => {
    if (event.key === readingListKey || event.key === null) { notice = ""; render(); }
  });
  document.addEventListener("facereader:ui-language", render);
  render();
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
