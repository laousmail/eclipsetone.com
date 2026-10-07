# EclipseTone Productions

Artist-first site for [Laousmail](https://instagram.com/laousmail) / EclipseTone — Montréal.

**Live:** https://eclipsetone.com/ (GitHub Pages; fallback https://laousmail.github.io/eclipsetone.com/)

## Custom domain (GoDaddy → GitHub Pages)

`CNAME` in the repo root publishes `eclipsetone.com`. In GoDaddy DNS for **eclipsetone.com**, set:

| Type | Name | Value |
|------|------|--------|
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `laousmail.github.io` |

Remove GoDaddy parking / forwarding A records (`15.197.x` / `3.33.x`) first. Then in the repo: **Settings → Pages → Custom domain** → `eclipsetone.com` → check DNS → **Enforce HTTPS**.

## Stack

Static site (`index.html`, `home.css` for homepage + services, `styles.css` for people/blog, `main.js`). No build step. Production services live at `services/`.

**Source of truth:** `main`.

**Deploy today:** GitHub Pages is still **legacy** from `cursor/eclipsetone-website-e2df` (kept as a mirror of `main`). Preferred: **Settings → Pages → Source → GitHub Actions** (or legacy source → `main`), then that mirror branch can be deleted. `.github/workflows/pages.yml` builds a filtered `dist/` (excludes `private/` / `docs/`). The `CNAME` file must stay in the published root (included in `dist/` via rsync).

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

### Sync from Spotify (Web API)

Create a Spotify app (Developer Dashboard) and add Actions secrets:

- `SPOTIFY_CLIENT_ID`
- `SPOTIFY_CLIENT_SECRET`

Locally:

```bash
export SPOTIFY_CLIENT_ID=...
export SPOTIFY_CLIENT_SECRET=...
node scripts/sync-spotify-challenge.mjs
node scripts/validate-challenge.mjs
node scripts/render-challenge-html.mjs
```

Unit tests (no network):

```bash
node --test scripts/lib/challenge-sync.test.mjs
```

GitHub Action `.github/workflows/spotify-challenge.yml` runs daily on the Pages branch and supports **workflow_dispatch**:

- `mode=sync` — Spotify Web API → ordered challenge-era slots (`challengeStart`, default `2026-01-01`)
- `mode=set-slot` — set one slot with `slot`, `status`, `title`, `link`, `hint`

After either path it validates JSON, re-renders the homepage grid, and commits. Locked slots (`"locked": true`) are never overwritten.

### Manual JSON edit

1. Edit `challenge-data.json` (use `hint` for mystery teasers; set `"locked": true` on a slot to protect it from sync later)
2. `node scripts/validate-challenge.mjs`
3. `node scripts/render-challenge-html.mjs`
4. Commit both files

## Internal notes

Brand / research notes live in `private/` (not deployed). Do not publish personal data (e.g. collaborator birth dates) without approval. History purge needs an explicit owner request.

## Contact

- Instagram: [@laousmail](https://instagram.com/laousmail) · [@eclipsetone](https://instagram.com/eclipsetone)
- WhatsApp: +1 438 466 8971
