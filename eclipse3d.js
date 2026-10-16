// EclipseTone hero: a live 3D total eclipse, drawn in one WebGL shader (no library).
// A lit sphere (the moon), an animated corona with streamers, a "diamond ring"
// flare, and three layers of drifting dust. Each layer shifts by a different
// amount with the cursor and scroll, which is what reads as depth.
// If WebGL is unavailable the CSS eclipse stays in place.
;(() => {
  const host = document.querySelector('[data-eclipse-disc]')
  if (!host) return
  const canvas = document.createElement('canvas')
  const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: true })
  if (!gl) return

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const isSmall = window.matchMedia('(max-width: 640px)').matches

  const vert = `
    attribute vec2 aPos;
    void main(){ gl_Position = vec4(aPos, 0., 1.); }
  `
  const frag = `
    precision highp float;
    uniform vec2 uRes; uniform float uTime; uniform vec2 uMouse; uniform float uScroll; uniform float uLight;
    uniform vec3 uHot; uniform vec3 uGold; uniform vec3 uCool; uniform vec3 uBase;

    float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
    float noise(vec2 p){
      vec2 i = floor(p), f = fract(p);
      float a = hash(i), b = hash(i+vec2(1.,0.)), c = hash(i+vec2(0.,1.)), d = hash(i+vec2(1.,1.));
      vec2 u = f*f*(3.-2.*f);
      return mix(a,b,u.x) + (c-a)*u.y*(1.-u.x) + (d-b)*u.x*u.y;
    }
    float fbm(vec2 p){ float v=0., a=.5; for(int i=0;i<5;i++){ v+=a*noise(p); p*=2.03; a*=.5; } return v; }

    float dust(vec2 p, float scale, float seed, float t){
      vec2 q = p * scale + vec2(t * .02, -t * .015) + seed * 13.1;
      vec2 cell = floor(q);
      vec2 f = fract(q) - .5;
      float h = hash(cell + seed);
      if (h < .55) return 0.;
      vec2 o = vec2(hash(cell + 1.7 + seed), hash(cell + 4.3 + seed)) - .5;
      float d = length(f - o * .7);
      float size = .025 + .05 * hash(cell + 9.1);
      float tw = .55 + .45 * sin(t * (.6 + h) + h * 40.);
      return smoothstep(size, 0., d) * tw * (h - .55) * 2.2;
    }

    void main(){
      float s = min(uRes.x, uRes.y);
      // zoom out slightly as the page scrolls: the eclipse recedes
      float zoom = 2.25 + uScroll * .55;
      vec2 p = (gl_FragCoord.xy - .5 * uRes) / (.5 * s) * zoom;
      p.y -= uScroll * .35;
      float t = uTime;

      // ----- corona (far layer) -----
      vec2 cp = p - uMouse * vec2(.07, .05);
      float r = length(cp);
      float ang = atan(cp.y, cp.x);
      vec2 ca = vec2(cos(ang), sin(ang));
      float edge = r - 1.;
      float ring = exp(-max(edge,0.) * 24.) * smoothstep(-.03, .004, edge);
      float turb = fbm(ca * 2.2 + vec2(r * 1.6 - t * .08, t * .05));
      float body = exp(-max(edge,0.) * 3.1) * (.42 + .95 * turb) * step(0., edge + .03);
      float sm = fbm(ca * 5.5 + vec2(t * .03, -t * .02));
      float streamers = pow(sm, 3.2) * exp(-max(edge,0.) * 1.3) * 2.5 * step(0., edge);
      vec2 dp = cp - vec2(.69, .73);
      float diamond = exp(-dot(dp,dp) * 46.) * 1.7 + exp(-dot(dp,dp) * 6.) * .22;
      float fade = smoothstep(2.25, 1.3, r);
      vec3 ringCol = mix(uGold, mix(uHot, uGold, .45), uLight);
      vec3 E = ringCol * ring * mix(2.1, 1.35, uLight)
             + mix(uHot, uGold, clamp(turb * 1.2, 0., 1.)) * body * .9
             + mix(uHot, uCool, smoothstep(.2, 1.1, edge)) * streamers * .75
             + vec3(1., .93, .8) * diamond;
      E *= fade * mix(1., .82, uLight);

      // ----- dust: three depth layers, each with its own parallax -----
      float dfar  = dust(p - uMouse * .03, 7., 1., t);
      float dmid  = dust(p - uMouse * .12, 4.5, 2., t);
      float dnear = dust(p - uMouse * .26, 2.6, 3., t) * 1.2;
      float dmask = smoothstep(1.05, 1.4, r) * smoothstep(3.2, 1.6, r);
      E += uGold * (dfar * .55 + dmid * .8 + dnear) * dmask;

      // ----- moon (near layer) -----
      vec2 mp = p - uMouse * vec2(.17, .13);
      float mr = length(mp);
      float aa = 1.5 * zoom / s;
      float mask = smoothstep(1. + aa, 1. - aa, mr);
      vec3 n = vec3(mp, sqrt(max(0., 1. - mr * mr)));
      float f = 1. - n.z;
      vec3 moon = uBase
                + uCool * pow(f, 2.6) * .22
                + uGold * pow(f, 9.) * .55
                + uCool * .05 * smoothstep(.2, -.6, n.y);
      // faint surface texture so the sphere reads as an object
      moon += uCool * .02 * (fbm(mp * 3.5 + n.xy * 2.) - .5);

      // compose, premultiplied
      E = clamp(E, 0., 1.);
      float aE = max(max(E.r, E.g), E.b);
      vec3 rgb = moon * mask + E * (1. - mask);
      float a = mask + aE * (1. - mask);
      gl_FragColor = vec4(rgb, a);
    }
  `

  function compile(type, src) {
    const sh = gl.createShader(type)
    gl.shaderSource(sh, src)
    gl.compileShader(sh)
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.warn('eclipse shader:', gl.getShaderInfoLog(sh))
      return null
    }
    return sh
  }
  const vs = compile(gl.VERTEX_SHADER, vert)
  const fs = compile(gl.FRAGMENT_SHADER, frag)
  if (!vs || !fs) return
  const prog = gl.createProgram()
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return
  gl.useProgram(prog)

  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW)
  const loc = gl.getAttribLocation(prog, 'aPos')
  gl.enableVertexAttribArray(loc)
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

  const U = (n) => gl.getUniformLocation(prog, n)
  const u = {
    res: U('uRes'), time: U('uTime'), mouse: U('uMouse'), scroll: U('uScroll'), light: U('uLight'),
    hot: U('uHot'), gold: U('uGold'), cool: U('uCool'), base: U('uBase'),
  }
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)

  function applyTheme() {
    const light = document.documentElement.getAttribute('data-theme') === 'light'
    gl.uniform3fv(u.hot, hex(light ? '#e0500c' : '#ff6a13'))
    gl.uniform3fv(u.gold, hex(light ? '#e08a12' : '#ffb347'))
    gl.uniform3fv(u.cool, hex(light ? '#3f6190' : '#6f8fb8'))
    gl.uniform3fv(u.base, hex(light ? '#17120e' : '#050404'))
    gl.uniform1f(u.light, light ? 1 : 0)
    if (reduceMotion) draw()
  }

  canvas.className = 'eclipse-canvas'
  canvas.setAttribute('aria-hidden', 'true')
  host.appendChild(canvas)
  host.classList.add('is-3d')

  const dprCap = isSmall ? 1.5 : 1.75
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, dprCap)
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr))
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr))
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w
      canvas.height = h
      gl.viewport(0, 0, w, h)
    }
    gl.uniform2f(u.res, w, h)
    if (reduceMotion) draw()
  }

  const target = { x: 0, y: 0 }
  const cur = { x: 0, y: 0 }
  let scrollK = 0
  if (!reduceMotion) {
    window.addEventListener('pointermove', (e) => {
      target.x = (e.clientX / window.innerWidth - 0.5) * 2
      target.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }, { passive: true })
    window.addEventListener('scroll', () => {
      scrollK = Math.min(1, window.scrollY / (window.innerHeight * 0.9))
    }, { passive: true })
  }

  const start = performance.now()
  let curScroll = 0
  function draw() {
    const t = reduceMotion ? 12 : (performance.now() - start) / 1000
    cur.x += (target.x - cur.x) * 0.05
    cur.y += (target.y - cur.y) * 0.05
    curScroll += (scrollK - curScroll) * 0.08
    gl.uniform1f(u.time, t)
    gl.uniform2f(u.mouse, cur.x, cur.y)
    gl.uniform1f(u.scroll, curScroll)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)
    gl.drawArrays(gl.TRIANGLES, 0, 3)
  }

  let visible = true
  let raf = 0
  function loop() {
    cancelAnimationFrame(raf)
    if (!visible || document.hidden) return
    draw()
    raf = requestAnimationFrame(loop)
  }

  applyTheme()
  resize()
  new MutationObserver(applyTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
  new ResizeObserver(resize).observe(canvas)
  if (reduceMotion) {
    draw()
  } else {
    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting
      if (visible) loop()
    }).observe(host)
    document.addEventListener('visibilitychange', loop)
    loop()
  }
})()
