#!/usr/bin/env node
/**
 * Embed challenge-data.json into index.html so the tracker works without JS.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const data = JSON.parse(readFileSync(join(root, 'challenge-data.json'), 'utf8'))
const indexPath = join(root, 'index.html')

function esc(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
}

const goal = data.goal
const released = data.songs.filter((s) => s.status === 'released').length
const pct = Math.min(100, Math.round((released / goal) * 100))

const cards = data.songs
  .map((song) => {
    const n = String(song.id).padStart(2, '0')
    if (song.status === 'released') {
      const title = esc(song.title || 'Out — title soon')
      const listen =
        typeof song.link === 'string' && song.link.startsWith('https://')
          ? `<a href="${esc(song.link)}" target="_blank" rel="noreferrer">
              <span data-lang="en">Listen</span><span data-lang="fr">Écouter</span>
            </a>`
          : `<span>
              <span data-lang="en">Link soon</span><span data-lang="fr">Lien bientôt</span>
            </span>`
      return `<article class="song-card released">
            <div class="song-num">${n}</div>
            <h3 class="song-title">${title}</h3>
            ${listen}
          </article>`
    }

    const hint = String(song.hint || '').trim()
    const title = hint
      ? esc(hint)
      : `<span data-lang="en">Mystery ${n}</span><span data-lang="fr">Mystère ${n}</span>`
    return `<article class="song-card mystery">
            <div class="song-num">${n}</div>
            <h3 class="song-title">${title}</h3>
            <span><span data-lang="en">Coming</span><span data-lang="fr">Bientôt</span></span>
          </article>`
  })
  .join('\n          ')

const block = `              <div class="challenge-count reveal" data-challenge-count>
                <span data-lang="en"><span data-challenge-released>${released}</span> of ${goal}</span>
                <span data-lang="fr"><span data-challenge-released>${released}</span> / ${goal}</span>
              </div>
            </div>

            <div class="challenge-bar" aria-hidden="true"><i data-challenge-bar style="width: ${pct}%"></i></div>
            <div class="song-grid" data-song-grid>
          ${cards}
            </div>
`

const html = readFileSync(indexPath, 'utf8')
const pattern =
  /              <div class="challenge-count reveal" data-challenge-count>[\s\S]*?<div class="song-grid" data-song-grid>[\s\S]*?<\/div>\s*(?=\n\s*<div class="cta-row")/

if (!pattern.test(html)) {
  console.error('Could not find challenge block in index.html')
  process.exit(1)
}

const next = html.replace(pattern, block)
writeFileSync(indexPath, next)
console.log(`Rendered challenge into index.html (${released}/${goal})`)
