import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  assignTracksToSlots,
  compareReleaseDate,
  filterChallengeTracks,
} from './challenge-sync.mjs'

const ARTIST = '60GjJwhvGe1eVg98jFPgMp'

function baseData() {
  return {
    goal: 15,
    challengeStart: '2026-01-01',
    songs: Array.from({ length: 15 }, (_, i) => ({
      id: i + 1,
      status: 'mystery',
      title: '',
      hint: '',
      link: '',
      spotifyId: '',
      albumUrl: '',
      releaseDate: '',
      year: '',
      isrc: '',
    })),
  }
}

test('compareReleaseDate sorts ascending', () => {
  const dates = ['2026-09-20', '2026-01-11', '2026-07-10']
  assert.deepEqual(dates.slice().sort(compareReleaseDate), ['2026-01-11', '2026-07-10', '2026-09-20'])
})

test('filterChallengeTracks keeps primary artist and challenge era, sorted', () => {
  const tracks = [
    {
      spotifyId: 'c',
      title: 'Late',
      releaseDate: '2026-09-20',
      primaryArtistId: ARTIST,
    },
    {
      spotifyId: 'a',
      title: 'Early',
      releaseDate: '2026-01-11',
      primaryArtistId: ARTIST,
    },
    {
      spotifyId: 'old',
      title: 'Old',
      releaseDate: '2024-01-01',
      primaryArtistId: ARTIST,
    },
    {
      spotifyId: 'other',
      title: 'Other',
      releaseDate: '2026-02-01',
      primaryArtistId: 'someone-else',
    },
  ]
  const filtered = filterChallengeTracks(tracks, ARTIST, '2026-01-01')
  assert.deepEqual(
    filtered.map((t) => t.spotifyId),
    ['a', 'c'],
  )
})

test('assignTracksToSlots fills mystery slots in release order', () => {
  const data = baseData()
  const tracks = [
    {
      spotifyId: '1',
      title: 'One',
      link: 'https://open.spotify.com/track/1',
      releaseDate: '2026-01-11',
      year: '2026',
      albumUrl: 'https://open.spotify.com/album/1',
      isrc: 'AAA',
    },
    {
      spotifyId: '2',
      title: 'Two',
      link: 'https://open.spotify.com/track/2',
      releaseDate: '2026-07-10',
      year: '2026',
      albumUrl: 'https://open.spotify.com/album/2',
      isrc: 'BBB',
    },
  ]
  const { data: next, added } = assignTracksToSlots(data, tracks)
  assert.equal(added.length, 2)
  assert.equal(next.songs[0].title, 'One')
  assert.equal(next.songs[1].title, 'Two')
  assert.equal(next.songs[0].isrc, 'AAA')
})

test('assignTracksToSlots is idempotent and respects locked slots', () => {
  const data = baseData()
  data.songs[0] = {
    ...data.songs[0],
    status: 'released',
    title: 'One',
    link: 'https://open.spotify.com/track/1',
    spotifyId: '1',
    locked: true,
  }
  const tracks = [
    {
      spotifyId: '1',
      title: 'One renamed',
      link: 'https://open.spotify.com/track/1',
      releaseDate: '2026-01-11',
    },
    {
      spotifyId: '2',
      title: 'Two',
      link: 'https://open.spotify.com/track/2',
      releaseDate: '2026-07-10',
    },
  ]
  const first = assignTracksToSlots(data, tracks)
  assert.equal(first.data.songs[0].title, 'One')
  assert.equal(first.data.songs[1].title, 'Two')
  const second = assignTracksToSlots(first.data, tracks)
  assert.equal(second.added.length, 0)
  assert.equal(second.data.songs[1].title, 'Two')
})
