# EclipseTone Productions

Artist-first site for [Laousmail](https://instagram.com/laousmail) / EclipseTone — Montréal.

**Live:** https://laousmail.github.io/eclipsetone.com/

## Stack

Static site (`index.html`, `styles.css`, `main.js`, `blog/`, `people/`). No build step. GitHub Pages serves the branch root.

### People profiles

Bios live in `people/profiles.json`. Regenerate pages after edits:

```bash
node people/generate.mjs
```

## Local preview

```bash
npx --yes serve .
```

## Challenge admin

1. Open the site → footer **Admin** (or `#admin`)
2. Passphrase default: `eclipsetone-admin` (change in `main.js`)
3. Add title + listen link per slot — data stores in **this browser’s** `localStorage` (Pages has no backend)

## Brand brief

Internal reference: `docs/brand-brief.md`

## Contact

- Instagram: [@laousmail](https://instagram.com/laousmail) · [@eclipsetone](https://instagram.com/eclipsetone)
- WhatsApp: +1 438 466 8971
