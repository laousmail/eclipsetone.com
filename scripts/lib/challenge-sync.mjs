/**
 * Pure helpers for Spotify → challenge slot assignment.
 */

export const ARTIST_ID = '60GjJwhvGe1eVg98jFPgMp'
export const DEFAULT_CHALLENGE_START = '2026-01-01'

export function challengeStartDate(data) {
  return data.challengeStart || DEFAULT_CHALLENGE_START
}

/** @param {string} a @param {string} b */
export function compareReleaseDate(a, b) {
  return String(a || '').localeCompare(String(b || ''))
}

/**
 * Keep only tracks whose primary artist is Laousmail and releaseDate >= challengeStart.
 * @param {Array<{spotifyId:string,title:string,releaseDate:string,primaryArtistId?:string}>} tracks
 */
export function filterChallengeTracks(tracks, artistId = ARTIST_ID, start = DEFAULT_CHALLENGE_START) {
  return tracks
    .filter((t) => t.primaryArtistId === artistId)
    .filter((t) => String(t.releaseDate || '') >= start)
    .slice()
    .sort((a, b) => compareReleaseDate(a.releaseDate, b.releaseDate) || a.spotifyId.localeCompare(b.spotifyId))
}

/**
 * Assign sorted tracks into mystery (unlocked) slots in order.
 * Never overwrites locked or already-released slots. Never removes releases.
 * @returns {{ data: object, added: string[], warnings: string[] }}
 */
export function assignTracksToSlots(data, sortedTracks) {
  const warnings = []
  const added = []
  const songs = data.songs.map((s) => ({ ...s }))
  const known = new Set(songs.filter((s) => s.spotifyId).map((s) => s.spotifyId))

  for (const track of sortedTracks) {
    if (known.has(track.spotifyId)) continue

    const existing = songs.find((s) => s.spotifyId === track.spotifyId)
    if (existing) continue

    const slot = songs.find((s) => s.status === 'mystery' && !s.locked)
    if (!slot) {
      warnings.push(`No mystery slots left for "${track.title}" (${track.spotifyId})`)
      break
    }

    slot.status = 'released'
    slot.title = track.title
    slot.link = track.link
    slot.spotifyId = track.spotifyId
    slot.albumUrl = track.albumUrl || ''
    slot.coverUrl = track.coverUrl || ''
    slot.releaseDate = track.releaseDate || ''
    slot.year = track.year || String(track.releaseDate || '').slice(0, 4)
    slot.isrc = track.isrc || ''
    slot.hint = ''
    known.add(track.spotifyId)
    added.push(`#${slot.id} ${track.title}`)
  }

  // Warn if a previously released spotifyId disappeared from the feed
  for (const song of songs) {
    if (song.status === 'released' && song.spotifyId && !sortedTracks.some((t) => t.spotifyId === song.spotifyId)) {
      // Only warn for challenge-era ids we expect to still see; skip if track list is empty (API failure)
      if (sortedTracks.length > 0) {
        warnings.push(`Released slot #${song.id} (${song.title}) not found in latest Spotify list — left unchanged`)
      }
    }
  }

  return {
    data: {
      ...data,
      challengeStart: challengeStartDate(data),
      updatedAt: new Date().toISOString().slice(0, 10),
      songs,
    },
    added,
    warnings,
  }
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
