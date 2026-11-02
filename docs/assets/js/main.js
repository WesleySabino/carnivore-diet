/* ==========================================================================
   Dieta Carnívora — interacciones y animaciones
   Librerías: GSAP + ScrollTrigger + SplitText (animación), Lenis (scroll suave)
   Todo el contenido es legible sin JavaScript; esto solo añade movimiento.
   ========================================================================== */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = root.classList.contains("reduce");
  var gsap = window.gsap;
  var ST = window.ScrollTrigger;
  var hasGsap = !!(gsap && ST);
  var M = hasGsap && !reduce; // ¿animamos?

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var NS = "http://www.w3.org/2000/svg";

  /* Textos generados por JavaScript, por idioma (<html lang>: es, en, pt-BR). */
  var LANG = (root.lang || "es").slice(0, 2).toLowerCase();
  var I18N = {
    es: {
      locale: "es-ES", close: "Cerrar", menu: "Índice", home: "Inicio", credits: "Créditos",
      table: "Ver como tabla", chart: "Ver como gráfico",
      brainAria: "Gráfico de líneas del volumen cerebral aproximado en la evolución humana",
      brainAxis: "Millones de años atrás", today: "hoy", ape: "Simio antropoide",
      ago: function (n) { return "hace ≈ " + n + " millones de años"; }, ago07: "hace ≈ 700.000 años",
      diets: ["Dieta inicial", "Alta en fibra", "Reducida en fibra", "Sin fibra"],
      symptoms: ["Estreñimiento", "Esfuerzo al evacuar", "Hinchazón", "Sangrado anal", "Dolor"]
    },
    en: {
      locale: "en-US", close: "Close", menu: "Contents", home: "Home", credits: "Credits",
      table: "View as table", chart: "View as chart",
      brainAria: "Line chart of approximate brain volume over human evolution",
      brainAxis: "Million years ago", today: "today", ape: "Anthropoid ape",
      ago: function (n) { return "≈ " + n + " million years ago"; }, ago07: "≈ 700,000 years ago",
      diets: ["Initial diet", "High fiber", "Reduced fiber", "No fiber"],
      symptoms: ["Constipation", "Straining", "Bloating", "Anal bleeding", "Pain"]
    },
    pt: {
      locale: "pt-BR", close: "Fechar", menu: "Índice", home: "Início", credits: "Créditos",
      table: "Ver como tabela", chart: "Ver como gráfico",
      brainAria: "Gráfico de linhas do volume cerebral aproximado na evolução humana",
      brainAxis: "Milhões de anos atrás", today: "hoje", ape: "Símio antropoide",
      ago: function (n) { return "há ≈ " + n + " milhões de anos"; }, ago07: "há ≈ 700 mil anos",
      diets: ["Dieta inicial", "Rica em fibra", "Reduzida em fibra", "Sem fibra"],
      symptoms: ["Constipação", "Esforço para evacuar", "Inchaço", "Sangramento anal", "Dor"]
    }
  };
  var T = I18N[LANG] || I18N.es;

  function svgEl(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function debounce(fn, ms) {
    var t;
    return function () { clearTimeout(t); t = setTimeout(fn, ms); };
  }
  function fmt(v, d) {
    return Number(v).toLocaleString(T.locale, { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  if (hasGsap) {
    var plugins = [ST];
    if (window.SplitText) plugins.push(window.SplitText);
    gsap.registerPlugin.apply(gsap, plugins);
  }

  /* ------------------------------------------------------------------------
     Scroll suave (Lenis) sincronizado con ScrollTrigger
     ------------------------------------------------------------------------ */
  var lenis = null;
  if (M && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ST.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  function scrollToTarget(target, immediate) {
    var offset = target.classList.contains("doubt") ? -80 : 0;
    if (lenis) {
      lenis.scrollTo(target, { offset: offset, immediate: !!immediate, duration: 1.6, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    } else {
      var y = target.getBoundingClientRect().top + window.pageYOffset + offset;
      window.scrollTo({ top: y, behavior: reduce || immediate ? "auto" : "smooth" });
    }
  }

  /* ------------------------------------------------------------------------
     Enlaces internos (índice, mapa, dudas, volver arriba)
     ------------------------------------------------------------------------ */
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = decodeURIComponent(a.getAttribute("href").slice(1));
    var target = id && document.getElementById(id);
    if (!target) return;
    e.preventDefault();
    if (root.classList.contains("menu-open")) closeMenu(false);
    scrollToTarget(target);
    if (history.pushState) history.pushState(null, "", "#" + id);
    if (!target.hasAttribute("tabindex")) target.setAttribute("tabindex", "-1");
    target.focus({ preventScroll: true });
  });

  /* Selector de idioma: guarda la elección (la portada la respeta en lugar
     del idioma del navegador) y abre la otra versión en la misma sección. */
  document.addEventListener("click", function (e) {
    var a = e.target.closest(".lang a[data-lang]");
    if (!a || e.ctrlKey || e.metaKey || e.shiftKey || e.button > 0) return;
    try { localStorage.setItem("dc-lang", a.getAttribute("data-lang")); } catch (err) {}
    if (a.hasAttribute("aria-current")) {
      e.preventDefault();
      if (root.classList.contains("menu-open")) closeMenu();
      return;
    }
    var line = window.innerHeight * 0.3, id = "";
    $$("main section[id], main article[id], main .chapter[id]").forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.height > 0 && r.top <= line && el.id !== "inicio") id = el.id;
    });
    if (window.gtag) {
      gtag("event", "language_switch", {
        from_language: LANG,
        to_language: a.getAttribute("data-lang"),
        section_id: id || "inicio",
        transport_type: "beacon"
      });
    }
    if (id) {
      e.preventDefault();
      window.location.href = a.getAttribute("href") + "#" + id;
    }
  });

  /* ------------------------------------------------------------------------
     Menú / índice
     ------------------------------------------------------------------------ */
  var menu = $("#menu");
  var menuBtn = $(".menu-btn");
  var menuLabel = $(".menu-btn__label");
  var mainEl = $("main");
  var footerEl = $(".site-footer");

  function openMenu() {
    root.classList.add("menu-open");
    menu.removeAttribute("inert");
    mainEl.setAttribute("inert", "");
    footerEl.setAttribute("inert", "");
    menuBtn.setAttribute("aria-expanded", "true");
    menuLabel.textContent = T.close;
    if (lenis) lenis.stop();
    if (M) {
      gsap.fromTo($$(".menu__list li, .menu__foot, .menu__eyebrow, .lang--menu", menu),
        { yPercent: 70, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.9, ease: "expo.out", stagger: 0.045, delay: 0.25, overwrite: true });
    }
    setTimeout(function () { var first = $(".menu__list a", menu); if (first) first.focus({ preventScroll: true }); }, 350);
  }
  function closeMenu(returnFocus) {
    root.classList.remove("menu-open");
    menu.setAttribute("inert", "");
    mainEl.removeAttribute("inert");
    footerEl.removeAttribute("inert");
    menuBtn.setAttribute("aria-expanded", "false");
    menuLabel.textContent = T.menu;
    if (lenis) lenis.start();
    if (returnFocus !== false) menuBtn.focus({ preventScroll: true });
  }
  menuBtn.addEventListener("click", function () {
    if (root.classList.contains("menu-open")) closeMenu(); else openMenu();
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && root.classList.contains("menu-open")) closeMenu();
  });
  menu.setAttribute("data-lenis-prevent", "");

  /* ------------------------------------------------------------------------
     Cabecera: fondo sólido tras el hero, se oculta al bajar, barra de progreso
     ------------------------------------------------------------------------ */
  var header = $(".site-header");
  var hero = $(".hero");
  var lastY = 0;
  function onScroll(y) {
    var h = hero.offsetHeight;
    header.classList.toggle("is-solid", y > h - 90);
    var down = y > lastY + 2;
    var up = y < lastY - 2;
    if (down && y > h) header.classList.add("is-hidden");
    if (up || y < h) header.classList.remove("is-hidden");
    lastY = y;
  }
  if (lenis) {
    lenis.on("scroll", function (l) { onScroll(l.scroll); });
  } else {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { onScroll(window.pageYOffset); ticking = false; });
    }, { passive: true });
  }
  onScroll(window.pageYOffset);

  if (hasGsap) {
    gsap.to(".progress i", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.3 } });

    // Indicador del capítulo actual
    var numEl = $(".site-header__num");
    var nameEl = $(".site-header__name");
    var current = "";
    var setChapter = function (num, name) {
      if (current === num) return;
      current = num;
      if (M) {
        gsap.to([numEl, nameEl], {
          yPercent: -60, opacity: 0, duration: 0.2, ease: "power2.in", overwrite: true,
          onComplete: function () {
            numEl.textContent = num; nameEl.textContent = name;
            gsap.fromTo([numEl, nameEl], { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.35, ease: "power3.out" });
          }
        });
      } else {
        numEl.textContent = num; nameEl.textContent = name;
      }
    };
    ST.create({ trigger: ".hero", start: "top top", end: "bottom 40%", onToggle: function (s) { if (s.isActive) setChapter("00", T.home); } });
    $$(".chapter").forEach(function (ch) {
      ST.create({ trigger: ch, start: "top 40%", end: "bottom 40%", onToggle: function (s) { if (s.isActive) setChapter(ch.dataset.chapter, ch.dataset.title); } });
    });
    ST.create({ trigger: ".finale", start: "top 40%", end: "max", onToggle: function (s) { if (s.isActive) setChapter("✦", T.credits); } });
  }

  /* ------------------------------------------------------------------------
     Preloader + entrada del hero
     ------------------------------------------------------------------------ */
  function showHeroStatic() {
    gsap.set([".hero__eyebrow", ".hero__title", ".hero__author", ".hero__scroll", ".hero__lion"], { visibility: "visible" });
    var pre = $(".preloader");
    if (pre) pre.style.display = "none";
  }

  function intro() {
    var pre = $(".preloader");
    var count = $(".preloader__count span");
    var lion = $(".hero__lion img");
    var counter = { v: 0 };
    var countTween = gsap.to(counter, { v: 88, duration: 1.8, ease: "power2.out", onUpdate: function () { count.textContent = Math.round(counter.v); } });
    var lionReady = new Promise(function (resolve) {
      if (lion.complete && lion.naturalWidth) return resolve();
      lion.addEventListener("load", resolve, { once: true });
      lion.addEventListener("error", resolve, { once: true });
    });
    var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    var minTime = new Promise(function (r) { setTimeout(r, 900); });
    var maxTime = new Promise(function (r) { setTimeout(r, 4000); });

    return Promise.race([Promise.all([lionReady, fontsReady, minTime]), maxTime]).then(function () {
      countTween.kill();
      gsap.set([".hero__eyebrow", ".hero__title", ".hero__author", ".hero__scroll", ".hero__lion"], { visibility: "visible" });
      var split = window.SplitText ? new window.SplitText(".hero__title", { type: "lines,chars", mask: "lines", linesClass: "hl" }) : null;
      var tl = gsap.timeline();
      tl.to(counter, { v: 100, duration: 0.3, ease: "power1.out", onUpdate: function () { count.textContent = Math.round(counter.v); } })
        .to(".preloader__inner", { yPercent: -40, opacity: 0, duration: 0.45, ease: "power2.in" })
        .to(pre, { yPercent: -100, duration: 1.1, ease: "expo.inOut" }, "-=0.1")
        .set(pre, { display: "none" });
      var at = "-=0.6";
      if (split) tl.from(split.chars, { yPercent: 155, rotate: 7, duration: 1.3, ease: "expo.out", stagger: 0.03 }, at);
      else tl.from(".hero__title", { y: 60, opacity: 0, duration: 1.2, ease: "expo.out" }, at);
      tl.from(".hero__lion img", { xPercent: 14, scale: 1.1, opacity: 0, duration: 2, ease: "expo.out" }, "<")
        .from(".hero__eyebrow", { y: 20, opacity: 0, duration: 1, ease: "power3.out" }, "<0.3")
        .fromTo(".hero__author .mark", { backgroundSize: "0% 100%", color: "rgba(255,255,255,0)" }, { backgroundSize: "100% 100%", color: "rgba(255,255,255,1)", duration: 1, ease: "expo.inOut" }, "<0.15")
        .from(".hero__scroll", { y: 12, opacity: 0, duration: 0.8, ease: "power2.out" }, "<0.5");
      return tl;
    });
  }

  /* ------------------------------------------------------------------------
     Brasas del hero (canvas 2D, se detiene fuera de pantalla)
     ------------------------------------------------------------------------ */
  function embers() {
    var canvas = $(".hero__embers");
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext("2d");
    var w = 0, h = 0, raf = 0, running = false;
    var count = window.innerWidth < 700 ? 34 : 72;
    var particles = [];

    // Sprite de brillo pre-renderizado
    var sprite = document.createElement("canvas");
    sprite.width = sprite.height = 64;
    var sctx = sprite.getContext("2d");
    var g = sctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,236,170,1)");
    g.addColorStop(0.25, "rgba(255,170,60,0.9)");
    g.addColorStop(0.6, "rgba(255,80,20,0.25)");
    g.addColorStop(1, "rgba(255,40,0,0)");
    sctx.fillStyle = g;
    sctx.fillRect(0, 0, 64, 64);

    function resize() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function spawn(p, initial) {
      p.x = Math.random() * w;
      p.y = initial ? Math.random() * h : h + 20;
      p.s = Math.random() * 10 + 5;
      p.vy = -(Math.random() * 0.7 + 0.3);
      p.vx = (Math.random() - 0.5) * 0.3;
      p.life = 0;
      p.max = Math.random() * 420 + 260;
      p.ph = Math.random() * Math.PI * 2;
    }
    function frame() {
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.life++; p.ph += 0.07;
        p.x += p.vx + Math.sin(p.life * 0.02 + p.ph) * 0.3;
        p.y += p.vy;
        var t = p.life / p.max;
        if (t >= 1 || p.y < -20) { spawn(p, false); continue; }
        ctx.globalAlpha = Math.sin(Math.PI * t) * (0.55 + 0.45 * Math.sin(p.ph * 1.7));
        ctx.drawImage(sprite, p.x - p.s / 2, p.y - p.s / 2, p.s, p.s);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    function start() { if (running) return; running = true; raf = requestAnimationFrame(frame); }
    function stop() { running = false; cancelAnimationFrame(raf); }

    resize();
    for (var i = 0; i < count; i++) { var p = {}; spawn(p, true); particles.push(p); }
    window.addEventListener("resize", debounce(resize, 200));
    ST.create({ trigger: ".hero", start: "top bottom", end: "bottom top", onToggle: function (s) { if (s.isActive) start(); else stop(); } });
    document.addEventListener("visibilitychange", function () { if (document.hidden) stop(); else if (ST.isInViewport(hero)) start(); });
  }

  /* ------------------------------------------------------------------------
     Cintas en movimiento (reaccionan a la velocidad del scroll)
     ------------------------------------------------------------------------ */
  function ribbons() {
    var tweens = [];
    $$(".ribbon").forEach(function (ribbon, i) {
      var track = $(".ribbon__track", ribbon);
      var unit = track.innerHTML;
      var guard = 0;
      while (track.scrollWidth < ribbon.offsetWidth * 1.05 && guard++ < 8) track.innerHTML += unit;
      track.innerHTML += track.innerHTML;
      var tw = i % 2 === 0
        ? gsap.fromTo(track, { xPercent: 0 }, { xPercent: -50, duration: 40, ease: "none", repeat: -1 })
        : gsap.fromTo(track, { xPercent: -50 }, { xPercent: 0, duration: 40, ease: "none", repeat: -1 });
      tweens.push(tw);
    });
    var vel = 0, dir = 1;
    ST.create({ trigger: ".ribbons", start: "top bottom", end: "bottom top", onUpdate: function (s) { vel = s.getVelocity(); dir = s.direction; } });
    gsap.ticker.add(function () {
      var target = dir * (1 + Math.min(Math.abs(vel) / 260, 6));
      vel *= 0.9;
      for (var i = 0; i < tweens.length; i++) {
        var ts = tweens[i].timeScale();
        tweens[i].timeScale(ts + (target - ts) * 0.08);
      }
    });
  }

  /* ------------------------------------------------------------------------
     Textos: división en letras / líneas y lectura progresiva por palabras
     ------------------------------------------------------------------------ */
  function textReveals() {
    var Split = window.SplitText;
    if (!Split) return;
    $$("[data-split]").forEach(function (el) {
      var mode = el.getAttribute("data-split");
      if (mode === "lines") {
        Split.create(el, {
          type: "lines", mask: "lines", linesClass: "sl", autoSplit: true,
          onSplit: function (self) {
            return gsap.from(self.lines, { yPercent: 130, duration: 1.15, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: el, start: "top 86%", once: true } });
          }
        });
      } else {
        Split.create(el, {
          type: "words,chars", mask: "words", wordsClass: "sw", autoSplit: true,
          onSplit: function (self) {
            return gsap.from(self.chars, { yPercent: 135, duration: 1.05, ease: "expo.out", stagger: 0.016, scrollTrigger: { trigger: el, start: "top 88%", once: true } });
          }
        });
      }
    });
    $$("[data-words]").forEach(function (el) {
      var split = Split.create(el, { type: "words" });
      gsap.fromTo(split.words, { opacity: 0.12 }, { opacity: 1, ease: "none", stagger: 0.12, scrollTrigger: { trigger: el, start: "top 82%", end: "bottom 42%", scrub: true } });
    });
  }

  /* ------------------------------------------------------------------------
     Apariciones genéricas
     ------------------------------------------------------------------------ */
  function reveals() {
    $$("[data-reveal]").forEach(function (el) {
      var type = el.getAttribute("data-reveal");
      if (type === "clip") {
        var img = $("img", el);
        var tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 90%", once: true } });
        tl.fromTo(el, { clipPath: "inset(14% 10% 14% 10% round 28px)", opacity: 0.001 }, { clipPath: "inset(0% 0% 0% 0% round 16px)", opacity: 1, duration: 1.5, ease: "expo.out", clearProps: "clipPath" });
        if (img) tl.from(img, { scale: 1.3, duration: 1.9, ease: "expo.out" }, 0);
      } else if (type === "mark") {
        gsap.fromTo(el, { backgroundSize: "0% 100%", color: "rgba(255,255,255,0)" }, { backgroundSize: "100% 100%", color: "rgba(255,255,255,1)", duration: 1.15, ease: "expo.inOut", scrollTrigger: { trigger: el, start: "top 90%", once: true } });
      } else {
        gsap.from(el, { y: 38, opacity: 0, duration: 1.1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 92%", once: true } });
      }
    });
    $$("[data-reveal-group]").forEach(function (g) {
      gsap.from(g.children, { y: 32, opacity: 0, duration: 0.95, ease: "power3.out", stagger: 0.08, scrollTrigger: { trigger: g, start: "top 90%", once: true } });
    });
  }

  function parallax() {
    $$("[data-parallax]").forEach(function (el) {
      gsap.fromTo(el, { yPercent: -7 }, { yPercent: 7, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });
  }

  function counters() {
    $$("[data-count]").forEach(function (el) {
      var to = parseFloat(el.getAttribute("data-count"));
      var d = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var obj = { v: 0 };
      el.textContent = fmt(0, d);
      gsap.to(obj, {
        v: to, duration: 2, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 92%", once: true },
        onUpdate: function () { el.textContent = fmt(obj.v, d); }
      });
    });
  }

  /* ------------------------------------------------------------------------
     Escena: la pirámide tradicional se desarma y aparece la carnívora
     ------------------------------------------------------------------------ */
  function pyramidScene() {
    var scene = $('[data-scene="pyramid"]');
    if (!scene) return;
    scene.classList.add("is-animated");
    var old = $$(".pyr--old .pyr__slice", scene);
    var neu = $$(".pyr--new .pyr__slice", scene);
    var steps = $$(".pyramid-steps__item", scene);
    gsap.set(neu, { opacity: 0, y: 50 });

    var tl = gsap.timeline({ defaults: { ease: "power2.inOut" } });
    tl.to({}, { duration: 0.5 })
      .addLabel("s1")
      .to(old[0], { x: 150, y: -70, rotation: 16, opacity: 0, duration: 1 })
      .addLabel("s2", "+=0.25")
      .to(old[2], { x: -170, y: 20, rotation: -14, opacity: 0, duration: 1 }, "s2")
      .addLabel("s3", "+=0.25")
      .to(old[3], { y: 170, rotation: 5, opacity: 0, duration: 1 }, "s3")
      .to(old[1], { scale: 1.12, duration: 0.7 }, "+=0.15")
      .addLabel("s4", "+=0.2")
      .to(old[1], { opacity: 0, scale: 0.92, duration: 0.6 }, "s4")
      .to(neu[2], { opacity: 1, y: 0, duration: 0.8 }, "s4+=0.15")
      .to(neu[1], { opacity: 1, y: 0, duration: 0.8 }, "s4+=0.5")
      .to(neu[0], { opacity: 1, y: 0, duration: 0.8 }, "s4+=0.85")
      .to({}, { duration: 0.6 });

    var dur = tl.duration();
    var marks = ["s1", "s2", "s3", "s4"].map(function (l) { return (tl.labels[l] + 0.1) / dur; });
    ST.create({
      animation: tl, trigger: scene, start: "top top", end: "bottom bottom", scrub: 0.7,
      onUpdate: function (s) {
        for (var i = 0; i < steps.length; i++) steps[i].classList.toggle("is-on", s.progress >= marks[i]);
      }
    });
  }

  /* ------------------------------------------------------------------------
     Escena: línea de tiempo horizontal con reloj de 24 h
     ------------------------------------------------------------------------ */
  function pad2(n) { return (n < 10 ? "0" : "") + n; }
  function clockText(sec) {
    sec = Math.max(0, Math.min(86399, Math.round(sec)));
    return pad2(Math.floor(sec / 3600)) + ":" + pad2(Math.floor((sec % 3600) / 60)) + ":" + pad2(sec % 60);
  }

  function timelineScene() {
    var sec = $('[data-scene="timeline"]');
    if (!sec) return;
    var mm = gsap.matchMedia();
    mm.add("(min-width: 900px)", function () {
      sec.classList.add("is-horizontal");
      var viewport = $(".timeline__viewport", sec);
      var track = $(".timeline__track", sec);
      var panels = $$(".tpanel", sec);
      var clock = $(".clock__time", sec);
      var bar = $(".timeline__bar i", sec);
      // Segundos del "día" de 2 millones de años en que llega cada panel
      var times = [0, 85968, 85968, 86385, 86397];
      var keys = [];
      var dist = function () { return Math.max(1, track.scrollWidth - window.innerWidth); };
      var measure = function () {
        var d = dist();
        keys = panels.map(function (p) { return Math.min(1, p.offsetLeft / d); });
      };

      var tween = gsap.to(track, {
        x: function () { return -dist(); },
        ease: "none",
        scrollTrigger: {
          trigger: viewport,
          start: "top top",
          end: function () { return "+=" + dist(); },
          pin: true,
          /* Tener "refreshPriority" activa en ScrollTrigger el reordenado de
             todos los triggers por su posición real en cada refresh. Sin esto,
             los triggers creados antes que este pin (o todos, cuando
             matchMedia lo recrea al redimensionar) no cuentan su espacio. */
          refreshPriority: 0,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onRefresh: measure,
          onUpdate: function (s) {
            var p = s.progress;
            bar.style.transform = "scaleX(" + p + ")";
            var t = times[times.length - 1];
            for (var i = 0; i < keys.length - 1; i++) {
              if (p <= keys[i + 1]) {
                var span = keys[i + 1] - keys[i] || 1;
                var k = Math.max(0, Math.min(1, (p - keys[i]) / span));
                k = k * k * (3 - 2 * k);
                t = times[i] + (times[i + 1] - times[i]) * k;
                break;
              }
            }
            clock.textContent = clockText(t);
          }
        }
      });
      measure();

      panels.forEach(function (panel) {
        var img = $(".tpanel__media img", panel);
        if (img) {
          gsap.fromTo(img, { xPercent: -5, scale: 1.14 }, { xPercent: 5, scale: 1.14, ease: "none", scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        }
        var cookie = $(".tpanel__cookie", panel);
        if (cookie) {
          gsap.fromTo(cookie, { rotation: -30, y: 60 }, { rotation: 25, y: -40, ease: "none", scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left right", end: "right left", scrub: true } });
        }
        if (!panel.classList.contains("tpanel--intro")) {
          gsap.from($(".tpanel__content", panel).children, { y: 50, opacity: 0, duration: 0.9, ease: "power3.out", stagger: 0.09, scrollTrigger: { trigger: panel, containerAnimation: tween, start: "left 62%", toggleActions: "play none none reverse" } });
        }
      });
      return function () { sec.classList.remove("is-horizontal"); gsap.set(track, { clearProps: "transform" }); };
    });
  }

  /* ------------------------------------------------------------------------
     Escena: barrido "¿la carne… o todo lo demás?"
     ------------------------------------------------------------------------ */
  function wipeScene() {
    var sec = $('[data-scene="wipe"]');
    if (!sec) return;
    sec.classList.add("is-animated");
    var b = $(".wipe__layer--b", sec);
    var tl = gsap.timeline({ scrollTrigger: { trigger: sec, start: "top top", end: "bottom bottom", scrub: 0.7 } });
    tl.fromTo($(".wipe__layer--a img", sec), { scale: 1.18 }, { scale: 1.02, ease: "none", duration: 1.4 }, 0)
      .fromTo(b, { clipPath: "inset(0% 0% 0% 100%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power2.inOut", duration: 1 }, 0.45)
      .fromTo($(".wipe__layer--b img", sec), { scale: 1.25 }, { scale: 1.02, ease: "none", duration: 1.2 }, 0.45);
  }

  /* ------------------------------------------------------------------------
     Pequeñas animaciones de escena
     ------------------------------------------------------------------------ */
  function sceneBits() {
    // Hero: el león baja más lento que el texto al hacer scroll
    gsap.to(".hero__lion", { yPercent: 16, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
    gsap.to(".hero__content", { yPercent: -18, opacity: 0.15, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });

    // Evolución: la fila de homínidos "camina" con el scroll
    var evo = $(".evo__track");
    if (evo) {
      gsap.set(evo, { left: "50%", x: 0, xPercent: -50 });
      gsap.fromTo(evo, { xPercent: -95 }, { xPercent: -5, ease: "none", scrollTrigger: { trigger: ".evo__walk", start: "top bottom", end: "bottom top", scrub: true } });
    }

    // Galería: tarjetas a distintas velocidades para dar profundidad
    $$(".bento__item").forEach(function (item, i) {
      gsap.fromTo(item, { y: i % 2 ? 70 : 10 }, { y: i % 2 ? -50 : -30, ease: "none", scrollTrigger: { trigger: ".bento", start: "top bottom", end: "bottom top", scrub: true } });
    });

    gsap.from(".forage__target img", { scale: 0.45, rotation: -30, opacity: 0, duration: 1.5, ease: "back.out(1.6)", scrollTrigger: { trigger: ".forage", start: "top 65%", once: true } });
    gsap.from(".brain__art img", { scale: 0.8, opacity: 0, duration: 1.6, ease: "expo.out", scrollTrigger: { trigger: ".brain", start: "top 70%", once: true } });
    gsap.to(".brain__art img", { y: -14, duration: 3.2, ease: "sine.inOut", yoyo: true, repeat: -1 });

    gsap.from(".epi__bag img", { y: -280, rotation: -20, opacity: 0, duration: 1.5, ease: "bounce.out", scrollTrigger: { trigger: ".epi", start: "top 62%", once: true } });

    gsap.to(".zodiac__signs", { rotation: 300, svgOrigin: "100 100", ease: "none", scrollTrigger: { trigger: ".survey", start: "top bottom", end: "bottom top", scrub: 1 } });
    $$(".zodiac__signs text").forEach(function (t) {
      gsap.to(t, { rotation: -300, transformOrigin: "50% 50%", ease: "none", scrollTrigger: { trigger: ".survey", start: "top bottom", end: "bottom top", scrub: 1 } });
    });

    // Comparaciones de cantidad
    $$(".compare").forEach(function (c) {
      var big = $$(".compare__art--big img, .compare__art--small img, .compare__art--tiny img", c);
      gsap.from(big, { scale: 0.3, opacity: 0, duration: 1.4, ease: "back.out(1.5)", stagger: 0.2, scrollTrigger: { trigger: c, start: "top 55%", once: true } });
      var pile = $$(".compare__art--pile img", c);
      if (pile.length) gsap.from(pile, { y: -320, opacity: 0, duration: 1.1, ease: "bounce.out", stagger: 0.13, scrollTrigger: { trigger: c, start: "top 50%", once: true } });
    });

    $$(".doubt__art img, .observers__art img").forEach(function (img) {
      gsap.from(img, { y: 60, rotation: 6, opacity: 0, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: img, start: "top 92%", once: true } });
    });
    gsap.from(".fallacy__egg", { y: -160, opacity: 0, duration: 1.2, ease: "bounce.out", scrollTrigger: { trigger: ".fallacy", start: "top 75%", once: true } });
    gsap.from(".multi__cow", { scale: 0, rotation: -15, duration: 1.3, ease: "back.out(1.7)", scrollTrigger: { trigger: ".multi", start: "top 60%", once: true } });
    gsap.from(".multi__bottle", { y: 80, opacity: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: ".multi", start: "top 70%", once: true } });

    gsap.fromTo(".finale__media img", { scale: 1.28 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".finale", start: "top bottom", end: "bottom top", scrub: true } });

    $$(".divider").forEach(function (d) {
      var num = $(".divider__num", d);
      if (num) gsap.fromTo(num, { yPercent: -35 }, { yPercent: -65, ease: "none", scrollTrigger: { trigger: d, start: "top bottom", end: "bottom top", scrub: true } });
      var icon = $(".divider__icon", d);
      if (icon) gsap.from(icon, { y: 30, opacity: 0, duration: 1, ease: "power3.out", scrollTrigger: { trigger: d, start: "top 70%", once: true } });
    });
    $$(".chapter-head__num").forEach(function (n) {
      gsap.fromTo(n, { y: 60 }, { y: -60, ease: "none", scrollTrigger: { trigger: n.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Filas de la comparación de dietas: entran desde los lados
    $$(".versus__table tbody tr").forEach(function (tr, i) {
      var cells = $$("td", tr);
      gsap.from(cells[0], { x: -60, opacity: 0, duration: 1, ease: "expo.out", delay: i * 0.08, scrollTrigger: { trigger: ".versus__table", start: "top 82%", once: true } });
      gsap.from(cells[1], { x: 60, opacity: 0, duration: 1, ease: "expo.out", delay: i * 0.08 + 0.05, scrollTrigger: { trigger: ".versus__table", start: "top 82%", once: true } });
    });
  }

  /* ------------------------------------------------------------------------
     Datos: barras en la tabla de nutrientes
     ------------------------------------------------------------------------ */
  function nutrientTable() {
    var cells = $$(".ntable td[data-v]");
    cells.forEach(function (td) {
      var v = parseFloat(td.getAttribute("data-v"));
      var wrap = document.createElement("div");
      wrap.className = "cell";
      var val = document.createElement("span");
      val.className = "cell__val";
      while (td.firstChild) val.appendChild(td.firstChild);
      var meter = document.createElement("span");
      meter.className = "meter-mini" + (v > 100 ? " is-over" : "");
      meter.setAttribute("aria-hidden", "true");
      var fill = document.createElement("i");
      fill.style.setProperty("--v", Math.min(v / 100, 1));
      meter.appendChild(fill);
      wrap.appendChild(val);
      wrap.appendChild(meter);
      td.appendChild(wrap);
    });
    if (M) {
      gsap.from(".ntable .meter-mini i", { scaleX: 0, duration: 1.3, ease: "expo.out", stagger: 0.012, scrollTrigger: { trigger: ".ntable", start: "top 78%", once: true } });
    }
  }

  /* ------------------------------------------------------------------------
     Gráfico: volumen cerebral (línea monótona, puntos con tooltip)
     ------------------------------------------------------------------------ */
  function monotonePath(p) {
    var n = p.length, dx = [], m = [], t = [], i;
    for (i = 0; i < n - 1; i++) { dx[i] = p[i + 1].x - p[i].x; m[i] = (p[i + 1].y - p[i].y) / dx[i]; }
    t[0] = m[0];
    for (i = 1; i < n - 1; i++) {
      if (m[i - 1] * m[i] <= 0) t[i] = 0;
      else {
        var w1 = 2 * dx[i] + dx[i - 1], w2 = dx[i] + 2 * dx[i - 1];
        t[i] = (w1 + w2) / (w1 / m[i - 1] + w2 / m[i]);
      }
    }
    t[n - 1] = m[n - 2];
    var d = "M" + p[0].x.toFixed(1) + "," + p[0].y.toFixed(1);
    for (i = 0; i < n - 1; i++) {
      var h = dx[i] / 3;
      d += "C" + (p[i].x + h).toFixed(1) + "," + (p[i].y + h * t[i]).toFixed(1) + " " + (p[i + 1].x - h).toFixed(1) + "," + (p[i + 1].y - h * t[i + 1]).toFixed(1) + " " + p[i + 1].x.toFixed(1) + "," + p[i + 1].y.toFixed(1);
    }
    return d;
  }

  function makeTip(container) {
    var tip = document.createElement("div");
    tip.className = "chart-tip";
    tip.setAttribute("aria-hidden", "true");
    var b = document.createElement("b");
    var s = document.createElement("span");
    tip.appendChild(b); tip.appendChild(s);
    container.appendChild(tip);
    return {
      show: function (x, y, value, label) {
        b.textContent = value; s.textContent = label;
        tip.classList.add("is-on");
        var W = container.clientWidth, tw = tip.offsetWidth;
        tip.style.left = Math.max(tw / 2, Math.min(W - tw / 2, x)) + "px";
        tip.style.top = y + "px";
      },
      hide: function () { tip.classList.remove("is-on"); }
    };
  }

  function brainChart() {
    var box = $('[data-chart="brain"]');
    if (!box) return;
    box.removeAttribute("aria-hidden");
    var data = [
      { name: T.ape, ma: 9.5, cc: 390, when: T.ago(fmt(9.5, 1)), val: "≈ 390 cm³", anchor: "start", dx: 10, dy: -14 },
      { name: "Australopithecus", ma: 3.9, cc: 465, when: T.ago(fmt(3.9, 1)), val: "≈ 465 cm³", anchor: "middle", dx: 0, dy: -18, it: true, narrow: { anchor: "middle", dx: 0, dy: 28 } },
      { name: "Homo habilis", ma: 1.7, cc: 570, when: T.ago(fmt(1.7, 1)), val: "≈ 570 cm³", anchor: "end", dx: -14, dy: -10, it: true, narrow: { anchor: "end", dx: -12, dy: -14 } },
      { name: "Homo erectus", ma: 0.7, cc: 900, when: T.ago07, val: "≈ 900 cm³", anchor: "end", dx: -14, dy: -2, it: true },
      { name: "Homo sapiens", ma: 0, cc: 1450, when: T.today, val: "≈ 1400–1500 cm³", anchor: "end", dx: -14, dy: 4, it: true }
    ];
    var tip = makeTip(box);
    var played = !M, trigger = null, lastW = 0;

    function render() {
      var W = box.clientWidth;
      if (!W || W === lastW) return;
      lastW = W;
      var old = $("svg", box);
      if (old) old.remove();
      var H = Math.round(Math.min(Math.max(W * 0.46, 280), 430));
      var mg = { t: 24, r: 18, b: 56, l: W < 520 ? 58 : 72 };
      var pw = W - mg.l - mg.r, ph = H - mg.t - mg.b;
      var X = function (ma) { return mg.l + ((10 - ma) / 10) * pw; };
      var Y = function (cc) { return mg.t + ph - (cc / 1600) * ph; };
      var svg = svgEl("svg", { viewBox: "0 0 " + W + " " + H, width: W, height: H, role: "group", "aria-label": T.brainAria });

      [0, 500, 1000, 1500].forEach(function (v) {
        svgEl("line", { "class": v === 0 ? "baseline" : "gridline", x1: mg.l, x2: W - mg.r, y1: Y(v), y2: Y(v) }, svg);
        var t = svgEl("text", { "class": "tick", x: mg.l - 10, y: Y(v), "text-anchor": "end", "dominant-baseline": "middle" }, svg);
        t.textContent = v === 0 ? "0" : v + " cm³";
      });
      [10, 8, 6, 4, 2, 0].forEach(function (v) {
        var t = svgEl("text", { "class": "tick", x: X(v), y: mg.t + ph + 22, "text-anchor": "middle" }, svg);
        t.textContent = v === 0 ? T.today : String(v);
      });
      var at = svgEl("text", { "class": "axis-title", x: mg.l + pw / 2, y: H - 8, "text-anchor": "middle" }, svg);
      at.textContent = T.brainAxis;

      var pts = data.map(function (d) { return { x: X(d.ma), y: Y(d.cc) }; });
      var lineD = monotonePath(pts);
      var area = svgEl("path", { "class": "area", d: lineD + "L" + pts[pts.length - 1].x + "," + Y(0) + "L" + pts[0].x + "," + Y(0) + "Z" }, svg);
      var line = svgEl("path", { "class": "line", d: lineD }, svg);

      var groups = data.map(function (d, i) {
        var g = svgEl("g", { "class": "pt", tabindex: "0", role: "img", "aria-label": d.name + ", " + d.when + ": " + d.val }, svg);
        svgEl("circle", { "class": "hit", cx: pts[i].x, cy: pts[i].y, r: 16 }, g);
        svgEl("circle", { "class": "dot", cx: pts[i].x, cy: pts[i].y, r: 5 }, g);
        var o = W < 560 && d.narrow ? d.narrow : d;
        var lab = svgEl("text", { "class": "label", x: pts[i].x + o.dx, y: pts[i].y + o.dy, "text-anchor": o.anchor }, g);
        if (d.it) lab.setAttribute("font-style", "italic");
        lab.textContent = d.name;
        var show = function () { tip.show(pts[i].x, pts[i].y, d.val, d.name + " · " + d.when); g.classList.add("is-on"); };
        var hide = function () { tip.hide(); g.classList.remove("is-on"); };
        g.addEventListener("pointerenter", show);
        g.addEventListener("pointerleave", hide);
        g.addEventListener("focus", show);
        g.addEventListener("blur", hide);
        return g;
      });
      box.insertBefore(svg, box.firstChild);

      if (!played) {
        if (trigger) trigger.kill();
        var len = line.getTotalLength();
        gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
        gsap.set(area, { opacity: 0 });
        gsap.set(groups, { opacity: 0 });
        trigger = ST.create({
          trigger: box, start: "top 78%", once: true,
          onEnter: function () {
            played = true;
            var tl = gsap.timeline();
            tl.to(line, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" })
              .to(area, { opacity: 0.08, duration: 1 }, 0.8)
              .to(groups, { opacity: 1, duration: 0.5, stagger: 0.32, ease: "power2.out" }, 0.2);
          }
        });
      }
    }
    render();
    if (window.ResizeObserver) new ResizeObserver(debounce(render, 120)).observe(box);
  }

  /* ------------------------------------------------------------------------
     Gráfico: síntomas según la fibra (pequeños múltiplos de barras)
     ------------------------------------------------------------------------ */
  function fiberChart() {
    var box = $('[data-chart="fiber"]');
    if (!box) return;
    var diets = T.diets;
    var data = [
      [T.symptoms[0], [100, 100, 75, 0]],
      [T.symptoms[1], [100, 100, 56, 0]],
      [T.symptoms[2], [52, 100, 31, 0]],
      [T.symptoms[3], [49, 67, 25, 0]],
      [T.symptoms[4], [20, 50, 13, 0]]
    ];
    var grid = document.createElement("div");
    grid.className = "fiber";
    data.forEach(function (row) {
      var panel = document.createElement("div");
      panel.className = "fiber__panel";
      var title = document.createElement("p");
      title.className = "fiber__title";
      title.textContent = row[0];
      panel.appendChild(title);
      var list = document.createElement("ul");
      list.className = "fiber__rows";
      row[1].forEach(function (v, i) {
        var li = document.createElement("li");
        li.className = "hbar" + (v === 0 ? " is-zero" : "");
        var l = document.createElement("span"); l.className = "hbar__label"; l.textContent = diets[i];
        var tr = document.createElement("span"); tr.className = "hbar__track";
        var f = document.createElement("i"); f.style.setProperty("--v", v / 100); tr.appendChild(f);
        var val = document.createElement("span"); val.className = "hbar__val"; val.textContent = v + "%";
        li.appendChild(l); li.appendChild(tr); li.appendChild(val);
        list.appendChild(li);
      });
      panel.appendChild(list);
      grid.appendChild(panel);
    });
    box.appendChild(grid);
    if (M) {
      gsap.from($$(".hbar__track i", grid), { scaleX: 0, duration: 1.3, ease: "expo.out", stagger: 0.03, scrollTrigger: { trigger: grid, start: "top 82%", once: true } });
    }
  }

  /* ------------------------------------------------------------------------
     22 países de Keys: 6 publicados, 16 excluidos
     ------------------------------------------------------------------------ */
  function countries() {
    var box = $(".countries__dots");
    if (!box) return;
    var dots = [];
    for (var i = 0; i < 22; i++) {
      var d = document.createElement("i");
      box.appendChild(d);
      dots.push(d);
    }
    var out = dots.slice(6);
    if (!M) { out.forEach(function (d) { d.classList.add("is-out"); }); return; }
    var tl = gsap.timeline({ scrollTrigger: { trigger: box, start: "top 85%", once: true } });
    tl.from(dots, { scale: 0, duration: 0.5, ease: "back.out(2)", stagger: 0.03 })
      .to(out, { scale: 0.75, duration: 0.35, stagger: 0.04, ease: "power2.out", onStart: function () {
        out.forEach(function (d, i) { setTimeout(function () { d.classList.add("is-out"); }, i * 40); });
      } }, "+=0.35")
      .to(out, { scale: 1, duration: 0.3 });
  }

  /* ------------------------------------------------------------------------
     Medidor de glucosa, botones "ver como tabla" y navegación de dudas
     ------------------------------------------------------------------------ */
  function meters() {
    if (!M) return;
    gsap.from(".meter__fill", { scaleX: 0, duration: 1.8, ease: "expo.out", scrollTrigger: { trigger: ".meter", start: "top 85%", once: true } });
  }

  function chartToggles() {
    $$("[data-chart-card]").forEach(function (card) {
      var btn = $(".chart-card__toggle", card);
      if (!btn) return;
      btn.addEventListener("click", function () {
        var on = card.classList.toggle("show-table");
        btn.setAttribute("aria-pressed", on ? "true" : "false");
        btn.textContent = on ? T.chart : T.table;
        if (hasGsap) ST.refresh();
      });
    });
  }

  /* Índice de dudas: se calcula con la posición real de cada duda en cada
     scroll (no con posiciones precalculadas, que quedan obsoletas cuando un
     pin superior se reconstruye al redimensionar la ventana). */
  function faqNav() {
    var nav = $(".faq__nav");
    if (!nav) return;
    var items = $$("a", nav).map(function (a) {
      return { a: a, el: document.getElementById(a.getAttribute("href").slice(1)) };
    }).filter(function (it) { return it.el; });
    if (!items.length) return;
    var current = null, queued = false;

    function update() {
      queued = false;
      var line = window.innerHeight * 0.45;
      var next = items[0];
      for (var i = 0; i < items.length; i++) {
        if (items[i].el.getBoundingClientRect().top <= line) next = items[i];
        else break;
      }
      /* Al final de la página, la última duda puede no llegar a la línea. */
      var doc = document.documentElement;
      var last = items[items.length - 1];
      if (window.innerHeight + window.pageYOffset >= doc.scrollHeight - 2 &&
          last.el.getBoundingClientRect().top < window.innerHeight) next = last;
      if (next === current) return;
      if (current) { current.a.classList.remove("is-active"); current.a.removeAttribute("aria-current"); }
      next.a.classList.add("is-active");
      next.a.setAttribute("aria-current", "true");
      current = next;
    }
    function queue() { if (!queued) { queued = true; requestAnimationFrame(update); } }

    window.addEventListener("scroll", queue, { passive: true });
    window.addEventListener("resize", queue);
    if (lenis) lenis.on("scroll", queue);
    update();
  }

  /* ------------------------------------------------------------------------
     Arranque
     ------------------------------------------------------------------------ */
  function failSafe(err) {
    if (err && window.console) console.error(err);
    root.classList.add("anim-failed");
    if (hasGsap) showHeroStatic();
  }

  try {
    nutrientTable();
    brainChart();
    fiberChart();
    countries();
    chartToggles();

    if (M) {
      pyramidScene();
      timelineScene();
      wipeScene();
      textReveals();
      reveals();
      parallax();
      counters();
      meters();
      sceneBits();
      embers();
      var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
      fontsReady.then(ribbons).catch(function () {});
      intro().catch(failSafe);
    }
    faqNav();
    window.__dcReady = true;
  } catch (err) {
    failSafe(err);
  }

  if (hasGsap) {
    window.addEventListener("load", function () {
      ST.refresh();
      // Si se abrió con un #ancla, volvemos a situarla tras crear los "pins"
      if (location.hash) {
        var t = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (t) setTimeout(function () { scrollToTarget(t, true); }, 60);
      }
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { ST.refresh(); });
  }
})();
