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
      var cards = document.createDocumentFragment();
      category.posts.forEach(function (post) {
        var item = document.createElement("li");
        var link = document.createElement("a");
        var image = document.createElement("img");
        var copy = document.createElement("span");
        var heading = document.createElement("strong");
        var date = document.createElement("time");
        var excerpt = document.createElement("span");
        link.className = "fr-category-detail__card";
        link.href = post.url;
        image.src = post.image;
        image.alt = "";
        image.loading = "lazy";
        image.decoding = "async";
        image.width = 500;
        image.height = 300;
        copy.className = "fr-category-detail__copy";
        heading.textContent = post.title;
        date.dateTime = post.date;
        date.textContent = post.date;
        excerpt.className = "fr-category-detail__excerpt";
        excerpt.textContent = post.excerpt || "";
        copy.append(heading, date);
        if (post.excerpt) copy.appendChild(excerpt);
        link.append(image, copy);
        item.appendChild(link);
        cards.appendChild(item);
      });
      list.appendChild(cards);
      detail.hidden = false;
      detail.scrollIntoView({ block: "start" });
    }).catch(function () {
      detail.hidden = true;
    });
  }

  window.addEventListener("hashchange", showCategory);
  showCategory();
})();
