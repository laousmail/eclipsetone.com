(() => {
  const LANG_KEY = 'eclipsetone-lang'
  const THEME_KEY = 'eclipsetone-theme'
  // Resolve against our site CSS (not Google Fonts), so nested pages still hit repo-root JSON.
  const siteStyle =
    document.querySelector('link[rel="stylesheet"][href*="home.css"]')?.href ||
    window.location.href

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

  function isSafeHttps(url) {
    try {
      const parsed = new URL(url)
      return parsed.protocol === 'https:'
    } catch {
      return false
    }
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
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.setAttribute('aria-pressed', btn.getAttribute('data-lang-btn') === next ? 'true' : 'false')
    })
    // Refresh theme toggle labels for the active language.
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
  }

  // Every page exists in English and in French at its own address. The footer link to the
  // other language (a[hreflang]) is where the EN / FR buttons go.
  function initLang() {
    const page = document.documentElement.lang === 'fr' ? 'fr' : 'en'
    const other = document.querySelector('a[hreflang]:not([hreflang="' + page + '"])')
    const keep = (lang) => { try { localStorage.setItem(LANG_KEY, lang) } catch { /* private mode */ } }
    let want = ''
    try { want = localStorage.getItem(LANG_KEY) || '' } catch { /* private mode */ }
    // First visit from a French-speaking browser: French. After that, the visitor's own choice.
    if (!want) want = /^fr\b/i.test(navigator.language || '') ? 'fr' : page
    if (want !== page && other && other.getAttribute('hreflang') === want) {
      location.replace(other.href + location.hash)
      return
    }
    setLang(page)
    document.querySelectorAll('[data-lang-btn]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const to = btn.getAttribute('data-lang-btn')
        if (to === page) return
        keep(to)
        if (other) location.href = other.href + location.hash
        else setLang(to)
      })
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
    setDiscProgress(1, { animate: true })
  }

  // Prices page: physical copies quantity picker. Updates the total and the WhatsApp order link.
  function initMerch() {
    const money = (n) => (window.etMoney ? window.etMoney(n) : '$' + n)
    const cad = (n) => '$' + Number(n).toLocaleString('en-US') + ' CAD'
    document.querySelectorAll('[data-merch]').forEach((card) => {
      const chips = [...card.querySelectorAll('.qty')]
      const order = card.querySelector('[data-merch-order]')
      const set = (chip) => {
        chips.forEach((c) => c.setAttribute('aria-pressed', String(c === chip)))
        const q = +chip.dataset.qty, t = +chip.dataset.total
        card.querySelector('[data-merch-total]').textContent = money(t)
        card.querySelector('[data-merch-each]').textContent = money(Math.round((t / q) * 100) / 100)
        card.querySelectorAll('[data-merch-qty]').forEach((el) => { el.textContent = q })
        const msg = `Hi EclipseTone, I'd like ${q} ${card.dataset.wa} (${cad(t)}). My name: `
        order.href = 'https://wa.me/14384668971?text=' + encodeURIComponent(msg)
      }
      chips.forEach((c) => c.addEventListener('click', () => set(c)))
      document.addEventListener('et:currency', () => set(chips.find((c) => c.getAttribute('aria-pressed') === 'true') || chips[0]))
      set(chips.find((c) => c.getAttribute('aria-pressed') === 'true') || chips[0])
    })
  }

  // Prices page: highlight the jump-bar link for the section on screen.
  function initJumpbar() {
    const links = [...document.querySelectorAll('.jumpbar a')]
    if (!links.length || !('IntersectionObserver' in window)) return
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]))
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return
        links.forEach((a) => a.classList.remove('on'))
        const a = map.get(e.target.id)
        if (a) { a.classList.add('on'); a.scrollIntoView({ block: 'nearest', inline: 'nearest' }) }
      })
    }, { rootMargin: '-35% 0px -55% 0px' })
    map.forEach((_, id) => { const el = document.getElementById(id); if (el) io.observe(el) })
  }

  const siteRoot = new URL('./', siteStyle).href



  // Email capture stays hidden until a MailerLite form action URL is pasted into data-ml-action.
  function initCapture() {
    document.querySelectorAll('[data-ml-form]').forEach((form) => {
      const action = (form.getAttribute('data-ml-action') || (window.ET_CONFIG || {}).mailerlite || '').trim()
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

    // Escape closes the menu and puts focus back on the Menu button
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape' || !checkbox.checked) return
      checkbox.checked = false
      toggle.setAttribute('aria-expanded', 'false')
      toggle.focus()
    })
  }

  // Questions button: hides while scrolling down and near the end (the closing section has its own WhatsApp link).
  function initHelpFab() {
    const fab = document.querySelector('.help-fab')
    if (!fab) return
    let last = window.scrollY
    window.addEventListener('scroll', () => {
      const y = window.scrollY
      const nearEnd = y + innerHeight > document.documentElement.scrollHeight - 200
      if (Math.abs(y - last) < 8) return
      fab.classList.toggle('is-away', nearEnd || (y > last && y > 300))
      last = y
    }, { passive: true })
  }

  // Phone bar: shows after the hero, hides near the price form.
  function initMobileBar() {
    const bar = document.querySelector('[data-mbar]')
    const hero = document.querySelector('.lp-hero .lp-actions, .ot-hero .cta, .hero, .page-hero')
    if (!bar) return
    document.body.classList.add('has-mbar')
    const form = document.querySelector('#start')
    let pastHero = false, atForm = false
    const set = () => { const on = pastHero && !atForm; bar.classList.toggle('is-on', on); bar.setAttribute('aria-hidden', String(!on)) }
    if ('IntersectionObserver' in window) {
      if (hero) new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; set() }).observe(hero)
      else pastHero = true
      if (form) new IntersectionObserver(([e]) => { atForm = e.isIntersecting; set() }, { rootMargin: '0px 0px -30% 0px' }).observe(form)
    }
    set()
  }

  // Choice chips get the shared press style; a tiny tap on phones for main buttons.
  function initPress() {
    const CHIPS = '.svc-pick,.ans,.qty,.chip-links a,.team-card,.sf-switch,.mbar-q'
    document.querySelectorAll(CHIPS).forEach((el) => el.classList.add('chipfx'))
    new MutationObserver(() => document.querySelectorAll(CHIPS).forEach((el) => el.classList.add('chipfx'))).observe(document.body, { childList: true, subtree: true })
    document.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.btn:not(.ghost):not(.help),.pill,.mbar-go')
      if (el && !el.disabled && e.pointerType === 'touch' && navigator.vibrate) navigator.vibrate(8)
    }, { passive: true })
  }

  // Light depth: hero layers drift at different speeds on scroll. Off when reduced motion is on.
  function initDepth() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const layers = [...document.querySelectorAll('[data-depth]')]
    if (!layers.length) return
    let ticking = false
    const paint = () => {
      ticking = false
      const y = Math.min(window.scrollY, innerHeight)
      layers.forEach((l) => { l.style.translate = `0 ${(y * parseFloat(l.dataset.depth)).toFixed(1)}px` })
    }
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paint) } }, { passive: true })
  }

  // Header: invisible at the very top, a bar with a hairline once the page moves.
  function initNavState() {
    const set = () => document.documentElement.classList.toggle('is-scrolled', scrollY > 8)
    set()
    addEventListener('scroll', set, { passive: true })
  }

  // "Voice memo in. Record out.": the stage stays pinned while the visitor scrolls, and the scroll
  // builds the record (the waveform grows, the steps light up in turn). Native scrolling, never
  // captured. Without JS, with reduced motion, or on a screen too short to pin it, the page shows
  // the finished record with every step visible.
  function initPin() {
    const sec = document.querySelector('[data-pin]')
    if (!sec || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const stage = sec.querySelector('[data-stage]')
    const view = sec.querySelector('.lp-pin-view')
    const track = sec.querySelector('.lp-pin-track')
    const steps = [...sec.querySelectorAll('.lp-steps li')]
    const phaseEl = sec.querySelector('[data-phase]')
    const pctEl = sec.querySelector('[data-pct]')
    const phases = (sec.querySelector('[data-phases]')?.textContent || '').split('|').filter(Boolean)
    const top = () => (document.querySelector('.nav')?.offsetHeight || 64) + 8
    let live = false
    let ticking = false

    const paint = () => {
      ticking = false
      if (!live) return
      const r = track.getBoundingClientRect()
      const raw = Math.min(Math.max((top() - r.top) / (r.height - view.offsetHeight), 0), 1)
      const p = Math.min(raw / 0.85, 1) // the last stretch holds the finished record
      stage.style.setProperty('--p', p.toFixed(3))
      const step = Math.min(steps.length - 1, Math.floor(p * steps.length))
      steps.forEach((li, i) => li.classList.toggle('is-on', i === step))
      const phase = phases[Math.min(phases.length - 1, Math.floor(p * phases.length))]
      if (phase && phaseEl.textContent !== phase) phaseEl.textContent = phase
      pctEl.textContent = `${Math.round(p * 100)}%`
    }
    // Pin only when the whole scene fits on screen while pinned
    const setup = () => {
      sec.classList.add('is-live')
      live = view.offsetHeight <= innerHeight - top() - 8
      if (!live) {
        sec.classList.remove('is-live')
        stage.style.removeProperty('--p')
      }
      paint()
    }
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(paint) } }, { passive: true })
    addEventListener('resize', setup, { passive: true })
    setup()
  }

  // Hero headline: the last words rotate (song, single, EP, album). The page HTML holds only the
  // first phrase, so search engines and screen readers get one clean headline.
  function initSwap() {
    const swap = document.querySelector('.lp-swap[data-swap]')
    if (!swap) return
    const swoosh = swap.closest('h1')?.querySelector('.lp-swoosh')
    const words = [swap.textContent.trim(), ...swap.dataset.swap.split('|')]
    swap.textContent = ''
    const items = words.map((w, i) => {
      const s = document.createElement('span')
      s.className = 'lp-swap-item' + (i ? '' : ' is-on')
      s.textContent = w
      if (i) s.setAttribute('aria-hidden', 'true')
      swap.append(s)
      return s
    })
    if (swoosh) swap.append(swoosh)
    let at = 0
    // The line fits the phrase on screen, so the headline stays centred with no gap
    const fit = () => { swap.style.width = `${items[at].getBoundingClientRect().width}px` }
    document.fonts?.ready.then(fit)
    fit()
    addEventListener('resize', fit, { passive: true })
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setInterval(() => {
      if (document.hidden) return
      items[at].classList.remove('is-on')
      at = (at + 1) % items.length
      fit()
      const next = items[at]
      next.classList.add('is-next')        // start just below, without animating there
      void next.offsetWidth
      next.classList.remove('is-next')
      next.classList.add('is-on')
    }, 2600)
  }

  initSwap()
  initNavState()
  initPin()
  initTheme()
  initHelpFab()
  initPress()
  initMobileBar()
  initDepth()
  initLang()
  initReveal()
  initNavMenu()
  initDiscFromMarkup()
  initJumpbar()
  initMerch()
  initCapture()
  initBeforeAfter()
})()
