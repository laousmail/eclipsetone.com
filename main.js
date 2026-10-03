(() => {
  const STORAGE_KEY = 'eclipsetone-challenge-v1'
  const LANG_KEY = 'eclipsetone-lang'
  // Change this passphrase anytime — only you should know it.
  const ADMIN_PASS = 'eclipsetone-admin'

  const GOAL = 15
  const defaultSongs = Array.from({ length: GOAL }, (_, i) => {
    const n = i + 1
    if (n <= 3) {
      return {
        id: n,
        status: 'released',
        title: '',
        hint: '',
        link: '',
      }
    }
    return {
      id: n,
      status: 'mystery',
      title: '',
      hint: '',
      link: '',
    }
  })

  function loadSongs() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return structuredClone(defaultSongs)
      const parsed = JSON.parse(raw)
      if (!Array.isArray(parsed) || parsed.length !== GOAL) return structuredClone(defaultSongs)
      return parsed
    } catch {
      return structuredClone(defaultSongs)
    }
  }

  function saveSongs(songs) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(songs))
  }

  function mysteryLabel(n, hint, lang) {
    if (hint) return hint
    return lang === 'fr' ? `Mystère ${String(n).padStart(2, '0')}` : `Mystery ${String(n).padStart(2, '0')}`
  }

  function releasedLabel(song, lang) {
    if (song.title) return song.title
    return lang === 'fr' ? 'Sortie — titre bientôt' : 'Out — title soon'
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
          const listen =
            song.link
              ? `<a href="${song.link}" target="_blank" rel="noreferrer">${lang === 'fr' ? 'Écouter' : 'Listen'}</a>`
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

  function escapeHtml(value) {
    return String(value)
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
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

  function fillSlotSelect() {
    const select = document.querySelector('[data-admin-slot]')
    if (!select) return
    const songs = loadSongs()
    select.innerHTML = songs
      .map((song) => {
        const label =
          song.status === 'released'
            ? `#${song.id} · released${song.title ? ` · ${song.title}` : ''}`
            : `#${song.id} · mystery`
        return `<option value="${song.id}">${escapeHtml(label)}</option>`
      })
      .join('')
  }

  function openAdmin() {
    const panel = document.querySelector('[data-admin-panel]')
    if (!panel) return
    const pass = window.prompt('Admin passphrase')
    if (pass !== ADMIN_PASS) {
      window.alert('Wrong passphrase.')
      return
    }
    panel.classList.add('open')
    fillSlotSelect()
  }

  function initAdmin() {
    const openBtn = document.querySelector('[data-admin-open]')
    const form = document.querySelector('[data-admin-form]')
    const resetBtn = document.querySelector('[data-admin-reset]')
    if (openBtn) openBtn.addEventListener('click', openAdmin)

    if (form) {
      form.addEventListener('submit', (event) => {
        event.preventDefault()
        const slot = Number(new FormData(form).get('slot'))
        const title = String(new FormData(form).get('title') || '').trim()
        const link = String(new FormData(form).get('link') || '').trim()
        const hint = String(new FormData(form).get('hint') || '').trim()
        const status = String(new FormData(form).get('status') || 'released')
        const songs = loadSongs()
        const idx = songs.findIndex((s) => s.id === slot)
        if (idx < 0) return
        songs[idx] = {
          ...songs[idx],
          status: status === 'mystery' ? 'mystery' : 'released',
          title,
          link,
          hint,
        }
        saveSongs(songs)
        fillSlotSelect()
        renderChallenge()
        window.alert('Saved on this browser.')
      })
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (!window.confirm('Reset challenge data on this browser?')) return
        localStorage.removeItem(STORAGE_KEY)
        fillSlotSelect()
        renderChallenge()
      })
    }

    if (window.location.hash === '#admin') openAdmin()
  }

  initLang()
  initReveal()
  renderChallenge()
  initAdmin()
})()
