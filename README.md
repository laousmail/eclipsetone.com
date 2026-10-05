# EclipseTone Productions

Artist-first site for [Laousmail](https://instagram.com/laousmail) / EclipseTone — Montréal.

**Live:** https://laousmail.github.io/eclipsetone.com/

## Stack

Static site (`index.html`, `styles.css`, `main.js`, `blog/`, `people/`). No build step. GitHub Pages serves the branch root (currently `cursor/eclipsetone-website-e2df`).

### People profiles

Bios live in `people/profiles.json`. Regenerate pages after edits:

```bash
node people/generate.mjs
```

### Artist microsites

- [Khaled Ouzzir](artists/khaled-ouzzir/) — singer page + Spotify releases (`artists/khaled-ouzzir/releases.json`)

## Local preview

```bash
npx --yes serve .
```

## 15-song challenge

Shared tracker data: `challenge-data.json`  
Artist: [laousmail on Spotify](https://open.spotify.com/artist/60GjJwhvGe1eVg98jFPgMp)

The homepage embeds the current grid in HTML (works with JS disabled). `main.js` may refresh from `challenge-data.json` when the fetch succeeds; on failure it leaves the embedded markup alone.

### Validate

```bash
node scripts/validate-challenge.mjs
```

### Sync from Spotify

```bash
node scripts/sync-spotify-challenge.mjs
node scripts/validate-challenge.mjs
node scripts/render-challenge-html.mjs
```

GitHub Action `.github/workflows/spotify-challenge.yml` runs daily on the Pages branch and also supports **workflow_dispatch**:

- `mode=sync` — pull new Laousmail releases into mystery slots
- `mode=set-slot` — set one slot with `slot`, `status`, `title`, `link`, `hint`

After either path it validates JSON, re-renders the homepage grid, and commits.

### Manual JSON edit

1. Edit `challenge-data.json` (use `hint` for mystery teasers; set `"locked": true` on a slot to protect it from sync later)
2. `node scripts/validate-challenge.mjs`
3. `node scripts/render-challenge-html.mjs`
4. Commit both files

## Contact

- Instagram: [@laousmail](https://instagram.com/laousmail) · [@eclipsetone](https://instagram.com/eclipsetone)
- WhatsApp: +1 438 466 8971
