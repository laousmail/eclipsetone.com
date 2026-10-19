// Visitor stats with GoatCounter (free, no cookies, no banner needed).
// Turns on when ET_CONFIG.goatcounter is set in config.js.
// Counts page views plus the steps that matter: project panel, WhatsApp, orders.
;(() => {
  const code = (window.ET_CONFIG || {}).goatcounter
  const queue = []
  const send = (name) => {
    if (window.goatcounter && window.goatcounter.count) window.goatcounter.count({ path: name, title: name, event: true })
    else queue.push(name)
  }
  window.etTrack = (name) => { if (code) send(name) }
  if (!code) return

  const s = document.createElement('script')
  s.async = true
  s.src = 'https://gc.zgo.at/count.js'
  s.dataset.goatcounter = `https://${code}.goatcounter.com/count`
  s.onload = () => { const wait = setInterval(() => { if (window.goatcounter && window.goatcounter.count) { clearInterval(wait); queue.splice(0).forEach(send) } }, 300) }
  document.head.appendChild(s)

  document.addEventListener('click', (e) => {
    const a = e.target.closest('a, button')
    if (!a) return
    if (a.matches('[data-merch-order]')) return send('order-' + (a.closest('[data-merch]')?.dataset.merch || 'merch'))
    if (a.matches('.help-fab, .nav-help')) return send('questions-whatsapp')
    if (a.matches('button[data-cur]')) return send('currency-' + a.dataset.cur)
    if (a.matches('[data-lang-btn]')) return send('language-' + a.dataset.langBtn)
    const href = a.getAttribute('href') || ''
    if (href.includes('calendly.com')) return send('call-booking')
    if (href.includes('wa.me')) return send('whatsapp-other')
    if (href.startsWith('tel:')) return send('phone-call')
  })
  document.addEventListener('et:track', (e) => send(e.detail))
})()
