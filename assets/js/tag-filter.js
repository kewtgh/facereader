function scrollToCurrentTag() {
  const anchor = document.getElementById("current-tag-anchor");
  if (anchor) anchor.scrollIntoView({ behavior: "smooth", block: "start" });
}

// 将 data-tags 字符串解析为“精确标签数组”
function parseTags(tagsStr) {
  if (!tagsStr) return [];
  return tagsStr
    .split(",")
    .map(t => t.trim())
    .filter(Boolean);
}

function filterByTag(tag) {
  const posts = document.querySelectorAll(".tag-post-item");

  posts.forEach(post => {
    const tags = parseTags(post.dataset.tags);
    post.style.display = tags.includes(tag) ? "block" : "none";
  });

  const currentTagEl = document.getElementById("current-tag");
  if (currentTagEl) currentTagEl.innerText = tag;

  history.replaceState(null, "", "?tag=" + encodeURIComponent(tag));
  scrollToCurrentTag();
}

function resetFilter() {
  document.querySelectorAll(".tag-post-item").forEach(p => {
    p.style.display = "block";
  });

  const currentTagEl = document.getElementById("current-tag");
  if (currentTagEl) currentTagEl.innerText = "All";

  history.replaceState(null, "", location.pathname);
  scrollToCurrentTag();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tag-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => filterByTag(btn.dataset.tag));
  });

  const params = new URLSearchParams(window.location.search);
  const tag = params.get("tag");
  if (tag) filterByTag(tag);
});
