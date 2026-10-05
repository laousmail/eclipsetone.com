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

### Artist microsites

- [Khaled Ouzzir](artists/khaled-ouzzir/) — singer page + Spotify releases (`artists/khaled-ouzzir/releases.json`)

Verified socials note: `docs/team-socials.md`

## Local preview

```bash
npx --yes serve .
```

## 15-song challenge + Spotify

Shared tracker data: `challenge-data.json`  
Artist: [laousmail on Spotify](https://open.spotify.com/artist/60GjJwhvGe1eVg98jFPgMp)

Sync new releases into mystery slots:

```bash
node scripts/sync-spotify-challenge.mjs
```

GitHub Action `.github/workflows/spotify-challenge.yml` runs daily, searches Laousmail’s Spotify releases, and commits new tracks onto the Pages branch so the live challenge grid updates.

### Challenge admin (browser override)

1. Open the site → footer **Admin** (or `#admin`)
2. Passphrase default: `eclipsetone-admin` (change in `main.js`)
3. Saves to **this browser’s** `localStorage` only — for everyone else, update `challenge-data.json`

## Brand brief

Internal reference: `docs/brand-brief.md`

## Contact

- Instagram: [@laousmail](https://instagram.com/laousmail) · [@eclipsetone](https://instagram.com/eclipsetone)
- WhatsApp: +1 438 466 8971
