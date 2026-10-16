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
    setDiscProgress(released / GOAL, { animate: true })

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

  function setDiscProgress(progress, { animate = true } = {}) {
    const root = document.documentElement
    const disc = document.querySelector('[data-eclipse-disc]')
    const value = Math.min(1, Math.max(0, Number(progress) || 0))
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const alreadyLive = disc?.classList.contains('is-live')
    if (!animate || reduceMotion || alreadyLive) {
      root.style.setProperty('--p', String(value))
    } else {
      root.style.setProperty('--p', '0')
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          root.style.setProperty('--p', String(value))
        })
      })
    }
    disc?.classList.add('is-live')
  }

  function initDiscFromMarkup() {
    if (!document.querySelector('[data-eclipse-disc]')) return
    const releasedEl = document.querySelector('[data-challenge-released]')
    const released = Number(releasedEl?.textContent?.trim())
    // No challenge on the page: the eclipse ring is shown complete.
    setDiscProgress(releasedEl && Number.isFinite(released) ? released / GOAL : 1, { animate: true })
  }

  // Soft light that follows the cursor across cards.
  function initSpotlight() {
    if (!window.matchMedia('(hover: hover)').matches) return
    document
      .querySelectorAll('.steps3 li, .rung, .quote, .pkg, .record-card, .ep, .flag, .capture-in')
      .forEach((el) => {
        el.setAttribute('data-spot', '')
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect()
          el.style.setProperty('--mx', `${e.clientX - r.left}px`)
          el.style.setProperty('--my', `${e.clientY - r.top}px`)
        })
      })
  }

  // 3D tilt: cards lean toward the cursor; inner layers sit forward in depth.
  function initTilt() {
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cards = document.querySelectorAll('.record-card, .pkg, .steps3 li, .quote, .rung, .ep')
    cards.forEach((el) => {
      const strong = el.classList.contains('record-card') || el.classList.contains('is-fit')
      const max = strong ? 7 : 9
      const base = ''
      let frame = 0
      el.classList.add('tilt')
      el.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(frame)
        frame = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect()
          const x = (e.clientX - r.left) / r.width - 0.5
          const y = (e.clientY - r.top) / r.height - 0.5
          el.style.transform = `perspective(1100px) rotateX(${(-y * max).toFixed(2)}deg) rotateY(${(x * max).toFixed(2)}deg)${base} translateZ(0)`
        })
      })
      el.addEventListener('pointerleave', () => {
        cancelAnimationFrame(frame)
        el.style.transform = ''
      })
    })
  }

  // Pricing: "What do you have?" picks the best-fit package; Cards/Compare switches view.
  function initPricing() {
    const root = document.querySelector('[data-pricing]')
    if (!root) return
    const names = { mix: 'The Mix', record: 'The Record', signature: 'The Signature Record', release: 'The Release' }
    const select = document.querySelector('[data-package-select]')
    const pickBtns = root.querySelectorAll('[data-pick]')
    function pick(key, fromUser) {
      pickBtns.forEach((b) => b.setAttribute('aria-checked', b.dataset.pick === key ? 'true' : 'false'))
      root.querySelectorAll('[data-plan]').forEach((el) => el.classList.toggle('is-fit', el.dataset.plan === key))
      root.querySelectorAll('.compare tbody tr, .compare tfoot tr').forEach((tr) => {
        const idx = ['mix', 'record', 'signature', 'release'].indexOf(key) + 1
        tr.querySelectorAll('td').forEach((td, i) => td.classList.toggle('is-fit', i + 1 === idx))
      })
      root.setAttribute('data-has-fit', '')
      if (select && fromUser) select.value = names[key]
      // Compare view: slide the table sideways to the chosen plan. The page itself doesn't move.
      const scroller = root.querySelector('.compare-scroll')
      const comparePanel = root.querySelector('[data-view-panel="compare"]')
      if (scroller && comparePanel && !comparePanel.hidden) {
        const col = scroller.querySelector(`thead th[data-plan="${key}"]`)
        const pinned = scroller.querySelector('thead .corner')
        if (col) {
          const left = col.offsetLeft - (pinned ? pinned.offsetWidth : 0) - 8
          scroller.scrollTo({ left: Math.max(0, left), behavior: fromUser ? 'smooth' : 'auto' })
        }
      } else if (fromUser && window.matchMedia('(max-width: 1180px)').matches) {
        const card = root.querySelector(`.pkg[data-plan="${key}"]`)
        if (card) card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }
    }
    pickBtns.forEach((b) => b.addEventListener('click', () => pick(b.dataset.pick, true)))
    // arrow keys move between options, like a native radio group
    root.querySelector('[data-picker]')?.addEventListener('keydown', (e) => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return
      const list = [...pickBtns]
      const i = list.findIndex((b) => b.getAttribute('aria-checked') === 'true')
      const next = list[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : list.length - 1)) % list.length]
      next.focus()
      pick(next.dataset.pick, true)
      e.preventDefault()
    })
    pick('record', false)
    // the guide sets a best fit without scrolling the page
    document.addEventListener('et:pick', (e) => { if (e.detail) pick(e.detail, false) })

    const viewBtns = root.querySelectorAll('[data-view]')
    viewBtns.forEach((b) =>
      b.addEventListener('click', () => {
        viewBtns.forEach((x) => x.setAttribute('aria-selected', x === b ? 'true' : 'false'))
        root.querySelectorAll('[data-view-panel]').forEach((panel) => {
          panel.hidden = panel.dataset.viewPanel !== b.dataset.view
        })
        const current = root.querySelector('[data-pick][aria-checked="true"]')
        if (current && b.dataset.view === 'compare') requestAnimationFrame(() => pick(current.dataset.pick, false))
      }),
    )
  }

  // Buttons with data-need tick that option in the Apply form's checklist.
  function initNeeds() {
    document.querySelectorAll('[data-need]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const box = document.querySelector(`[data-needs] input[value="${CSS.escape(btn.dataset.need)}"]`)
        if (box) box.checked = true
      })
    })
  }

  const WHATSAPP = 'https://wa.me/14384668971'
  const siteRoot = new URL('./', siteStyle).href

  function initPackageButtons() {
    const select = document.querySelector('[data-package-select]')
    if (!select) return
    document.querySelectorAll('[data-package]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute('data-package')
        if (value && [...select.options].some((o) => o.value === value)) select.value = value
      })
    })
  }

  function initApplyForms() {
    document.querySelectorAll('[data-apply-form]').forEach((form) => {
      const error = form.querySelector('[data-form-error]')
      form.addEventListener('submit', (event) => {
        event.preventDefault()
        const data = new FormData(form)
        const name = String(data.get('name') || '').trim()
        const email = String(data.get('email') || '').trim()
        if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
          if (error) error.hidden = false
          return
        }
        if (error) error.hidden = true
        const lines = [
          'EclipseTone application',
          `Name: ${name}`,
          `Email: ${email}`,
          `IG/TikTok: ${data.get('handle') || ''}`,
          `Package: ${data.get('package') || ''}`,
          `Vocals/demo: ${data.get('link') || ''}`,
          `Release date: ${data.get('deadline') || ''}`,
          `References: ${data.get('refs') || ''}`,
          `Needs: ${data.getAll('needs').join(', ') || ''}`,
          `About the project: ${data.get('message') || ''}`,
        ]
        window.open(`${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer')
      })
    })

    const ddpForm = document.getElementById('ddp-form')
    if (ddpForm) {
      ddpForm.addEventListener('submit', (event) => {
        event.preventDefault()
        const data = new FormData(ddpForm)
        const lines = [
          'EclipseTone DDP request ($99 / 12 songs)',
          `Name: ${data.get('name') || ''}`,
          `Email: ${data.get('email') || ''}`,
          `Artist: ${data.get('artist') || ''}`,
          `Songs: ${data.get('tracks') || ''}`,
          `Master links: ${data.get('links') || ''}`,
          `Message: ${data.get('message') || ''}`,
        ]
        window.open(`${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank', 'noopener,noreferrer')
      })
    }
  }

  // Email capture stays hidden until a MailerLite form action URL is pasted into data-ml-action.
  function initCapture() {
    document.querySelectorAll('[data-ml-form]').forEach((form) => {
      const action = (form.getAttribute('data-ml-action') || '').trim()
      if (!isSafeHttps(action)) return
      form.setAttribute('action', action)
      const section = form.closest('[data-capture]')
      if (section) section.hidden = false
    })
  }

  // Before/after pairs live in proof/pairs.json. The section stays hidden while the list is empty.
  async function initBeforeAfter() {
    const section = document.querySelector('[data-ab]')
    const list = section?.querySelector('[data-ab-list]')
    if (!section || !list) return
    try {
      const res = await fetch(new URL('proof/pairs.json', siteRoot).href, { cache: 'no-cache' })
      if (!res.ok) return
      const data = await res.json()
      const pairs = (Array.isArray(data.pairs) ? data.pairs : []).filter(
        (p) => p && p.before && p.after,
      )
      if (!pairs.length) return
      const src = (path) => escapeHtml(new URL(path, siteRoot).href)
      list.innerHTML = pairs
        .map(
          (p) => `<article class="ab-pair">
            ${p.title ? `<h3>${escapeHtml(p.title)}</h3>` : ''}
            <div class="ab-side"><p><span data-lang="en">Before</span><span data-lang="fr">Avant</span></p><audio controls preload="none" src="${src(p.before)}"></audio></div>
            <div class="ab-side after"><p><span data-lang="en">After</span><span data-lang="fr">Après</span></p><audio controls preload="none" src="${src(p.after)}"></audio></div>
          </article>`,
        )
        .join('')
      section.hidden = false
      // Only one track plays at a time.
      list.addEventListener('play', (e) => {
        list.querySelectorAll('audio').forEach((a) => { if (a !== e.target) a.pause() })
      }, true)
    } catch (error) {
      console.warn('before/after pairs unavailable', error)
    }
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
  initDiscFromMarkup()
  initSpotlight()
  initTilt()
  initPricing()
  initPackageButtons()
  initNeeds()
  initApplyForms()
  initCapture()
  initBeforeAfter()
  if (document.querySelector('[data-song-grid]')) enhanceChallenge()
})()
