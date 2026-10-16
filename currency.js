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
    if (cur === 'EUR') return fr() ? `${approx}${num} €` : `${approx}€${num}`
    if (cur === 'USD') return fr() ? `${approx}${num} $ US` : `${approx}US$${num}`
    return fr() ? `${num} $` : `$${num}`
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
    document.querySelectorAll('[data-cur-note]').forEach((el) => { el.hidden = cur === 'CAD' })
    document.documentElement.dataset.currency = cur
  }
  function set(c) {
    cur = c
    try { localStorage.setItem(KEY, c) } catch { /* private mode */ }
    paint()
    document.dispatchEvent(new CustomEvent('et:currency', { detail: c }))
  }

  document.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-cur]')
    if (b) set(b.dataset.cur)
  })
  new MutationObserver(paint).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  document.addEventListener('DOMContentLoaded', paint)
  paint()

  // Fresh rates, at most once a day per visitor. The backup rates above are used if this fails.
  try {
    const saved = JSON.parse(localStorage.getItem(RATE_KEY) || 'null')
    if (saved && Date.now() - saved.at < 864e5) { Object.assign(rates, saved.r); paint() }
    else {
      fetch('https://open.er-api.com/v6/latest/CAD').then((r) => r.json()).then((d) => {
        if (!d || !d.rates || !d.rates.USD) return
        const r = { USD: d.rates.USD, EUR: d.rates.EUR }
        Object.assign(rates, r)
        localStorage.setItem(RATE_KEY, JSON.stringify({ at: Date.now(), r }))
        paint()
        document.dispatchEvent(new CustomEvent('et:currency', { detail: cur }))
      }).catch(() => {})
    }
  } catch { /* offline or private mode */ }
})()
