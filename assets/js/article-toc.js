(function () {
  var selector = '.fr-article-toc__nav a[href^="#"], .fr-article-toc-mobile a[href^="#"]';
  var pairs = [];
  var current = null;
  var observer;
  var scheduled = false;

  function activate(pair) {
    pairs.forEach(function (entry) {
      var active = entry.heading === pair.heading;
      entry.link.classList.toggle("is-active", active);
      if (active) entry.link.setAttribute("aria-current", "true");
      else entry.link.removeAttribute("aria-current");
    });
    var desktop = pairs.find(function (entry) {
      return entry.heading === pair.heading && entry.link.closest(".fr-article-toc");
    });
    if (!desktop) return;
    var rail = desktop.link.closest(".fr-article-toc");
    if (!rail.getClientRects().length) return;
    var bounds = rail.getBoundingClientRect();
    var linkBounds = desktop.link.getBoundingClientRect();
    if (linkBounds.top < bounds.top + 16 || linkBounds.bottom > bounds.bottom - 16) {
      rail.scrollBy({ top: linkBounds.top - bounds.top - rail.clientHeight / 3,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    }
  }

  function update() {
    scheduled = false;
    var visible = pairs.filter(function (pair) { return pair.heading.getClientRects().length; });
    if (!visible.length) return;
    var header = document.querySelector(".masthead");
    var offset = (header ? header.getBoundingClientRect().height : 64) + 24;
    var next = visible[0];
    visible.forEach(function (pair) {
      if (pair.heading.getBoundingClientRect().top <= offset) next = pair;
    });
    if (current !== next.heading) { current = next.heading; activate(next); }
  }
  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(update);
  }
  function rebuild() {
    if (observer) observer.disconnect();
    current = null;
    pairs = Array.from(document.querySelectorAll(selector)).map(function (link) {
      link.classList.remove("is-active");
      link.removeAttribute("aria-current");
      var heading;
      try { heading = document.getElementById(decodeURIComponent(link.hash.slice(1))); }
      catch (error) { return null; }
      return heading && !link.hidden ? { link: link, heading: heading } : null;
    }).filter(Boolean);
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(schedule, { rootMargin: "0px 0px -60% 0px" });
      pairs.forEach(function (pair) { observer.observe(pair.heading); });
    }
    schedule();
  }
  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  document.addEventListener("facereader:ui-language", rebuild);
  rebuild();
})();
