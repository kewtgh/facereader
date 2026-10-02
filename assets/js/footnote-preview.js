(function () {
  var references = Array.prototype.slice.call(document.querySelectorAll(
    '.page__content a.footnote[rel="footnote"][href^="#"]'
  ));
  if (!references.length) return;

  var preview = document.createElement("div");
  preview.className = "fr-footnote-preview";
  preview.id = "fr-footnote-preview";
  preview.setAttribute("role", "tooltip");
  preview.hidden = true;
  preview.innerHTML = '<span class="fr-footnote-preview__label"></span><div class="fr-footnote-preview__content"></div>';
  document.body.appendChild(preview);

  var activeReference = null;
  var hideTimer = null;

  function cancelHide() {
    if (hideTimer !== null) window.clearTimeout(hideTimer);
    hideTimer = null;
  }

  function hide() {
    cancelHide();
    if (activeReference) {
      var descriptions = (activeReference.getAttribute("aria-describedby") || "")
        .split(/\s+/).filter(function (id) { return id && id !== preview.id; });
      if (descriptions.length) activeReference.setAttribute("aria-describedby", descriptions.join(" "));
      else activeReference.removeAttribute("aria-describedby");
    }
    activeReference = null;
    preview.hidden = true;
  }

  function scheduleHide() {
    cancelHide();
    hideTimer = window.setTimeout(function () {
      if (activeReference && document.activeElement === activeReference) return;
      hide();
    }, 140);
  }

  function noteFor(reference) {
    var id;
    try { id = decodeURIComponent(reference.hash.slice(1)); }
    catch (error) { return null; }
    var note = document.getElementById(id);
    return note && note.matches(".footnotes li") ? note : null;
  }

  function position() {
    if (!activeReference || preview.hidden) return;
    var anchor = activeReference.getBoundingClientRect();
    var box = preview.getBoundingClientRect();
    var margin = 12;
    var left = anchor.left + anchor.width / 2 - box.width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - box.width - margin));
    var below = anchor.bottom + 10;
    var above = anchor.top - box.height - 10;
    var top = below + box.height <= window.innerHeight - margin ? below : above;
    top = Math.max(margin, Math.min(top, window.innerHeight - box.height - margin));
    preview.style.left = left + "px";
    preview.style.top = top + "px";
  }

  function show(reference) {
    cancelHide();
    var note = noteFor(reference);
    if (!note) { hide(); return; }
    if (activeReference !== reference) hide();

    var content = document.createElement("div");
    Array.prototype.forEach.call(note.childNodes, function (node) {
      content.appendChild(node.cloneNode(true));
    });
    content.querySelectorAll(".reversefootnote, [role='doc-backlink']").forEach(function (backlink) {
      backlink.remove();
    });
    content.querySelectorAll("[id]").forEach(function (element) { element.removeAttribute("id"); });
    // The original footnote remains the place to follow links. The preview is read-only.
    content.querySelectorAll("a").forEach(function (link) {
      link.replaceWith(document.createTextNode(link.textContent));
    });

    var english = document.documentElement.getAttribute("data-fr-ui-lang") === "en";
    preview.querySelector(".fr-footnote-preview__label").textContent =
      (english ? "Note " : "注释 ") + reference.textContent.trim();
    preview.querySelector(".fr-footnote-preview__content").replaceChildren(content);
    activeReference = reference;
    var descriptions = (reference.getAttribute("aria-describedby") || "").split(/\s+/).filter(Boolean);
    if (descriptions.indexOf(preview.id) === -1) descriptions.push(preview.id);
    reference.setAttribute("aria-describedby", descriptions.join(" "));
    preview.hidden = false;
    position();
  }

  references.forEach(function (reference) {
    reference.addEventListener("pointerenter", function (event) {
      if (event.pointerType !== "touch") show(reference);
    });
    reference.addEventListener("pointerleave", scheduleHide);
    reference.addEventListener("focus", function () { show(reference); });
    reference.addEventListener("blur", scheduleHide);
  });
  preview.addEventListener("pointerenter", cancelHide);
  preview.addEventListener("pointerleave", scheduleHide);
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && activeReference) hide();
  });
  window.addEventListener("scroll", position, { passive: true });
  window.addEventListener("resize", position);
  document.addEventListener("facereader:ui-language", function () {
    if (activeReference) show(activeReference);
  });
})();
