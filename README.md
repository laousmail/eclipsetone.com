# EclipseTone Productions

Artist-first site for [Laousmail](https://instagram.com/laousmail) / EclipseTone — Montréal.

**Live:** https://eclipsetone.com/

## Stack

Static site (`index.html`, `home.css`, `styles.css`, `main.js`). No build step. Production services live at `services/`.

**Source of truth:** `main` (GitHub Pages).

### People profiles

Bios live in `people/profiles.json`. Regenerate pages after edits:

```bash
node people/generate.mjs
```

### Artist microsites

- [SMA!L · Laousmail](https://laousmail.com/) — [laousmail/laousmail.com](https://github.com/laousmail/laousmail.com)
- [Khaled Ouzzir](artists/khaled-ouzzir/) — singer page + Spotify releases (`artists/khaled-ouzzir/releases.json`)

## Local preview

```bash
npx --yes serve .
```

## 15-song challenge

Shared tracker data: `challenge-data.json`  
Artist: [laousmail on Spotify](https://open.spotify.com/artist/60GjJwhvGe1eVg98jFPgMp)

The homepage embeds the current grid in HTML (works with JS disabled). `main.js` may refresh from `challenge-data.json` when the fetch succeeds; on failure it leaves the embedded markup alone.

Validate locally:

```bash
node scripts/validate-challenge.mjs
```

Maintainers: challenge sync, deploy, and DNS notes stay offline in `private/` (not published). Never commit API credentials or personal contact numbers into this repo.

## Contact

- Instagram: [@laousmail](https://instagram.com/laousmail) · [@eclipsetone](https://instagram.com/eclipsetone)
- Booking and WhatsApp: [eclipsetone.com](https://eclipsetone.com/)
