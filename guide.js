// "Guide me" flow: three quick questions, then a plan with only what the artist needs.
// Anyone can skip it and browse the full page. Works on any page that has
// a [data-guide-open] button. The finished plan is remembered on this device
// and pre-fills the Apply form and the pricing picker.
;(() => {
  const openers = document.querySelectorAll('[data-guide-open]')
  if (!openers.length) return

  const L = (en, fr) => `<span data-lang="en">${en}</span><span data-lang="fr">${fr}</span>`
  const KEY = 'eclipsetone-plan'
  const onServices = !!document.querySelector('[data-pricing]')
  const pkgHref = onServices ? '#packages' : 'services/'
  const bookHref = '#booking'

  const STAGES = [
    { id: 'idea', en: 'Just an idea', fr: 'Juste une idée', den: 'A feeling, a hook, a few words.', dfr: 'Un feeling, un hook, quelques mots.' },
    { id: 'vocals', en: 'Vocals or lyrics', fr: 'Des voix ou des paroles', den: 'A voice memo, a demo or written lyrics.', dfr: 'Un mémo vocal, une démo ou des paroles écrites.' },
    { id: 'beat', en: 'A finished beat', fr: 'Une prod finie', den: 'The music is done. It needs a pro mix.', dfr: 'La musique est faite. Il faut un mix pro.' },
    { id: 'done', en: 'Finished masters', fr: 'Des masters finis', den: 'The song is done. I need the rest.', dfr: 'La chanson est finie. Il me faut le reste.' },
  ]
  const COUNTS = [
    { id: '1', en: 'One song', fr: 'Une chanson', den: 'A single.', dfr: 'Un single.' },
    { id: '3', en: 'Two or three', fr: 'Deux ou trois', den: 'An EP or a short project.', dfr: 'Un EP ou un court projet.' },
    { id: 'album', en: 'An album', fr: 'Un album', den: 'Four songs or more.', dfr: 'Quatre chansons ou plus.' },
  ]
  const EXTRAS = [
    { id: 'physical', need: 'Physical products (CD, vinyl, cassette, USB-C)', en: 'CDs, vinyl, cassettes, USB‑C', fr: 'CD, vinyles, cassettes, USB‑C' },
    { id: 'launch', need: 'Release plan and launch support', en: 'A release plan and launch', fr: 'Un plan de sortie et lancement' },
    { id: 'social', need: 'Social media setup', en: 'Social media setup', fr: 'Réseaux sociaux' },
    { id: 'website', need: 'Website design', en: 'My own website', fr: 'Mon propre site web' },
    { id: 'media', need: 'Photo and video', en: 'Photo and video', fr: 'Photo et vidéo' },
    { id: 'management', need: 'Artist management', en: 'Artist management', fr: 'Gestion d’artiste' },
  ]
  const PACKS = {
    mix: { name: 'The Mix', price: '$350', en: 'Your beat, mixed and mastered to sound expensive.', fr: 'Ta prod, mixée et masterisée pour sonner cher.' },
    record: { name: 'The Record', price: '$599', en: 'Your vocals or lyrics turned into a finished song. First draft in 7 days.', fr: 'Tes voix ou paroles transformées en chanson finie. Première version en 7 jours.' },
    signature: { name: 'The Signature Record', price: '$997', en: 'We write it with you in a 2-hour session, then build the whole record.', fr: 'On l’écrit avec toi en session de 2 h, puis on construit tout le disque.' },
    release: { name: 'The Release', price: '$2,000', en: 'Written, produced and launched: release plan, promo pack and launch-week support.', fr: 'Écrite, produite et lancée : plan de sortie, kit promo et support de lancement.' },
    ep: { name: 'The EP', price: '$1,597', en: 'Three Records with one sound. You save $200.', fr: 'Trois Records avec un seul son. Tu économises 200 $.' },
  }

  let state = { stage: null, count: null, extras: [] }
  let step = 0

  // ---------- plan logic ----------
  function buildPlan(st) {
    const extras = [...st.extras]
    let pack = null
    let note = null
    if (st.stage === 'beat') pack = 'mix'
    if (st.stage === 'vocals') pack = st.count === '3' ? 'ep' : 'record'
    if (st.stage === 'idea') pack = extras.includes('launch') ? 'release' : 'signature'
    if (pack === 'release') extras.splice(extras.indexOf('launch'), 1) // already included
    if (st.count === 'album' && st.stage !== 'done') {
      note = L('For an album we build one plan with album pricing on your quote.', 'Pour un album, on bâtit un seul plan avec un prix album sur ton devis.')
    } else if (st.count === '3' && pack && pack !== 'ep') {
      note = L('Multi-song pricing is included on your quote.', 'Le prix multi-chansons est inclus sur ton devis.')
    }
    return { pack, extras, note }
  }

  // ---------- markup ----------
  const dlg = document.createElement('dialog')
  dlg.className = 'guide'
  dlg.setAttribute('aria-labelledby', 'guide-title')
  dlg.innerHTML = `
    <div class="guide-card">
      <header class="guide-top">
        <div class="guide-dots" aria-hidden="true"><i></i><i></i><i></i><i></i></div>
        <button type="button" class="guide-browse" data-guide-browse>${L('Browse everything', 'Tout voir')}</button>
        <button type="button" class="guide-x" data-guide-close aria-label="Close">✕</button>
      </header>
      <div class="guide-body" data-guide-body aria-live="polite"></div>
      <footer class="guide-foot" data-guide-foot></footer>
    </div>`
  document.body.appendChild(dlg)
  const body = dlg.querySelector('[data-guide-body]')
  const foot = dlg.querySelector('[data-guide-foot]')
  const dots = dlg.querySelectorAll('.guide-dots i')

  const fab = document.createElement('button')
  fab.type = 'button'
  fab.className = 'plan-fab'
  fab.hidden = true
  fab.innerHTML = `<span class="plan-dot"></span>${L('Your plan', 'Ton plan')}`
  document.body.appendChild(fab)
  fab.addEventListener('click', () => open(3))

  function tile(opt, group, type, checked) {
    return `<label class="g-opt">
      <input type="${type}" name="${group}" value="${opt.id}" ${checked ? 'checked' : ''} />
      <span class="g-tile"><b>${L(opt.en, opt.fr)}</b>${opt.den ? `<small>${L(opt.den, opt.dfr)}</small>` : ''}</span>
    </label>`
  }

  function render() {
    dots.forEach((d, i) => d.classList.toggle('on', i <= step))
    if (step === 0) {
      body.innerHTML = `<p class="g-k">${L('Step 1 of 3', 'Étape 1 sur 3')}</p>
        <h2 id="guide-title">${L('Where is your song at?', 'Ta chanson en est où ?')}</h2>
        <div class="g-grid">${STAGES.map((o) => tile(o, 'stage', 'radio', state.stage === o.id)).join('')}</div>`
      foot.innerHTML = `<span></span><button type="button" class="btn" data-next ${state.stage ? '' : 'disabled'}>${L('Next', 'Suivant')}</button>`
    } else if (step === 1) {
      body.innerHTML = `<p class="g-k">${L('Step 2 of 3', 'Étape 2 sur 3')}</p>
        <h2 id="guide-title">${L('How many songs?', 'Combien de chansons ?')}</h2>
        <div class="g-grid g-3">${COUNTS.map((o) => tile(o, 'count', 'radio', state.count === o.id)).join('')}</div>`
      foot.innerHTML = `<button type="button" class="btn ghost" data-back>${L('Back', 'Retour')}</button><button type="button" class="btn" data-next ${state.count ? '' : 'disabled'}>${L('Next', 'Suivant')}</button>`
    } else if (step === 2) {
      body.innerHTML = `<p class="g-k">${L('Step 3 of 3', 'Étape 3 sur 3')}</p>
        <h2 id="guide-title">${L('What else do you need?', 'De quoi d’autre as-tu besoin ?')}</h2>
        <p class="g-sub">${L('Pick as many as you want, or none.', 'Choisis-en autant que tu veux, ou aucun.')}</p>
        <div class="g-grid g-chips">${EXTRAS.map((o) => tile(o, 'extras', 'checkbox', state.extras.includes(o.id))).join('')}</div>`
      foot.innerHTML = `<button type="button" class="btn ghost" data-back>${L('Back', 'Retour')}</button><button type="button" class="btn" data-next>${L('Show my plan', 'Voir mon plan')}</button>`
    } else {
      const plan = buildPlan(state)
      const p = plan.pack ? PACKS[plan.pack] : null
      const extras = plan.extras.map((id) => EXTRAS.find((e) => e.id === id)).filter(Boolean)
      body.innerHTML = `<p class="g-k">${L('Your plan', 'Ton plan')}</p>
        <h2 id="guide-title">${L('Here’s everything you need. Nothing you don’t.', 'Voici tout ce qu’il te faut. Rien de plus.')}</h2>
        <div class="g-plan">
          ${p ? `<div class="g-pack">
              <div><p class="g-pack-k">${L('Your music', 'Ta musique')}</p><h3>${p.name}</h3><p>${L(p.en, p.fr)}</p></div>
              <p class="g-price">${p.price}</p>
            </div>` : `<div class="g-pack g-pack-done"><div><p class="g-pack-k">${L('Your music', 'Ta musique')}</p><h3>${L('Already finished', 'Déjà finie')}</h3><p>${L('We take it from here.', 'On prend le relais.')}</p></div></div>`}
          ${extras.length ? `<ul class="g-extras">${extras.map((e) => `<li><b>${L(e.en, e.fr)}</b><span>${L('Quoted for your project', 'Chiffré pour ton projet')}</span></li>`).join('')}</ul>` : ''}
          ${plan.note ? `<p class="g-note">${plan.note}</p>` : ''}
          ${!p && !extras.length ? `<p class="g-note">${L('Tell us about your project and we’ll suggest the next step.', 'Parle-nous de ton projet et on te propose la suite.')}</p>` : ''}
        </div>
        <p class="g-sub">${L('One team, one plan, one quote. We reply within 24 hours.', 'Une équipe, un plan, un devis. On répond en moins de 24 h.')}</p>`
      foot.innerHTML = `<button type="button" class="btn ghost" data-restart>${L('Start over', 'Recommencer')}</button>
        <div class="g-foot-r"><a class="btn ghost" href="${pkgHref}" data-guide-see>${L('Compare packages', 'Comparer')}</a><button type="button" class="btn" data-apply>${L('Apply with this plan', 'Postuler avec ce plan')}</button></div>`
      save()
    }
    const first = body.querySelector('input:checked') || body.querySelector('input') || foot.querySelector('.btn:not([disabled])')
    first?.focus({ preventScroll: true })
  }

  // ---------- events ----------
  body.addEventListener('change', (e) => {
    const t = e.target
    if (t.name === 'stage') state.stage = t.value
    if (t.name === 'count') state.count = t.value
    if (t.name === 'extras') state.extras = [...body.querySelectorAll('input[name=extras]:checked')].map((i) => i.value)
    const next = foot.querySelector('[data-next]')
    if (next) next.disabled = (step === 0 && !state.stage) || (step === 1 && !state.count)
    // single-choice steps move on by themselves
    if (t.type === 'radio') setTimeout(() => { step += 1; render() }, 220)
  })
  foot.addEventListener('click', (e) => {
    const b = e.target.closest('button, a')
    if (!b) return
    if (b.hasAttribute('data-next')) { step += 1; render() }
    if (b.hasAttribute('data-back')) { step = Math.max(0, step - 1); render() }
    if (b.hasAttribute('data-restart')) { state = { stage: null, count: null, extras: [] }; step = 0; render() }
    if (b.hasAttribute('data-apply')) { applyToForm(); close(); go(bookHref) }
    if (b.hasAttribute('data-guide-see')) { close() }
  })
  dlg.querySelector('[data-guide-close]').addEventListener('click', close)
  dlg.querySelector('[data-guide-browse]').addEventListener('click', () => { close(); go('#how') })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close() })
  dlg.addEventListener('close', () => document.documentElement.classList.remove('guide-open'))

  function go(hash) {
    const el = document.querySelector(hash)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    else if (!hash.startsWith('#')) window.location.href = hash
  }

  function open(atStep) {
    step = typeof atStep === 'number' ? atStep : 0
    render()
    document.documentElement.classList.add('guide-open')
    if (typeof dlg.showModal === 'function') dlg.showModal()
    else dlg.setAttribute('open', '')
  }
  function close() {
    if (typeof dlg.close === 'function' && dlg.open) dlg.close()
    else dlg.removeAttribute('open')
    document.documentElement.classList.remove('guide-open')
  }
  openers.forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); open(0) }))

  // ---------- carry the plan into the page ----------
  function applyToForm() {
    const plan = buildPlan(state)
    const select = document.querySelector('[data-package-select]')
    if (select) {
      const name = plan.pack ? PACKS[plan.pack].name : 'Not sure'
      if ([...select.options].some((o) => o.value === name)) select.value = name
    }
    const boxes = document.querySelectorAll('[data-needs] input')
    if (boxes.length) {
      const wanted = new Set(plan.extras.map((id) => EXTRAS.find((e) => e.id === id)?.need))
      if (plan.pack === 'release') wanted.add('Release plan and launch support')
      boxes.forEach((b) => {
        if (b.value === 'Music production') b.checked = !!plan.pack
        else b.checked = wanted.has(b.value)
      })
    }
    const msg = document.querySelector('#a-msg')
    if (msg && !msg.value) {
      const stage = STAGES.find((s) => s.id === state.stage)?.en || ''
      const count = COUNTS.find((c) => c.id === state.count)?.en || ''
      msg.value = `Guided plan: ${stage}, ${count.toLowerCase()}.`
    }
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* private mode */ }
    fab.hidden = false
    syncPricing()
  }
  function syncPricing() {
    const plan = buildPlan(state)
    const key = plan.pack === 'ep' ? 'record' : plan.pack
    if (!key) return
    document.dispatchEvent(new CustomEvent('et:pick', { detail: key }))
  }
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && saved.stage && saved.count) {
      state = { stage: saved.stage, count: saved.count, extras: Array.isArray(saved.extras) ? saved.extras : [] }
      fab.hidden = false
      applyToForm()
      syncPricing()
    }
  } catch { /* nothing saved */ }
})()
