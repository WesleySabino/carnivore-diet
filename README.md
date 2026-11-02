# Carnivore Diet: a visual guide

**Live site: <https://carnivore-diet.sabinolab.site/>**

A single-page, static website that teaches the content of the presentation
**«Dieta Carnívora» by Jade Soller**, credited throughout the site and in a dedicated
credits section. Available in **English**, **Spanish** (the language of the original deck)
and **Brazilian Portuguese**.

The site has no backend and no external dependencies at runtime. Everything,
including fonts and libraries, is inside the `docs/` folder.

## Languages

| URL | Language |
|-----|----------|
| `/` | English (default) |
| `/es/` | Español |
| `/pt/` | Português (Brasil) |

When someone opens the site root, it goes to the first of their browser languages that
the site supports (English, Spanish or Portuguese). If none matches, it stays in English.
Choosing a language with the EN · ES · PT switcher overrides that, is remembered in the
browser, and opens the other version at the same section. Direct links to `/es/` or
`/pt/` are always respected.

## Structure

```
docs/                      ← the website (published by GitHub Pages)
├── index.html             ← English (generated)
├── es/index.html          ← Spanish (generated)
├── pt/index.html          ← Portuguese (generated)
├── CNAME                  ← custom domain for GitHub Pages
├── favicon.svg
├── .nojekyll
└── assets/                ← shared by all languages
    ├── css/style.css      ← design system and layout
    ├── js/main.js         ← animations, scroll scenes, charts, menu (+ its own texts per language)
    ├── img/               ← images from the presentation (WebP) + social cards per language
    ├── fonts/             ← Staatliches and Ubuntu (self-hosted, with licenses)
    └── vendor/            ← GSAP + ScrollTrigger + SplitText, Lenis (with licenses)
i18n/
├── template.html          ← SOURCE of the page (Spanish). Edit this, not docs/*.html
├── en.txt, pt.txt         ← translations, one block per text segment
├── build.py, segments.py  ← generator (Python 3, standard library only)
```

## Editing content

The three HTML pages are generated from one template, so the layout stays identical
in every language.

1. Edit `i18n/template.html` (Spanish text, markup, images).
2. Run `python3 i18n/build.py`.
3. If you changed or added text, the build stops and lists each segment that has no
   translation yet (`@@ key  Spanish text`). Add those blocks to `i18n/en.txt` and
   `i18n/pt.txt` and run the build again. In the catalogs, `=` means "same as Spanish".
   `python3 i18n/build.py --dump` writes every Spanish segment to `i18n/source.es.txt`
   for reference.

Texts created by JavaScript (chart labels, menu button, tooltips) live in the `I18N`
object at the top of `docs/assets/js/main.js`.

## Analytics

Google Analytics 4 (property "Carnivore Diet", measurement ID `G-0H8ZC8EW3S`, set as
`GA_ID` in `i18n/build.py`) is loaded by `docs/assets/js/analytics.js`:

- **Consent Mode v2:** analytics cookies stay off until the visitor clicks **Accept** in the
  banner; ad storage is always off. "Cookie preferences" in the footer reopens the banner.
- Google's script loads only on `carnivore-diet.sabinolab.site`, so local previews send nothing.
- Events: `section_view` (`section_id`, `section_number`) when a chapter or the credits
  stays in the middle of the screen for 2 s; `language_switch` (`from_language`,
  `to_language`, `section_id`). Every event carries `content_language` (en/es/pt).
- The root page does not count a visit when it redirects to `/es/` or `/pt/`.

## Preview locally

```bash
cd docs
python3 -m http.server 8000
# open http://localhost:8000
```

## Publishing

The repository is published with **GitHub Pages** from the `main` branch, `/docs`
folder; any push to `main` updates the site. The custom domain is set by `docs/CNAME`
and a DNS record at the domain registrar (Spaceship):

```
CNAME  carnivore-diet  →  wesleysabino.github.io
```

To host it elsewhere, upload the contents of `docs/` (all paths are relative). The
`canonical`, `hreflang` and `og:image` URLs point to `https://carnivore-diet.sabinolab.site/`;
change `SITE` in `i18n/build.py` and rebuild if the address changes.

## What's inside

- **Hero** with the lion from the deck's cover, animated embers and kinetic typography.
- **Scroll scenes:** the traditional food pyramid falls apart into the carnivore pyramid;
  a horizontal timeline with a "24-hour clock" (2 million years of eating meat compressed
  into one day); a wipe from "is the problem meat…" to "…or everything else?".
- **Data rebuilt from the slides:** the nutrient table (with bars), the brain-volume
  chart, the fiber/symptoms chart, the glucose meter, and the 6 vs 16 countries
  from Keys' 1953 study. Each chart has a table view.
- **Atlas** of the traditional peoples mentioned in the deck, linking to each story.
- **Study cards** for every paper shown in the deck, with verified DOI links.
- **Accessibility:** works without JavaScript, respects "reduce motion", keyboard
  navigable index menu, alt texts, screen-reader tables for charts.

## Credits

- **Content:** Jade Soller, nutricionista integrativa:
  [jadesoller.com.br](https://jadesoller.com.br) ·
  [Instagram @jade.soller](https://www.instagram.com/jade.soller/) ·
  [YouTube @jade.soller](https://www.youtube.com/@jade.soller) · X/Twitter @soller_jade.
  Texts, arguments, data and images come from her presentation; the English and
  Portuguese versions are translations of the Spanish edition.
- **Libraries:** [GSAP](https://gsap.com) (Standard "no charge" license),
  [Lenis](https://github.com/darkroomengineering/lenis) (MIT).
- **Fonts:** Staatliches (SIL OFL 1.1), Ubuntu (Ubuntu Font Licence 1.0), the same
  fonts used in the original deck.
- **Map:** generated at build time from Natural Earth data (public domain) via `world-atlas`.

## Note on images

The images come from the original presentation. Some are third-party material:
testimonial and before/after photos (e.g. meatrx.com), brand packaging (Trakinas,
McDonald's, Coca-Cola) and stock or historical photos. The image files are in
`docs/assets/img/` with descriptive names, in case any needs to be replaced.
