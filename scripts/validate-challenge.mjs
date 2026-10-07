#!/usr/bin/env node
/**
 * Validate challenge-data.json schema for the 15-song tracker.
 * Exit 1 on failure.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = join(root, 'challenge-data.json')
const HTTPS = /^https:\/\//

function fail(msg) {
  console.error(`challenge-data invalid: ${msg}`)
  process.exit(1)
}

const data = JSON.parse(readFileSync(dataPath, 'utf8'))
const goal = Number(data.goal)
if (!Number.isInteger(goal) || goal < 1) fail('goal must be a positive integer')

if (!Array.isArray(data.songs)) fail('songs must be an array')
if (data.songs.length !== goal) fail(`expected ${goal} songs, got ${data.songs.length}`)

const ids = new Set()
for (const song of data.songs) {
  const id = Number(song.id)
  if (!Number.isInteger(id) || id < 1 || id > goal) fail(`bad id ${song.id}`)
  if (ids.has(id)) fail(`duplicate id ${id}`)
  ids.add(id)

  if (song.status !== 'released' && song.status !== 'mystery') {
    fail(`song ${id}: status must be released|mystery`)
  }

  if (song.status === 'released') {
    if (!String(song.title || '').trim()) fail(`song ${id}: released needs title`)
    if (!HTTPS.test(String(song.link || ''))) fail(`song ${id}: released needs https:// link`)
  }

  if (song.link && !HTTPS.test(String(song.link))) {
    fail(`song ${id}: link must be https:// when present`)
  }

  if (song.coverUrl && !HTTPS.test(String(song.coverUrl))) {
    fail(`song ${id}: coverUrl must be https:// when present`)
  }
}

for (let i = 1; i <= goal; i += 1) {
  if (!ids.has(i)) fail(`missing id ${i}`)
}

const released = data.songs.filter((s) => s.status === 'released').length
console.log(`OK: ${released}/${goal} released · ${dataPath}`)
