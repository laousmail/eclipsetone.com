# EclipseTone Productions

Online song production for independent artists. Montréal, worldwide.

**Live:** https://eclipsetone.com/ · **Source of truth:** `main` (GitHub Pages)

## Stack

Static site, no build step for the main pages.

| File | What it does |
| --- | --- |
| `index.html`, `home.css` | Homepage and the shared design |
| `services/` | Prices page (`services.css` adds pricing styles) |
| `config.js` | **Settings you edit:** lead sheet URL, analytics code, MailerLite form, backup exchange rates |
| `main.js` | Theme, language, menu, light depth effects, physical copies picker |
| `project.js` | "Start your project" panel: 3 steps, slides up in place, logs leads to the sheet, WhatsApp fallback |
| `sound.js` | Optional studio sound, hidden until an ambience file is set in `config.js` |
| `currency.js` | Prices are in CAD; visitors can view USD or EUR estimates |
| `analytics.js` | GoatCounter visits and button events (off until `config.js` has a code) |
| `blog/`, `privacy/` | Built by `python3 docs/build_pages.py` from `docs/blog.json`, `docs/privacy.html` |
| `docs/icons.html` | Icon set used on every page (copied in by the build) |
| `og-image.jpg` | Share preview for WhatsApp, Instagram, iMessage |

Setup steps for the lead sheet, analytics and MailerLite: [`docs/SETUP.md`](docs/SETUP.md). The `docs/` folder is not published.

## Edit blog or privacy pages

Edit `docs/blog.json` or `docs/privacy.html`, then run:

```bash
python3 docs/build_pages.py
```

Header, menu and footer are copied from `index.html`, so change them there first.

## Homepage switches

- **Before/after player:** add pairs to `proof/pairs.json` (MP3s in `proof/`). Hidden while the list is empty.
- **Email capture:** set `mailerlite` in `config.js`. Hidden until set.
- **Monthly spots:** set the number and remove `hidden` on the `.spots` line in `index.html` and `services/index.html`.

## Local preview

```bash
python3 -m http.server 8765
```

Artist sites live in their own repos: [laousmail.com](https://github.com/laousmail/laousmail.com).
