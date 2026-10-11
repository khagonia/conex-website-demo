/* ============================================================
   Conex Prime — main.js
   Header scroll state, mobile nav, hero video, FAQ, project filter
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- Header shadow on scroll ---- */
  var header = document.querySelector(".header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  /* ---- Mobile nav ---- */
  var toggle = document.querySelector(".nav-toggle");
  var mobileNav = document.querySelector(".mobile-nav");
  if (toggle && mobileNav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      mobileNav.classList.toggle("is-open", !open);
    });
    mobileNav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        toggle.setAttribute("aria-expanded", "false");
        mobileNav.classList.remove("is-open");
      }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        toggle.setAttribute("aria-expanded", "false");
        mobileNav.classList.remove("is-open");
      }
    });
  }

  /* ---- Hero video ---- */
  var heroVideo = document.querySelector(".hero__video");
  if (heroVideo) {
    var loadSource = function () {
      var mobile = window.matchMedia("(max-width: 900px)").matches;
      var src = mobile ? heroVideo.dataset.srcMobile : heroVideo.dataset.src;
      if (src && heroVideo.getAttribute("src") !== src) {
        heroVideo.setAttribute("src", src);
        heroVideo.load();
      }
    };

    if (reduceMotion) {
      heroVideo.removeAttribute("autoplay");
      heroVideo.pause();
    } else {
      loadSource();
      heroVideo.play().catch(function () {});

      if ("IntersectionObserver" in window) {
        var vio = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (entry.isIntersecting) { heroVideo.play().catch(function () {}); }
            else { heroVideo.pause(); }
          });
        }, { threshold: 0.15 });
        vio.observe(heroVideo);
      }

      document.addEventListener("visibilitychange", function () {
        if (document.hidden) { heroVideo.pause(); }
        else { heroVideo.play().catch(function () {}); }
      });
    }
  }

  /* ---- FAQ accordion ---- */
  document.querySelectorAll(".accordion__trigger").forEach(function (trigger) {
    trigger.addEventListener("click", function () {
      var panel = trigger.nextElementSibling;
      var expanded = trigger.getAttribute("aria-expanded") === "true";

      // close siblings within same accordion
      var group = trigger.closest(".accordion");
      if (group) {
        group.querySelectorAll(".accordion__trigger").forEach(function (t) {
          if (t !== trigger && t.getAttribute("aria-expanded") === "true") {
            t.setAttribute("aria-expanded", "false");
            t.nextElementSibling.style.maxHeight = null;
          }
        });
      }

      trigger.setAttribute("aria-expanded", String(!expanded));
      panel.style.maxHeight = expanded ? null : panel.scrollHeight + "px";
    });
  });

  /* ---- Project filter ---- */
  var filterBtns = document.querySelectorAll(".filter-btn");
  if (filterBtns.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filter = btn.getAttribute("data-filter");
        filterBtns.forEach(function (b) { b.classList.remove("is-active"); });
        btn.classList.add("is-active");
        document.querySelectorAll("[data-category]").forEach(function (card) {
          var show = filter === "all" || card.getAttribute("data-category") === filter;
          card.style.display = show ? "" : "none";
        });
      });
    });
  }

  /* ---- Projects carousel (continuous drift + controls) ---- */
  document.querySelectorAll("[data-carousel]").forEach(function (carousel) {
    var viewport = carousel.querySelector("[data-carousel-viewport]");
    var track = carousel.querySelector(".carousel__track");
    var prev = carousel.querySelector("[data-carousel-prev]");
    var next = carousel.querySelector("[data-carousel-next]");
    if (!viewport || !track) return;

    var SPEED = 0.4;              // px per frame @60fps (~24px/s)
    var pos = 0;                  // float accumulator (scrollLeft gets rounded)
    var raf = null;
    var last = null;
    var paused = false;
    var idleTimer = null;

    var halfWidth = function () { return track.scrollWidth / 2; };
    var stepSize = function () {
      var card = track.querySelector(".card");
      var group = track.querySelector(".carousel__group");
      if (!card) return 424;
      var gap = group ? (parseFloat(getComputedStyle(group).columnGap) || 24) : 24;
      return card.getBoundingClientRect().width + gap;
    };

    var tick = function (ts) {
      raf = requestAnimationFrame(tick);
      if (paused) { last = ts; pos = viewport.scrollLeft; return; }
      if (last === null) { last = ts; pos = viewport.scrollLeft; return; }
      var dt = Math.min((ts - last) / 16.6667, 3);
      last = ts;
      pos += SPEED * dt;
      var h = halfWidth();
      if (h > 0) {
        if (pos >= h) { pos -= h; }
        else if (pos < 0) { pos += h; }
      }
      viewport.scrollLeft = pos;
    };

    var play = function () {
      paused = false;
      if (reduceMotion) return;
      if (!raf) { last = null; raf = requestAnimationFrame(tick); }
    };
    var pause = function () { paused = true; };
    var pauseThenResume = function (ms) {
      paused = true;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(play, ms || 1800);
    };

    var go = function (dir) {
      pauseThenResume(1800);
      if (dir < 0 && viewport.scrollLeft < stepSize() / 2) {
        viewport.scrollLeft += halfWidth();
      }
      viewport.scrollBy({ left: dir * stepSize(), behavior: reduceMotion ? "auto" : "smooth" });
    };
    if (prev) prev.addEventListener("click", function () { go(-1); });
    if (next) next.addEventListener("click", function () { go(1); });

    viewport.addEventListener("scroll", function () {
      // Keep the loop seamless if the user drags past a copy boundary.
      if (paused) {
        var h = halfWidth();
        if (h > 0 && viewport.scrollLeft >= h) { viewport.scrollLeft -= h; }
      }
    }, { passive: true });
    carousel.addEventListener("mouseenter", pause);
    carousel.addEventListener("mouseleave", play);
    carousel.addEventListener("focusin", pause);
    carousel.addEventListener("focusout", play);
    viewport.addEventListener("pointerdown", pause);
    window.addEventListener("pointerup", function () { pauseThenResume(1500); });
    viewport.addEventListener("wheel", function () { pauseThenResume(1500); }, { passive: true });
    viewport.addEventListener("touchstart", pause, { passive: true });
    document.addEventListener("visibilitychange", function () {
      if (document.hidden) { pause(); } else { play(); }
    });

    play();
  });

  /* ---- Footer year ---- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();
})();
