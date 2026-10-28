// Prices are set in Canadian dollars. Visitors can view an estimate in USD or EUR.
// Any element <span class="money" data-cad="599"> is rewritten; scripts use window.etMoney(cad).
;(() => {
  const KEY = 'eclipsetone-cur'
  const RATE_KEY = 'eclipsetone-fx'
  const cfg = window.ET_CONFIG || {}
  const rates = Object.assign({ CAD: 1, USD: 0.702, EUR: 0.625 }, cfg.fx || {})
  let cur = 'CAD'
  try { const c = localStorage.getItem(KEY); if (c === 'USD' || c === 'EUR') cur = c } catch { /* private mode */ }
  const fr = () => document.documentElement.lang === 'fr'

  function fmt(cad, opts = {}) {
    const decimals = opts.decimals ?? (cad % 1 ? 2 : 0)
    let n = cad * rates[cur]
    if (cur !== 'CAD') n = decimals ? Math.round(n * 100) / 100 : Math.round(n)
    const num = n.toLocaleString(fr() ? 'fr-CA' : 'en-CA', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
    const approx = cur === 'CAD' ? '' : '≈ '
    if (cur === 'EUR') return fr() ? `${approx}${num}\u00a0€` : `${approx}€${num}`
    if (cur === 'USD') return fr() ? `${approx}${num}\u00a0$\u00a0US` : `${approx}US$${num}`
    return fr() ? `${num}\u00a0$` : `$${num}`
  }
  window.etMoney = fmt
  window.etCurrency = () => cur

  // Rewrites "$599" / "599 $" inside a plain text string (used for tips and labels built in JS).
  window.etPrices = (text) => String(text).replace(
    /\$(\d{1,3}(?:,\d{3})*(?:\.\d+)?)|(\d{1,3}(?:[   ]\d{3})*(?:,\d+)?) \$(?! US)/g,
    (_, en, f) => fmt(en ? parseFloat(en.replace(/,/g, '')) : parseFloat(f.replace(/[   ]/g, '').replace(',', '.'))))

  function paint() {
    document.querySelectorAll('.money[data-cad]').forEach((el) => { el.textContent = fmt(parseFloat(el.dataset.cad)) })
    document.querySelectorAll('button[data-cur]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.cur === cur)))
    document.querySelectorAll('select[data-cur-select]').forEach((sel) => { sel.value = cur })
    document.querySelectorAll('[data-cur-note]').forEach((el) => { el.hidden = cur === 'CAD' })
    document.documentElement.dataset.currency = cur
  }
  function set(c) {
    cur = c
    try { localStorage.setItem(KEY, c) } catch { /* private mode */ }
    paint()
    document.dispatchEvent(new CustomEvent('et:currency', { detail: c }))
    if (c !== 'CAD') refreshRates()
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cur]')
    if (b) set(b.dataset.cur)
  })
  document.addEventListener('change', (e) => {
    const sel = e.target.closest('select[data-cur-select]')
    if (sel && ['CAD', 'USD', 'EUR'].includes(sel.value)) set(sel.value)
  })
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  document.addEventListener('DOMContentLoaded', paint)
  paint()

  // Fresh rates, at most once a day, and only for visitors who view USD or EUR (CAD needs none).
  // The backup rates above are used if this fails.
  function refreshRates() {
    try {
      const saved = JSON.parse(localStorage.getItem(RATE_KEY) || 'null')
      if (saved && Date.now() - saved.at < 864e5) { Object.assign(rates, saved.r); paint(); return }
      if (refreshRates.busy) return
      refreshRates.busy = true
      fetch('https://open.er-api.com/v6/latest/CAD').then((r) => r.json()).then((d) => {
        if (!d || !d.rates || !d.rates.USD) return
        const r = { USD: d.rates.USD, EUR: d.rates.EUR }
        Object.assign(rates, r)
        localStorage.setItem(RATE_KEY, JSON.stringify({ at: Date.now(), r }))
        paint()
        document.dispatchEvent(new CustomEvent('et:currency', { detail: cur }))
      }).catch(() => {}).finally(() => { refreshRates.busy = false })
    } catch { /* offline or private mode */ }
  }
  if (cur !== 'CAD') refreshRates()
})()
