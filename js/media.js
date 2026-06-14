/* ============================================================
   media.js — media components (§5.2–5.4)
   Registers three components against the Portfolio contract:
     • "youtube"  → click-to-load facade  (§5.2)
     • "video"    → lazy self-hosted <video> (§5.3)
     • "gallery"  → image pair + lightbox (§5.4)
   ============================================================ */
(function () {
  "use strict";
  if (!window.Portfolio) return;

  /* ---------- small helpers ---------- */
  function ce(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
  function playIcon() {
    return '<svg class="play-glyph" viewBox="0 0 24 24" aria-hidden="true">' +
           '<path d="M8 5.5v13l11-6.5z"></path></svg>';
  }
  // Accept a raw 11-char ID or any common YouTube URL form.
  function ytId(raw) {
    if (!raw) return "";
    raw = raw.trim();
    if (/^[\w-]{11}$/.test(raw)) return raw;
    var m = raw.match(/(?:youtu\.be\/|v=|\/embed\/|\/shorts\/)([\w-]{11})/);
    return m ? m[1] : raw;
  }

  /* ============================================================
     5.2 — YouTube facade
     <div data-component="youtube" data-yt="ID|URL" [data-poster="…"]
          [data-title="…"]></div>
     ============================================================ */
  function mountYouTube(el) {
    var id = ytId(el.getAttribute("data-yt"));
    var poster = el.getAttribute("data-poster");
    var title = el.getAttribute("data-title") || "Play video";
    el.classList.add("yt");

    var btn = ce("button", "yt__btn");
    btn.type = "button";
    btn.setAttribute("aria-label", title);
    if (poster) {
      btn.style.backgroundImage = "url('" + poster + "')";
    } else if (id) {
      // Fall back to YouTube's hosted thumbnail.
      btn.style.backgroundImage =
        "url('https://i.ytimg.com/vi/" + id + "/hqdefault.jpg')";
    }
    btn.innerHTML = '<span class="play-btn">' + playIcon() + "</span>";
    el.innerHTML = "";
    el.appendChild(btn);

    function activate() {
      if (!id) return;
      var iframe = ce("iframe", "yt__frame");
      iframe.title = title;
      iframe.allow =
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share";
      iframe.setAttribute("allowfullscreen", "");
      iframe.src =
        "https://www.youtube-nocookie.com/embed/" + id +
        "?autoplay=1&rel=0&modestbranding=1&playsinline=1";
      el.innerHTML = "";
      el.appendChild(iframe);
      el.classList.add("is-active");
    }
    btn.addEventListener("click", activate);
  }

  /* ============================================================
     5.3 — Self-hosted video (lazy <video>)
     <div data-component="video" data-lazy data-video="…mp4"
          [data-poster="…"]></div>
     ============================================================ */
  function mountVideo(el) {
    var src = el.getAttribute("data-video");
    var poster = el.getAttribute("data-poster");
    var label = el.getAttribute("aria-label") || "Video";
    if (!src) return;
    el.classList.add("videoc");

    var v = ce("video", "videoc__el");
    v.controls = true;
    v.preload = "none";              // nothing fetched until lazy-activated
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("controlslist", "nodownload");
    if (poster) v.poster = poster;
    v.setAttribute("aria-label", label);
    el.innerHTML = "";
    el.appendChild(v);

    // A poster-overlay play button for an obvious affordance.
    var btn = ce("button", "videoc__play");
    btn.type = "button";
    btn.setAttribute("aria-label", "Play video");
    btn.innerHTML = '<span class="play-btn">' + playIcon() + "</span>";
    el.appendChild(btn);
    btn.addEventListener("click", function () {
      v.preload = "auto";
      v.play();
    });
    v.addEventListener("play", function () { el.classList.add("is-playing"); });
    v.addEventListener("pause", function () { el.classList.remove("is-playing"); });

    // Lazy: attach the source only when scrolled into the active view.
    Portfolio.lazy(el, function () {
      var s = ce("source");
      s.src = src;
      s.type = "video/mp4";
      v.appendChild(s);
      v.preload = "metadata";
      v.load();
    });
  }

  /* ============================================================
     5.4 — Image gallery + lightbox
     <div data-component="gallery"><figure><img src data-full></figure>…</div>
     ============================================================ */
  var lb = null; // shared lightbox singleton

  function buildLightbox() {
    if (lb) return lb;
    var root = ce("div", "lightbox");
    root.setAttribute("role", "dialog");
    root.setAttribute("aria-modal", "true");
    root.setAttribute("aria-label", "Image viewer");
    root.hidden = true;
    root.innerHTML =
      '<div class="lightbox__backdrop" data-close></div>' +
      '<figure class="lightbox__stage">' +
        '<img class="lightbox__img" alt="">' +
        '<figcaption class="lightbox__cap" aria-hidden="true"></figcaption>' +
      '</figure>' +
      '<button class="lightbox__btn lightbox__close" type="button" aria-label="Close (Esc)" data-close>✕</button>' +
      '<button class="lightbox__btn lightbox__prev" type="button" aria-label="Previous image">‹</button>' +
      '<button class="lightbox__btn lightbox__next" type="button" aria-label="Next image">›</button>';
    document.body.appendChild(root);

    lb = {
      root: root,
      img: root.querySelector(".lightbox__img"),
      cap: root.querySelector(".lightbox__cap"),
      prev: root.querySelector(".lightbox__prev"),
      next: root.querySelector(".lightbox__next"),
      closeBtn: root.querySelector(".lightbox__close"),
      items: [], index: 0, lastFocus: null
    };

    function show(i) {
      lb.index = (i + lb.items.length) % lb.items.length;
      var it = lb.items[lb.index];
      lb.img.src = it.full;
      lb.img.alt = it.alt || "";
      lb.cap.textContent = it.alt || "";
      lb.cap.hidden = !it.alt;
      var multi = lb.items.length > 1;
      lb.prev.hidden = lb.next.hidden = !multi;
    }
    function open(items, i) {
      lb.items = items;
      lb.lastFocus = document.activeElement;
      root.hidden = false;
      document.body.classList.add("lb-open");
      show(i);
      lb.closeBtn.focus();
      document.addEventListener("keydown", onKey, true);
    }
    function close() {
      root.hidden = true;
      document.body.classList.remove("lb-open");
      lb.img.removeAttribute("src");
      document.removeEventListener("keydown", onKey, true);
      if (lb.lastFocus && lb.lastFocus.focus) lb.lastFocus.focus();
    }
    function onKey(e) {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if (e.key === "ArrowRight") { e.preventDefault(); show(lb.index + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); show(lb.index - 1); }
      else if (e.key === "Tab") {
        // simple focus trap among the visible controls
        var f = [lb.closeBtn, lb.prev, lb.next].filter(function (b) { return !b.hidden; });
        var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    }

    lb.prev.addEventListener("click", function () { show(lb.index - 1); });
    lb.next.addEventListener("click", function () { show(lb.index + 1); });
    Array.prototype.forEach.call(root.querySelectorAll("[data-close]"), function (b) {
      b.addEventListener("click", close);
    });
    lb.open = open;
    return lb;
  }

  function mountGallery(el) {
    el.classList.add("gallery");
    var figs = el.querySelectorAll("img");
    var items = Array.prototype.map.call(figs, function (img) {
      return { full: img.getAttribute("data-full") || img.src, alt: img.alt };
    });
    el.classList.toggle("gallery--single", items.length < 2);

    Array.prototype.forEach.call(figs, function (img, i) {
      img.style.cursor = "zoom-in";
      img.setAttribute("tabindex", "0");
      img.setAttribute("role", "button");
      img.setAttribute("aria-label", (img.alt || "Image") + " — enlarge");
      function go() { buildLightbox().open(items, i); }
      img.addEventListener("click", go);
      img.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); }
      });
    });
  }

  /* ============================================================
     Slide show — cycle a set of <img> with themed dots + arrows
     <div data-component="slideshow"><img ...><img ...></div>
     ============================================================ */
  function mountSlideshow(el) {
    el.classList.add("slideshow");
    var imgs = Array.prototype.slice.call(el.querySelectorAll("img"));
    var n = imgs.length;
    if (!n) return;

    var vp = ce("div", "slideshow__viewport");
    var slides = imgs.map(function (img, i) {
      var fig = ce("figure", "slide");
      if (i === 0) fig.classList.add("is-active");
      img.loading = "lazy";
      img.decoding = "async";
      fig.appendChild(img);
      vp.appendChild(fig);
      return fig;
    });

    var nav = ce("div", "slideshow__nav");
    var prev = ce("button", "slideshow__arrow");
    prev.type = "button"; prev.setAttribute("aria-label", "Previous image");
    prev.innerHTML = '<span aria-hidden="true">‹</span>';
    var next = ce("button", "slideshow__arrow");
    next.type = "button"; next.setAttribute("aria-label", "Next image");
    next.innerHTML = '<span aria-hidden="true">›</span>';
    var dotsWrap = ce("div", "slideshow__dots");
    var dots = imgs.map(function (_, i) {
      var d = ce("button", "slideshow__dot");
      d.type = "button"; d.setAttribute("aria-label", "Show image " + (i + 1) + " of " + n);
      d.addEventListener("click", function () { show(i); });
      dotsWrap.appendChild(d);
      return d;
    });
    nav.appendChild(prev); nav.appendChild(dotsWrap); nav.appendChild(next);

    el.innerHTML = "";
    el.appendChild(vp);
    el.appendChild(nav);

    var idx = 0;
    function show(i) {
      idx = (i + n) % n;
      slides.forEach(function (s, j) { s.classList.toggle("is-active", j === idx); });
      dots.forEach(function (d, j) {
        d.classList.toggle("is-active", j === idx);
        if (j === idx) d.setAttribute("aria-current", "true");
        else d.removeAttribute("aria-current");
      });
    }
    prev.addEventListener("click", function () { show(idx - 1); });
    next.addEventListener("click", function () { show(idx + 1); });
    el.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") { e.preventDefault(); show(idx - 1); }
      else if (e.key === "ArrowRight") { e.preventDefault(); show(idx + 1); }
    });
    show(0);
  }

  Portfolio.register("youtube", mountYouTube);
  Portfolio.register("video", mountVideo);
  Portfolio.register("gallery", mountGallery);
  Portfolio.register("slideshow", mountSlideshow);
})();
