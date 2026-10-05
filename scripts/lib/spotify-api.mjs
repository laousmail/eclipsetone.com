/**
 * Spotify Web API client (client-credentials) with retry/backoff.
 */

import { sleep } from './challenge-sync.mjs'

export async function fetchWithRetry(url, options = {}, { retries = 3 } = {}) {
  let lastError
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const res = await fetch(url, options)
    if (res.ok) return res

    const retryable = res.status === 429 || res.status >= 500
    if (!retryable || attempt === retries - 1) {
      const body = await res.text().catch(() => '')
      throw new Error(`${url} → ${res.status} ${body.slice(0, 200)}`)
    }

    const retryAfter = Number(res.headers.get('retry-after'))
    const waitMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 500 * 2 ** attempt
    await sleep(waitMs)
    lastError = new Error(`${url} → ${res.status}`)
  }
  throw lastError
}

export async function getClientCredentialsToken(clientId, clientSecret, fetchImpl = fetchWithRetry) {
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
  const res = await fetchImpl('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })
  const json = await res.json()
  if (!json.access_token) throw new Error('Spotify token response missing access_token')
  return json.access_token
}

/**
 * Load singles/albums then tracks for an artist. Returns normalized track records.
 */
export async function listArtistTracks(artistId, token, fetchImpl = fetchWithRetry, { market = 'CA' } = {}) {
  const headers = { Authorization: `Bearer ${token}` }
  const albums = []
  let url =
    `https://api.spotify.com/v1/artists/${artistId}/albums` +
    `?include_groups=single,album&market=${market}&limit=50`

  while (url) {
    const res = await fetchImpl(url, { headers })
    const json = await res.json()
    albums.push(...(json.items || []))
    url = json.next || null
  }

  // Dedupe albums by id
  const uniqueAlbums = [...new Map(albums.map((a) => [a.id, a])).values()]
  const tracks = []

  for (const album of uniqueAlbums) {
    let trackUrl = `https://api.spotify.com/v1/albums/${album.id}/tracks?market=${market}&limit=50`
    while (trackUrl) {
      const res = await fetchImpl(trackUrl, { headers })
      const json = await res.json()
      for (const item of json.items || []) {
        const primary = item.artists?.[0]
        tracks.push({
          spotifyId: item.id,
          title: item.name,
          link: `https://open.spotify.com/track/${item.id}`,
          albumUrl: album.external_urls?.spotify || `https://open.spotify.com/album/${album.id}`,
          releaseDate: album.release_date || '',
          year: String(album.release_date || '').slice(0, 4),
          isrc: item.external_ids?.isrc || '',
          primaryArtistId: primary?.id || '',
        })
      }
      trackUrl = json.next || null
    }
  }

  // Album tracks endpoint often omits external_ids.isrc — enrich via tracks API in batches of 50
  const missingIsrc = tracks.filter((t) => !t.isrc).map((t) => t.spotifyId)
  for (let i = 0; i < missingIsrc.length; i += 50) {
    const chunk = missingIsrc.slice(i, i + 50)
    const res = await fetchImpl(`https://api.spotify.com/v1/tracks?market=${market}&ids=${chunk.join(',')}`, {
      headers,
    })
    const json = await res.json()
    for (const item of json.tracks || []) {
      if (!item) continue
      const row = tracks.find((t) => t.spotifyId === item.id)
      if (row) row.isrc = item.external_ids?.isrc || row.isrc
    }
  }

  return tracks
}
