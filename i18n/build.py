#!/usr/bin/env python3
"""Builds the three language versions of the site from the Spanish template.

    python3 i18n/build.py            # writes docs/index.html (en), docs/es/, docs/pt/
    python3 i18n/build.py --dump     # also writes i18n/source.es.txt (all segments)

Source of truth: i18n/template.html (Spanish, with paths relative to docs/).
Translations:    i18n/en.txt and i18n/pt.txt ("@@ key" + text; "=" keeps the Spanish).
If a segment has no translation, the build stops and lists the missing keys.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from segments import collect, read_catalog, LETTER  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
DOCS = os.path.join(HERE, "..", "docs")
SITE = "https://carnivore-diet.sabinolab.site/"
GA_ID = "G-0H8ZC8EW3S"  # Google Analytics 4 measurement ID (see docs/assets/js/analytics.js)

LANGS = {
    # code: (html lang, og locale, folder ("" = site root), switch label, name)
    "en": ("en", "en_US", "", "Language", "English"),
    "es": ("es", "es_ES", "es/", "Idioma", "Español"),
    "pt": ("pt-BR", "pt_BR", "pt/", "Idioma", "Português"),
}
ORDER = ["en", "es", "pt"]

# Segments that read the same in every language (numbers, units, DOIs, symbols).
KEEP = re.compile(r"^(?:[\d\s.,%≈–+\-:/()×*³]|mg|kg|g|cm|kcal|doi:\S+|&#x?[0-9a-fA-F]+;|[♈-♓])*$")


def plain(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", html)).strip()


def auto_keep(text):
    p = plain(text)
    return not LETTER.search(p) or bool(KEEP.match(p))


def translate(src, lang):
    if lang == "es":
        return src
    cat = read_catalog(os.path.join(HERE, lang + ".txt"))
    segs, stray = collect(src)
    if stray:
        raise SystemExit(f"Text outside any segment: {stray}")
    missing, out, pos = [], [], 0
    for start, end, text, key, kind in segs:
        if key in cat:
            new = cat[key]
            if new.strip() == "=":
                new = text
        elif auto_keep(text):
            new = text
        else:
            missing.append((key, plain(text)[:90]))
            new = text
        if kind == "attr":
            new = new.replace('"', "&quot;")
        out.append(src[pos:start])
        out.append(new)
        pos = end
    out.append(src[pos:])
    if lang == "en":
        # Number-only text (table cells, counters): 9,5 -> 9.5 and 10.000 -> 10,000
        def num(m):
            t = m.group(1)
            if LETTER.search(t):
                return m.group(0)
            t = re.sub(r"(\d)\.(\d{3})\b", r"\1⁣\2", t)
            t = re.sub(r"(\d),(\d)", r"\1.\2", t).replace("⁣", ",")
            return ">" + t + "<"
        out = [re.sub(r">([^<>]*\d[^<>]*)<", num, "".join(out))]
    if missing:
        print(f"[{lang}] {len(missing)} segment(s) without translation:")
        for k, t in missing:
            print(f"  @@ {k}  {t}")
        raise SystemExit(1)
    used = {s[3] for s in segs}
    unused = [k for k in cat if k not in used]
    if unused:
        print(f"[{lang}] note: {len(unused)} unused key(s) in {lang}.txt: {' '.join(unused)}")
    return "".join(out)


def href_from(cur, target):
    """Relative link from the page of language `cur` to the page of `target`."""
    up = "../" if LANGS[cur][2] else ""
    dest = LANGS[target][2]
    return (up + dest) or "./"


def switcher(cur, where):
    links = []
    for code in ORDER:
        h, _, _, _, name = LANGS[code]
        attrs = f'href="{href_from(cur, code)}" hreflang="{h}" lang="{h}" data-lang="{code}" title="{name}"'
        if code == cur:
            attrs += ' aria-current="true"'
        links.append(f'<a {attrs}>{code.upper()}</a>')
    label = LANGS[cur][3]
    return f'<nav class="lang lang--{where}" aria-label="{label}">' + "".join(links) + "</nav>"


REDIRECT = """<script>
    // Language: the visitor's saved choice, else the first supported browser language, else English.
    (function () {
      var pick = null;
      try { pick = localStorage.getItem("dc-lang"); } catch (e) {}
      if (!pick) {
        var list = navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || ""];
        for (var i = 0; i < list.length && !pick; i++) {
          var c = String(list[i] || "").toLowerCase().slice(0, 2);
          if (c === "en" || c === "es" || c === "pt") pick = c;
        }
      }
      if (pick === "es" || pick === "pt") {
        window.__dcRedirect = true; // keeps analytics.js from counting this page
        location.replace(pick + "/" + location.search + location.hash);
      }
    })();
  </script>"""


CONSENT = {
    "en": ("Analytics consent",
           "May we use Google Analytics cookies to see which parts of this guide people read? "
           "No ads and no advertising profiles. You can change your mind anytime in the footer.",
           "Decline", "Accept", "Cookie preferences"),
    "es": ("Consentimiento de análisis",
           "¿Podemos usar cookies de Google Analytics para saber qué partes de esta guía se leen? "
           "Sin anuncios ni perfiles publicitarios. Puedes cambiar de opinión cuando quieras en el pie de página.",
           "Rechazar", "Aceptar", "Preferencias de cookies"),
    "pt": ("Consentimento de análise",
           "Podemos usar cookies do Google Analytics para saber quais partes deste guia são lidas? "
           "Sem anúncios e sem perfis publicitários. Você pode mudar de ideia quando quiser no rodapé.",
           "Recusar", "Aceitar", "Preferências de cookies"),
}


def consent_block(cur):
    label, text, no, yes, _ = CONSENT[cur]
    return (f'<div class="consent" id="consent" role="region" aria-label="{label}" hidden>\n'
            f'    <p>{text}</p>\n'
            f'    <div class="consent__actions">'
            f'<button type="button" class="consent__btn" data-consent="denied">{no}</button>'
            f'<button type="button" class="consent__btn consent__btn--yes" data-consent="granted">{yes}</button>'
            f'</div>\n  </div>\n'
            f'  <script src="assets/js/analytics.js" data-ga="{GA_ID}" defer></script>')


def head_block(cur):
    h, locale, folder, _, _ = LANGS[cur]
    lines = [f'<link rel="canonical" href="{SITE}{folder}">']
    for code in ORDER:
        lines.append(f'<link rel="alternate" hreflang="{LANGS[code][0]}" href="{SITE}{LANGS[code][2]}">')
    lines.append(f'<link rel="alternate" hreflang="x-default" href="{SITE}">')
    lines.append(f'<meta property="og:url" content="{SITE}{folder}">')
    lines.append(f'<meta property="og:locale" content="{locale}">')
    for code in ORDER:
        if code != cur:
            lines.append(f'<meta property="og:locale:alternate" content="{LANGS[code][1]}">')
    lines.append(f'<meta property="og:image" content="{SITE}assets/img/og-image-{cur}.jpg">')
    lines.append('<meta property="og:image:width" content="1200">')
    lines.append('<meta property="og:image:height" content="630">')
    if cur == "en":
        lines.append(REDIRECT)
    return "\n  ".join(lines)


def localise(html, cur):
    h, _, folder, _, _ = LANGS[cur]
    html = re.sub(r'<html lang="[^"]*">', f'<html lang="{h}">', html, count=1)
    html = html.replace("<!--i18n:head-->", head_block(cur))
    html = html.replace("<!--i18n:switch-header-->", switcher(cur, "header"))
    html = html.replace("<!--i18n:switch-menu-->", switcher(cur, "menu"))
    html = html.replace("<!--i18n:switch-footer-->", switcher(cur, "footer"))
    html = html.replace("<!--i18n:consent-->", consent_block(cur))
    html = html.replace("<!--i18n:consent-footer-->",
                        f'<button type="button" class="consent-open" data-consent-open hidden>{CONSENT[cur][4]}</button>')
    if "<!--i18n:" in html:
        raise SystemExit("Unreplaced i18n marker left in output")
    if folder:
        # Pages in a sub-folder reach the shared files one level up.
        def fix(tag):
            t = tag.group(0)
            t = re.sub(r'((?:src|href|srcset|imagesrcset|content)=")(assets/|favicon\.svg)', r"\1../\2", t)
            t = re.sub(r'(,\s*)(assets/)', r"\1../\2", t)
            return t
        html = re.sub(r"<(?:img|link|script|source|meta|a)\b[^>]*>", fix, html)
    return html


def main():
    src = open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
    if "--dump" in sys.argv:
        segs, _ = collect(src)
        seen, buf = set(), []
        for s in segs:
            if s[3] not in seen and not auto_keep(s[2]):
                seen.add(s[3])
                buf.append(f"@@ {s[3]}\n{plain(s[2]) if s[4] == 'attr' else s[2].strip()}\n")
        open(os.path.join(HERE, "source.es.txt"), "w", encoding="utf-8").write("".join(buf))
    for code in ORDER:
        html = localise(translate(src, code), code)
        folder = os.path.join(DOCS, LANGS[code][2])
        os.makedirs(folder, exist_ok=True)
        with open(os.path.join(folder, "index.html"), "w", encoding="utf-8") as f:
            f.write(html)
        print(f"wrote docs/{LANGS[code][2]}index.html ({len(html):,} bytes)")


if __name__ == "__main__":
    main()
