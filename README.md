# EclipseTone Productions

Online song production for independent artists. Montréal, worldwide.

**Live:** https://eclipsetone.com/ · **Source of truth:** `main` (GitHub Pages)

## Stack

Static site. Every page exists in English and in French at its own address (French under `fr/`),
built from bilingual sources by one script:

```bash
python3 docs/build_pages.py
```

**Edit the sources, never the generated pages** (`index.html`, `services/index.html`, `fr/…`, the
service folders, `blog/`, `privacy/` and `sitemap.xml` are all rewritten by the build).

| Source | What it makes |
| --- | --- |
| `src/index.html` | Homepage, EN + FR. Text in both languages side by side: `<span data-lang="en">…</span><span data-lang="fr">…</span>`; French title and descriptions in `data-fr="…"` |
| `src/services/index.html` | Prices page, EN + FR (`services/services.css` adds pricing styles) |
| `docs/services.json` | One page per service (song production, mixing, studio recording, video, CDs, website, social) |
| `docs/blog.json` | Blog posts and the blog index |
| `docs/privacy.html` | Privacy policy |
| `docs/lyrics.html` | Eclipse Lyrics page (`lyrics/`, `fr/paroles/`), marketing the free tool at lyrics.eclipsetone.com; screenshots and `lyrics.css` in `lyrics/` |
| `home.css` | The shared design |

Other files:

| File | What it does |
| --- | --- |
| `config.js` | **Settings you edit:** lead sheet URL, analytics code, MailerLite form, backup exchange rates |
| `main.js` | Theme, language switch (goes to the other language's page), menu, physical copies picker |
| `project.js` | "Start your project" panel: 3 steps, logs the request to the sheet only when sent, WhatsApp fallback |
| `sound.js` | Optional studio sound, hidden until an ambience file is set in `config.js` |
| `currency.js` | Prices are in CAD; visitors can view USD or EUR estimates (rates fetched only then) |
| `analytics.js` | GoatCounter visits and button events (off until `config.js` has a code) |
| `robots.txt`, `llms.txt` | For search engines and AI assistants. Update `llms.txt` when prices change |
| `docs/icons.html` | Icon set used on every page (copied in by the build) |
| `og-image.jpg` | Share preview for WhatsApp, Instagram, iMessage |

Setup steps for the lead sheet, analytics and MailerLite: [`docs/SETUP.md`](docs/SETUP.md). `docs/` and `src/` are not published.

## Homepage switches

- **Before/after player:** add pairs to `proof/pairs.json` (MP3s in `proof/`). Hidden while the list is empty.
- **Email capture:** set `mailerlite` in `config.js`. Hidden until set.
- **Monthly spots:** set the number and remove `hidden` on the `.spots` line in `src/index.html` and `src/services/index.html`, then rebuild.

## Local preview

```bash
python3 -m http.server 8765
```

Artist sites live in their own repos: [laousmail.com](https://github.com/laousmail/laousmail.com).
