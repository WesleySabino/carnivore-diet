/* Google Analytics 4 with Consent Mode v2.
   - Measurement ID comes from data-ga on this <script> tag (set by i18n/build.py).
   - Analytics cookies stay off ("denied") until the visitor clicks Accept in the banner;
     ad storage is always denied. The choice is kept in localStorage ("dc-consent").
   - Google's script is loaded only on the published host, so local previews never send
     data; there, events are still pushed to window.dataLayer for testing.
   - Events: section_view (each chapter and the credits, at most once per page view) and
     language_switch (sent from main.js). Every event carries content_language. */
(function () {
  "use strict";
  var me = document.currentScript;
  var id = me && me.getAttribute("data-ga");
  if (!id || window.__dcRedirect) return;

  var HOST = "carnivore-diet.sabinolab.site";
  var KEY = "dc-consent";
  var lang = (document.documentElement.lang || "es").slice(0, 2);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };

  var choice = null;
  try { choice = localStorage.getItem(KEY); } catch (e) {}

  gtag("consent", "default", {
    analytics_storage: choice === "granted" ? "granted" : "denied",
    ad_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied"
  });
  gtag("set", { content_language: lang });
  gtag("js", new Date());
  gtag("config", id);

  if (location.hostname === HOST) {
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + encodeURIComponent(id);
    document.head.appendChild(s);
  }

  /* Consent banner */
  var box = document.getElementById("consent");
  if (box) {
    if (choice !== "granted" && choice !== "denied") box.hidden = false;
    box.addEventListener("click", function (e) {
      var b = e.target.closest("[data-consent]");
      if (!b) return;
      var v = b.getAttribute("data-consent");
      try { localStorage.setItem(KEY, v); } catch (err) {}
      gtag("consent", "update", { analytics_storage: v });
      // The page view sent before the choice had no cookies; count this page now.
      if (v === "granted" && choice !== "granted") gtag("event", "page_view");
      choice = v;
      box.hidden = true;
    });
  }
  var opener = document.querySelector("[data-consent-open]");
  if (opener && box) {
    opener.hidden = false;
    opener.addEventListener("click", function () {
      box.hidden = false;
      var first = box.querySelector("[data-consent]");
      if (first) first.focus();
    });
  }

  /* Reading progress: a section counts as viewed when it stays across the middle of the
     screen for 2 seconds (so jumping through the index does not count every chapter). */
  if ("IntersectionObserver" in window) {
    var timers = {};
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        clearTimeout(timers[el.id]);
        if (!en.isIntersecting) return;
        timers[el.id] = setTimeout(function () {
          io.unobserve(el);
          gtag("event", "section_view", {
            section_id: el.id,
            section_number: el.getAttribute("data-chapter") || "credits"
          });
        }, 2000);
      });
    }, { rootMargin: "-50% 0px -49% 0px" });
    var start = function () {
      document.querySelectorAll("main .chapter[id], #creditos").forEach(function (el) { io.observe(el); });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
    else start();
  }
})();
