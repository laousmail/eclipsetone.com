// EclipseTone "Start your project" panel.
// One path for every visitor: a panel slides up in place, three short steps, nothing is lost.
// Open it from any element with data-start (optionally data-start="Website" data-answer="page").
;(() => {
  const WA = 'https://wa.me/14384668971'
  const CALENDLY = 'https://calendly.com/eclipsetonereservation/free-onboarding-call'
  const BASE = (document.currentScript?.src || '').replace(/project\.js.*$/, '')
  const ME_KEY = 'eclipsetone-me'
  const ST_KEY = 'eclipsetone-project'
  const LAST_KEY = 'eclipsetone-last'
  const fr = () => document.documentElement.lang === 'fr'
  const L = (en, f) => (fr() ? String(f).replace(/ ([?:!;»])/g, ' $1') : en)
  const P = (t) => (window.etPrices ? window.etPrices(t) : t)
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } }
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode */ } }
  const track = (n) => document.dispatchEvent(new CustomEvent('et:track', { detail: n }))
  const icon = (id) => `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><use href="#i-${id}"/></svg>`
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches

  // Every project type: its icon, its one question, and what we tell them along the way.
  // Answers: [id, en, fr, price, en note, fr note]. Tips: [kind, [switch to pick, answer] or null, en, fr].
  const SERVICES = {
    'Song': { icon: 'song', label: ['A song', 'Une chanson'], from: 599, call: true,
      q: ['Which one fits you?', 'Lequel te ressemble ?'],
      a: [
        ['full', 'Full Song', 'Chanson complète', { p: 599, sub: ['You have vocals or lyrics', 'Tu as des voix ou des paroles'] }],
        ['write', 'Song + Songwriting', 'Chanson + écriture', { p: 997, sub: ['Just an idea? We write it with you', 'Juste une idée ? On l’écrit avec toi'] }],
        ['launch', 'Song + Launch', 'Chanson + lancement', { p: 2000, sub: ['The song plus your release plan', 'La chanson plus ton plan de sortie'] }],
        ['ep', '3-Song EP', 'EP 3 chansons', { p: 1597, sub: ['3 songs that sound like one project', '3 chansons qui sonnent comme un projet'] }],
      ] },
    'Music video': { icon: 'video', label: ['A music video', 'Un clip'], call: true,
      q: ['Where is your song at?', 'Ta chanson en est où ?'],
      a: [['ready', 'Finished, ready to film', 'Finie, prête à filmer'], ['making', 'Still being made', 'En cours'], ['none', 'No song yet', 'Pas encore de chanson']],
      tip: { none: ['info', ['Song', 'full'], 'We can make the song and the video together. Start with the song, we add the video to your price.', 'On peut faire la chanson et le clip ensemble. Commence par la chanson, on ajoute le clip à ton prix.'] } },
    'Website': { icon: 'web', label: ['A website', 'Un site web'], from: 500, call: true,
      q: ['How big?', 'Quelle taille ?'],
      a: [['page', 'Artist Page', 'Page d’artiste', { p: 500, sub: ['One page with everything fans need', 'Une page avec tout ce que tes fans cherchent'] }], ['site', 'Artist Site', 'Site complet', { p: 1500, from: true, sub: ['A full site that updates itself', 'Un site complet qui se met à jour seul'] }], ['ns', 'Not sure yet', 'Pas encore sûr']] },
    'Social media': { icon: 'social', label: ['Social media', 'Réseaux sociaux'], call: true,
      q: ['What do you need?', 'De quoi as-tu besoin ?'],
      a: [['setup', 'Set up my profiles', 'Monter mes profils'], ['run', 'Run them with me', 'Les gérer avec moi'], ['manage', 'Full artist management', 'Gestion d’artiste complète']] },
    'Mixing': { icon: 'mix', label: ['Mixing', 'Mixage'], from: 150, call: false,
      q: ['How many tracks does your song have?', 'Combien de pistes a ta chanson ?'],
      a: [['s', 'Under 16', 'Moins de 16'], ['m', '16 to 40', '16 à 40'], ['l', 'Over 40', 'Plus de 40'], ['ns', 'Not sure', 'Je ne sais pas']],
      tip: { ns: ['info', null, 'No problem. Send the files and we count for you.', 'Pas de souci. Envoie les fichiers et on compte pour toi.'] } },
    'Studio Recording': { icon: 'mic', label: ['Studio recording', 'Session studio'], price: 350, call: false,
      q: ['When do you want to come in?', 'Tu veux venir quand ?'],
      a: [['week', 'This week', 'Cette semaine'], ['two', 'In the next 2 weeks', 'Dans les 2 prochaines semaines'], ['flex', 'I’m flexible', 'Je suis flexible']],
      always: ['warn', ['Song', 'full'], 'In person, at our studio in Montréal, 2 hours with Smail. Not nearby? A full song works 100% online.', 'En personne, à notre studio à Montréal, 2 heures avec Smail. Pas dans le coin ? Une chanson complète se fait 100 % en ligne.'] },
    'Not sure': { icon: 'spark', label: ['Not sure yet', 'Pas encore sûr'], call: true,
      q: ['What do you have right now?', 'Tu as quoi en ce moment ?'],
      a: [['song', 'A recorded song', 'Une chanson enregistrée'], ['vocals', 'Recorded vocals', 'Des voix enregistrées'], ['lyrics', 'Lyrics', 'Des paroles'], ['idea', 'Just an idea', 'Juste une idée']],
      tip: {
        song: ['ok', ['Mixing', ''], 'Mixing (from $150) is the one for you.', 'Le mixage (dès 150 $) est fait pour toi.'],
        vocals: ['ok', ['Song', 'full'], 'Full Song ($599) is the one for you.', 'Chanson complète (599 $) est faite pour toi.'],
        lyrics: ['ok', ['Song', 'full'], 'Full Song ($599) is the one for you.', 'Chanson complète (599 $) est faite pour toi.'],
        idea: ['ok', ['Song', 'write'], 'Song + Songwriting ($997) is the one for you.', 'Chanson + écriture (997 $) est faite pour toi.'],
      } },
  }
  const ORDER = ['Song', 'Music video', 'Website', 'Social media', 'Mixing', 'Studio Recording', 'Not sure']
  // Old package names still work as openers (from links, bookmarks and the prices page).
  const ALIAS = { 'Full Song': ['Song', 'full'], 'Song + Songwriting': ['Song', 'write'], 'Song + Launch': ['Song', 'launch'], '3-Song EP': ['Song', 'ep'], 'Website design': ['Website', ''], 'Artist management': ['Social media', 'manage'] }

  const money = (n) => (window.etMoney ? window.etMoney(n) : '$' + n)
  const ansOf = (s) => (SERVICES[s.pick]?.a || []).find((x) => x[0] === s.answer)
  // The name Laou sees in his sheet: the package when there is one, the service otherwise.
  const leadName = (s) => (s.pick === 'Song' && ansOf(s) ? ansOf(s)[1] : s.pick)
  const shown = (s) => (s.pick === 'Song' && ansOf(s) ? L(ansOf(s)[1], ansOf(s)[2]) : L(...SERVICES[s.pick].label))

  // ---------- lead log: every request we can reply to lands in the Google Sheet, sent or not ----------
  function leadId() {
    try {
      let id = sessionStorage.getItem('eclipsetone-lead-id')
      if (!id) { id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7); sessionStorage.setItem('eclipsetone-lead-id', id) }
      return id
    } catch { return 'x' + Date.now().toString(36) }
  }
  function logLead(data) {
    if (data.status === 'sent' || (data.status === 'started' && !logLead.once)) { logLead.once = true; track('project-' + data.status) }
    const url = (window.ET_CONFIG || {}).leadSheetUrl
    if (!url) return
    const body = JSON.stringify(Object.assign({ id: leadId(), page: location.pathname, lang: document.documentElement.lang }, data))
    try { fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body, keepalive: true }).catch(() => {}) } catch { /* ignore */ }
  }

  // ---------- state ----------
  const saved = read(ST_KEY) || {}
  const st = { pick: SERVICES[saved.pick] ? saved.pick : '', answer: saved.answer || '', step: saved.step || 1, pref: saved.pref || 'text', note: saved.note || '' }
  const save = () => write(ST_KEY, { pick: st.pick, answer: st.answer, step: st.step === 'done' ? 1 : st.step, pref: st.pref, note: st.note })

  // ---------- the panel ----------
  const dlg = document.createElement('dialog')
  dlg.className = 'sheet'
  dlg.setAttribute('aria-labelledby', 'sheet-h')
  dlg.innerHTML = `
    <div class="sheet-card" data-card>
      <div class="sheet-top" data-drag>
        <span class="sheet-grab" aria-hidden="true"></span>
        <button type="button" class="sheet-ic" data-back><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg><span class="sr" data-t="Back"></span></button>
        <div class="sheet-prog"><p class="sheet-step" data-steptxt aria-live="polite"></p><span class="sheet-bar" aria-hidden="true"><i></i><i></i><i></i></span></div>
        <button type="button" class="sheet-ic" data-close><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg><span class="sr" data-t="Close"></span></button>
      </div>
      <form class="sheet-body" data-form novalidate>
        <section class="pane" data-pane="1">
          <h2 id="sheet-h" data-t="H1"></h2>
          <p class="pane-sub" data-welcome hidden></p>
          <div class="svc-picks" role="radiogroup" data-picks>${ORDER.map((k) => `<button type="button" class="svc-pick" role="radio" aria-checked="false" data-pick="${esc(k)}">${icon(SERVICES[k].icon)}<b></b><small></small></button>`).join('')}</div>
        </section>
        <section class="pane" data-pane="2" hidden>
          <p class="pane-for" data-for></p>
          <h2 data-q></h2>
          <div class="ans-list" role="radiogroup" data-answers></div>
          <div data-tips></div>
        </section>
        <section class="pane" data-pane="3" hidden>
          <p class="pane-for" data-for2></p>
          <h2 data-t="H3"></h2>
          <div class="field"><label for="pj-name" data-t="Name"></label><input id="pj-name" name="name" autocomplete="name" /></div>
          <div class="field"><label for="pj-email" data-t="Email"></label><input id="pj-email" name="email" type="email" autocomplete="email" inputmode="email" /></div>
          <div class="field"><label for="pj-phone" data-t="Phone"></label><input id="pj-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="+1 514 555 0123" /><small class="sf-help" data-t="PhoneHelp"></small></div>
          <div class="pref" role="radiogroup" data-prefs><p data-t="ContactQ"></p><div><button type="button" class="ans" role="radio" data-pref="text"></button><button type="button" class="ans" role="radio" data-pref="call"></button></div></div>
          <button type="button" class="sf-add" data-addnote aria-expanded="false"></button>
          <div class="field" data-notefield hidden><label for="pj-msg" data-t="NoteL"></label><textarea id="pj-msg" name="message" rows="3"></textarea></div>
          <p class="sf-consent" data-t="Consent"></p>
          <p class="note err" data-err hidden></p>
        </section>
        <section class="pane pane-done" data-pane="done" hidden></section>
      </form>
      <div class="sheet-foot"><button type="button" class="btn big cta-go" data-primary></button></div>
    </div>`
  document.body.appendChild(dlg)

  const $ = (s) => dlg.querySelector(s)
  const name = $('#pj-name'), email = $('#pj-email'), phone = $('#pj-phone'), msg = $('#pj-msg')
  const primary = $('[data-primary]')
  const T = {
    Back: ['Back', 'Retour'], Close: ['Close', 'Fermer'],
    H1: ['What’s your project?', 'C’est quoi ton projet ?'],
    H3: ['Where do we send your price?', 'On t’envoie ton prix où ?'],
    Name: ['Your name', 'Ton nom'], Email: ['Your email', 'Ton courriel'],
    Phone: ['Your WhatsApp number', 'Ton numéro WhatsApp'],
    PhoneHelp: ['With your country code. We message you here once we’ve read your project.', 'Avec l’indicatif du pays. On t’écrit ici une fois ton projet lu.'],
    ContactQ: ['How should we reach you?', 'Comment on te joint ?'],
    NoteL: ['Your note (optional)', 'Ta note (optionnel)'],
    Add: ['+ Add a note, a link or a release date', '+ Ajouter une note, un lien ou une date'],
    Consent: [`Nothing is sent until you press send. We only use it to reply with your price. <a href="${BASE}privacy/">Privacy</a>`, `Rien n’est envoyé avant que tu appuies sur Envoyer. On s’en sert seulement pour te répondre avec ton prix. <a href="${BASE}fr/privacy/">Confidentialité</a>`],
  }

  const emailOk = () => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())
  const phoneOk = () => phone.value.replace(/\D/g, '').length >= 8
  const complete = () => name.value.trim() && emailOk() && phoneOk()
  const svc = () => SERVICES[st.pick]
  const wantsCall = () => !!(svc() && svc().call)

  function tipHtml(t) {
    if (!t) return ''
    const [kind, sw, en, f] = t
    const can = sw && !(sw[0] === st.pick && (sw[1] || '') === st.answer) && !(sw[0] === st.pick && st.pick !== 'Song')
    const btn = can ? ` <button type="button" class="sf-switch" data-switch="${esc(sw[0])}" data-switch-a="${esc(sw[1])}">${L('Switch', 'Changer')}</button>` : ''
    return `<p class="note ${kind}">${P(esc(L(en, f)))}${btn}</p>`
  }

  function paint() {
    dlg.querySelectorAll('[data-t]').forEach((el) => { el.innerHTML = L(...T[el.dataset.t]) })
    const step = st.step
    dlg.dataset.step = step
    dlg.querySelectorAll('[data-pane]').forEach((p) => { p.hidden = String(p.dataset.pane) !== String(step) })
    // progress
    $('[data-steptxt]').textContent = step === 'done' ? L('Sent', 'Envoyé') : L(`Step ${step} of 3`, `Étape ${step} sur 3`)
    dlg.querySelectorAll('.sheet-bar i').forEach((i, n) => i.classList.toggle('on', step === 'done' || n < step))
    $('[data-back]').style.visibility = step === 2 || step === 3 ? 'visible' : 'hidden'

    // step 1
    dlg.querySelectorAll('[data-pick]').forEach((b) => {
      const s = SERVICES[b.dataset.pick]
      b.querySelector('b').textContent = L(...s.label)
      b.querySelector('small').textContent = s.price ? money(s.price) : s.from ? L(`from ${money(s.from)}`, `dès ${money(s.from)}`) : b.dataset.pick === 'Not sure' ? L('We help you pick', 'On t’aide à choisir') : L('Priced per project', 'Prix selon le projet')
      b.setAttribute('aria-checked', String(b.dataset.pick === st.pick))
    })
    const me = read(ME_KEY)
    const w = $('[data-welcome]')
    if (me && me.name) { w.innerHTML = L(`Welcome back, ${esc(me.name.split(' ')[0])}.`, `Content de te revoir, ${esc(me.name.split(' ')[0])}.`); w.hidden = false } else w.hidden = true

    // step 2
    const s = svc()
    if (s) {
      $('[data-for]').innerHTML = `${icon(s.icon)}<span>${esc(L(...s.label))}</span>`
      $('[data-q]').textContent = L(...s.q)
      $('[data-answers]').innerHTML = s.a.map(([id, en, f, o = {}]) => {
        const pr = o.p ? `<span class="ans-p">${o.from ? L(`from ${money(o.p)}`, `dès ${money(o.p)}`) : money(o.p)}</span>` : ''
        const sub = o.sub ? `<small>${esc(L(...o.sub))}</small>` : ''
        return `<button type="button" class="ans${o.p || o.sub ? ' rich' : ''}" role="radio" aria-checked="${st.answer === id}" data-ans="${id}"><b>${esc(L(en, f))}</b>${sub}${pr}</button>`
      }).join('')
      const tips = []
      if (s.always) tips.push(tipHtml(s.always))
      if (s.tip && s.tip[st.answer]) tips.push(tipHtml(s.tip[st.answer]))
      $('[data-tips]').innerHTML = tips.join('')
      $('[data-for2]').innerHTML = `${icon(s.icon)}<span>${esc(shown(st))}${ansOf(st) && st.pick !== 'Song' ? ` · ${esc(L(ansOf(st)[1], ansOf(st)[2]))}` : ''}</span>`
    }

    // step 3
    dlg.querySelectorAll('[data-pref]').forEach((b) => {
      b.textContent = b.dataset.pref === 'text' ? L('Text me on WhatsApp', 'Écris-moi sur WhatsApp') : L('Call me', 'Appelle-moi')
      b.setAttribute('aria-checked', String(b.dataset.pref === st.pref))
    })
    $('[data-addnote]').textContent = L(...T.Add)
    msg.placeholder = L('Demo link, release date, anything we should know', 'Lien de démo, date de sortie, ce qu’on devrait savoir')
    name.classList.toggle('is-ok', !!name.value.trim()); email.classList.toggle('is-ok', emailOk()); phone.classList.toggle('is-ok', phoneOk())

    // the one button: always says what comes next
    primary.hidden = false
    primary.classList.remove('ghost')
    if (step === 1) { primary.textContent = L('Next: one quick question', 'Suivant : une question rapide'); primary.disabled = !st.pick }
    else if (step === 2) { primary.textContent = L('Next: your details', 'Suivant : tes coordonnées'); primary.disabled = !st.answer }
    else if (step === 3) { primary.textContent = L('Send my project', 'Envoyer mon projet'); primary.disabled = false }
    else { primary.textContent = L('Done', 'Terminé'); primary.disabled = false; primary.classList.add('ghost') }
  }

  function go(step, focus = true) {
    st.step = step
    save()
    paint()
    const body = $('[data-form]')
    body.scrollTop = 0
    const pane = dlg.querySelector(`[data-pane="${step}"]`)
    if (!reduce && pane) { pane.classList.remove('pane-in'); void pane.offsetWidth; pane.classList.add(go.back ? 'pane-in-back' : 'pane-in') ; setTimeout(() => pane.classList.remove('pane-in', 'pane-in-back'), 400) }
    go.back = false
    if (!focus) return
    // on phones, focus the heading: jumping into a field would throw the keyboard up mid-animation
    const fine = matchMedia('(pointer: fine)').matches
    const target = step === 3 && fine ? (!name.value.trim() ? name : !emailOk() ? email : !phoneOk() ? phone : primary) : pane?.querySelector('h2')
    if (target) { if (target.tagName === 'H2') target.setAttribute('tabindex', '-1'); target.focus({ preventScroll: true }) }
  }

  function choose(pick, answer) {
    if (!SERVICES[pick]) pick = 'Not sure'
    if (pick !== st.pick) st.answer = ''
    st.pick = pick
    if (answer !== undefined && answer !== null && answer !== '') st.answer = answer
    save()
  }

  // ---------- open / close, with the page stepping back behind the panel ----------
  let opener = null, pushed = false, fresh = false
  function open(pick, answer) {
    opener = document.activeElement
    if (st.step === 'done' || fresh) { fresh = false; sent = false; logLead.once = false; st.pick = ''; st.answer = ''; st.note = ''; msg.value = ''; st.step = 1 }
    if (pick) { choose(pick, answer); st.step = 2 }
    if (!st.pick) st.step = 1
    const me = read(ME_KEY)
    if (me) { if (!name.value) name.value = me.name || ''; if (!email.value) email.value = me.email || ''; if (!phone.value) phone.value = me.phone || '' }
    if (st.note && !msg.value) { msg.value = st.note; $('[data-notefield]').hidden = false }
    paint()
    if (!dlg.open) {
      // the page steps back around the spot you were looking at, so nothing jumps
      const m = document.querySelector('main')
      document.documentElement.style.setProperty('--oy', `${Math.round(innerHeight / 2 - (m ? m.getBoundingClientRect().top : 0))}px`)
      document.documentElement.classList.add('sheet-open')
      dlg.showModal()
      requestAnimationFrame(() => dlg.classList.add('is-in'))
      try { history.pushState({ etSheet: 1 }, ''); pushed = true } catch { pushed = false }
      track('project-open' + (pick ? '-' + pick : ''))
    }
    go(st.step)
  }
  function shut() {
    if (!dlg.open) return
    dlg.classList.remove('is-in')
    document.documentElement.classList.remove('sheet-open')
    const fin = () => { dlg.close(); if (opener && opener.focus) opener.focus({ preventScroll: true }) }
    if (reduce) fin(); else setTimeout(fin, 280)
  }
  function close() {
    if (pushed) { pushed = false; history.back(); return } // popstate below does the closing
    shut()
  }
  window.addEventListener('popstate', () => { if (dlg.open) { pushed = false; shut() } })
  dlg.addEventListener('cancel', (e) => { e.preventDefault(); close() })
  dlg.addEventListener('click', (e) => { if (e.target === dlg) close() }) // tap outside the card
  $('[data-close]').addEventListener('click', close)
  $('[data-back]').addEventListener('click', () => { go.back = true; go(st.step === 3 ? 2 : 1) })

  // drag the top bar down to close (phones)
  ;(() => {
    const bar = $('[data-drag]'), card = $('[data-card]')
    let y0 = null, dy = 0
    bar.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) return; y0 = e.clientY; dy = 0; card.style.transition = 'none'; bar.setPointerCapture(e.pointerId) })
    bar.addEventListener('pointermove', (e) => { if (y0 === null) return; dy = Math.max(0, e.clientY - y0); card.style.transform = `translateY(${dy}px)` })
    const end = () => { if (y0 === null) return; y0 = null; card.style.transition = ''; card.style.transform = ''; if (dy > 90) close() }
    bar.addEventListener('pointerup', end); bar.addEventListener('pointercancel', end)
  })()

  // ---------- inside the panel ----------
  let sent = false
  function snapshot(status) {
    const a = ansOf(st)
    return { status, pick: leadName(st), answer: a ? (st.pick === 'Song' ? 'Song package' : a[1]) : '', name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), contact: st.pref === 'call' ? 'Call' : 'Text (WhatsApp)', call: wantsCall() ? 'Offered 15-min call' : '', note: msg.value.trim(), selection: '' }
  }
  // Drafts stay on this device; nothing reaches us until the visitor presses send (Québec Law 25: clear consent)
  function keep() {
    st.note = msg.value
    save()
  }

  dlg.addEventListener('click', (e) => {
    const pk = e.target.closest('[data-pick]')
    if (pk) {
      choose(pk.dataset.pick)
      track('project-pick-' + pk.dataset.pick)
      paint()
      // the choice is the action: move on by itself, after the press is felt
      setTimeout(() => go(2), reduce ? 0 : 170)
      return
    }
    const an = e.target.closest('[data-ans]')
    if (an) { st.answer = an.dataset.ans; save(); paint(); const t = svc().tip?.[st.answer]; if (!t && !svc().always) setTimeout(() => go(3), reduce ? 0 : 200); return }
    const sw = e.target.closest('[data-switch]')
    if (sw) { choose(sw.dataset.switch, sw.dataset.switchA); st.answer = sw.dataset.switchA || ''; save(); go(2); return }
    const pr = e.target.closest('[data-pref]')
    if (pr) { st.pref = pr.dataset.pref; save(); paint(); keep(); return }
    const add = e.target.closest('[data-addnote]')
    if (add) { const f = $('[data-notefield]'); f.hidden = !f.hidden; add.setAttribute('aria-expanded', String(!f.hidden)); if (!f.hidden) msg.focus(); return }
    if (e.target.closest('[data-edit]')) { sent = false; go.back = true; go(3); return }
  })
  dlg.addEventListener('input', () => { paint(); keep() })
  $('[data-form]').addEventListener('submit', (e) => { e.preventDefault(); primary.click() })
  dlg.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.matches('input') && st.step === 3) { e.preventDefault(); primary.click() } })
  // Choices are radio groups: arrow keys move between choices, Enter or Space picks one
  // (picking moves on to the next step, so arrows only move focus)
  dlg.addEventListener('keydown', (e) => {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[e.key]
    const group = step && e.target.matches('[role="radio"]') && e.target.closest('[role="radiogroup"]')
    if (!group) return
    const radios = [...group.querySelectorAll('[role="radio"]')]
    e.preventDefault()
    radios[(radios.indexOf(e.target) + step + radios.length) % radios.length].focus()
  })

  primary.addEventListener('click', () => {
    if (st.step === 1 && st.pick) return go(2)
    if (st.step === 2 && st.answer) return go(3)
    if (st.step === 'done') return close()
    if (st.step !== 3) return
    const err = $('[data-err]')
    if (!complete()) {
      const miss = !name.value.trim() ? [L('add your name.', 'ajoute ton nom.'), name]
        : !emailOk() ? [L('check your email, it looks incomplete.', 'vérifie ton courriel, il semble incomplet.'), email]
        : [L('add your WhatsApp number with the country code.', 'ajoute ton numéro WhatsApp avec l’indicatif du pays.'), phone]
      err.innerHTML = `<b>${L('Almost:', 'Presque :')}</b> ${miss[0]}`
      err.hidden = false
      miss[1].focus()
      return
    }
    err.hidden = true
    send()
  })

  function send() {
    const a = ansOf(st), s = svc()
    const lines = [
      'EclipseTone: new project',
      `Project: ${leadName(st)}`,
      a && st.pick !== 'Song' ? `${s.q[0]} ${a[1]}` : '',
      `Name: ${name.value.trim()}`,
      `Email: ${email.value.trim()}`,
      `WhatsApp: ${phone.value.trim()}`,
      `Contact me by: ${st.pref === 'call' ? 'phone call' : 'WhatsApp text'}`,
      wantsCall() ? 'Booking a 15-min call next' : '',
      msg.value.trim() ? `Note: ${msg.value.trim()}` : '',
    ].filter(Boolean)
    const href = `${WA}?text=${encodeURIComponent(lines.join('\n'))}`
    sent = true
    logLead(snapshot('sent'))
    write(ME_KEY, { name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), pref: st.pref })
    write(LAST_KEY, { pick: leadName(st), at: Date.now() })
    const viaSheet = !!(window.ET_CONFIG || {}).leadSheetUrl
    if (!viaSheet) window.open(href, '_blank', 'noopener,noreferrer')
    done(href, viaSheet)
    // the next visit starts fresh; contact details stay remembered
    write(ST_KEY, { pref: st.pref })
  }

  function done(href, viaSheet) {
    const first = esc(name.value.trim().split(' ')[0])
    const tel = esc(phone.value.trim())
    const reach = st.pref === 'call'
      ? L(`We’ll call you at <b>${tel}</b>, usually within 24 hours.`, `On t’appelle au <b>${tel}</b>, en général en moins de 24 h.`)
      : L(`We’ll message you on WhatsApp at <b>${tel}</b>, usually within 24 hours.`, `On t’écrit sur WhatsApp au <b>${tel}</b>, en général en moins de 24 h.`)
    // Calendly is a third party with its own cookies: it only loads if the visitor chooses to book,
    // in a new tab under Calendly's own privacy notice. We pass the name and email they gave us, nothing else.
    const cal = new URL(CALENDLY)
    cal.searchParams.set('name', name.value.trim())
    cal.searchParams.set('email', email.value.trim())
    const next = [
      [L('We read your project', 'On lit ton projet'), 'eye'],
      [L('You get your price', 'Tu reçois ton prix'), 'tag'],
      [L('We start when you say yes', 'On commence quand tu dis oui'), 'play'],
    ]
    $('[data-pane="done"]').innerHTML = `
      <p class="done-badge" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg></p>
      <h2 tabindex="-1">${viaSheet ? L(`Got it, ${first}. Thank you.`, `C’est reçu, ${first}. Merci.`) : L(`Almost done, ${first}.`, `Presque fini, ${first}.`)}</h2>
      ${viaSheet ? `<p class="pane-sub">${reach}</p>` : `<p class="note warn"><b>${L('One last tap:', 'Un dernier geste :')}</b> ${L('WhatsApp opened with your project. Press <b>Send</b> there so we get it.', 'WhatsApp s’est ouvert avec ton projet. Appuie sur <b>Envoyer</b> pour qu’on le reçoive.')} <a href="${href}" target="_blank" rel="noopener">${L('Didn’t open? Tap here', 'Rien ne s’ouvre ? Touche ici')}</a></p>`}
      <ol class="done-flow">${next.map(([t, i]) => `<li>${icon(i)}<span>${t}</span></li>`).join('')}</ol>
      ${wantsCall() ? `
      <div class="sf-call">
        <p class="sf-call-t">${L('Want to talk it through? Pick a time.', 'Tu veux en parler ? Choisis un moment.')}</p>
        <p class="sf-call-s">${L('A free 15-minute call. We listen to your idea and confirm your price. Optional.', 'Un appel gratuit de 15 minutes. On écoute ton idée et on confirme ton prix. Optionnel.')}</p>
        <p><a class="btn ghost" href="${esc(cal.href)}" target="_blank" rel="noopener">${L('Book a 15-minute call', 'Réserver un appel de 15 minutes')}</a></p>
        <p class="hint">${L('Opens Calendly, our booking tool, in a new tab.', 'Ouvre Calendly, notre outil de réservation, dans un nouvel onglet.')}</p>
      </div>` : ''}
      <p class="done-edit"><button type="button" class="sf-switch" data-edit>${L('Fix a detail', 'Corriger un détail')}</button></p>`
    st.step = 'done'
    paint()
    dlg.querySelector('[data-pane="done"] h2').focus({ preventScroll: true })
    $('[data-form]').scrollTop = 0
  }

  new MutationObserver(() => { if (dlg.open && st.step !== 'done') paint() }).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  document.addEventListener('et:currency', () => { if (dlg.open) paint() })

  // ---------- openers anywhere on the page ----------
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-start]')
    if (!b || dlg.contains(b)) return
    e.preventDefault()
    let pick = b.getAttribute('data-start') || '', answer = b.getAttribute('data-answer') || ''
    if (ALIAS[pick]) { answer = answer || ALIAS[pick][1]; pick = ALIAS[pick][0] }
    open(pick, answer)
  })
  // Deep links: eclipsetone.com/#start or ?start=Website
  const q = new URLSearchParams(location.search).get('start')
  if (location.hash === '#start' || q) {
    let pick = q || '', answer = ''
    if (ALIAS[pick]) { answer = ALIAS[pick][1]; pick = ALIAS[pick][0] }
    setTimeout(() => open(pick, answer), 250)
  }
  window.EclipseProject = { open, close }
})()
