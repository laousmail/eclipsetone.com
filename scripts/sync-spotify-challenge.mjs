#!/usr/bin/env node
/**
 * Sync Laousmail Spotify releases into challenge-data.json via Spotify Web API.
 *
 * Requires env:
 *   SPOTIFY_CLIENT_ID
 *   SPOTIFY_CLIENT_SECRET
 *
 * Usage: node scripts/sync-spotify-challenge.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  ARTIST_ID,
  assignTracksToSlots,
  challengeStartDate,
  filterChallengeTracks,
} from './lib/challenge-sync.mjs'
import { getClientCredentialsToken, listArtistTracks } from './lib/spotify-api.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = join(root, 'challenge-data.json')

function loadData() {
  return JSON.parse(readFileSync(dataPath, 'utf8'))
}

function saveData(data) {
  writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`)
}

function summary(lines) {
  const text = lines.join('\n')
  console.log(text)
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, `${text}\n`, { flag: 'a' })
  }
}

async function main() {
  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new Error(
      'Missing SPOTIFY_CLIENT_ID / SPOTIFY_CLIENT_SECRET. Add them as GitHub Actions secrets (or export locally).',
    )
  }

  const data = loadData()
  const start = challengeStartDate(data)
  const token = await getClientCredentialsToken(clientId, clientSecret)
  const allTracks = await listArtistTracks(data.artist?.spotifyId || ARTIST_ID, token)
  const sorted = filterChallengeTracks(allTracks, data.artist?.spotifyId || ARTIST_ID, start)
  const result = assignTracksToSlots(data, sorted)

  if (result.added.length) {
    saveData(result.data)
  }

  summary([
    '## Spotify challenge sync',
    '',
    `- Challenge start: \`${start}\``,
    `- Tracks considered: ${sorted.length}`,
    `- Added: ${result.added.length ? result.added.join(', ') : 'none'}`,
    `- Warnings: ${result.warnings.length ? result.warnings.join(' · ') : 'none'}`,
    `- Progress: ${result.data.songs.filter((s) => s.status === 'released').length}/${result.data.goal}`,
  ])
}

main().catch((err) => {
  console.error(err)
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(
      process.env.GITHUB_STEP_SUMMARY,
      `## Spotify challenge sync\n\nFailed: \`${String(err.message || err)}\`\n`,
      { flag: 'a' },
    )
  }
  process.exit(1)
})
