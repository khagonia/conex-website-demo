/* ============================================================
   Conex Prime — scroll motion (GSAP + ScrollTrigger)
   Restrained entrances, staggered grids, light parallax,
   one pinned band on desktop. Reduced-motion safe.
   ============================================================ */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Fallback: if GSAP failed to load (or reduced motion), reveal everything.
  if (!window.gsap || !window.ScrollTrigger || reduceMotion) {
    document.documentElement.classList.remove("js");
    return;
  }

  gsap.registerPlugin(ScrollTrigger);

  /* ---------- Hero intro ---------- */
  gsap.from(".hero__content [data-hero]", {
    y: 34,
    autoAlpha: 0,
    duration: 0.9,
    ease: "power3.out",
    stagger: 0.12,
    delay: 0.1
  });

  /* ---------- Hero video parallax on scroll ---------- */
  gsap.fromTo(".hero__video",
    { yPercent: -6, scale: 1.12 },
    {
      yPercent: 6,
      scale: 1.12,
      ease: "none",
      scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true }
    }
  );

  /* ---------- Batched section reveals ---------- */
  gsap.set(".reveal", { opacity: 0, y: 26 });
  ScrollTrigger.batch(".reveal", {
    start: "top 86%",
    onEnter: function (batch) {
      gsap.to(batch, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out",
        stagger: 0.09,
        overwrite: true
      });
    }
  });

  /* ---------- Light parallax on band media ---------- */
  document.querySelectorAll("[data-parallax]").forEach(function (el) {
    var amt = parseFloat(el.getAttribute("data-parallax")) || 10;
    var section = el.closest("section") || el;
    gsap.fromTo(el,
      { yPercent: -amt / 2, scale: 1.12 },
      {
        yPercent: amt / 2,
        scale: 1.12,
        ease: "none",
        scrollTrigger: { trigger: section, start: "top bottom", end: "bottom top", scrub: true }
      }
    );
  });

  /* ---------- Animated counters ---------- */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var end = parseFloat(el.getAttribute("data-count")) || 0;
    var obj = { v: 0 };
    ScrollTrigger.create({
      trigger: el,
      start: "top 92%",
      once: true,
      onEnter: function () {
        gsap.to(obj, {
          v: end,
          duration: 1.6,
          ease: "power2.out",
          onUpdate: function () { el.textContent = Math.round(obj.v).toLocaleString(); }
        });
      }
    });
  });

  /* ---------- Desktop-only touches ---------- */
  var mm = gsap.matchMedia();
  mm.add("(min-width: 900px)", function () {
    // Capability media gentle in-place drift.
    document.querySelectorAll(".capability").forEach(function (sec) {
      var img = sec.querySelector(".capability__media img");
      if (!img) return;
      gsap.fromTo(img,
        { yPercent: -7 },
        {
          yPercent: 7,
          ease: "none",
          scrollTrigger: { trigger: sec, start: "top bottom", end: "bottom top", scrub: true }
        }
      );
    });
  });

  /* ---------- Refresh after load ---------- */
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
})();
