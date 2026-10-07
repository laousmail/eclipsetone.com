(() => {
  const LANG_KEY = 'eclipsetone-lang'
  const THEME_KEY = 'eclipsetone-theme'
  // Resolve against our site CSS (not Google Fonts), so nested pages still hit repo-root JSON.
  const siteStyle =
    document.querySelector('link[rel="stylesheet"][href*="home.css"]')?.href ||
    document.querySelector('link[rel="stylesheet"][href*="styles.css"]')?.href ||
    window.location.href
  const DATA_URL = new URL('challenge-data.json', siteStyle).href

  const GOAL = 15
  let songsCache = null

  function preferredTheme() {
    try {
      const saved = localStorage.getItem(THEME_KEY)
      if (saved === 'light' || saved === 'dark') return saved
    } catch {
      /* private mode */
    }
    try {
      return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
    } catch {
      return 'dark'
    }
  }

  function setTheme(theme) {
    const next = theme === 'light' ? 'light' : 'dark'
    document.documentElement.setAttribute('data-theme', next)
    try {
      localStorage.setItem(THEME_KEY, next)
    } catch {
      /* private mode */
    }
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      const label =
        next === 'dark'
          ? (document.documentElement.lang === 'fr' ? 'Passer en mode clair' : 'Switch to light mode')
          : (document.documentElement.lang === 'fr' ? 'Passer en mode sombre' : 'Switch to dark mode')
      btn.setAttribute('aria-label', label)
      btn.setAttribute('aria-pressed', next === 'dark' ? 'true' : 'false')
    })
  }

  function initTheme() {
    setTheme(preferredTheme())
    document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark'
        setTheme(current === 'dark' ? 'light' : 'dark')
      })
    })
  }

  function normalizeSongs(songs) {
    if (!Array.isArray(songs) || songs.length !== GOAL) {
      console.warn('challenge-data: expected', GOAL, 'songs, got', Array.isArray(songs) ? songs.length : typeof songs)
      return null
    }
    return songs.map((song, i) => ({
      id: Number(song.id) || i + 1,
      status: song.status === 'released' ? 'released' : 'mystery',
      title: song.title || '',
      hint: song.hint || '',
      link: song.link || '',
      spotifyId: song.spotifyId || '',
      year: song.year || '',
      coverUrl: song.coverUrl || '',
    }))
  }

  function isSafeHttps(url) {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'https:'
    } catch {
      return false
    }
  }

  async function loadRemoteSongs() {
    const res = await fetch(DATA_URL, { cache: 'no-cache' })
    if (!res.ok) throw new Error(`challenge-data.json ${res.status}`)
    const data = await res.json()
    return normalizeSongs(data.songs)
  }

  function mysteryLabel(n, hint, lang) {
    if (hint) return hint
    return lang === 'fr' ? `Mystère ${String(n).padStart(2, '0')}` : `Mystery ${String(n).padStart(2, '0')}`
  }

  function releasedLabel(song, lang) {
    if (song.title) return song.title
    return lang === 'fr' ? 'Sortie: titre bientôt' : 'Out: title soon'
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
  }

  function renderChallenge(songs) {
    const grid = document.querySelector('[data-song-grid]')
    const countEl = document.querySelector('[data-challenge-count]')
    const bar = document.querySelector('[data-challenge-bar]')
    if (!grid || !countEl || !bar || !songs) return

    const lang = document.documentElement.lang || 'en'
    const released = songs.filter((s) => s.status === 'released').length

    countEl.innerHTML =
      lang === 'fr'
        ? `<span data-challenge-released>${released}</span> / ${GOAL}`
        : `<span data-challenge-released>${released}</span> of ${GOAL}`

    bar.style.width = `${Math.min(100, (released / GOAL) * 100)}%`
    document.documentElement.style.setProperty('--p', released / GOAL)

    grid.innerHTML = songs
      .map((song) => {
        const n = String(song.id).padStart(2, '0')
        if (song.status === 'released') {
          const title = releasedLabel(song, lang)
          const cover = isSafeHttps(song.coverUrl)
            ? `<img class="song-cover" src="${escapeHtml(song.coverUrl)}" alt="" width="640" height="640" loading="lazy" decoding="async" />`
            : `<div class="song-cover song-cover-fallback" aria-hidden="true"></div>`
          const listen =
            song.link && isSafeHttps(song.link)
              ? `<a href="${escapeHtml(song.link)}" target="_blank" rel="noreferrer">${
                  lang === 'fr' ? 'Écouter' : 'Listen'
                }</a>`
              : `<span>${lang === 'fr' ? 'Lien bientôt' : 'Link soon'}</span>`
          return `<article class="song-card released">
            ${cover}
            <div class="song-body">
              <div class="song-num">${n}</div>
              <h3 class="song-title">${escapeHtml(title)}</h3>
              ${listen}
            </div>
          </article>`
        }

        const title = mysteryLabel(song.id, song.hint, lang)
        return `<article class="song-card mystery" aria-label="${escapeHtml(title)}">
          <div class="song-cover song-cover-fallback" aria-hidden="true"></div>
          <div class="song-body">
            <div class="song-num">${n}</div>
            <h3 class="song-title">${escapeHtml(title)}</h3>
            <span>${lang === 'fr' ? 'Bientôt' : 'Coming'}</span>
          </div>
        </article>`
      })
      .join('')
  }

  async function enhanceChallenge() {
    try {
      const songs = await loadRemoteSongs()
      if (!songs) return
      songsCache = songs
      renderChallenge(songs)
    } catch (error) {
      console.warn('challenge-data fetch failed; keeping server-rendered markup', error)
    }
  }

  function setLang(lang) {
    const next = lang === 'fr' ? 'fr' : 'en'
    document.documentElement.lang = next
    try {
      localStorage.setItem(LANG_KEY, next)
    } catch {
      /* private mode */
    }
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang-btn') === next ? 'true' : 'false')
    })
    // Refresh theme toggle labels for the active language.
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
    // Only refresh challenge DOM when we have a successful fetch cache.
    // Otherwise keep bilingual server-rendered markup (data-lang spans).
    if (songsCache) renderChallenge(songsCache)
  }

  function initLang() {
    let start = 'en'
    try {
      const saved = localStorage.getItem(LANG_KEY)
      if (saved === 'fr' || saved === 'en') start = saved
    } catch {
      /* private mode */
    }
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

  initTheme()
  initLang()
  initReveal()
  initNavMenu()
  enhanceChallenge()
})()
