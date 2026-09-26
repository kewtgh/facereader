(function () {
  var detail = document.getElementById("category-detail");
  if (!detail) return;
  var title = document.getElementById("category-detail-title");
  var list = document.getElementById("category-detail-posts");
  var status = document.getElementById("category-detail-status");
  var retry = document.getElementById("category-detail-retry");
  var requestId = 0;
  var state = "idle";
  var indexPromise;
  var directoryItems = Array.from(document.querySelectorAll(".fr-category-directory li"));
  var categories = new Map(directoryItems.map(function (item) {
    var link = item.querySelector("a");
    return [decodeURIComponent(link.hash.slice(1)), link.textContent];
  }));

  function english() { return document.documentElement.getAttribute("data-fr-ui-lang") === "en"; }
  function updateStatus() {
    status.textContent = state === "loading" ? (english() ? "Loading category…" : "正在加载分类…") :
      state === "error" ? (english() ? "Could not load this category. Please retry." : "分类加载失败，请重试。") : "";
    retry.hidden = state !== "error";
    detail.setAttribute("aria-busy", state === "loading" ? "true" : "false");
  }

  function filterCategories() {
    var query = document.getElementById("category-filter").value.trim().toLocaleLowerCase();
    var count = 0;
    directoryItems.forEach(function (item) {
      item.hidden = !item.querySelector("a").textContent.toLocaleLowerCase().includes(query);
      if (!item.hidden) count++;
    });
    document.getElementById("category-filter-status").textContent = english()
      ? (count ? count + " / " + directoryItems.length + " categories" : "No matching categories.")
      : (count ? "显示 " + count + " / " + directoryItems.length + " 个分类" : "没有匹配的分类。");
  }

  function showCategory() {
    var currentRequest = ++requestId;
    var key;
    try { key = decodeURIComponent(location.hash.slice(1)); }
    catch (error) { key = ""; }
    if (!categories.has(key)) {
      state = "idle";
      updateStatus();
      detail.hidden = true;
      return;
    }
    title.textContent = categories.get(key);
    list.replaceChildren();
    detail.hidden = false;
    state = "loading";
    updateStatus();
    detail.scrollIntoView({ block: "start" });
    if (!indexPromise) {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 15000);
      indexPromise = fetch(detail.dataset.indexUrl, { signal: controller.signal }).then(function (response) {
        if (!response.ok) throw new Error("Category index unavailable");
        return response.json();
      }).catch(function (error) {
        indexPromise = null;
        throw error;
      }).finally(function () {
        clearTimeout(timer);
      });
    }
    indexPromise.then(function (index) {
      if (currentRequest !== requestId) return;
      var category = Object.prototype.hasOwnProperty.call(index, key) && index[key];
      if (!category || !Array.isArray(category.posts)) throw new Error("Invalid category index");
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
      state = "ready";
      updateStatus();
      detail.hidden = false;
    }).catch(function () {
      if (currentRequest !== requestId) return;
      indexPromise = null;
      state = "error";
      updateStatus();
    });
  }

  retry.addEventListener("click", showCategory);
  document.getElementById("category-filter").addEventListener("input", filterCategories);
  document.addEventListener("facereader:ui-language", function () { updateStatus(); filterCategories(); });
  window.addEventListener("hashchange", showCategory);
  filterCategories();
  showCategory();
})();
