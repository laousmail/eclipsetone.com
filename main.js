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
    setDiscProgress(1, { animate: true })
  }

  // Pricing: "What do you have?" picks the best-fit package; Cards/Compare switches view.
  function initPricing() {
    const root = document.querySelector('[data-pricing]')
    if (!root) return
    const names = { mix: 'Mixing', record: 'Full Song', signature: 'Song + Songwriting', release: 'Song + Launch' }
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
  }

  // Questions button: hides while scrolling down, comes back when scrolling up or near the end.
  function initHelpFab() {
    const fab = document.querySelector('.help-fab')
    if (!fab) return
    let last = window.scrollY
    window.addEventListener('scroll', () => {
      const y = window.scrollY
      const nearEnd = y + innerHeight > document.documentElement.scrollHeight - 200
      if (Math.abs(y - last) < 8) return
      fab.classList.toggle('is-away', y > last && y > 300 && !nearEnd)
      last = y
    }, { passive: true })
  }

  // Hero "Hear one of our songs": loads YouTube only when tapped (privacy-friendly, fast).
  function initListen() {
    document.querySelectorAll('[data-listen-play]').forEach((btn) => btn.addEventListener('click', () => {
      const id = btn.dataset.yt
      const wrap = btn.closest('[data-listen]')
      wrap.innerHTML = `<div class="listen-frame"><iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0" title="EclipseTone song" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe></div>`
      document.dispatchEvent(new CustomEvent('et:track', { detail: 'hero-listen' }))
    }))
  }

  // Phone bar: shows after the hero, hides near the price form.
  function initMobileBar() {
    const bar = document.querySelector('[data-mbar]')
    const hero = document.querySelector('.hero, .page-hero')
    if (!bar) return
    document.body.classList.add('has-mbar')
    const form = document.querySelector('#booking, #book')
    let pastHero = false, atForm = false
    const set = () => { const on = pastHero && !atForm; bar.classList.toggle('is-on', on); bar.setAttribute('aria-hidden', String(!on)) }
    if ('IntersectionObserver' in window) {
      if (hero) new IntersectionObserver(([e]) => { pastHero = !e.isIntersecting; set() }).observe(hero)
      else pastHero = true
      if (form) new IntersectionObserver(([e]) => { atForm = e.isIntersecting; set() }, { rootMargin: '0px 0px -30% 0px' }).observe(form)
    }
    set()
  }

  // Satisfying clicks: a ripple where you press, a tiny tap on phones for main buttons.
  function initPress() {
    const CHIPS = '.sf-pick,.sf-ans,.qty,.mo,.chip-links a,.team-card,.rows a,.sf-switch,.listen-btn,.cfg-pack-in,.cfg-extra,.mbar-q'
    document.querySelectorAll(CHIPS).forEach((el) => el.classList.add('chipfx'))
    new MutationObserver(() => document.querySelectorAll(CHIPS).forEach((el) => el.classList.add('chipfx'))).observe(document.body, { childList: true, subtree: true })
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    document.addEventListener('pointerdown', (e) => {
      const el = e.target.closest('.btn,.pill,.mbar-go,.chipfx')
      if (!el || el.disabled) return
      const r = el.getBoundingClientRect()
      const size = Math.max(r.width, r.height) * 2.2
      const rip = document.createElement('span')
      rip.className = 'rip'
      rip.style.cssText = `width:${size}px;height:${size}px;left:${e.clientX - r.left - size / 2}px;top:${e.clientY - r.top - size / 2}px`
      el.appendChild(rip)
      setTimeout(() => rip.remove(), 650)
      if (e.pointerType === 'touch' && el.matches('.btn:not(.ghost):not(.help),.pill,.mbar-go') && navigator.vibrate) navigator.vibrate(8)
    }, { passive: true })
  }

  // Main buttons: a small magnetic pull toward the cursor, and a pop when they first appear.
  function initCtas() {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
      document.addEventListener('pointermove', (e) => {
        const btn = e.target.closest && e.target.closest('.btn.cta-go')
        document.querySelectorAll('.btn.cta-go[data-mag]').forEach((b) => { if (b !== btn) { b.style.removeProperty('--mx'); b.style.removeProperty('--my'); b.removeAttribute('data-mag') } })
        if (!btn) return
        const r = btn.getBoundingClientRect()
        const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2)
        const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2)
        btn.style.setProperty('--mx', `${(dx * 4).toFixed(1)}px`)
        btn.style.setProperty('--my', `${(dy * 3).toFixed(1)}px`)
        btn.setAttribute('data-mag', '')
      }, { passive: true })
    }
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => entries.forEach((en) => {
        if (!en.isIntersecting) return
        en.target.classList.add('cta-pop')
        io.unobserve(en.target)
        setTimeout(() => en.target.classList.remove('cta-pop'), 800)
      }), { threshold: 0.9 })
      document.querySelectorAll('.btn.cta-breathe:not(.mbar-go), .pk .btn.cta-go').forEach((b) => io.observe(b))
    }
  }

  initTheme()
  initHelpFab()
  initPress()
  initCtas()
  initListen()
  initMobileBar()
  initLang()
  initReveal()
  initNavMenu()
  initDiscFromMarkup()
  initPricing()
  initJumpbar()
  initMerch()
  initCapture()
  initBeforeAfter()
})()
