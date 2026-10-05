#!/usr/bin/env node
/**
 * Manually set one challenge slot in challenge-data.json.
 *
 * Usage:
 *   node scripts/set-challenge-slot.mjs --slot=4 --status=released --title="Song" --link=https://...
 *   node scripts/set-challenge-slot.mjs --slot=4 --status=mystery --hint="Teaser"
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = join(root, 'challenge-data.json')
const HTTPS = /^https:\/\//

function arg(name) {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`))
  return hit ? hit.slice(name.length + 3) : ''
}

const slot = Number(arg('slot'))
const status = arg('status') || 'released'
const title = arg('title').trim()
const link = arg('link').trim()
const hint = arg('hint').trim()

if (!Number.isInteger(slot) || slot < 1) {
  console.error('Usage: --slot=N --status=released|mystery [--title=] [--link=] [--hint=]')
  process.exit(1)
}

if (status !== 'released' && status !== 'mystery') {
  console.error('status must be released or mystery')
  process.exit(1)
}

if (status === 'released') {
  if (!title) {
    console.error('released slots require --title')
    process.exit(1)
  }
  if (!HTTPS.test(link)) {
    console.error('released slots require --link=https://...')
    process.exit(1)
  }
}

const data = JSON.parse(readFileSync(dataPath, 'utf8'))
const song = data.songs.find((s) => Number(s.id) === slot)
if (!song) {
  console.error(`No slot ${slot}`)
  process.exit(1)
}

if (song.locked) {
  console.error(`Slot ${slot} is locked; edit challenge-data.json manually if needed.`)
  process.exit(1)
}

song.status = status
song.title = status === 'released' ? title : ''
song.link = status === 'released' ? link : ''
song.hint = hint
if (status === 'mystery') {
  // Keep spotify metadata empty for pure mystery; do not invent ids.
  song.spotifyId = song.spotifyId || ''
}

data.updatedAt = new Date().toISOString().slice(0, 10)
writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`)
console.log(`Updated slot #${slot} → ${status}${title ? ` · ${title}` : ''}`)
