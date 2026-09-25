(function () {
  var nav = document.querySelector("nav.greedy-nav");
  if (!nav) return;

  var visible = nav.querySelector(".visible-links");
  var hidden = nav.querySelector(".hidden-links");
  var toggle = nav.querySelector(".greedy-nav__toggle");
  var originalItems = Array.prototype.slice.call(visible.children).concat(Array.prototype.slice.call(hidden.children));
  var scheduled = false;

  function width(element) {
    if (!element) return 0;
    var style = window.getComputedStyle(element);
    return element.getBoundingClientRect().width + parseFloat(style.marginLeft || 0) + parseFloat(style.marginRight || 0);
  }

  function layout() {
    scheduled = false;
    // The bundled GreedyNav can move items on resize. Restore source order before
    // measuring the translated labels; their widths change with UI language.
    originalItems.forEach(function (item) { visible.appendChild(item); });
    toggle.classList.remove("hidden");
    var toggleWidth = width(toggle);
    var fixedWidth = width(nav.querySelector(".site-logo")) + width(nav.querySelector(".site-title")) +
      width(nav.querySelector(".masthead-language-switcher")) + width(nav.querySelector(".search__toggle"));
    var available = Math.max(0, nav.clientWidth - fixedWidth - toggleWidth - 2);
    var used = 0;
    var visibleCount = 0;

    originalItems.forEach(function (item, index) {
      var itemWidth = width(item);
      if (visibleCount === index && used + itemWidth <= available) {
        used += itemWidth;
        visibleCount += 1;
      } else {
        hidden.appendChild(item);
      }
    });

    if (visibleCount === originalItems.length) {
      toggle.classList.add("hidden");
    }
    toggle.setAttribute("count", String(originalItems.length - visibleCount));
    if (visibleCount === originalItems.length) {
      hidden.classList.add("hidden");
      hidden.setAttribute("aria-hidden", "true");
      toggle.classList.remove("close");
      toggle.setAttribute("aria-expanded", "false");
    }
  }

  function schedule() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(layout);
  }

  document.addEventListener("facereader:ui-language", schedule);
  window.addEventListener("resize", schedule);
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", schedule);
  else schedule();
})();
