(function () {
  var copy = {
    zh: {
      tocOpen: "打开文章目录",
      tocClose: "关闭文章目录",
      tocLabel: "文章目录",
      backToTop: "返回顶部"
    },
    en: {
      tocOpen: "Open table of contents",
      tocClose: "Close table of contents",
      tocLabel: "Table of contents",
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

  function createButton(className, labelKey, iconClass, onClick) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.dataset.labelKey = labelKey;
    setControlLabel(button, text(labelKey));
    button.innerHTML = "<i class=\"" + iconClass + "\" aria-hidden=\"true\"></i>";
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

  function closeToc(panel) {
    if (!panel.classList.contains("is-open")) return;
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("fr-mobile-toc-open");
    setBackgroundInert(panel, false);

    if (panel._frPreviousFocus && document.contains(panel._frPreviousFocus)) {
      panel._frPreviousFocus.focus();
    }
  }

  function openToc(panel, trigger) {
    panel._frPreviousFocus = trigger || document.activeElement;
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    document.body.classList.add("fr-mobile-toc-open");
    setBackgroundInert(panel, true);

    window.requestAnimationFrame(function () {
      var closeButton = panel.querySelector("button[data-close-toc]");
      if (closeButton) closeButton.focus();
    });
  }

  function updateToolLanguage() {
    document.querySelectorAll("[data-label-key]").forEach(function (control) {
      setControlLabel(control, text(control.dataset.labelKey));
    });

    document.querySelectorAll(".fr-mobile-toc__panel").forEach(function (dialog) {
      dialog.setAttribute("aria-label", text("tocLabel"));
      dialog.setAttribute("lang", currentLanguage() === "en" ? "en" : "zh-CN");
    });
  }

  function createTocPanel(sourceToc) {
    var panel = document.createElement("div");
    panel.className = "fr-mobile-toc";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = [
      "<div class=\"fr-mobile-toc__shade\" data-close-toc></div>",
      "<aside class=\"fr-mobile-toc__panel\" role=\"dialog\" aria-modal=\"true\" tabindex=\"-1\">",
      "<button class=\"fr-mobile-toc__close\" type=\"button\" data-close-toc data-label-key=\"tocClose\"><i class=\"fas fa-times\" aria-hidden=\"true\"></i></button>",
      "<div class=\"fr-mobile-toc__body\"></div>",
      "</aside>"
    ].join("");

    var clone = sourceToc.cloneNode(true);
    panel.querySelector(".fr-mobile-toc__body").appendChild(clone);
    panel.addEventListener("click", function (event) {
      if (event.target.closest("[data-close-toc]") || event.target.closest(".toc a")) {
        closeToc(panel);
      }
    });
    panel.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeToc(panel);
        return;
      }

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

    var toc = document.querySelector("nav.toc");
    var panel = toc ? createTocPanel(toc) : null;
    var rail = document.createElement("div");
    rail.className = "fr-reader-tools";

    if (panel) {
      rail.appendChild(createButton("fr-reader-tools__btn fr-reader-tools__btn--toc", "tocOpen", "fas fa-list-ul", function () {
        openToc(panel, this);
      }));
    }

    rail.appendChild(createButton("fr-reader-tools__btn fr-reader-tools__btn--top", "backToTop", "fas fa-arrow-up", function () {
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
