function scrollToCurrentTag() {
  const anchor = document.getElementById("current-tag-anchor");
  if (anchor) {
    anchor.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function filterByTag(tag) {
  const posts = document.querySelectorAll(".tag-post-item");
  let visible = 0;

  posts.forEach(post => {
    const tags = post.dataset.tags || "";
    if (tags.includes(tag)) {
      post.style.display = "block";
      visible++;
    } else {
      post.style.display = "none";
    }
  });

  const currentTagEl = document.getElementById("current-tag");
  if (currentTagEl) {
    currentTagEl.innerText = tag;
  }

  history.replaceState(null, "", "?tag=" + encodeURIComponent(tag));

  // ✅ 立即滚动
  scrollToCurrentTag();
}

function resetFilter() {
  document.querySelectorAll(".tag-post-item").forEach(p => {
    p.style.display = "block";
  });

  const currentTagEl = document.getElementById("current-tag");
  if (currentTagEl) {
    currentTagEl.innerText = "All";
  }

  history.replaceState(null, "", location.pathname);

  // ✅ 清除后也回到状态区
  scrollToCurrentTag();
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tag-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      filterByTag(btn.dataset.tag);
    });
  });

  const params = new URLSearchParams(window.location.search);
  const tag = params.get("tag");
  if (tag) {
    filterByTag(tag);
  }
});
