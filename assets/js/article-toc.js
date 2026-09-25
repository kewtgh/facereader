(function () {
  var nav = document.querySelector(".fr-article-toc__nav");
  if (!nav) return;
  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var pairs = links.map(function (link) {
    var id;
    try { id = decodeURIComponent(link.hash.slice(1)); }
    catch (error) { return null; }
    var heading = document.getElementById(id);
    return heading ? { link: link, heading: heading } : null;
  }).filter(Boolean);
  if (!pairs.length) return;

  function activate(pair) {
    pairs.forEach(function (entry) {
      var active = entry === pair;
      entry.link.classList.toggle("is-active", active);
      if (active) entry.link.setAttribute("aria-current", "true");
      else entry.link.removeAttribute("aria-current");
    });
    var rail = nav.closest(".fr-article-toc");
    if (!rail) return;
    var bounds = rail.getBoundingClientRect();
    var linkBounds = pair.link.getBoundingClientRect();
    if (linkBounds.top < bounds.top + 16 || linkBounds.bottom > bounds.bottom - 16) {
      rail.scrollBy({
        top: linkBounds.top - bounds.top - rail.clientHeight / 3,
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth"
      });
    }
  }

  var current = pairs[0];
  activate(current);
  var observer = new IntersectionObserver(function () {
    var next = pairs[0];
    pairs.forEach(function (pair) {
      if (pair.heading.getBoundingClientRect().top <= 160) next = pair;
    });
    if (next !== current) {
      current = next;
      activate(current);
    }
  }, { rootMargin: "-145px 0px -65% 0px" });
  pairs.forEach(function (pair) { observer.observe(pair.heading); });
  links.forEach(function (link) {
    link.addEventListener("click", function () {
      var pair = pairs.find(function (entry) { return entry.link === link; });
      if (pair) activate(pair);
    });
  });
})();
