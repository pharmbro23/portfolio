/* ============================================================
   app.js — orchestrator (lead-owned)
   - Hash router (#/, #/clotless, #/anesthesia) with cross-fade
   - Apple-dock interaction state (hover/focus handled in CSS)
   - Shared component contract: window.Portfolio
   ------------------------------------------------------------
   SHARED CONTRACT (components code against this)
   ------------------------------------------------------------
   Markup convention for any media element:
     <div data-component="NAME" data-lazy ...>…</div>
   where NAME is one of: "pdf" | "youtube" | "video" | "gallery".

   A component registers itself synchronously at script-eval time:
     Portfolio.register("pdf", function mount(el){ ... });

   `mount(el)` runs once for every matching element on init. It must
   render the LIGHTWEIGHT placeholder (frame, poster, play glyph) and,
   for anything heavy (iframe/PDF/video), defer the real load via:
     Portfolio.lazy(el, function load(){ ...inject heavy resource... });

   `Portfolio.lazy` hydrates only when the element scrolls into view
   AND its view is active (hidden views never intersect). One-shot.
   ============================================================ */
(function () {
  "use strict";

  var ROUTES = {
    "/":            "view-home",
    "/clotless":    "view-clotless",
    "/anesthesia":  "view-anesthesia"
  };
  var TITLES = {
    "view-home":        "Portfolio — Adrian Tabari",
    "view-clotless":    "CAN-RGX (CLOT-LESS) — Adrian Tabari",
    "view-anesthesia":  "Anesthesia in Microgravity — Adrian Tabari"
  };

  var Portfolio = window.Portfolio = window.Portfolio || {};
  Portfolio.components = Portfolio.components || {};

  /** Register a component mount function under a name. */
  Portfolio.register = function (name, mount) {
    Portfolio.components[name] = mount;
  };

  /* ---- Lazy hydration: one IntersectionObserver for all media ---- */
  var lazyJobs = new WeakMap();
  var io = null;
  if ("IntersectionObserver" in window) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        io.unobserve(el);
        var job = lazyJobs.get(el);
        if (job) { lazyJobs.delete(el); el.removeAttribute("data-lazy"); job(); }
      });
    }, { rootMargin: "200px 0px", threshold: 0.01 });
  }

  /** Defer a heavy load until `el` is visible (or immediately as fallback). */
  Portfolio.lazy = function (el, load) {
    if (io) { lazyJobs.set(el, load); io.observe(el); }
    else { el.removeAttribute("data-lazy"); load(); }
  };

  /* ---- Mount all declared components once (placeholders only) ---- */
  function mountComponents(root) {
    var nodes = (root || document).querySelectorAll("[data-component]");
    Array.prototype.forEach.call(nodes, function (el) {
      if (el.dataset.mounted) return;
      var mount = Portfolio.components[el.dataset.component];
      if (typeof mount === "function") {
        el.dataset.mounted = "1";
        try { mount(el); }
        catch (e) { if (window.console) console.error("mount failed:", el, e); }
      }
    });
  }
  Portfolio.mountComponents = mountComponents;

  /* ============================================================
     Router
     ============================================================ */
  var views, dockItems, mainEl, currentId = null;

  function routeFromHash() {
    var h = (location.hash || "").replace(/^#/, "");
    if (h === "" || h === "/") return "/";
    return ROUTES.hasOwnProperty(h) ? h : "/";
  }

  function setActiveDock(viewId) {
    Array.prototype.forEach.call(dockItems, function (a) {
      var isCur = a.getAttribute("data-target") === viewId;
      if (isCur) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function swap(viewId, focusView) {
    Array.prototype.forEach.call(views, function (v) {
      v.classList.toggle("is-active", v.id === viewId);
    });
    document.title = TITLES[viewId] || TITLES["view-home"];
    setActiveDock(viewId);
    currentId = viewId;
    var active = document.getElementById(viewId);
    if (active) {
      active.setAttribute("tabindex", "-1");
      // Only pull focus on user-initiated navigation — never on first paint
      // (auto-focusing a region on load is a screen-reader anti-pattern).
      if (focusView) active.focus({ preventScroll: true });
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }

  function navigate(viewId, animate, focusView) {
    if (viewId === currentId) return;
    var reduce = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduce || currentId === null) { swap(viewId, focusView); return; }
    mainEl.classList.add("is-switching");
    window.setTimeout(function () {
      swap(viewId, focusView);
      mainEl.classList.remove("is-switching");
    }, 150);
  }

  function onHashChange() {
    var h = (location.hash || "").replace(/^#/, "");
    // Ignore in-page anchors / unknown fragments (e.g. #main from the skip
    // link) so they don't get redirected to Home by the router.
    if (h !== "" && h !== "/" && !ROUTES.hasOwnProperty(h)) return;
    navigate(ROUTES[routeFromHash()], true, true);
  }

  /* ============================================================
     Init
     ============================================================ */
  function init() {
    mainEl    = document.getElementById("main");
    views     = document.querySelectorAll(".view");
    dockItems = document.querySelectorAll("[data-target]");

    mountComponents(document);

    // Initial view (no animation, no focus-steal on first paint).
    var route = routeFromHash();
    navigate(ROUTES[route], false, false);

    // Skip link: move focus into the *current* view without touching the hash.
    var skip = document.querySelector(".skip-link");
    if (skip) {
      skip.addEventListener("click", function (e) {
        e.preventDefault();
        var v = document.getElementById(currentId);
        if (v) { v.setAttribute("tabindex", "-1"); v.focus(); }
      });
    }

    window.addEventListener("hashchange", onHashChange);

    // Normalise bare "#" / empty hash to "#/" for clean deep-links.
    if (!location.hash || location.hash === "#") {
      if (history.replaceState) history.replaceState(null, "", "#/");
    }
  }

  // NOTE: these scripts load with `defer`, so when app.js executes the
  // readyState is already "interactive" and the component scripts
  // (pdf-viewer.js, media.js) have NOT registered yet. DOMContentLoaded
  // fires only after all deferred scripts run — so wait for it unless the
  // document is already fully "complete".
  if (document.readyState === "complete") {
    init();
  } else {
    document.addEventListener("DOMContentLoaded", init);
  }
})();
