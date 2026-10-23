(function () {
  var copy = {
    zh: {
      tocOpen: "打开文章目录",
      tocClose: "关闭文章目录",
      tocLabel: "文章目录",
      seriesOpen: "打开专题文章列表",
      seriesClose: "关闭专题文章列表",
      seriesLabel: "专题文章",
      navigationOpen: "打开阅读导航",
      navigationClose: "关闭阅读导航",
      navigationLabel: "阅读导航",
      backToTop: "返回顶部"
    },
    en: {
      tocOpen: "Open table of contents",
      tocClose: "Close table of contents",
      tocLabel: "Table of contents",
      seriesOpen: "Open series articles",
      seriesClose: "Close series articles",
      seriesLabel: "Series articles",
      navigationOpen: "Open reading navigation",
      navigationClose: "Close reading navigation",
      navigationLabel: "Reading navigation",
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

    var content = document.querySelector(".fr-article .page__content");
    if (!content) return;
    var bounds = content.getBoundingClientRect();
    var start = bounds.top + window.scrollY;
    var scrollable = content.offsetHeight - window.innerHeight;
    var value = scrollable > 0 ? Math.min(1, Math.max(0, (window.scrollY - start) / scrollable)) : (bounds.bottom <= window.innerHeight ? 1 : 0);
    bar.style.transform = "scaleX(" + value + ")";
  }

  function updateToolPosition() {
    var rail = document.querySelector(".fr-reader-tools");
    var footer = document.getElementById("footer");
    if (!rail || !footer) return;
    var overlap = Math.max(0, Math.ceil(window.innerHeight - footer.getBoundingClientRect().top));
    var bottom = overlap ? "calc(1rem + " + overlap + "px + env(safe-area-inset-bottom, 0px))" : "";
    if (rail.style.bottom !== bottom) rail.style.bottom = bottom;
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
      return element.tabIndex >= 0 && element.getClientRects().length && !element.hidden && !element.closest('[hidden]') && element.getAttribute("aria-hidden") !== "true";
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
    if (panel._frSelectTab) panel._frSelectTab("toc");
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
      var activeLink = Array.prototype.find.call(panel.querySelectorAll('a[aria-current]'), function (link) { return !link.closest('[hidden]'); });
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
    document.querySelectorAll('[data-tab-label]').forEach(function (tab) {
      tab.textContent = text(tab.dataset.tabLabel);
    });
    document.querySelectorAll('.fr-navigation-tabs').forEach(function (tabs) {
      tabs.setAttribute('aria-label', text('navigationLabel'));
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
      if (event.target.closest(".fr-series-list a[href]")) {
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

  function addNavigationTabs(panel, seriesSource) {
    var body = panel.querySelector('.fr-mobile-toc__body');
    var tocSection = document.createElement('section');
    tocSection.id = 'fr-navigation-toc';
    tocSection.appendChild(body.firstElementChild);
    var seriesSection = document.createElement('section');
    seriesSection.id = 'fr-navigation-series';
    seriesSection.appendChild(seriesSource.cloneNode(true));
    seriesSection.hidden = true;
    var tabs = document.createElement('div');
    tabs.className = 'fr-navigation-tabs';
    tabs.setAttribute('role', 'tablist');
    tabs.setAttribute('aria-label', text('navigationLabel'));
    var buttons = [];
    var sections = [tocSection, seriesSection];
    ['toc', 'series'].forEach(function (name, index) {
      var tab = document.createElement('button');
      tab.type = 'button';
      tab.id = 'fr-navigation-tab-' + name;
      tab.dataset.tabLabel = name === 'toc' ? 'tocLabel' : 'seriesLabel';
      tab.setAttribute('role', 'tab');
      tab.setAttribute('aria-controls', sections[index].id);
      sections[index].setAttribute('role', 'tabpanel');
      sections[index].setAttribute('aria-labelledby', tab.id);
      tab.addEventListener('click', function () { panel._frSelectTab(name); });
      buttons.push(tab);
      tabs.appendChild(tab);
    });
    panel._frSelectTab = function (name) {
      buttons.forEach(function (tab, index) {
        var selected = index === (name === 'series' ? 1 : 0);
        tab.setAttribute('aria-selected', String(selected));
        tab.tabIndex = selected ? 0 : -1;
        sections[index].hidden = !selected;
      });
      body.scrollTop = 0;
      if (name === 'series') {
        var current = seriesSection.querySelector('[aria-current="page"]');
        if (current && panel.classList.contains('is-open')) current.scrollIntoView({ block: 'nearest' });
      }
    };
    tabs.addEventListener('keydown', function (event) {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      var selected = buttons[0].getAttribute('aria-selected') === 'true' ? 0 : 1;
      var next = event.key === 'Home' ? 0 : event.key === 'End' ? 1 : 1 - selected;
      panel._frSelectTab(next ? 'series' : 'toc');
      buttons[next].focus({ preventScroll: true });
    });
    body.append(tocSection, seriesSection);
    body.before(tabs);
    panel.classList.add('fr-combined-navigation');
    panel._frSelectTab('toc');
  }

  function createFloatingTools() {
    if (document.querySelector(".fr-reader-tools")) return;

    var article = document.body.classList.contains("fr-article");
    var toc = article ? document.querySelector(".fr-article-toc__nav") : document.querySelector("nav.toc");
    var panel = toc && toc.querySelector('.toc__menu a[href^="#"]') ? createTocPanel(toc) : null;
    var seriesTemplate = article && document.getElementById("fr-series-list");
    var seriesSource = seriesTemplate && seriesTemplate.content.querySelector("nav");
    var seriesPanel = seriesSource ? createTocPanel(seriesSource, "series") : null;
    if (panel && seriesSource) addNavigationTabs(panel, seriesSource);
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
    if (panel && seriesSource) rail.classList.add('fr-reader-tools--combined');

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
    function updateNavigationLayout() {
      var mobile = window.matchMedia('(max-width: 63.99em)').matches;
      if (!panel || !seriesSource) return;
      closeToc(panel, false);
      closeToc(seriesPanel, false);
      panel._frSelectTab('toc');
      panel.querySelector('.fr-mobile-toc__panel').dataset.dialogLabel = mobile ? 'navigationLabel' : 'tocLabel';
      panel.querySelector('[data-close-toc].fr-mobile-toc__close').dataset.labelKey = mobile ? 'navigationClose' : 'tocClose';
      rail.querySelector('.fr-reader-tools__btn--toc').dataset.labelKey = mobile ? 'navigationOpen' : 'tocOpen';
      updateToolLanguage();
    }
    window.matchMedia('(max-width: 63.99em)').addEventListener('change', updateNavigationLayout);
    updateNavigationLayout();
  }

  ready(function () {
    if (!document.querySelector(".page__content, .archive")) return;
    if (document.body.classList.contains("fr-article")) createProgressBar();
    createFloatingTools();
    updateToolLanguage();
    function updatePosition() { updateProgress(); updateToolPosition(); }
    updatePosition();
    window.addEventListener("scroll", updatePosition, { passive: true });
    window.addEventListener("resize", updatePosition);
    if (window.ResizeObserver && document.body.classList.contains("fr-article")) {
      new ResizeObserver(updatePosition).observe(document.querySelector(".page__content"));
    }
    document.addEventListener("facereader:ui-language", function () { updateToolLanguage(); updatePosition(); });
  });
})();
