#!/usr/bin/env node
/**
 * Sync Laousmail Spotify releases into challenge-data.json.
 * Fills the next mystery slots when new tracks appear on the artist profile.
 *
 * Usage: node scripts/sync-spotify-challenge.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dataPath = join(root, 'challenge-data.json')
const ARTIST_ID = '60GjJwhvGe1eVg98jFPgMp'

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; EclipseToneChallengeBot/1.0; +https://eclipsetone.com)',
      Accept: 'text/html,application/json',
    },
  })
  if (!res.ok) throw new Error(`${url} → ${res.status}`)
  return res.text()
}

async function oembedTitle(trackId) {
  const url = `https://open.spotify.com/oembed?url=https://open.spotify.com/track/${trackId}`
  const json = JSON.parse(await fetchText(url))
  return json.title || ''
}

async function trackMeta(trackId) {
  const html = await fetchText(`https://open.spotify.com/track/${trackId}`)
  const desc = html.match(/property="og:description" content="([^"]+)"/)?.[1] || ''
  // e.g. "laousmail · Asiwel · Song · 2026"
  const parts = desc.split(' · ').map((p) => p.trim())
  const artist = parts[0] || ''
  const year = parts[3] || ''
  const title = (await oembedTitle(trackId)) || parts[1] || trackId
  return { trackId, title, artist, year, link: `https://open.spotify.com/track/${trackId}` }
}

async function listArtistTrackIds() {
  const html = await fetchText(`https://open.spotify.com/embed/artist/${ARTIST_ID}`)
  const ids = [...html.matchAll(/spotify:track:([A-Za-z0-9]{22})/g)].map((m) => m[1])
  return [...new Set(ids)]
}

function loadData() {
  return JSON.parse(readFileSync(dataPath, 'utf8'))
}

function saveData(data) {
  data.updatedAt = new Date().toISOString().slice(0, 10)
  writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`)
}

async function main() {
  const data = loadData()
  const known = new Set(
    data.songs.filter((s) => s.spotifyId).map((s) => s.spotifyId),
  )

  const trackIds = await listArtistTrackIds()
  const metas = []
  for (const id of trackIds) {
    const meta = await trackMeta(id)
    // Only count tracks credited to laousmail (skip other artists)
    if (!/laousmail/i.test(meta.artist)) {
      console.log(`skip (artist="${meta.artist}"): ${meta.title}`)
      continue
    }
    metas.push(meta)
  }

  // Prefer 2026+ challenge era; still allow adding any laousmail track not yet listed
  const newcomers = metas.filter((m) => !known.has(m.trackId))
  let added = 0

  for (const meta of newcomers) {
    const slot = data.songs.find((s) => s.status === 'mystery')
    if (!slot) {
      console.log('No mystery slots left; not adding', meta.title)
      break
    }
    slot.status = 'released'
    slot.title = meta.title
    slot.link = meta.link
    slot.spotifyId = meta.trackId
    slot.year = meta.year
    slot.hint = ''
    added += 1
    console.log(`Added #${slot.id}: ${meta.title} (${meta.year})`)
  }

  if (added > 0) {
    saveData(data)
    console.log(`Updated ${dataPath} (+${added})`)
  } else {
    console.log('No new Laousmail tracks to add.')
  }

  const released = data.songs.filter((s) => s.status === 'released').length
  console.log(`Challenge progress: ${released}/${data.goal}`)
  console.log(`Artist: ${data.artist.spotifyUrl}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
