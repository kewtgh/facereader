(function () {
  var copy = {
    zh: { commentsLoading: "正在加载 Disqus 评论…", commentsFailed: "评论未能加载。可以重试；第三方服务可能被浏览器或网络阻止。", commentsRetry: "重试加载评论" },
    en: { commentsLoading: "Loading Disqus comments…", commentsFailed: "Comments could not load. Retry; your browser or network may block this service.", commentsRetry: "Retry loading comments" }
  };
  function text(key) { return copy[document.documentElement.getAttribute("data-fr-ui-lang") === "en" ? "en" : "zh"][key] || ""; }
  function update() {
    document.querySelectorAll("[data-fr-disqus]").forEach(function (root) {
      var state = root.dataset.frCommentState;
      root.querySelector("[data-fr-comment-status]").textContent = text(state === "loading" ? "commentsLoading" : state === "failed" ? "commentsFailed" : "");
      if (state === "failed") root.querySelector("button").textContent = text("commentsRetry");
    });
  }
  function loadAnalytics() {
    var meta = document.querySelector('meta[name="facereader-analytics-id"]');
    if (!meta || !meta.content || navigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || window.doNotTrack === "1") return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    function withoutParameters(value) {
      if (!value) return "";
      try { var url = new URL(value, location.href); return url.origin + url.pathname; }
      catch (error) { return ""; }
    }
    window.gtag("js", new Date());
    window.gtag("config", meta.content, { anonymize_ip: true, page_location: withoutParameters(location.href), page_referrer: withoutParameters(document.referrer) });
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(meta.content);
    document.head.appendChild(script);
  }
  function loadComments(root) {
    if (["loading", "loaded"].indexOf(root.dataset.frCommentState) >= 0 || !/^[a-z0-9-]+$/i.test(root.dataset.frDisqus)) return;
    var button = root.querySelector("button");
    button.disabled = true;
    root.dataset.frCommentState = "loading";
    update();
    window.disqus_config = function () {
      this.page.url = root.dataset.frCommentUrl;
      this.page.identifier = root.dataset.frCommentId;
      this.page.title = root.dataset.frCommentTitle;
    };
    var script = document.createElement("script");
    var settled = false;
    var timer = setTimeout(fail, 15000);
    function fail() {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      script.remove();
      root.dataset.frCommentState = "failed";
      button.disabled = false;
      update();
    }
    script.src = "https://" + root.dataset.frDisqus + ".disqus.com/embed.js";
    script.async = true;
    script.onerror = fail;
    script.onload = function () {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      root.dataset.frCommentState = "loaded";
      button.hidden = true;
      update();
    };
    document.head.appendChild(script);
  }
  function init() {
    document.querySelectorAll("[data-fr-disqus]").forEach(function (root) {
      root.querySelector("button").hidden = false;
      root.querySelector("button").addEventListener("click", function () { loadComments(root); });
    });
    var toggle = document.querySelector(".search__toggle");
    if (toggle) document.querySelectorAll("[data-fr-open-search]").forEach(function (button) {
      button.hidden = false;
      button.addEventListener("click", function () { if (toggle.getAttribute("aria-expanded") !== "true") toggle.click(); });
    });
    update();
    loadAnalytics();
  }
  document.addEventListener("facereader:ui-language", update);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
