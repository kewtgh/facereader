import { findArticles, readSaved, validPath, validateCatalog, readingListKey, readingListLimit } from "./catalog-search.mjs";

const copy = {
  zh: { save: "稍后阅读", saved: "已保存，点击移除", remove: "移除", empty: "阅读列表还是空的。在文章页点击「稍后阅读」即可保存。", storage: "浏览器存储不可用，无法保存阅读列表。", limit: "已达到 100 篇上限，请先移除一些文章。", added: "已保存到此浏览器。", removed: "已从阅读列表移除。", loading: "正在加载文章目录…", failed: "文章目录暂时无法加载，请重试或浏览全部文章。", noResults: "没有找到匹配的文章。试试更短的关键词或其他主题。", topics: "全部主题", results: n => `找到 ${n} 篇文章`, count: n => `${n} 篇已保存文章`, minutes: n => `约 ${n} 分钟`, stale: "部分保存的文章已不可用。" },
  en: { save: "Read later", saved: "Saved; click to remove", remove: "Remove", empty: "Your list is empty. Use Read later on an article to save it.", storage: "Browser storage is unavailable. The reading list cannot be saved.", limit: "The list holds 100 articles. Remove some before adding more.", added: "Saved in this browser.", removed: "Removed from your reading list.", loading: "Loading the article catalog…", failed: "The article catalog could not load. Retry or browse all articles.", noResults: "No matching articles. Try fewer keywords or a different topic.", topics: "All topics", results: n => `${n} articles found`, count: n => `${n} saved articles`, minutes: n => `About ${n} min`, stale: "Some saved articles are no longer available." }
};

function init() {
  const save = document.querySelector("[data-fr-save-article]");
  const root = document.querySelector("[data-fr-local-search], [data-fr-reading-list]");
  if (!save && !root) return;
  const searching = root?.hasAttribute("data-fr-local-search");
  const status = root?.querySelector("[data-fr-library-status]");
  const results = root?.querySelector("[data-fr-library-results]");
  const retry = root?.querySelector("[data-fr-catalog-retry]");
  const more = root?.querySelector("[data-fr-library-more]");
  const cleanup = root?.querySelector("[data-fr-clear-unavailable]");
  const form = root?.querySelector("form");
  const query = form?.elements.q;
  const language = form?.elements.lang;
  const category = form?.elements.category;
  let posts;
  let loading = false;
  let failed = false;
  let shown = 12;
  let saveNotice = "";

  const uiLanguage = () => document.documentElement.getAttribute("data-fr-ui-lang") === "en" ? "en" : "zh";
  const text = key => copy[uiLanguage()][key];
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
    save.textContent = text(active ? "saved" : "save");
    save.setAttribute("aria-pressed", String(active));
    save.closest(".fr-article-save").lang = uiLanguage() === "en" ? "en" : "zh-CN";
    document.querySelector("[data-fr-save-status]").textContent = text(!state.available ? "storage" : saveNotice) || "";
  }
  function toggle(url) {
    if (!validPath(url)) return;
    const state = savedState();
    const exists = state.urls.includes(url);
    saveNotice = "";
    if (!state.available) saveNotice = "storage";
    else if (!exists && state.urls.length >= readingListLimit) saveNotice = "limit";
    else {
      const urls = exists ? state.urls.filter(item => item !== url) : [url, ...state.urls];
      saveNotice = store(urls) ? exists ? "removed" : "added" : "storage";
    }
    renderSave();
    render();
  }
  save?.addEventListener("click", () => toggle(save.dataset.frSaveArticle));

  function readUrl() {
    if (!searching) return;
    const params = new URLSearchParams(location.search);
    query.value = (params.get("q") || "").slice(0, 200);
    language.value = ["zh", "en"].includes(params.get("lang")) ? params.get("lang") : uiLanguage();
    updateTopics(params.get("category") || "");
    shown = 12;
  }
  function writeUrl() {
    const url = new URL(location.href);
    for (const [key, value] of [["q", query.value.trim()], ["lang", language.value], ["category", category.value]]) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    if (url.href !== location.href) history.pushState(null, "", url);
  }
  function updateTopics(selected = category?.value || "") {
    if (!searching || !posts) return;
    category.replaceChildren(new Option(text("topics"), ""));
    const topics = [...new Set(posts.filter(post => post.language === language.value).flatMap(post => post.categories))].sort();
    for (const topic of topics) category.appendChild(new Option(topic, topic));
    category.value = topics.includes(selected) ? selected : "";
  }
  function element(tag, value, className) {
    const node = document.createElement(tag);
    if (value !== undefined) node.textContent = value;
    if (className) node.className = className;
    return node;
  }
  function card(post, removable) {
    const article = element("article", undefined, "fr-library__card");
    article.lang = post.language === "en" ? "en" : "zh-CN";
    const heading = element("h2");
    const link = element("a", post.title);
    link.href = post.url;
    heading.appendChild(link);
    const meta = element("p", undefined, "fr-library__meta");
    meta.lang = uiLanguage();
    const date = element("time", post.date);
    date.dateTime = post.date;
    meta.append(date, document.createTextNode(` · ${post.language === "en" ? "English" : "中文"} · ${text("minutes")(post.minutes)}`));
    article.append(heading, meta, element("p", post.excerpt));
    if (removable) {
      const remove = element("button", text("remove"), "btn");
      remove.type = "button";
      remove.lang = uiLanguage();
      remove.setAttribute("aria-label", `${text("remove")}: ${post.title}`);
      remove.addEventListener("click", () => {
        const index = [...results.children].indexOf(article);
        toggle(post.url);
        (results.children[index] || results.lastElementChild)?.querySelector("button")?.focus();
        if (!results.children.length) { status.tabIndex = -1; status.focus(); }
      });
      article.appendChild(remove);
    }
    return article;
  }
  function render() {
    if (!root) return;
    root.lang = uiLanguage() === "en" ? "en" : "zh-CN";
    retry.hidden = !failed;
    if (loading || failed || !posts) {
      status.textContent = text(failed ? "failed" : "loading");
      return;
    }
    let items;
    if (searching) {
      items = findArticles(posts, { query: query.value, category: category.value, language: language.value });
      status.textContent = items.length ? text("results")(items.length) : text("noResults");
      more.hidden = items.length <= shown;
    } else {
      const state = savedState();
      items = state.urls.map(url => posts.find(post => post.url === url)).filter(Boolean);
      status.textContent = !state.available || saveNotice === "storage" ? text("storage") : items.length ? text("count")(items.length) : text("empty");
      if (state.urls.length > items.length) status.textContent += ` ${text("stale")}`;
      cleanup.hidden = !state.available || state.urls.length === items.length;
    }
    results.replaceChildren(...(searching ? items.slice(0, shown) : items).map(post => card(post, !searching)));
  }
  async function load() {
    if (loading) return;
    loading = true;
    failed = false;
    root.setAttribute("aria-busy", "true");
    render();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(root.dataset.frCatalogUrl, { signal: controller.signal });
      if (!response.ok) throw new Error("Catalog unavailable");
      posts = validateCatalog(await response.json());
      readUrl();
    } catch { failed = true; }
    finally {
      clearTimeout(timer);
      loading = false;
      root.setAttribute("aria-busy", "false");
      render();
    }
  }
  form?.addEventListener("submit", event => {
    event.preventDefault();
    shown = 12;
    writeUrl();
    render();
  });
  for (const control of [language, category].filter(Boolean)) control.addEventListener("change", () => {
    if (control === language) updateTopics();
    shown = 12;
    writeUrl();
    render();
  });
  root?.querySelector("[data-fr-search-clear]")?.addEventListener("click", () => {
    query.value = "";
    category.value = "";
    shown = 12;
    writeUrl();
    render();
    query.focus();
  });
  more?.addEventListener("click", () => {
    const previous = shown;
    shown += 12;
    render();
    results.children[previous]?.querySelector("a")?.focus();
  });
  retry?.addEventListener("click", load);
  cleanup?.addEventListener("click", () => {
    if (!posts) return;
    const known = new Set(posts.map(post => post.url));
    saveNotice = store(savedState().urls.filter(url => known.has(url))) ? "removed" : "storage";
    render();
    status.tabIndex = -1;
    status.focus();
  });
  window.addEventListener("popstate", () => { readUrl(); render(); });
  window.addEventListener("storage", event => {
    if (event.key === readingListKey || event.key === null) { saveNotice = ""; renderSave(); render(); }
  });
  document.addEventListener("facereader:ui-language", event => {
    renderSave();
    if (searching) {
      const explicit = new URLSearchParams(location.search).get("lang");
      if (!event.detail?.initial || !["zh", "en"].includes(explicit)) language.value = uiLanguage();
      updateTopics();
      shown = 12;
      if (!event.detail?.initial) writeUrl();
    }
    render();
  });
  renderSave();
  if (root) { readUrl(); load(); }
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
else init();
