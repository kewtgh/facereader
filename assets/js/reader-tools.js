(function () {
  var copy = {
    zh: {
      tocOpen: "打开文章目录",
      tocClose: "关闭文章目录",
      tocLabel: "文章目录",
      seriesOpen: "打开专题文章列表",
      seriesClose: "关闭专题文章列表",
      seriesLabel: "专题文章",
      backToTop: "返回顶部"
    },
    en: {
      tocOpen: "Open table of contents",
      tocClose: "Close table of contents",
      tocLabel: "Table of contents",
      seriesOpen: "Open series articles",
      seriesClose: "Close series articles",
      seriesLabel: "Series articles",
      backToTop: "Back to top"
    }
  };
  var dictionaryKeys = {
    tocOpen: "reader_toc_open",
    tocClose: "reader_toc_close",
    tocLabel: "toc_label",
    backToTop: "reader_back_to_top"
  };

  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
  }

  function currentLanguage() {
    return document.documentElement.getAttribute("data-fr-ui-lang") === "en" ? "en" : "zh";
  }

  function text(key) {
    var language = currentLanguage();
    var dictionary = window.FaceReaderUiText && window.FaceReaderUiText[language];
    var dictionaryKey = dictionaryKeys[key];
    return (dictionary && dictionary[dictionaryKey]) || copy[language][key];
  }

  function setControlLabel(control, value) {
    control.setAttribute("aria-label", value);
    control.title = value;
  }

  function createProgressBar() {
    if (document.querySelector(".fr-reading-progress")) return;
    var bar = document.createElement("div");
    bar.className = "fr-reading-progress";
    bar.setAttribute("aria-hidden", "true");
    bar.innerHTML = "<i></i>";
    document.body.appendChild(bar);
  }

  function updateProgress() {
    var bar = document.querySelector(".fr-reading-progress i");
    if (!bar) return;

    var doc = document.documentElement;
    var scrollable = doc.scrollHeight - window.innerHeight;
    var value = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0;
    bar.style.transform = "scaleX(" + value + ")";
  }

  function createButton(className, labelKey, symbol, onClick) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.labelKey = labelKey;
    setControlLabel(button, text(labelKey));
    button.innerHTML = "<span aria-hidden=\"true\">" + symbol + "</span>";
    button.addEventListener("click", onClick);
    return button;
  }

  function focusableControls(panel) {
    return Array.prototype.slice.call(panel.querySelectorAll(
      "a[href], button:not([disabled]), [tabindex]:not([tabindex='-1'])"
    )).filter(function (element) {
      return !element.hidden && element.getAttribute("aria-hidden") !== "true";
    });
  }

  function setBackgroundInert(panel, inert) {
    if (inert) {
      panel._frInertElements = Array.prototype.slice.call(document.querySelectorAll(
        ".masthead, .initial-content, .page__footer, .fr-reader-tools"
      )).map(function (element) {
        var state = { element: element, inert: element.inert };
        element.inert = true;
        return state;
      });
      return;
    }

    (panel._frInertElements || []).forEach(function (state) {
      state.element.inert = state.inert;
    });
    panel._frInertElements = [];
  }

  function closeToc(panel, restoreFocus) {
    if (!panel.classList.contains("is-open")) return;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    if (panel._frTrigger) panel._frTrigger.setAttribute("aria-expanded", "false");
    document.body.classList.remove("fr-mobile-toc-open");
    setBackgroundInert(panel, false);

    if (restoreFocus !== false && panel._frPreviousFocus && document.contains(panel._frPreviousFocus)) {
      panel._frPreviousFocus.focus();
    }
  }

  function openToc(panel, trigger) {
    document.querySelectorAll(".fr-mobile-toc.is-open").forEach(function (other) {
      if (other !== panel) closeToc(other, false);
    });
    panel._frTrigger = trigger;
    if (trigger) trigger.setAttribute("aria-expanded", "true");
    panel._frPreviousFocus = trigger || document.activeElement;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    document.body.classList.add("fr-mobile-toc-open");
    setBackgroundInert(panel, true);

    window.requestAnimationFrame(function () {
      var closeButton = panel.querySelector("button[data-close-toc]");
      if (closeButton) closeButton.focus({ preventScroll: true });
      var activeLink = panel.querySelector('a[aria-current]');
      if (activeLink) {
        var scroller = document.body.classList.contains("fr-article") ?
          panel.querySelector(".fr-mobile-toc__body") : panel.querySelector(".fr-mobile-toc__panel");
        var bounds = scroller.getBoundingClientRect();
        var linkBounds = activeLink.getBoundingClientRect();
        scroller.scrollTop += linkBounds.top - bounds.top - scroller.clientHeight / 2;
      }
    });
  }

  function updateToolLanguage() {
    document.querySelectorAll("[data-label-key]").forEach(function (control) {
      setControlLabel(control, text(control.dataset.labelKey));
    });

    document.querySelectorAll(".fr-mobile-toc__panel").forEach(function (dialog) {
      dialog.setAttribute("aria-label", text(dialog.dataset.dialogLabel || "tocLabel"));
      dialog.setAttribute("lang", currentLanguage() === "en" ? "en" : "zh-CN");
    });
  }

  function createTocPanel(sourceToc, kind) {
    var series = kind === "series";
    var panel = document.createElement("div");
    panel.className = "fr-mobile-toc" + (series ? " fr-mobile-series" : "");
    panel.id = series ? "fr-series-panel" : "fr-toc-panel";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = [
      "<div class=\"fr-mobile-toc__shade\" data-close-toc></div>",
      "<aside class=\"fr-mobile-toc__panel\" role=\"dialog\" aria-modal=\"true\" tabindex=\"-1\">",
      "<button class=\"fr-mobile-toc__close\" type=\"button\" data-close-toc data-label-key=\"tocClose\"><span aria-hidden=\"true\">×</span></button>",
      "<div class=\"fr-mobile-toc__body\"></div>",
      "</aside>"
    ].join("");
    panel.querySelector(".fr-mobile-toc__panel").dataset.dialogLabel = series ? "seriesLabel" : "tocLabel";
    panel.querySelector("button[data-close-toc]").dataset.labelKey = series ? "seriesClose" : "tocClose";

    var clone = sourceToc.cloneNode(true);
    panel.querySelector(".fr-mobile-toc__body").appendChild(clone);
    panel.addEventListener("click", function (event) {
      if (series && event.target.closest("a[href]")) {
        closeToc(panel);
        return;
      }
      var tocLink = event.target.closest('.toc__menu a[href^="#"]');
      if (tocLink) {
        var heading = null;
        try { heading = document.getElementById(decodeURIComponent(tocLink.hash.slice(1))); }
        catch (error) { /* Keep native anchor navigation. */ }
        closeToc(panel, false);
        if (heading) {
          if (!heading.hasAttribute("tabindex")) heading.setAttribute("tabindex", "-1");
          window.requestAnimationFrame(function () { heading.focus({ preventScroll: true }); });
        }
      } else if (event.target.closest("[data-close-toc]")) {
        closeToc(panel);
      }
    });
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && panel.classList.contains("is-open")) {
        event.preventDefault();
        closeToc(panel);
      }
    });

    panel.addEventListener("keydown", function (event) {
      if (event.key !== "Tab") return;
      var controls = focusableControls(panel);
      if (!controls.length) {
        event.preventDefault();
        return;
      }

      var first = controls[0];
      var last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
    document.body.appendChild(panel);
    updateToolLanguage();
    return panel;
  }

  function createFloatingTools() {
    if (document.querySelector(".fr-reader-tools")) return;

    var article = document.body.classList.contains("fr-article");
    var toc = article ? document.querySelector(".fr-article-toc__nav") : document.querySelector("nav.toc");
    var panel = toc && toc.querySelector('.toc__menu a[href^="#"]') ? createTocPanel(toc) : null;
    var seriesTemplate = article && document.getElementById("fr-series-list");
    var seriesSource = seriesTemplate && seriesTemplate.content.querySelector("nav");
    var seriesPanel = seriesSource ? createTocPanel(seriesSource, "series") : null;
    if (article && panel) {
      var topToc = document.querySelector(".fr-article-toc-mobile");
      if (topToc) topToc.remove();
      var desktopLayout = window.matchMedia("(min-width: 1360px)");
      desktopLayout.addEventListener("change", function (event) {
        if (event.matches) closeToc(panel);
      });
    }
    var rail = document.createElement("div");
    rail.className = "fr-reader-tools";

    function addPanelButton(target, className, label, symbol) {
      var button = createButton("fr-reader-tools__btn " + className, label, symbol, function () {
        openToc(target, this);
      });
      button.setAttribute("aria-controls", target.id);
      button.setAttribute("aria-expanded", "false");
      button.setAttribute("aria-haspopup", "dialog");
      rail.appendChild(button);
    }
    if (seriesPanel) addPanelButton(seriesPanel, "fr-reader-tools__btn--series", "seriesOpen", "▤");

    if (panel) {
      addPanelButton(panel, "fr-reader-tools__btn--toc", "tocOpen", "≡");
    }

    rail.appendChild(createButton("fr-reader-tools__btn fr-reader-tools__btn--top", "backToTop", "↑", function () {
      var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    }));
    document.body.appendChild(rail);
  }

  ready(function () {
    if (!document.querySelector(".page__content, .archive")) return;
    createProgressBar();
    createFloatingTools();
    updateToolLanguage();
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    document.addEventListener("facereader:ui-language", updateToolLanguage);
  });
})();
