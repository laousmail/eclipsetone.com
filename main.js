(() => {
  const LANG_KEY = 'eclipsetone-lang'
  const LEGACY_OVERRIDE_KEY = 'eclipsetone-challenge-v1'
  const styleHref = document.querySelector('link[rel="stylesheet"]')?.href
  const DATA_URL = new URL('challenge-data.json', styleHref || window.location.href).href

  const GOAL = 15
  let songsCache = null

  // Clear old browser-only overrides so everyone sees shared challenge-data.json
  try {
    localStorage.removeItem(LEGACY_OVERRIDE_KEY)
  } catch {
    /* ignore */
  }

  function emptySongs() {
    return Array.from({ length: GOAL }, (_, i) => ({
      id: i + 1,
      status: 'mystery',
      title: '',
      hint: '',
      link: '',
      spotifyId: '',
      year: '',
    }))
  }

  function normalizeSongs(songs) {
    if (!Array.isArray(songs) || songs.length !== GOAL) return null
    return songs.map((song, i) => ({
      id: Number(song.id) || i + 1,
      status: song.status === 'released' ? 'released' : 'mystery',
      title: song.title || '',
      hint: song.hint || '',
      link: song.link || '',
      spotifyId: song.spotifyId || '',
      year: song.year || '',
    }))
  }

  async function loadRemoteSongs() {
    const res = await fetch(DATA_URL, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`challenge-data.json ${res.status}`)
    const data = await res.json()
    return normalizeSongs(data.songs)
  }

  async function ensureSongs() {
    if (songsCache) return songsCache
    try {
      songsCache = (await loadRemoteSongs()) || emptySongs()
    } catch {
      songsCache = emptySongs()
    }
    return songsCache
  }

  function loadSongs() {
    return songsCache || emptySongs()
  }

  function mysteryLabel(n, hint, lang) {
    if (hint) return hint
    return lang === 'fr' ? `Mystère ${String(n).padStart(2, '0')}` : `Mystery ${String(n).padStart(2, '0')}`
  }

  function releasedLabel(song, lang) {
    if (song.title) return song.title
    return lang === 'fr' ? 'Sortie — titre bientôt' : 'Out — title soon'
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
  }

  function renderChallenge() {
    const grid = document.querySelector('[data-song-grid]')
    const countEl = document.querySelector('[data-challenge-count]')
    const bar = document.querySelector('[data-challenge-bar]')
    if (!grid || !countEl || !bar) return

    const lang = document.documentElement.lang || 'en'
    const songs = loadSongs()
    const released = songs.filter((s) => s.status === 'released').length

    countEl.innerHTML =
      lang === 'fr'
        ? `<span>${released}</span> / ${GOAL}`
        : `<span>${released}</span> of ${GOAL}`

    bar.style.width = `${Math.min(100, (released / GOAL) * 100)}%`

    grid.innerHTML = songs
      .map((song) => {
        if (song.status === 'released') {
          const title = releasedLabel(song, lang)
          const listen = song.link
            ? `<a href="${escapeHtml(song.link)}" target="_blank" rel="noreferrer">${
                lang === 'fr' ? 'Écouter' : 'Listen'
              }</a>`
            : `<span>${lang === 'fr' ? 'Lien bientôt' : 'Link soon'}</span>`
          return `<article class="song-card released">
            <div class="song-num">${String(song.id).padStart(2, '0')}</div>
            <h3 class="song-title">${escapeHtml(title)}</h3>
            ${listen}
          </article>`
        }

        const title = mysteryLabel(song.id, song.hint, lang)
        return `<article class="song-card mystery">
          <div class="song-num">${String(song.id).padStart(2, '0')}</div>
          <h3 class="song-title">${escapeHtml(title)}</h3>
          <span>${lang === 'fr' ? 'Bientôt' : 'Coming'}</span>
        </article>`
      })
      .join('')
  }

  function setLang(lang) {
    const next = lang === 'fr' ? 'fr' : 'en'
    document.documentElement.lang = next
    localStorage.setItem(LANG_KEY, next)
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang-btn') === next ? 'true' : 'false')
    })
    renderChallenge()
  }

  function initLang() {
    const saved = localStorage.getItem(LANG_KEY)
    const start = saved === 'fr' || saved === 'en' ? saved : 'en'
    setLang(start)
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-btn')))
    })
  }

  function initReveal() {
    const nodes = document.querySelectorAll('.reveal')
    if (!nodes.length) return
    if (!('IntersectionObserver' in window)) {
      nodes.forEach((node) => node.classList.add('in'))
      return
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('in')
            observer.unobserve(entry.target)
          }
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    )
    nodes.forEach((node) => observer.observe(node))
  }

  function initNavMenu() {
    const checkbox = document.querySelector('.nav-checkbox')
    const toggle = document.querySelector('.nav-toggle')
    if (!checkbox || !toggle) return

    toggle.addEventListener('click', (event) => {
      event.preventDefault()
      checkbox.checked = !checkbox.checked
      toggle.setAttribute('aria-expanded', checkbox.checked ? 'true' : 'false')
    })
    toggle.setAttribute('aria-expanded', 'false')
    toggle.setAttribute('aria-controls', 'site-nav-links')

    const links = document.querySelector('.nav-links')
    if (links && !links.id) links.id = 'site-nav-links'

    document.querySelectorAll('.nav-links a').forEach((link) => {
      link.addEventListener('click', () => {
        checkbox.checked = false
        toggle.setAttribute('aria-expanded', 'false')
      })
    })
  }

  initLang()
  initReveal()
  initNavMenu()
  ensureSongs().then(renderChallenge)
})()
