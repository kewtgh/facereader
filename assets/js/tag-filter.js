function scrollToCurrentTag() {
  const anchor = document.getElementById("current-tag-anchor");
  if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
}

function parseTags(tagsStr) {
  if (!tagsStr) return [];
  return tagsStr
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);
}

function setActiveTag(tag) {
  const btns = document.querySelectorAll(".tag-filter-btn");
  btns.forEach(b => {
    const isActive = b.dataset.tag === tag;
    b.classList.toggle("is-active", isActive);
    b.setAttribute("aria-pressed", isActive ? "true" : "false");
  });

  // 让选中的按钮尽量滚到可见位置（尤其是从文章页跳转进来时）
  const activeBtn = document.querySelector(`.tag-filter-btn[data-tag="${CSS.escape(tag)}"]`);
  if (activeBtn) activeBtn.scrollIntoView({ behavior: "smooth", block: "center" });
}

function updateCurrentTagMeta(tag) {
  const countEl = document.getElementById("current-tag-count");
  const descEl = document.getElementById("current-tag-description");
  const totalPosts = document.querySelectorAll(".tag-post-item").length;
  const lang = (document.documentElement.getAttribute("data-fr-ui-lang") || "zh").slice(0, 2);
  const dictionary = window.FaceReaderUiText?.[lang] || window.FaceReaderUiText?.zh || {};
  const postsLabel = dictionary.tag_posts_count_label || "posts";
  const emptyDesc = dictionary.tag_filter_empty_desc || "选择标签后，会显示该标签说明和对应文章列表。";
  const missingDesc = dictionary.tag_filter_missing_desc || "该标签暂无单独说明。";

  if (!tag) {
    if (countEl) countEl.innerText = `${totalPosts} ${postsLabel}`;
    if (descEl) descEl.innerText = emptyDesc;
    return;
  }

  const activeBtn = document.querySelector(`.tag-filter-btn[data-tag="${CSS.escape(tag)}"]`);
  if (countEl) countEl.innerText = `${activeBtn?.dataset.count || 0} ${postsLabel}`;
  if (descEl) descEl.innerText = activeBtn?.dataset.description || missingDesc;
}

function applyFilter(tag, { push = false } = {}) {
  const posts = document.querySelectorAll(".tag-post-item");

  if (!tag) {
    posts.forEach(p => (p.style.display = "block"));

    const currentTagEl = document.getElementById("current-tag");
    const lang = (document.documentElement.getAttribute("data-fr-ui-lang") || "zh").slice(0, 2);
    const dictionary = window.FaceReaderUiText?.[lang] || window.FaceReaderUiText?.zh || {};
    if (currentTagEl) currentTagEl.innerText = dictionary.tag_all || "All";

    document.querySelectorAll(".tag-filter-btn").forEach(b => {
      b.classList.remove("is-active");
      b.setAttribute("aria-pressed", "false");
    });
    updateCurrentTagMeta("");

    if (push) history.pushState(null, "", location.pathname);
    else history.replaceState(null, "", location.pathname);

    scrollToCurrentTag();
    return;
  }

  posts.forEach(post => {
    const tags = parseTags(post.dataset.tags);
    post.style.display = tags.includes(tag) ? "block" : "none";
  });

  const currentTagEl = document.getElementById("current-tag");
  if (currentTagEl) currentTagEl.innerText = tag;

  setActiveTag(tag);
  updateCurrentTagMeta(tag);

  const url = `?tag=${encodeURIComponent(tag)}`;
  if (push) history.pushState(null, "", url);
  else history.replaceState(null, "", url);

  scrollToCurrentTag();
}

function filterByTag(tag) {
  applyFilter(tag, { push: true });
}

function resetFilter() {
  applyFilter("", { push: true });
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tag-filter-btn").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      filterByTag(btn.dataset.tag);
    });
  });

  // 初次加载：根据 URL 自动筛选（不 push 记录）
  const params = new URLSearchParams(window.location.search);
  const tag = params.get("tag");
  if (tag) applyFilter(tag, { push: false });

  // 支持浏览器前进/后退
  window.addEventListener("popstate", () => {
    const p = new URLSearchParams(window.location.search);
    applyFilter(p.get("tag") || "", { push: false });
  });

  document.addEventListener("facereader:ui-language", () => {
    const currentTagEl = document.getElementById("current-tag");
    const currentTag = currentTagEl && !currentTagEl.hasAttribute("data-fr-tag-all-label") ? currentTagEl.innerText : "";
    const params = new URLSearchParams(window.location.search);
    const tag = params.get("tag") || (currentTag && currentTag !== "All" && currentTag !== "全部" ? currentTag : "");
    if (!tag && currentTagEl) {
      const lang = (document.documentElement.getAttribute("data-fr-ui-lang") || "zh").slice(0, 2);
      const dictionary = window.FaceReaderUiText?.[lang] || window.FaceReaderUiText?.zh || {};
      currentTagEl.innerText = dictionary.tag_all || "All";
    }
    updateCurrentTagMeta(tag);
  });
});
