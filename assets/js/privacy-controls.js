(function () {
  var key = "facereader.analyticsConsent.v1";
  var form;
  var notice = "";
  var copy = {
    zh: { blocked: "浏览器隐私信号已开启，本站不会加载访问统计。", unavailable: "此页面未启用访问统计。", storage: "无法保存浏览器偏好，访问统计保持关闭。", commentsLoading: "正在加载 Disqus 评论…", commentsFailed: "评论未能加载。可以重试；第三方服务可能被浏览器或网络阻止。", commentsRetry: "重试加载评论" },
    en: { blocked: "Your browser privacy signal is enabled. Analytics will stay off.", unavailable: "Analytics is not enabled on this page.", storage: "Browser preferences could not be saved. Analytics remains off.", commentsLoading: "Loading Disqus comments…", commentsFailed: "Comments could not load. Retry; your browser or network may block this service.", commentsRetry: "Retry loading comments" }
  };
  function text(key) { return copy[document.documentElement.getAttribute("data-fr-ui-lang") === "en" ? "en" : "zh"][key] || ""; }
  function privacySignal() { return navigator.globalPrivacyControl === true || navigator.doNotTrack === "1" || window.doNotTrack === "1"; }
  function analyticsId() { var meta = document.querySelector('meta[name="facereader-analytics-id"]'); return meta ? meta.content : ""; }
  function consent() { try { return localStorage.getItem(key) === "enabled"; } catch (error) { return false; } }
  function update() {
    if (form) {
      var configured = form.dataset.frAnalyticsConfigured === "true";
      var disabled = privacySignal() || !configured;
      form.elements.analytics.disabled = disabled;
      form.querySelector("button").disabled = disabled;
      form.querySelector("[data-fr-privacy-status]").textContent = text(privacySignal() ? "blocked" : !configured ? "unavailable" : notice);
    }
    document.querySelectorAll("[data-fr-disqus]").forEach(function (root) {
      var state = root.dataset.frCommentState;
      root.querySelector("[data-fr-comment-status]").textContent = text(state === "loading" ? "commentsLoading" : state === "failed" ? "commentsFailed" : "");
      if (state === "failed") root.querySelector("button").textContent = text("commentsRetry");
    });
  }
  function loadAnalytics() {
    var id = analyticsId();
    if (!id || !consent() || privacySignal()) return;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag("js", new Date());
    function withoutParameters(value) {
      if (!value) return "";
      try { var url = new URL(value, location.href); return url.origin + url.pathname; }
      catch (error) { return ""; }
    }
    window.gtag("config", id, { anonymize_ip: true, page_location: withoutParameters(location.href), page_referrer: withoutParameters(document.referrer) });
    var script = document.createElement("script");
    script.async = true;
    script.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    script.dataset.frAnalytics = "true";
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
    form = document.querySelector("[data-fr-privacy-form]");
    if (form) {
      form.elements.analytics.checked = consent() && !privacySignal();
      form.addEventListener("submit", function (event) {
        event.preventDefault();
        try {
          localStorage.setItem(key, form.elements.analytics.checked && !privacySignal() ? "enabled" : "disabled");
          window.location.reload();
        } catch (error) { form.elements.analytics.checked = false; notice = "storage"; update(); }
      });
    }
    document.querySelectorAll("[data-fr-disqus]").forEach(function (root) {
      root.querySelector("button").hidden = false;
      root.querySelector("button").addEventListener("click", function () { loadComments(root); });
    });
    update();
    loadAnalytics();
    window.addEventListener("storage", function (event) {
      if (event.key === key || event.key === null) window.location.reload();
    });
  }
  document.addEventListener("facereader:ui-language", update);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
