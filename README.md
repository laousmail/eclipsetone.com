# EclipseTone Productions

EclipseTone Productions: online song production for independent artists. Montréal, worldwide.

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

The tracker no longer appears on eclipsetone.com; it lives on [laousmail.com](https://laousmail.com/). The data file and scripts stay here because the artist site may read them. `main.js` only renders the grid on pages that include `[data-song-grid]`.

Validate locally:

```bash
node scripts/validate-challenge.mjs
```

Maintainers: challenge sync, deploy, and DNS notes stay offline in `private/` (not published). Never commit API credentials or personal contact numbers into this repo.

## Homepage switches

- **Before/after player:** add pairs to `proof/pairs.json` (MP3s in `proof/`). The section stays hidden while the list is empty.
- **Email capture:** paste the MailerLite form action URL into `data-ml-action` on the capture form in `index.html`. Hidden until set.
- **Monthly spots:** set the number and remove `hidden` on the `.spots` line in `index.html` and `services/index.html`.

## Contact

- Instagram: [@laousmail](https://instagram.com/laousmail) · [@eclipsetone](https://instagram.com/eclipsetone)
- Booking and WhatsApp: [eclipsetone.com](https://eclipsetone.com/)
