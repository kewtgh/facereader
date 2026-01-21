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

  document.getElementById("current-tag").innerText = tag;
  history.replaceState(null, "", "?tag=" + encodeURIComponent(tag));
}

function resetFilter() {
  document.querySelectorAll(".tag-post-item").forEach(p => {
    p.style.display = "block";
  });
  document.getElementById("current-tag").innerText = "All";
  history.replaceState(null, "", location.pathname);
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".tag-filter-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      filterByTag(btn.dataset.tag);
    });
  });

  const params = new URLSearchParams(window.location.search);
  const tag = params.get("tag");
  if (tag) filterByTag(tag);
});
