// EclipseTone "Get your price" form.
// One choice at a time: pick what you need, answer one quick question, say where we reply.
// The form adapts to the choice (question, tips, what happens next) and sends through WhatsApp.
;(() => {
  const WA = 'https://wa.me/14384668971'
  const CALENDLY = 'https://calendly.com/eclipsetonereservation/free-onboarding-call'
  // Bigger projects get a 15-minute call to talk it through. Simple orders don't need one.
  const CALL_PICKS = ['Full Song', 'Song + Songwriting', 'Song + Launch', '3-Song EP', 'Not sure']
  const BASE = (document.currentScript?.src || '').replace(/smartform\.js.*$/, '')
  const ME_KEY = 'eclipsetone-me'
  const LAST_KEY = 'eclipsetone-last'
  const fr = () => document.documentElement.lang === 'fr'
  const L = (en, f) => (fr() ? String(f).replace(/ ([?:!;»])/g, '\u00a0$1') : en)
  const P = (t) => (window.etPrices ? window.etPrices(t) : t)
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])
  const read = (k) => { try { return JSON.parse(localStorage.getItem(k) || 'null') } catch { return null } }
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch { /* private mode */ } }

  const HAVE = [
    ['vocals', 'Recorded vocals', 'Des voix enregistrées'],
    ['lyrics', 'Lyrics', 'Des paroles'],
    ['memo', 'A voice memo', 'Un mémo vocal'],
    ['idea', 'Just an idea', 'Juste une idée'],
  ]

  // Everything the form knows about each choice.
  const PICKS = {
    'Full Song': { label: ['Full Song', 'Chanson complète'],
      price: '$599', hint: ['You have vocals or lyrics', 'Tu as des voix ou des paroles'],
      q: ['What do you have right now?', 'Tu as quoi en ce moment ?'], a: HAVE,
      tip: { idea: ['switch', 'Song + Songwriting', 'Just an idea? Song + Songwriting ($997) adds a writing session with you.', 'Juste une idée ? Chanson + écriture (997 $) ajoute une session d’écriture avec toi.'] },
      next: [['We reply within 24 hours with your price', 'On répond en moins de 24 h avec ton prix'], ['You send your vocals or lyrics', 'Tu envoies tes voix ou tes paroles'], ['First version in 7 days', 'Première version en 7 jours'], ['Your finished song in 2 to 3 weeks', 'Ta chanson finie en 2 à 3 semaines']],
      cta: ['Get my price', 'Obtenir mon prix'],
    },
    'Song + Songwriting': { label: ['Song + Songwriting', 'Chanson + écriture'],
      price: '$997', hint: ['You have just an idea', 'Tu as juste une idée'],
      q: ['What do you have right now?', 'Tu as quoi en ce moment ?'], a: HAVE,
      tip: { vocals: ['switch', 'Full Song', 'Already have vocals? Full Song ($599) may be all you need.', 'Tu as déjà des voix ? Chanson complète (599 $) suffit peut-être.'] },
      next: [['We reply within 24 hours with your price', 'On répond en moins de 24 h avec ton prix'], ['We write the song with you (2 hours)', 'On écrit la chanson avec toi (2 h)'], ['First version in 7 days', 'Première version en 7 jours'], ['Your finished song in 2 to 3 weeks', 'Ta chanson finie en 2 à 3 semaines']],
      cta: ['Get my price', 'Obtenir mon prix'],
    },
    'Song + Launch': { label: ['Song + Launch', 'Chanson + lancement'],
      price: '$2,000', hint: ['Your song plus the launch', 'Ta chanson plus le lancement'],
      q: ['When do you want to release?', 'Tu veux sortir quand ?'],
      a: [['month', 'Within a month', 'D’ici un mois'], ['quarter', 'In 1 to 3 months', 'Dans 1 à 3 mois'], ['open', 'No date yet', 'Pas encore de date']],
      tip: { month: ['warn', '', 'Tight, but doable. Put your date in the note so we plan backwards from it.', 'Serré, mais faisable. Mets ta date dans la note pour qu’on planifie à rebours.'] },
      next: [['We reply within 24 hours with your price', 'On répond en moins de 24 h avec ton prix'], ['We write the song with you', 'On écrit la chanson avec toi'], ['Your finished song in 2 to 3 weeks', 'Ta chanson finie en 2 à 3 semaines'], ['We plan and run your launch with you', 'On planifie et lance ta sortie avec toi']],
      cta: ['Get my price', 'Obtenir mon prix'],
    },
    '3-Song EP': { label: ['3-Song EP', 'EP 3 chansons'],
      price: '$1,597', hint: ['3 songs, save $200', '3 chansons, économise 200 $'],
      q: ['What do you have right now?', 'Tu as quoi en ce moment ?'], a: HAVE,
      tip: { idea: ['info', '', 'No problem. We can add a writing session for each song. We’ll price it in your reply.', 'Pas de problème. On peut ajouter une session d’écriture par chanson. On l’inclut dans ton prix.'] },
      next: [['We reply within 24 hours with your price', 'On répond en moins de 24 h avec ton prix'], ['You send what you have for the 3 songs', 'Tu envoies ce que tu as pour les 3 chansons'], ['First versions, one song at a time', 'Premières versions, une chanson à la fois'], ['3 finished songs that sound like one project', '3 chansons finies qui sonnent comme un projet']],
      cta: ['Get my price', 'Obtenir mon prix'],
    },
    'Mixing': { label: ['Mixing', 'Mixage'],
      price: '$150+', hint: ['Your song is recorded', 'Ta chanson est enregistrée'],
      q: ['How many tracks (stems) does your song have?', 'Combien de pistes a ta chanson ?'],
      a: [['s', 'Under 16', 'Moins de 16'], ['m', '16 to 40', '16 à 40'], ['l', 'Over 40', 'Plus de 40'], ['ns', 'Not sure', 'Je ne sais pas']],
      tip: { ns: ['info', '', 'No problem. Count them later, or just send the files and we count for you.', 'Pas de souci. Compte-les plus tard, ou envoie les fichiers et on compte pour toi.'] },
      next: [['We reply within 24 hours with your exact price', 'On répond en moins de 24 h avec ton prix exact'], ['You send your tracks (WAV files)', 'Tu envoies tes pistes (fichiers WAV)'], ['First mix in a few days', 'Premier mix en quelques jours'], ['2 rounds of changes, then your final mix', '2 rondes de changements, puis ton mix final']],
      cta: ['Get my price', 'Obtenir mon prix'],
    },
    'Studio Recording': { label: ['Studio Recording', 'Enregistrement en studio'],
      price: '$350', hint: ['In person, Montréal', 'En personne, Montréal'],
      q: ['When do you want to come in?', 'Tu veux venir quand ?'],
      a: [['week', 'This week', 'Cette semaine'], ['two', 'In the next 2 weeks', 'Dans les 2 prochaines semaines'], ['flex', 'I’m flexible', 'Je suis flexible']],
      always: ['warn', '', 'In person only, at our studio in Montréal. Not nearby? Full Song works 100% online.', 'En personne seulement, à notre studio à Montréal. Pas dans le coin ? Chanson complète se fait 100 % en ligne.'],
      next: [['We reply within 24 hours with open times', 'On répond en moins de 24 h avec les plages libres'], ['You pick a time that works', 'Tu choisis un moment qui te va'], ['2 hours in the studio with Smail', '2 heures au studio avec Smail'], ['You get your song, mixed', 'Tu reçois ta chanson, mixée']],
      cta: ['Ask for open times', 'Demander les disponibilités'],
    },
    'Physical copies': {
      price: '', label: ['Physical copies', 'Copies physiques'], hint: ['CDs, USB‑C cards, cassettes, vinyl', 'CD, cartes USB‑C, cassettes, vinyle'],
      q: ['Which format?', 'Quel format ?'],
      a: [['cd', 'CDs', 'CD'], ['usb', 'USB‑C cards', 'Cartes USB‑C'], ['tape', 'Cassettes', 'Cassettes'], ['vinyl', 'Vinyl', 'Vinyle']],
      tip: { vinyl: ['warn', '', 'Vinyl takes 8 to 12 weeks. Ask early if you have a release date.', 'Le vinyle prend 8 à 12 semaines. Demande tôt si tu as une date de sortie.'] },
      next: [['We reply within 24 hours with your total', 'On répond en moins de 24 h avec ton total'], ['You send your cover (or we design it)', 'Tu envoies ta pochette (ou on la conçoit)'], ['You approve a proof', 'Tu approuves une épreuve'], ['Ready in about 2 to 3 weeks', 'Prêt en environ 2 à 3 semaines']],
      cta: ['Get my total', 'Obtenir mon total'],
    },
    'Not sure': {
      price: '', hint: ['We help you pick', 'On t’aide à choisir'], label: ['Not sure yet', 'Pas encore sûr'],
      q: ['What do you have right now?', 'Tu as quoi en ce moment ?'],
      a: [['song', 'A recorded song', 'Une chanson enregistrée'], ['vocals', 'Recorded vocals', 'Des voix enregistrées'], ['lyrics', 'Lyrics', 'Des paroles'], ['idea', 'Just an idea', 'Juste une idée']],
      tip: {
        song: ['switch', 'Mixing', 'Mixing (from $150) is the one for you.', 'Mixage (dès 150 $) est fait pour toi.'],
        vocals: ['switch', 'Full Song', 'Full Song ($599) is the one for you.', 'Chanson complète (599 $) est faite pour toi.'],
        lyrics: ['switch', 'Full Song', 'Full Song ($599) is the one for you.', 'Chanson complète (599 $) est faite pour toi.'],
        idea: ['switch', 'Song + Songwriting', 'Song + Songwriting ($997) is the one for you.', 'Chanson + écriture (997 $) est faite pour toi.'],
      },
      next: [['We reply within 24 hours', 'On répond en moins de 24 h'], ['We tell you what fits and the price', 'On te dit ce qui te convient et le prix'], ['You decide. No payment until you say yes.', 'Tu décides. Aucun paiement avant ton oui.']],
      cta: ['Help me choose', 'Aide-moi à choisir'],
    },
  }
  const nm = (k) => (PICKS[k] && PICKS[k].label ? L(...PICKS[k].label) : k)
  const ORDER = ['Full Song', 'Song + Songwriting', 'Song + Launch', '3-Song EP', 'Mixing', 'Studio Recording', 'Physical copies', 'Not sure']

  // Lead log: every request with a valid email lands in the Google Sheet, sent or not.
  function leadId() {
    try {
      let id = sessionStorage.getItem('eclipsetone-lead-id')
      if (!id) { id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7); sessionStorage.setItem('eclipsetone-lead-id', id) }
      return id
    } catch { return 'x' + Date.now().toString(36) }
  }
  const track_ = (n) => document.dispatchEvent(new CustomEvent('et:track', { detail: n }))
  function logLead(data) {
    if (data.status === 'sent' || (data.status === 'started' && !logLead.once)) { logLead.once = true; track_('price-form-' + data.status) }
    const url = (window.ET_CONFIG || {}).leadSheetUrl
    if (!url) return
    const body = JSON.stringify(Object.assign({ id: leadId(), page: location.pathname, lang: document.documentElement.lang }, data))
    try { fetch(url, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' }, body, keepalive: true }).catch(() => {}) } catch { /* ignore */ }
  }

  function build(form) {
    const st = { pick: '', answer: '' }
    form.innerHTML = `
      <div class="sf-plan" data-sf-plan hidden></div>
      <p class="sf-back note ok" data-sf-welcome hidden></p>
      <fieldset class="sf-block is-open" data-b="1">
        <legend><span class="sf-num">1</span><span data-t="Step1"></span></legend>
        <div class="sf-picks" role="radiogroup">${ORDER.map((k) => `<button type="button" class="sf-pick" role="radio" aria-checked="false" data-pick="${esc(k)}"><b></b><span class="sf-pp"></span><small></small></button>`).join('')}</div>
      </fieldset>
      <fieldset class="sf-block" data-b="2" hidden>
        <legend><span class="sf-num">2</span><span data-q></span></legend>
        <div class="sf-answers" role="radiogroup" data-answers></div>
        <div data-tips></div>
        <div class="sf-next"><p class="sf-next-t" data-t="Next"></p><ol data-next></ol></div>
      </fieldset>
      <fieldset class="sf-block" data-b="3" hidden>
        <legend><span class="sf-num">3</span><span data-t="Step3"></span></legend>
        <div class="row">
          <div class="field"><label for="sf-name" data-t="Name"></label><input id="sf-name" name="name" autocomplete="name" required /></div>
          <div class="field"><label for="sf-email" data-t="Email"></label><input id="sf-email" name="email" type="email" autocomplete="email" inputmode="email" required /></div>
        </div>
        <div class="field"><label for="sf-phone" data-t="Phone"></label><input id="sf-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" required /><small class="sf-help" data-t="PhoneHelp"></small></div>
        <div class="sf-contact"><p class="sf-contact-t" data-t="ContactQ"></p><div class="sf-answers" role="radiogroup" data-contact>
          <button type="button" class="sf-ans" role="radio" aria-checked="true" data-pref="text"></button>
          <button type="button" class="sf-ans" role="radio" aria-checked="false" data-pref="call"></button>
        </div></div>
        <p class="sf-consent" data-t="Consent"></p>
        <button type="button" class="sf-add" data-addnote aria-expanded="false"></button>
        <div class="field" data-notefield hidden><label for="sf-msg" data-t="NoteL"></label><textarea id="sf-msg" name="message" rows="3"></textarea></div>
        <p class="note err" data-form-error hidden></p>
        <div class="actions"><button class="btn big cta-go" type="submit" data-cta></button></div>
        <p class="hint" data-t="Hint"></p>
      </fieldset>`
    const done = document.createElement('div')
    done.className = 'sf-done'
    done.hidden = true
    form.after(done)

    const $ = (s) => form.querySelector(s)
    const name = $('#sf-name'), email = $('#sf-email'), msg = $('#sf-msg'), phone = $('#sf-phone')
    let pref = 'text'
    const T = {
      Step1: ['What do you need?', 'De quoi as-tu besoin ?'],
      Next: ['What happens next', 'La suite'],
      Step3: ['How do we reach you?', 'Comment te joindre ?'],
      Phone: ['Your WhatsApp number', 'Ton numéro WhatsApp'],
      PhoneHelp: ['With your country code, like +1 514 555 0123. We contact you here after we review your request.', 'Avec l’indicatif du pays, par ex. +1 514 555 0123. On te contacte ici après avoir lu ta demande.'],
      ContactQ: ['How do you prefer we contact you?', 'Tu préfères qu’on te contacte comment ?'],
      Name: ['Your name', 'Ton nom'],
      Email: ['Your email', 'Ton courriel'],
      NoteL: ['Your note (optional)', 'Ta note (optionnel)'],
      Consent: [`We save what you type here so we can reply, even if you don’t finish. <a href="${BASE}privacy/">Privacy policy</a>`, `On garde ce que tu écris ici pour pouvoir te répondre, même si tu ne finis pas. <a href="${BASE}privacy/">Politique de confidentialité</a>`],
      Add: ['+ Add a note, a link or a release date (optional)', '+ Ajouter une note, un lien ou une date (optionnel)'],
      Hint: ['No payment now. We read every request ourselves.', 'Aucun paiement maintenant. On lit chaque demande nous-mêmes.'],
    }

    function paintStatic() {
      form.querySelectorAll('[data-t]').forEach((el) => { el.innerHTML = L(...T[el.dataset.t]) })
      form.querySelectorAll('.sf-pick').forEach((b) => {
        const p = PICKS[b.dataset.pick]
        b.querySelector('b').textContent = p.label ? L(...p.label) : b.dataset.pick
        b.querySelector('.sf-pp').textContent = P(b.dataset.pick === 'Physical copies' ? L('From $249', 'Dès 249 $') : p.price)
        b.querySelector('small').textContent = L(...p.hint)
      })
      $('[data-addnote]').textContent = L(...T.Add)
      $('[data-pref="text"]').textContent = L('Text me on WhatsApp', 'Écris-moi sur WhatsApp')
      $('[data-pref="call"]').textContent = L('Call me', 'Appelle-moi')
      form.querySelectorAll('[data-pref]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.pref === pref)))
      msg.placeholder = L('Demo link, release date, anything we should know', 'Lien de démo, date de sortie, ce qu’on devrait savoir')
    }

    function note(kind, html, sw) {
      const cls = kind === 'switch' ? 'ok' : kind
      const btn = sw && sw !== st.pick ? ` <button type="button" class="sf-switch" data-switch="${esc(sw)}">${L('Switch to', 'Passer à')} ${esc(nm(sw))}</button>` : ''
      return `<p class="note ${cls}">${P(html)}${btn}</p>`
    }

    function paint() {
      paintStatic()
      form.querySelectorAll('.sf-pick').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.pick === st.pick)))
      const p = PICKS[st.pick]
      const b2 = $('[data-b="2"]'), b3 = $('[data-b="3"]')
      $('[data-b="1"]').classList.toggle('is-done', !!p)
      if (!p) { b2.hidden = b3.hidden = true; return }
      b2.hidden = b3.hidden = false
      $('[data-q]').textContent = L(...p.q)
      $('[data-answers]').innerHTML = p.a.map(([id, en, f]) => `<button type="button" class="sf-ans" role="radio" aria-checked="${st.answer === id}" data-ans="${id}">${esc(L(en, f))}</button>`).join('')
      const tips = []
      if (p.always) tips.push(note(p.always[0], L(p.always[2], p.always[3])))
      const t = p.tip && p.tip[st.answer]
      if (t) tips.push(note(t[0], L(t[2], t[3]), t[1]))
      $('[data-tips]').innerHTML = tips.join('')
      $('[data-next]').innerHTML = steps().map(([en, f]) => `<li>${esc(L(en, f))}</li>`).join('')
      b2.classList.toggle('is-done', !!st.answer)
      $('[data-cta]').textContent = st.pick === 'Not sure' || st.pick === 'Physical copies' || st.pick === 'Studio Recording'
        ? L(...p.cta)
        : `${L(...p.cta)}${L(':', ' :')} ${nm(st.pick)}`
      check()
    }

    const wantsCall = () => CALL_PICKS.includes(st.pick)
    function steps() {
      const p = PICKS[st.pick]
      return wantsCall() ? [['You book a free 15-minute call about your project', 'Tu réserves un appel gratuit de 15 minutes sur ton projet'], ...p.next] : p.next
    }
    let sent = false, timer = 0
    function snapshot(status) {
      const p = PICKS[st.pick]
      const ans = p && p.a.find(([id]) => id === st.answer)
      return { status, pick: st.pick, answer: ans ? ans[1] : '', name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), contact: pref === 'call' ? 'Call' : 'Text (WhatsApp)', call: wantsCall() ? 'Offered 15-min call' : '', note: msg.value.trim(), selection: (window.EclipsePlan?.lines?.() || []).join(' | ') }
    }
    function track() {
      if (sent || !valid()) return
      clearTimeout(timer)
      timer = setTimeout(() => logLead(snapshot('started')), 1200)
    }
    window.addEventListener('pagehide', () => { if (!sent && valid()) logLead(snapshot('started')) })
    const phoneOk = () => phone.value.replace(/\D/g, '').length >= 8
    const emailOk = () => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim())
    // A lead is worth saving as soon as we can reach them one way or another.
    function valid() { return name.value.trim() && (emailOk() || phoneOk()) }
    function complete() { return name.value.trim() && emailOk() && phoneOk() }
    function check() {
      const ok = !!complete()
      $('[data-b="3"]').classList.toggle('is-done', ok)
      phone.classList.toggle('is-ok', phoneOk())
      name.classList.toggle('is-ok', !!name.value.trim())
      email.classList.toggle('is-ok', /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.value.trim()))
    }

    function choose(k, scroll) {
      if (!PICKS[k]) k = 'Not sure'
      if (st.pick !== k) st.answer = ''
      st.pick = k
      paint()
      if (scroll) $('[data-b="2"]').scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    function plan() {
      const lines = window.EclipsePlan?.lines?.() || []
      const box = $('[data-sf-plan]')
      if (!lines.length) { box.hidden = true; return [] }
      box.hidden = false
      const rich = window.EclipsePlan?.html?.() || ''
      box.innerHTML = `<p class="sf-plan-t">${L('Your selection', 'Ta sélection')}</p>${rich || `<ul>${lines.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`}<p class="sf-plan-f">${L('We’ll send it with your request.', 'On l’envoie avec ta demande.')} <button type="button" class="sf-switch" data-editplan>${L('Change my selection', 'Modifier ma sélection')}</button></p>`
      return lines
    }

    function welcome() {
      const me = read(ME_KEY), last = read(LAST_KEY)
      if (me) { if (!name.value) name.value = me.name || ''; if (!email.value) email.value = me.email || ''; if (!phone.value) phone.value = me.phone || ''; if (me.pref) pref = me.pref }
      const w = $('[data-sf-welcome]')
      if (me && me.name) {
        const first = esc(me.name.split(' ')[0])
        const lastLine = last && last.pick ? ` ${L(`Last time you asked about ${esc(nm(last.pick))}. Didn’t hear back? Send it again, it’s fine.`, `La dernière fois, tu as demandé ${esc(nm(last.pick))}. Pas de réponse ? Renvoie-la, aucun souci.`)}` : ''
        w.innerHTML = `<b>${L(`Welcome back, ${first}.`, `Content de te revoir, ${first}.`)}</b>${lastLine}`
        w.hidden = false
      }
    }

    function showDone(href) {
      const first = esc(name.value.trim().split(' ')[0])
      const tel = esc(phone.value.trim())
      const viaSheet = !!(window.ET_CONFIG || {}).leadSheetUrl
      const reach = pref === 'call'
        ? L(`We’ll review your request and call you at <b>${tel}</b>, usually within 24 hours.`, `On lit ta demande et on t’appelle au <b>${tel}</b>, en général en moins de 24 h.`)
        : L(`We’ll review your request and message you on WhatsApp at <b>${tel}</b>, usually within 24 hours.`, `On lit ta demande et on t’écrit sur WhatsApp au <b>${tel}</b>, en général en moins de 24 h.`)
      const cal = new URL(CALENDLY)
      cal.searchParams.set('name', name.value.trim())
      cal.searchParams.set('email', email.value.trim())
      cal.searchParams.set('a1', `${st.pick} · WhatsApp ${phone.value.trim()}`)
      const calInline = new URL(cal)
      calInline.searchParams.set('embed_type', 'Inline')
      calInline.searchParams.set('embed_domain', location.hostname || 'eclipsetone.com')
      calInline.searchParams.set('hide_gdpr_banner', '1')
      done.innerHTML = `
        <p class="sf-done-badge">✓</p>
        <h3>${viaSheet ? L(`Got it, ${first}.`, `C’est reçu, ${first}.`) : L(`Almost done, ${first}.`, `Presque fini, ${first}.`)}</h3>
        ${viaSheet ? '' : `<p class="note warn"><b>${L('One last tap:', 'Un dernier geste :')}</b> ${L('WhatsApp opened with your request. Press <b>Send</b> there so we get it.', 'WhatsApp s’est ouvert avec ta demande. Appuie sur <b>Envoyer</b> pour qu’on la reçoive.')} <a href="${href}" target="_blank" rel="noopener">${L('Didn’t open? Tap here', 'Rien ne s’ouvre ? Touche ici')}</a></p>`}
        ${wantsCall() ? `
        <div class="sf-call">
          <p class="sf-call-t">${L('Last step: pick a time to talk', 'Dernière étape : choisis un moment pour parler')}</p>
          <p class="sf-call-s">${L('A free 15-minute call about your project. We listen to your idea, answer your questions and confirm your price.', 'Un appel gratuit de 15 minutes sur ton projet. On écoute ton idée, on répond à tes questions et on confirme ton prix.')}</p>
          <iframe class="sf-cal" title="${L('Book a 15-minute call', 'Réserver un appel de 15 minutes')}" src="${esc(calInline.href)}" loading="lazy"></iframe>
          <p class="hint">${L('Calendar not loading?', 'Le calendrier ne charge pas ?')} <a href="${esc(cal.href)}" target="_blank" rel="noopener">${L('Open it in a new tab', 'Ouvre-le dans un nouvel onglet')}</a>. ${L('Rather skip the call? No problem.', 'Tu préfères sauter l’appel ? Aucun souci.')} ${reach}</p>
        </div>` : `<p class="note ok">${reach}</p>`}
        <div class="sf-next"><p class="sf-next-t">${L('What happens next', 'La suite')}</p><ol>${steps().map(([en, f]) => `<li>${esc(L(en, f))}</li>`).join('')}</ol></div>
        <div class="actions"><button type="button" class="btn ghost" data-sf-edit>${L('Change my request', 'Modifier ma demande')}</button></div>`
      form.hidden = true
      done.hidden = false
      done.scrollIntoView({ behavior: 'smooth', block: 'start' })
      done.querySelector('[data-sf-edit]').addEventListener('click', () => { done.hidden = true; form.hidden = false; form.scrollIntoView({ behavior: 'smooth', block: 'start' }) })
    }

    form.addEventListener('click', (e) => {
      const pk = e.target.closest('[data-pick]')
      if (pk) { track_('price-form-pick-' + pk.dataset.pick); return choose(pk.dataset.pick, true) }
      const pr = e.target.closest('[data-pref]')
      if (pr) { pref = pr.dataset.pref; paint(); track(); return }
      const an = e.target.closest('[data-ans]')
      if (an) { st.answer = an.dataset.ans; paint(); track(); return }
      const sw = e.target.closest('[data-switch]')
      if (sw) { const keep = st.answer; choose(sw.dataset.switch); if (PICKS[st.pick].a.some(([id]) => id === keep)) { st.answer = keep; paint() } return }
      if (e.target.closest('[data-editplan]')) { document.querySelector('[data-guide-open]')?.click(); return }
      const add = e.target.closest('[data-addnote]')
      if (add) { const f = $('[data-notefield]'); f.hidden = !f.hidden; add.setAttribute('aria-expanded', String(!f.hidden)); if (!f.hidden) msg.focus() }
    })
    form.addEventListener('input', () => { check(); track() })
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const err = $('[data-form-error]')
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
      const p = PICKS[st.pick]
      const ans = p.a.find(([id]) => id === st.answer)
      const lines = [
        'EclipseTone: price request',
        `Interested in: ${st.pick}`,
        ans ? `${p.q[0]} ${ans[1]}` : '',
        ...plan().map((l) => `Selection: ${l}`),
        `Name: ${name.value.trim()}`,
        `Email: ${email.value.trim()}`,
        `WhatsApp: ${phone.value.trim()}`,
        `Contact me by: ${pref === 'call' ? 'phone call' : 'WhatsApp text'}`,
        wantsCall() ? 'Booking a 15-min call next' : '',
        msg.value.trim() ? `Note: ${msg.value.trim()}` : '',
      ].filter(Boolean)
      const href = `${WA}?text=${encodeURIComponent(lines.join('\n'))}`
      sent = true
      clearTimeout(timer)
      logLead(snapshot('sent'))
      write(ME_KEY, { name: name.value.trim(), email: email.value.trim(), phone: phone.value.trim(), pref })
      write(LAST_KEY, { pick: st.pick, at: Date.now() })
      // With the lead sheet connected, the request is saved directly. Without it, WhatsApp carries it.
      if (!(window.ET_CONFIG || {}).leadSheetUrl) window.open(href, '_blank', 'noopener,noreferrer')
      showDone(href)
    })

    // Other parts of the page (package buttons, the Get started guide) pick for us.
    document.addEventListener('et:package', (e) => { choose(e.detail); plan() })
    document.addEventListener('et:plan', () => plan())
    document.addEventListener('et:currency', () => { paint(); plan() })
    new MutationObserver(() => paint()).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })

    welcome()
    const pre = window.EclipsePlan?.pick?.()
    if (pre) st.pick = PICKS[pre] ? pre : 'Not sure'
    plan()
    paint()
  }

  // Buttons anywhere on the page: <a data-package="Full Song">
  document.querySelectorAll('[data-package]').forEach((b) => b.addEventListener('click', () => {
    document.dispatchEvent(new CustomEvent('et:package', { detail: b.getAttribute('data-package') }))
  }))
  document.querySelectorAll('form[data-smart-form]').forEach(build)
})()
