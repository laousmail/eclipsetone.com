// "Build your release": a shopping-style configurator.
// Four steps (music, songs, extras, review) with a live cart and running total.
// Every step has a way out ("already finished", "no extras, that's it"), and
// "Browse everything" closes it so the normal page is always one tap away.
// Opens from any [data-guide-open] button. The plan is remembered on this
// device and pre-fills the Apply form and the pricing picker.
;(() => {
  const openers = document.querySelectorAll('[data-guide-open]')
  if (!openers.length) return

  const L = (en, fr) => `<span data-lang="en">${en}</span><span data-lang="fr">${fr}</span>`
  const lang = () => (document.documentElement.lang === 'fr' ? 'fr' : 'en')
  const KEY = 'eclipsetone-plan-v2'
  const WHATSAPP = 'https://wa.me/14384668971'
  const onServices = !!document.querySelector('[data-pricing]')

  const PACKS = [
    { id: 'mix', name: 'The Mix', price: 350, for: ['You have a finished beat', 'Tu as une prod finie'], what: ['Mix, vocal production and master.', 'Mix, production vocale et master.'] },
    { id: 'record', name: 'The Record', price: 599, tag: ['Start here', 'Commence ici'], for: ['You have vocals or lyrics', 'Tu as des voix ou des paroles'], what: ['Full production by real players, mix and master. First draft in 7 days.', 'Production complète par de vrais musiciens, mix et master. Première version en 7 jours.'] },
    { id: 'signature', name: 'The Signature Record', price: 997, for: ['You have just an idea', 'Tu as juste une idée'], what: ['A 2-hour writing session, then the whole record. Priority turnaround.', 'Session d’écriture de 2 h, puis tout le disque. Délai prioritaire.'] },
    { id: 'release', name: 'The Release', price: 2000, for: ['You want the song and the launch', 'Tu veux la chanson et le lancement'], what: ['Everything in Signature, plus release plan, promo pack and launch-week support.', 'Tout Signature, plus plan de sortie, kit promo et support de lancement.'] },
  ]
  const EXTRAS = [
    { id: 'physical', need: 'Physical products (CD, vinyl, cassette, USB-C)', icon: 'disc', name: ['Physical copies', 'Copies physiques'], what: ['Designed, manufactured and delivered.', 'Conçues, fabriquées et livrées.'] },
    { id: 'launch', need: 'Release plan and launch support', icon: 'rocket', name: ['Release plan and launch', 'Plan de sortie et lancement'], what: ['Timeline, hooks, promo pack, launch-week support.', 'Calendrier, hooks, kit promo, support de lancement.'] },
    { id: 'social', need: 'Social media setup', icon: 'phone', name: ['Social media setup', 'Réseaux sociaux'], what: ['Profiles, visuals and a content plan.', 'Profils, visuels et plan de contenu.'] },
    { id: 'website', need: 'Website design', icon: 'globe', name: ['Artist website', 'Site d’artiste'], what: ['Music, shows, merch and a fan email list.', 'Musique, spectacles, merch et liste de fans.'] },
    { id: 'media', need: 'Photo and video', icon: 'camera', name: ['Photo and video', 'Photo et vidéo'], what: ['Press photos, cover shoot, clips for social.', 'Photos de presse, pochette, extraits pour les réseaux.'] },
    { id: 'management', need: 'Artist management', icon: 'compass', name: ['Artist management', 'Gestion d’artiste'], what: ['Planning, releases, opportunities.', 'Planification, sorties, opportunités.'] },
  ]
  const FORMATS = [
    { id: 'cd', name: ['CD', 'CD'] },
    { id: 'vinyl', name: ['Vinyl', 'Vinyle'] },
    { id: 'cassette', name: ['Cassette', 'Cassette'] },
    { id: 'usb', name: ['USB‑C drive', 'Clé USB‑C'] },
  ]
  const ICONS = {
    disc: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5"/>',
    rocket: '<path d="M5 19c1-3 3-5 5-6M14 4c3 0 6 3 6 6l-7 7-6-6 7-7z"/><circle cx="14.5" cy="9.5" r="1.5"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.7 2.5 15.3 0 18M12 3c-2.5 2.7-2.5 15.3 0 18"/>',
    camera: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><circle cx="12" cy="13.5" r="3.5"/><path d="M8 7l1.5-3h5L16 7"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  }
  const icon = (k) => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`
  const STEPS = [
    ['Music', 'Musique'],
    ['Songs', 'Chansons'],
    ['Extras', 'Extras'],
    ['Review', 'Résumé'],
  ]

  const blank = () => ({ pack: null, qty: 1, extras: [], formats: [], name: '', email: '', handle: '', link: '' })
  let s = blank()
  let step = 0
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null')
    if (saved && typeof saved === 'object') s = Object.assign(blank(), saved)
  } catch { /* nothing saved */ }

  const money = (n) => '$' + n.toLocaleString('en-US')
  const pack = () => PACKS.find((p) => p.id === s.pack) || null
  const isEP = () => s.pack === 'record' && s.qty === 3
  function musicTotal() {
    const p = pack()
    if (!p) return 0
    return isEP() ? 1597 : p.price * s.qty
  }
  const hasQuoted = () => s.extras.length > 0 || (s.pack && s.qty >= 8)
  const launchIncluded = () => s.pack === 'release'
  const stepsFor = () => (s.pack === 'none' ? [0, 2, 3] : [0, 1, 2, 3])

  // ---------- shell ----------
  const dlg = document.createElement('dialog')
  dlg.className = 'cfg'
  dlg.setAttribute('aria-labelledby', 'cfg-title')
  dlg.innerHTML = `
    <div class="cfg-shell">
      <header class="cfg-top">
        <p class="cfg-brand">${L('Build your release', 'Bâtis ta sortie')}</p>
        <nav class="cfg-steps" aria-label="Steps" data-steps></nav>
        <div class="cfg-top-r">
          <button type="button" class="cfg-link" data-browse>${L('Browse everything', 'Tout voir')}</button>
          <button type="button" class="cfg-x" data-close aria-label="Close"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
        </div>
      </header>
      <div class="cfg-main">
        <section class="cfg-stage" data-stage aria-live="polite"></section>
        <aside class="cfg-cart" data-cart aria-label="Your plan"></aside>
      </div>
      <footer class="cfg-bar" data-bar></footer>
    </div>`
  document.body.appendChild(dlg)
  const $ = (sel) => dlg.querySelector(sel)
  const stage = $('[data-stage]')
  const cart = $('[data-cart]')
  const bar = $('[data-bar]')
  const stepsNav = $('[data-steps]')

  const fab = document.createElement('button')
  fab.type = 'button'
  fab.className = 'plan-fab'
  fab.innerHTML = `<span class="plan-dot"></span>${L('Your plan', 'Ton plan')} <b data-fab-total></b>`
  fab.hidden = !s.pack
  document.body.appendChild(fab)
  fab.addEventListener('click', () => open(3))

  // ---------- steps ----------
  function viewMusic() {
    return `<p class="cfg-k">${L('Step 1', 'Étape 1')}</p>
      <h2 id="cfg-title">${L('What do you want us to make?', 'Qu’est-ce qu’on fait pour toi ?')}</h2>
      <p class="cfg-sub">${L('Pick the one that matches what you have right now.', 'Choisis celui qui correspond à ce que tu as maintenant.')}</p>
      <div class="cfg-packs" role="radiogroup">
        ${PACKS.map((p) => `
          <label class="cfg-pack">
            <input type="radio" name="pack" value="${p.id}" ${s.pack === p.id ? 'checked' : ''} />
            <span class="cfg-pack-in">
              ${p.tag ? `<em class="cfg-tag">${L(...p.tag)}</em>` : ''}
              <span class="cfg-for">${L(...p.for)}</span>
              <b class="cfg-name">${p.name}</b>
              <span class="cfg-what">${L(...p.what)}</span>
              <span class="cfg-price">${money(p.price)} <small>${L('per song', 'par chanson')}</small></span>
              <span class="cfg-radio" aria-hidden="true"></span>
            </span>
          </label>`).join('')}
      </div>
      <label class="cfg-skip">
        <input type="radio" name="pack" value="none" ${s.pack === 'none' ? 'checked' : ''} />
        <span>${L('My music is already finished. I only need the rest.', 'Ma musique est déjà finie. J’ai besoin du reste seulement.')}</span>
      </label>`
  }

  function viewSongs() {
    const p = pack()
    let line = ''
    if (isEP()) line = `<p class="cfg-deal">${L('EP price applied: $1,597 for 3 songs. You save $200.', 'Prix EP appliqué : 1 597 $ pour 3 chansons. Tu économises 200 $.')}</p>`
    else if (s.qty >= 8) line = `<p class="cfg-note">${L('Album pricing is confirmed on your quote.', 'Le prix album est confirmé sur ton devis.')}</p>`
    else if (s.qty > 1 && s.pack === 'record') line = `<p class="cfg-note">${L('Tip: 3 Records is an EP at $1,597.', 'Astuce : 3 Records, c’est un EP à 1 597 $.')} <button type="button" class="cfg-inline" data-qty-set="3">${L('Make it 3', 'Passer à 3')}</button></p>`
    else if (s.qty > 1) line = `<p class="cfg-note">${L('Multi-song pricing is confirmed on your quote.', 'Le prix multi-chansons est confirmé sur ton devis.')}</p>`
    return `<p class="cfg-k">${L('Step 2', 'Étape 2')}</p>
      <h2 id="cfg-title">${L('How many songs?', 'Combien de chansons ?')}</h2>
      <p class="cfg-sub">${p ? `${p.name} · ${money(p.price)} ${L('per song', 'par chanson')}` : ''}</p>
      <div class="cfg-qty">
        <button type="button" class="cfg-qbtn" data-qty="-1" aria-label="One less" ${s.qty <= 1 ? 'disabled' : ''}>−</button>
        <output class="cfg-qnum" aria-live="polite">${s.qty}</output>
        <button type="button" class="cfg-qbtn" data-qty="1" aria-label="One more" ${s.qty >= 20 ? 'disabled' : ''}>+</button>
      </div>
      <div class="cfg-presets">
        <button type="button" data-qty-set="1" aria-pressed="${s.qty === 1}">${L('Single', 'Single')}<small>1</small></button>
        <button type="button" data-qty-set="3" aria-pressed="${s.qty === 3}">EP<small>3</small></button>
        <button type="button" data-qty-set="8" aria-pressed="${s.qty === 8}">Album<small>8+</small></button>
      </div>
      ${line}`
  }

  function viewExtras() {
    const none = s.extras.length === 0
    return `<p class="cfg-k">${L('Step 3', 'Étape 3')}</p>
      <h2 id="cfg-title">${L('Anything else for this release?', 'Autre chose pour cette sortie ?')}</h2>
      <p class="cfg-sub">${L('Add what you need. Each extra is quoted for your project.', 'Ajoute ce qu’il te faut. Chaque extra est chiffré pour ton projet.')}</p>
      <button type="button" class="cfg-noextras ${none ? 'is-on' : ''}" data-noextras>
        <span class="cfg-check" aria-hidden="true"></span>
        <span><b>${L('No extras, that’s it', 'Pas d’extras, c’est tout')}</b><small>${L('Just the music. Take me to my plan.', 'Juste la musique. Montre-moi mon plan.')}</small></span>
        <span class="cfg-arrow" aria-hidden="true">→</span>
      </button>
      <div class="cfg-extras">
        ${EXTRAS.map((e) => {
          const included = e.id === 'launch' && launchIncluded()
          const on = included || s.extras.includes(e.id)
          return `<div class="cfg-extra ${on ? 'is-on' : ''}">
            <span class="cfg-ico">${icon(e.icon)}</span>
            <div class="cfg-extra-t"><b>${L(...e.name)}</b><small>${L(...e.what)}</small></div>
            ${included
              ? `<span class="cfg-incl">${L('Included', 'Inclus')}</span>`
              : `<button type="button" class="cfg-add" data-extra="${e.id}" aria-pressed="${on}">${on ? L('Added', 'Ajouté') : L('Add', 'Ajouter')}</button>`}
            ${e.id === 'physical' && on ? `<div class="cfg-formats">${FORMATS.map((f) => `<button type="button" data-format="${f.id}" aria-pressed="${s.formats.includes(f.id)}">${L(...f.name)}</button>`).join('')}</div>` : ''}
          </div>`
        }).join('')}
      </div>`
  }

  function viewReview() {
    return `<p class="cfg-k">${L('Step 4', 'Étape 4')}</p>
      <h2 id="cfg-title">${L('Your plan is ready.', 'Ton plan est prêt.')}</h2>
      <p class="cfg-sub">${L('Send it and we reply within 24 hours with your quote and next steps. No payment now.', 'Envoie-le et on te répond en moins de 24 h avec ton devis et la suite. Aucun paiement maintenant.')}</p>
      <div class="cfg-review">${cartLines(true)}</div>
      <form class="cfg-form" data-send-form novalidate>
        <div class="cfg-row">
          <label><span>${L('Name', 'Nom')}</span><input name="name" autocomplete="name" value="${esc(s.name)}" required /></label>
          <label><span>${L('Email', 'Courriel')}</span><input name="email" type="email" autocomplete="email" value="${esc(s.email)}" required /></label>
        </div>
        <div class="cfg-row">
          <label><span>${L('Instagram or TikTok', 'Instagram ou TikTok')}</span><input name="handle" placeholder="@yourname" value="${esc(s.handle)}" /></label>
          <label><span>${L('Link to vocals or demo (optional)', 'Lien voix ou démo (optionnel)')}</span><input name="link" placeholder="Drive, Dropbox…" value="${esc(s.link)}" /></label>
        </div>
        <p class="cfg-err" data-err hidden>${L('Add your name and a valid email so we can reply.', 'Ajoute ton nom et un courriel valide pour qu’on te réponde.')}</p>
      </form>`
  }

  function esc(v) {
    return String(v || '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  }

  // ---------- cart ----------
  function cartLines(big) {
    const p = pack()
    const rows = []
    if (p) {
      const label = isEP() ? 'The EP' : p.name
      const sub = isEP() ? L('3 Records, one sound', '3 Records, un seul son') : s.qty > 1 ? `${s.qty} × ${money(p.price)}` : L('1 song', '1 chanson')
      rows.push(`<li><div><b>${label}</b><small>${sub}</small></div><span class="cfg-amt">${s.qty >= 8 ? L('Quoted', 'Sur devis') : money(musicTotal())}</span></li>`)
      if (launchIncluded()) rows.push(`<li class="is-sub"><div><b>${L('Release plan and launch', 'Plan de sortie et lancement')}</b></div><span class="cfg-amt">${L('Included', 'Inclus')}</span></li>`)
    } else if (s.pack === 'none') {
      rows.push(`<li class="is-sub"><div><b>${L('Your music', 'Ta musique')}</b><small>${L('Already finished', 'Déjà finie')}</small></div><span class="cfg-amt">–</span></li>`)
    }
    s.extras.forEach((id) => {
      const e = EXTRAS.find((x) => x.id === id)
      if (!e) return
      const fm = id === 'physical' && s.formats.length ? FORMATS.filter((f) => s.formats.includes(f.id)).map((f) => f.name[lang() === 'fr' ? 1 : 0]).join(', ') : ''
      rows.push(`<li><div><b>${L(...e.name)}</b>${fm ? `<small>${fm}</small>` : ''}</div><span class="cfg-amt q">${L('Quoted', 'Sur devis')}</span></li>`)
    })
    if (!rows.length) {
      return `<p class="cfg-empty">${L('Pick what you need. Your plan builds here.', 'Choisis ce qu’il te faut. Ton plan se construit ici.')}</p>`
    }
    const total = s.qty >= 8 ? 0 : musicTotal()
    return `<ul class="cfg-lines ${big ? 'big' : ''}">${rows.join('')}</ul>
      <div class="cfg-total">
        <span>${total ? L('Music total', 'Total musique') : L('Total', 'Total')}</span>
        <b data-total>${total ? money(total) : L('On quote', 'Sur devis')}</b>
      </div>
      ${total && hasQuoted() ? `<p class="cfg-plus">${L('+ quoted extras', '+ extras sur devis')}</p>` : ''}`
  }

  function canContinue() {
    if (step === 0) return !!s.pack
    return true
  }

  function primary() {
    if (step === 3) return `<a class="btn cfg-go" data-send href="#" target="_blank" rel="noopener">${L('Send my plan', 'Envoyer mon plan')}</a>`
    const label = step === 2 ? L('Review my plan', 'Voir mon plan') : L('Continue', 'Continuer')
    return `<button type="button" class="btn cfg-go" data-next ${canContinue() ? '' : 'disabled'}>${label}</button>`
  }

  function render(dir) {
    const order = stepsFor()
    if (!order.includes(step)) step = order.find((x) => x > step) ?? 3
    stepsNav.innerHTML = STEPS.map((n, i) => {
      if (!order.includes(i)) return ''
      const state = i === step ? 'now' : i < step ? 'done' : ''
      const reach = i < step || (i > step && canReach(i))
      return `<button type="button" class="cfg-step ${state}" data-goto="${i}" ${reach || i === step ? '' : 'disabled'} ${i === step ? 'aria-current="step"' : ''}><i></i>${L(...n)}</button>`
    }).join('')
    const html = step === 0 ? viewMusic() : step === 1 ? viewSongs() : step === 2 ? viewExtras() : viewReview()
    stage.innerHTML = `<div class="cfg-pane ${dir ? 'in-' + dir : ''}">${html}</div>`
    const back = order.indexOf(step) > 0 ? `<button type="button" class="cfg-back" data-back>${L('Back', 'Retour')}</button>` : ''
    cart.innerHTML = `<p class="cfg-cart-k">${L('Your plan', 'Ton plan')}</p>${cartLines(false)}<div class="cfg-cart-cta">${primary()}${back}</div>`
    const total = s.qty >= 8 ? 0 : musicTotal()
    bar.innerHTML = `<button type="button" class="cfg-bar-sum" data-sheet>
        <small>${L('Your plan', 'Ton plan')}</small>
        <b>${s.pack ? (total ? money(total) : L('On quote', 'Sur devis')) : '–'}${total && hasQuoted() ? ' <em>+</em>' : ''}</b>
      </button>
      ${back}${primary()}`
    updateSend()
    const fabTotal = document.querySelector('[data-fab-total]')
    if (fabTotal) fabTotal.textContent = total ? money(total) : ''
    fab.hidden = !s.pack
  }
  function canReach(i) {
    if (!s.pack) return false
    return i <= 3
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(s)) } catch { /* private mode */ }
    syncPage()
  }

  // ---------- events ----------
  dlg.addEventListener('change', (e) => {
    const t = e.target
    if (t.name === 'pack') {
      s.pack = t.value
      if (s.pack === 'release') s.extras = s.extras.filter((x) => x !== 'launch')
      save(); render()
    }
  })
  dlg.addEventListener('input', (e) => {
    const t = e.target
    if (t.closest('[data-send-form]') && t.name in s) {
      s[t.name] = t.value; save(); updateSend()
      const err = dlg.querySelector('[data-err]')
      if (err && s.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email.trim())) err.hidden = true
    }
  })
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) return close()
    const b = e.target.closest('button, a')
    if (!b) return
    if (b.hasAttribute('data-close')) close()
    if (b.hasAttribute('data-browse')) { close(); browse() }
    if (b.hasAttribute('data-next')) go(+1)
    if (b.hasAttribute('data-back')) go(-1)
    if (b.dataset.goto) { const to = +b.dataset.goto; const d = to > step ? 'fwd' : 'back'; step = to; render(d) }
    if (b.dataset.qty) { s.qty = Math.min(20, Math.max(1, s.qty + +b.dataset.qty)); save(); render() }
    if (b.dataset.qtySet) { s.qty = +b.dataset.qtySet; save(); render() }
    if (b.dataset.extra) {
      const id = b.dataset.extra
      s.extras = s.extras.includes(id) ? s.extras.filter((x) => x !== id) : [...s.extras, id]
      if (id === 'physical' && !s.extras.includes('physical')) s.formats = []
      save(); render()
    }
    if (b.dataset.format) {
      const f = b.dataset.format
      s.formats = s.formats.includes(f) ? s.formats.filter((x) => x !== f) : [...s.formats, f]
      save(); render()
    }
    if (b.hasAttribute('data-noextras')) { s.extras = []; s.formats = []; save(); step = 3; render('fwd') }
    if (b.hasAttribute('data-sheet')) dlg.classList.toggle('sheet-open')
    if (b.hasAttribute('data-send')) {
      const ok = s.name.trim() && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.email.trim())
      const err = dlg.querySelector('[data-err]')
      if (!ok) { e.preventDefault(); if (err) err.hidden = false; dlg.querySelector('[data-send-form] input:invalid, [data-send-form] input')?.focus(); return }
      if (err) err.hidden = true
      applyToForm()
    }
  })
  dlg.addEventListener('close', () => { document.documentElement.classList.remove('cfg-open'); dlg.classList.remove('sheet-open') })

  function go(d) {
    const order = stepsFor()
    const i = order.indexOf(step)
    const next = order[Math.min(order.length - 1, Math.max(0, i + d))]
    if (d > 0 && !canContinue()) return
    step = next
    dlg.classList.remove('sheet-open')
    render(d > 0 ? 'fwd' : 'back')
    stage.scrollTop = 0
  }

  function message() {
    const p = pack()
    const lines = ['EclipseTone plan']
    if (p) lines.push(`Music: ${isEP() ? 'The EP (3 Records)' : `${p.name} × ${s.qty}`}${s.qty >= 8 ? ' (album, quote)' : ` = ${money(musicTotal())}`}`)
    if (s.pack === 'none') lines.push('Music: already finished')
    if (launchIncluded()) lines.push('Release plan and launch: included')
    s.extras.forEach((id) => {
      const e = EXTRAS.find((x) => x.id === id)
      let line = `Extra: ${e.name[0]}`
      if (id === 'physical' && s.formats.length) line += ` (${FORMATS.filter((f) => s.formats.includes(f.id)).map((f) => f.name[0]).join(', ')})`
      lines.push(line)
    })
    lines.push(`Name: ${s.name}`, `Email: ${s.email}`)
    if (s.handle) lines.push(`IG/TikTok: ${s.handle}`)
    if (s.link) lines.push(`Vocals/demo: ${s.link}`)
    return lines.join('\n')
  }
  function updateSend() {
    dlg.querySelectorAll('[data-send]').forEach((a) => { a.href = `${WHATSAPP}?text=${encodeURIComponent(message())}` })
  }

  function browse() {
    const target = document.querySelector('#how') || document.querySelector('#packages')
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
  function open(at) {
    step = typeof at === 'number' ? at : s.pack ? step : 0
    if (step > 0 && !s.pack) step = 0
    render()
    document.documentElement.classList.add('cfg-open')
    if (typeof dlg.showModal === 'function') dlg.showModal()
    else dlg.setAttribute('open', '')
  }
  function close() {
    if (dlg.open && typeof dlg.close === 'function') dlg.close()
    else dlg.removeAttribute('open')
    document.documentElement.classList.remove('cfg-open')
  }
  openers.forEach((b) => b.addEventListener('click', (e) => { e.preventDefault(); open(s.pack ? 0 : 0) }))

  // ---------- carry the plan into the page ----------
  function applyToForm() {
    const select = document.querySelector('[data-package-select]')
    if (select && s.pack) {
      const name = isEP() ? 'The EP' : s.pack === 'none' ? 'Not sure' : pack()?.name
      if ([...select.options].some((o) => o.value === name)) select.value = name
    }
    const wanted = new Set(s.extras.map((id) => EXTRAS.find((e) => e.id === id)?.need))
    if (launchIncluded()) wanted.add('Release plan and launch support')
    document.querySelectorAll('[data-needs] input').forEach((b) => {
      b.checked = b.value === 'Music production' ? !!(s.pack && s.pack !== 'none') : wanted.has(b.value)
    })
    const set = (sel, v) => { const el = document.querySelector(sel); if (el && v && !el.value) el.value = v }
    set('#a-name', s.name); set('#a-email', s.email); set('#a-handle', s.handle); set('#a-link', s.link)
  }
  function syncPage() {
    if (!s.pack || s.pack === 'none') return
    document.dispatchEvent(new CustomEvent('et:pick', { detail: s.pack }))
    applyToForm()
  }
  if (s.pack) { syncPage(); render() }
})()
