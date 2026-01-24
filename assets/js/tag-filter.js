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

function applyFilter(tag, { push = false } = {}) {
  const posts = document.querySelectorAll(".tag-post-item");

  if (!tag) {
    posts.forEach(p => (p.style.display = "block"));

    const currentTagEl = document.getElementById("current-tag");
    if (currentTagEl) currentTagEl.innerText = "All";

    document.querySelectorAll(".tag-filter-btn").forEach(b => {
      b.classList.remove("is-active");
      b.setAttribute("aria-pressed", "false");
    });

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
});
