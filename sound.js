// Optional studio sound. Off until the visitor turns it on, and the choice is remembered.
// Stays hidden until an ambience recording is set in config.js (sound.ambience).
// With sound on: the room tone drifts slowly left and right (made for headphones), the eclipse
// breathes with it, and taps get a soft click placed where you tapped.
;(() => {
  const cfg = (window.ET_CONFIG || {}).sound || {}
  const btn = document.querySelector('[data-sound]')
  if (!btn || !cfg.ambience) return
  const KEY = 'eclipsetone-sound'
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  let ctx = null, master = null, bed = null, analyser = null, on = false, raf = 0
  btn.hidden = false

  const label = () => {
    btn.setAttribute('aria-pressed', String(on))
    const fr = document.documentElement.lang === 'fr'
    btn.querySelector('.sr').textContent = on ? (fr ? 'Couper le son' : 'Turn off the sound') : (fr ? 'Activer le son' : 'Turn on the sound')
  }

  async function setup() {
    ctx = new (window.AudioContext || window.webkitAudioContext)()
    master = ctx.createGain(); master.gain.value = 0
    analyser = ctx.createAnalyser(); analyser.fftSize = 256
    master.connect(analyser).connect(ctx.destination)
    const data = await fetch(new URL(cfg.ambience, document.baseURI)).then((r) => r.arrayBuffer())
    const buf = await ctx.decodeAudioData(data)
    bed = ctx.createBufferSource(); bed.buffer = buf; bed.loop = true
    const pan = ctx.createStereoPanner()
    const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05
    const depth = ctx.createGain(); depth.gain.value = 0.35
    lfo.connect(depth).connect(pan.pan)
    bed.connect(pan).connect(master)
    bed.start(); lfo.start()
  }

  function pulse() {
    const hub = document.querySelector('[data-hub]')
    if (!hub || reduce) return
    const d = new Uint8Array(analyser.frequencyBinCount)
    const loop = () => {
      analyser.getByteFrequencyData(d)
      let sum = 0
      for (let i = 0; i < 24; i++) sum += d[i]
      hub.style.setProperty('--level', (sum / (24 * 255)).toFixed(3))
      raf = requestAnimationFrame(loop)
    }
    loop()
  }

  async function set(next) {
    on = next
    try { localStorage.setItem(KEY, on ? 'on' : 'off') } catch { /* private mode */ }
    label()
    if (on) {
      try { if (!ctx) await setup(); await ctx.resume() } catch { on = false; label(); return }
      master.gain.setTargetAtTime(cfg.volume || 0.35, ctx.currentTime, 0.6)
      pulse()
    } else if (ctx) {
      master.gain.setTargetAtTime(0, ctx.currentTime, 0.25)
      cancelAnimationFrame(raf)
      document.querySelector('[data-hub]')?.style.removeProperty('--level')
    }
  }

  // A soft click, placed left or right where the tap happened.
  function tick(x, soft) {
    if (!on || !ctx) return
    const t = ctx.currentTime
    const o = ctx.createOscillator(), g = ctx.createGain(), p = ctx.createStereoPanner()
    o.type = 'sine'; o.frequency.setValueAtTime(soft ? 880 : 620, t); o.frequency.exponentialRampToValueAtTime(soft ? 700 : 420, t + 0.07)
    g.gain.setValueAtTime(soft ? 0.015 : 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.09)
    p.pan.value = Math.max(-0.8, Math.min(0.8, (x / innerWidth) * 2 - 1))
    o.connect(g).connect(p).connect(ctx.destination)
    o.start(t); o.stop(t + 0.1)
  }
  const TAP = '.btn,.pill,.tile,.node,.svc-pick,.ans,.sheet-ic'
  document.addEventListener('pointerdown', (e) => { if (e.target.closest(TAP)) tick(e.clientX) }, { passive: true })
  if (matchMedia('(hover: hover)').matches) document.addEventListener('pointerover', (e) => { const el = e.target.closest('.tile,.node,.svc-pick'); if (el && !el.contains(e.relatedTarget)) tick(e.clientX, true) }, { passive: true })

  btn.addEventListener('click', () => set(!on))
  document.addEventListener('visibilitychange', () => { if (ctx && on) document.hidden ? ctx.suspend() : ctx.resume() })
  new MutationObserver(label).observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  label()
  // Remembered "on": browsers need one tap first, so it starts on the first touch of the page.
  let saved = 'off'
  try { saved = localStorage.getItem(KEY) || 'off' } catch { /* private mode */ }
  if (saved === 'on') document.addEventListener('pointerdown', function first(e) { document.removeEventListener('pointerdown', first); if (!e.target.closest('[data-sound]')) set(true) })
})()
