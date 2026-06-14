/* ============================================================
   pdf-viewer.js — embedded PDF viewer component (§5.1)
   Contract: <div data-component="pdf" data-lazy
                  data-pdf="assets/pdf/x.pdf" [data-caption="…"]></div>
   - Native-first: <iframe> with PDF Open Parameters (chrome hidden).
   - Lazy: real iframe injected only when the quadrant scrolls into
     view AND its view is active (via Portfolio.lazy).
   - Scroll-through works natively; a quiet "Open PDF ↗" affordance is
     always available as a fallback (some mobile browsers won't inline).
   - Escalation path (per §5.1): swap the body of loadPdf() to a PDF.js
     renderer behind this same API if a given PDF looks cramped. Native
     is shipped first; no change to callers required.
   ============================================================ */
(function () {
  "use strict";
  if (!window.Portfolio) return;

  // Hide built-in chrome; fit to width; let pages scroll natively.
  var PARAMS = "#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&messages=0&view=FitH";

  function fileLabel(src) {
    try { return decodeURIComponent(src.split("/").pop()); }
    catch (e) { return src.split("/").pop(); }
  }

  function loadPdf(el, src) {
    var label = el.getAttribute("aria-label") || "Embedded PDF";

    var frame = document.createElement("iframe");
    frame.className = "pdfv__frame";
    frame.title = label;
    frame.setAttribute("loading", "lazy");
    frame.src = src + PARAMS;

    // "Open in new tab" affordance — always present, also the fallback
    // route for browsers that refuse to inline PDFs.
    var open = document.createElement("a");
    open.className = "pdfv__open";
    open.href = src;
    open.target = "_blank";
    open.rel = "noopener";
    open.setAttribute("aria-label", "Open " + fileLabel(src) + " in a new tab");
    open.innerHTML = '<span aria-hidden="true">Open&nbsp;PDF ↗</span>';

    el.innerHTML = "";
    el.appendChild(frame);
    el.appendChild(open);
    el.classList.add("is-loaded");
  }

  function mountPdf(el) {
    var src = el.getAttribute("data-pdf");
    if (!src) return;
    el.classList.add("pdfv");

    // Lightweight placeholder until hydration.
    el.innerHTML =
      '<div class="pdfv__placeholder" aria-hidden="true">' +
        '<span class="pdfv__spinner"></span>' +
        '<span class="pdfv__ph-label">Loading document…</span>' +
      '</div>';

    Portfolio.lazy(el, function () { loadPdf(el, src); });
  }

  Portfolio.register("pdf", mountPdf);
})();
