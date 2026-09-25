(function () {
  var detail = document.getElementById("category-detail");
  if (!detail) return;
  var title = document.getElementById("category-detail-title");
  var list = document.getElementById("category-detail-posts");
  var indexPromise;

  function showCategory() {
    var key;
    try { key = decodeURIComponent(location.hash.slice(1)); }
    catch (error) { return; }
    if (!key) {
      detail.hidden = true;
      return;
    }
    if (!indexPromise) {
      indexPromise = fetch("/category-index.json").then(function (response) {
        if (!response.ok) throw new Error("Category index unavailable");
        return response.json();
      });
    }
    indexPromise.then(function (index) {
      var category = index[key];
      if (!category) {
        detail.hidden = true;
        return;
      }
      title.textContent = category.name;
      list.replaceChildren();
      category.posts.forEach(function (post) {
        var item = document.createElement("li");
        var link = document.createElement("a");
        var date = document.createElement("time");
        link.href = post.url;
        link.textContent = post.title;
        date.dateTime = post.date;
        date.textContent = post.date;
        item.append(link, date);
        list.appendChild(item);
      });
      detail.hidden = false;
      detail.scrollIntoView({ block: "start" });
    }).catch(function () {
      detail.hidden = true;
    });
  }

  window.addEventListener("hashchange", showCategory);
  showCategory();
})();
