(function () {
  function ready(fn) {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn);
    else fn();
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

  function createButton(className, label, iconClass, onClick) {
    var button = document.createElement("button");
    button.type = "button";
    button.className = className;
    button.setAttribute("aria-label", label);
    button.title = label;
    button.innerHTML = "<i class=\"" + iconClass + "\" aria-hidden=\"true\"></i>";
    button.addEventListener("click", onClick);
    return button;
  }

  function createTocPanel(sourceToc) {
    var panel = document.createElement("div");
    panel.className = "fr-mobile-toc";
    panel.setAttribute("aria-hidden", "true");
    panel.innerHTML = [
      "<div class=\"fr-mobile-toc__shade\" data-close-toc></div>",
      "<aside class=\"fr-mobile-toc__panel\" role=\"dialog\" aria-modal=\"true\" aria-label=\"文章目录\">",
      "<button class=\"fr-mobile-toc__close\" type=\"button\" data-close-toc aria-label=\"关闭目录\"><i class=\"fas fa-times\" aria-hidden=\"true\"></i></button>",
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
    document.body.appendChild(panel);
    return panel;
  }

  function openToc(panel) {
    panel.classList.add("is-open");
    panel.setAttribute("aria-hidden", "false");
    document.body.classList.add("fr-mobile-toc-open");
  }

  function closeToc(panel) {
    panel.classList.remove("is-open");
    panel.setAttribute("aria-hidden", "true");
    document.body.classList.remove("fr-mobile-toc-open");
  }

  function createFloatingTools() {
    if (document.querySelector(".fr-reader-tools")) return;

    var toc = document.querySelector("nav.toc");
    var panel = toc ? createTocPanel(toc) : null;
    var rail = document.createElement("div");
    rail.className = "fr-reader-tools";

    if (panel) {
      rail.appendChild(createButton("fr-reader-tools__btn fr-reader-tools__btn--toc", "打开目录", "fas fa-list-ul", function () {
        openToc(panel);
      }));
    }

    rail.appendChild(createButton("fr-reader-tools__btn fr-reader-tools__btn--top", "返回顶部", "fas fa-arrow-up", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }));
    document.body.appendChild(rail);
  }

  ready(function () {
    if (!document.querySelector(".page__content, .archive")) return;
    createProgressBar();
    createFloatingTools();
    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
  });
})();
