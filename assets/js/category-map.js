const { validPath } = await import("./site-paths.mjs" + new URL(import.meta.url).search);

(function () {
  var detail = document.getElementById("category-detail");
  if (!detail) return;
  var title = document.getElementById("category-detail-title");
  var list = document.getElementById("category-detail-posts");
  var status = document.getElementById("category-detail-status");
  var retry = document.getElementById("category-detail-retry");
  var indexUrl = new URL(detail.dataset.indexUrl, location.href);
  var moduleVersion = new URL(import.meta.url).searchParams.get("v");
  if (moduleVersion) indexUrl.searchParams.set("v", moduleVersion);
  var requestId = 0;
  var state = "idle";
  var resultCount = 0;
  var indexPromise;
  var directoryItems = Array.from(document.querySelectorAll(".fr-category-directory li"));
  var categories = new Map(directoryItems.map(function (item) {
    var link = item.querySelector("a");
    return [decodeURIComponent(link.hash.slice(1)), link.textContent];
  }));
  function english() { return document.documentElement.getAttribute("data-fr-ui-lang") === "en"; }
  function updateStatus() {
    status.textContent = state === "loading" ? (english() ? "Loading category…" : "正在加载分类…") :
      state === "error" ? (english() ? "Could not load this category. Please retry." : "分类加载失败，请重试。") :
      state === "empty" ? (english() ? "No English essays in this category yet. Choose another category or switch to Chinese." : "这个分类暂无中文文章。请选择其他分类或切换到英文。") :
      state === "ready" ? (english() ? resultCount + " essays" : resultCount + " 篇文章") : "";
    retry.hidden = state !== "error";
    detail.setAttribute("aria-busy", state === "loading" ? "true" : "false");
  }
  function countForLanguage(item) { return Number(item.getAttribute(english() ? "data-fr-category-count-en" : "data-fr-category-count-zh")) || 0; }
  function filterCategories() {
    document.querySelectorAll(".fr-pillar").forEach(function (pillar) {
      pillar.hidden = Number(pillar.getAttribute(english() ? "data-fr-pillar-count-en" : "data-fr-pillar-count-zh")) === 0;
    });
    var query = document.getElementById("category-filter").value.trim().toLocaleLowerCase();
    directoryItems.sort(function (a, b) { return countForLanguage(b) - countForLanguage(a) || a.textContent.localeCompare(b.textContent); });
    if (directoryItems.length) directoryItems[0].parentElement.append(...directoryItems);
    var count = 0;
    var total = 0;
    directoryItems.forEach(function (item) {
      var posts = countForLanguage(item);
      item.querySelector("[data-fr-category-count]").textContent = posts;
      if (posts) total++;
      item.hidden = !posts || !item.querySelector("a").textContent.toLocaleLowerCase().includes(query);
      if (!item.hidden) count++;
    });
    document.getElementById("category-filter-status").textContent = english()
      ? (count ? count + " / " + total + " categories" : "No matching categories.")
      : (count ? "显示 " + count + " / " + total + " 个分类" : "没有匹配的分类。");
    document.querySelector(".fr-category-directory header small").textContent = english() ? "By article count · " + total + " categories" : "按文章数量排列 · " + total + " 个分类";
  }
  function validImage(value) {
    if (validPath(value)) return true;
    try { var url = new URL(value); return typeof value === "string" && url.protocol === "https:" && !url.username && !url.password; } catch (error) { return false; }
  }
  function validateCategory(category) {
    if (!category || typeof category.name !== "string" || !Array.isArray(category.posts) || !category.posts.every(function (post) {
      return post && typeof post.title === "string" && validPath(post.url) && validImage(post.image) &&
        ["zh", "en"].includes(post.language) && typeof post.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(post.date) &&
        typeof post.excerpt === "string";
    })) throw new Error("Invalid category data");
  }
  function showCategory(scroll) {
    var currentRequest = ++requestId;
    var key;
    try { key = decodeURIComponent(location.hash.slice(1)); } catch (error) { key = ""; }
    if (!categories.has(key)) { state = "idle"; updateStatus(); detail.hidden = true; return; }
    title.textContent = categories.get(key);
    list.replaceChildren();
    detail.hidden = false;
    state = "loading";
    updateStatus();
    if (scroll) detail.scrollIntoView({ block: "start" });
    if (!indexPromise) {
      var controller = new AbortController();
      var timer = setTimeout(function () { controller.abort(); }, 15000);
      indexPromise = fetch(indexUrl.href, { signal: controller.signal }).then(function (response) {
        if (!response.ok) throw new Error("Category index unavailable");
        return response.json();
      }).catch(function (error) { indexPromise = null; throw error; }).finally(function () { clearTimeout(timer); });
    }
    indexPromise.then(function (index) {
      if (currentRequest !== requestId) return;
      var category = Object.prototype.hasOwnProperty.call(index, key) && index[key];
      validateCategory(category);
      var posts = category.posts.filter(function (post) { return post.language === (english() ? "en" : "zh"); });
      title.textContent = category.name;
      var cards = document.createDocumentFragment();
      posts.forEach(function (post) {
        var item = document.createElement("li");
        item.lang = post.language;
        var link = document.createElement("a");
        var image = document.createElement("img");
        var copy = document.createElement("span");
        var heading = document.createElement("strong");
        var date = document.createElement("time");
        var excerpt = document.createElement("span");
        link.className = "fr-category-detail__card";
        link.href = post.url;
        image.src = post.image;
        image.alt = ""; image.loading = "lazy"; image.decoding = "async"; image.width = 500; image.height = 300;
        copy.className = "fr-category-detail__copy";
        heading.textContent = post.title; date.dateTime = post.date; date.textContent = post.date;
        excerpt.className = "fr-category-detail__excerpt"; excerpt.textContent = post.excerpt;
        copy.append(heading, date);
        if (post.excerpt) copy.appendChild(excerpt);
        link.append(image, copy); item.appendChild(link); cards.appendChild(item);
      });
      list.replaceChildren(cards);
      resultCount = posts.length;
      state = posts.length ? "ready" : "empty";
      updateStatus();
    }).catch(function () {
      if (currentRequest !== requestId) return;
      indexPromise = null; state = "error"; updateStatus();
    });
  }
  retry.addEventListener("click", function () { showCategory(false); });
  document.getElementById("category-filter").addEventListener("input", filterCategories);
  document.addEventListener("facereader:ui-language", function () { filterCategories(); showCategory(false); });
  window.addEventListener("hashchange", function () { showCategory(true); });
  filterCategories(); showCategory(true);
})();
