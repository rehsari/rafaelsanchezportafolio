/*!
 * <shiroi-sticker> — holographic foil sticker, as a drop-in web component.
 *
 * Usage:
 *   <script type="module" src="shiroi-sticker.js"></script>
 *   <shiroi-sticker src="shiroi.svg" finish="rare" style="width: 480px"></shiroi-sticker>
 *
 * Attributes
 *   src      URL of the sticker SVG (white vinyl shapes + an embedded halftone <image>). Required.
 *   finish   ink | holo | chrome | gold | oil | shiroi | rare        (default: rare)
 *   tilt     maximum tilt in degrees                                  (default: 16)
 *   track    "self" tilts while the pointer is over the sticker,
 *            "page" follows the pointer anywhere on the page          (default: self)
 *   idle     "off" stops the slow drift when nobody is interacting    (default: on)
 *   shadow   "off" hides the drop shadow                              (default: on)
 *   rotate   resting rotation in degrees, e.g. -3                     (default: 0)
 *   secret-finishes   hidden finish switching: number keys 1–7 pick a finish,
 *            and a quick double press on the sticker cycles to the next one
 *            (1 ink, 2 holo, 3 chrome, 4 gold, 5 oil, 6 shiroi, 7 rare)
 *
 * Property: el.finish = 'gold'   (same as setting the attribute)
 * Size it with CSS width; height follows the sticker's shape.
 */

const FINISHES = { ink: 0, holo: 1, chrome: 2, gold: 3, oil: 4, shiroi: 5, rare: 6 };

const VS = `
  attribute vec2 aPos;
  varying vec2 vUv;
  void main() {
    vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
    gl_Position = vec4(aPos, 0.0, 1.0);
  }`;

const FS = `
      precision highp float;
      varying vec2 vUv;
      uniform sampler2D uSil;
      uniform sampler2D uInk;
      uniform vec3 uN;
      uniform float uLift;
      uniform float uMode;
      uniform vec4 uCrop;
      uniform vec4 uInkXf;
      uniform vec2 uInkSize;
      uniform vec2 uTexel;
      uniform float uAspect;

      float hash1(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }
      vec3 hash3(vec2 p) { return vec3(hash1(p), hash1(p + 17.13), hash1(p + 41.71)); }
      vec3 rainbow(float t) { return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }

      // A small fake studio: sky gradient, a softbox up-left, a light strip and a horizon glint.
      float env(vec3 r) {
        float sky = smoothstep(-0.4, 0.6, r.y);
        float base = mix(0.10, 0.45, sky);
        float box = exp(-pow(length(r.xy - vec2(-0.30, 0.40)) * 5.0, 2.0)) * 0.9;
        float strip = exp(-pow((r.x * 0.8 + r.y * 0.6 - 0.05) * 8.0, 2.0)) * 0.35;
        float horizon = exp(-pow(r.y * 10.0, 2.0)) * 0.25;
        return base + box + strip + horizon;
      }

      // Glitter: sparse cells, each with its own facet, drawn as a dot with star arms.
      vec3 glitter(vec2 uv, vec3 N, vec3 L, vec3 V, float cells, float density, float expo, float seed) {
        vec2 gp = uv * vec2(cells, cells / uAspect);
        vec3 gh = hash3(floor(gp) + seed);
        if (gh.z < density) return vec3(0.0);
        vec2 q = fract(gp) - 0.5 - (gh.xy - 0.5) * 0.4;
        vec3 Ng = normalize(N + vec3((gh.xy - 0.5) * 1.2, 0.0));
        float tw = pow(max(dot(reflect(-L, Ng), V), 0.0), expo);
        float core = smoothstep(0.22, 0.0, length(q));
        float ax = exp(-abs(q.y) * 28.0) * smoothstep(0.5, 0.0, abs(q.x));
        float ay = exp(-abs(q.x) * 28.0) * smoothstep(0.5, 0.0, abs(q.y));
        vec3 tint = mix(vec3(1.0), rainbow(gh.x * 2.0 + gh.y), 0.45);
        return tint * (core + (ax + ay) * 0.55) * tw;
      }

      void main() {
        vec2 uv = vUv;
        float sil = texture2D(uSil, uv).a;
        if (sil < 0.002) { gl_FragColor = vec4(0.0); return; }

        // Halftone ink: one texel of the PNG = one printed dot
        vec2 vb = uCrop.xy + uv * uCrop.zw;
        vec2 iuv = (vb - uInkXf.xy) / uInkXf.zw / uInkSize;
        float ink = 0.0;
        if (iuv.x > 0.0 && iuv.y > 0.0 && iuv.x < 1.0 && iuv.y < 1.0) ink = step(0.5, texture2D(uInk, iuv).a);
        vec3 h = hash3(floor(iuv * uInkSize));

        vec2 p = vec2((uv.x - 0.5) * uAspect, 0.5 - uv.y) * 0.62;
        vec3 V = normalize(vec3(-p, 0.95));
        vec3 N = normalize(uN);
        vec3 L = normalize(vec3(-0.32, 0.40, 0.86));
        float ndl = max(dot(N, L), 0.0);
        float rv = max(dot(reflect(-L, N), V), 0.0);
        float glare = pow(rv, 70.0);
        float sheen = pow(rv, 9.0);

        // Each dot is a flake with its own tiny facet angle
        vec3 Nf = normalize(N + vec3((h.xy - 0.5) * 0.85, 0.0));
        float flake = pow(max(dot(reflect(-L, Nf), V), 0.0), 90.0) * step(0.3, h.z) * (0.6 + h.z);
        float e = env(reflect(-V, normalize(mix(N, Nf, 0.25))));
        float t = p.x * 1.1 + p.y * 0.8 + N.x * 2.4 + N.y * 1.9 + h.z * 0.06;
        vec3 holo = rainbow(t);
        float grain = (hash1(floor(uv / uTexel)) - 0.5) * 0.025;

        // Cut-edge bevel from the silhouette gradient
        vec2 dx = vec2(uTexel.x * 2.5, 0.0), dy = vec2(0.0, uTexel.y * 2.5);
        vec2 g = vec2(texture2D(uSil, uv + dx).a - texture2D(uSil, uv - dx).a,
                      texture2D(uSil, uv + dy).a - texture2D(uSil, uv - dy).a);
        float edge = clamp(length(g), 0.0, 1.0);
        vec2 en = length(g) > 1e-4 ? -normalize(g) : vec2(0.0);
        vec2 toLight = normalize(vec2(-0.6, -0.8));
        float rimHi = edge * max(dot(en, toLight), 0.0);
        float rimLo = edge * max(-dot(en, toLight), 0.0);

        vec3 white = vec3(0.955, 0.952, 0.94) * (0.9 + 0.1 * ndl) + grain;
        vec3 vinyl = white;
        vec3 inkc;
        vec3 sparkle = vec3(0.0);
        if (uMode < 0.5) {
          inkc = vec3(0.055) + vec3(sheen * 0.18 + glare * 0.35);
        } else if (uMode < 1.5) {
          vinyl = mix(white, holo, 0.06 + 0.05 * sheen);
          inkc = vec3(0.04) + holo * (0.30 + 0.55 * e) + vec3(flake * 1.4);
        } else if (uMode < 2.5) {
          inkc = vec3(0.10 + 0.78 * e) * vec3(0.93, 0.96, 1.0) + vec3(flake * 1.3) + holo * 0.03;
        } else if (uMode < 3.5) {
          inkc = vec3(0.20, 0.12, 0.03) + e * vec3(0.95, 0.70, 0.30) + vec3(1.0, 0.9, 0.65) * flake * 1.3;
        } else if (uMode < 4.5) {
          vec3 film = 0.5 + 0.5 * cos(6.28318 * (t * 1.7 + vec3(0.1, 0.45, 0.75)));
          inkc = vec3(0.03) + film * (0.25 + 0.45 * e) * 0.8 + vec3(flake * 0.9);
        } else if (uMode < 5.5) {
          vinyl = vec3(0.045) + vec3(sheen * 0.10) + grain * 0.5;
          inkc = vec3(0.94, 0.94, 0.96) * (0.85 + 0.2 * e) + holo * 0.10 + vec3(flake * 1.2);
        } else {
          // Shiroi rare: white pearl ink. Rainbow only lives inside the reflected light:
          // a soft highlight around the glare plus a diagonal light band that slides with the tilt.
          vec2 q2 = vec2(uv.x * uAspect, uv.y);
          float diag = q2.x * 0.9 + q2.y * 0.55;
          vec3 rb = rainbow(diag * 2.2 + N.x * 3.2 - N.y * 2.4);
          float broad = pow(rv, 5.0);
          float pillar = exp(-pow(diag - 0.75 - N.x * 2.6 + N.y * 1.9, 2.0) * 10.0);
          float lightMask = clamp(broad * 0.8 + pillar * 0.55, 0.0, 1.0);
          // Like chrome, each dot reflects the room at its own angle, so the pearl glitters
          float eDot = env(reflect(-V, normalize(mix(N, Nf, 0.6))));
          vec3 pearl = vec3(0.95, 0.95, 0.97) * (0.68 + 0.40 * eDot) * (0.93 + 0.07 * h.y);
          float flakeR = pow(max(dot(reflect(-L, Nf), V), 0.0), 50.0) * step(0.25, h.z);
          vec3 fc = mix(vec3(1.0), rainbow(h.x * 1.7 + diag), 0.3);
          inkc = pearl + (rb - 0.5) * 0.30 * lightMask + vec3(lightMask * 0.06)
               + fc * flakeR * 1.6 + vec3(flake * 1.6);
          vinyl = vec3(0.035) + rb * 0.07 * lightMask + vec3(sheen * 0.06) + grain * 0.5;
          sparkle = glitter(uv, N, L, V, 230.0, 0.72, 24.0, 3.0) * 1.3
                  + glitter(uv, N, L, V, 70.0, 0.90, 60.0, 11.0) * 2.0;
        }

        vec3 col = mix(vinyl, inkc, ink) + sparkle;
        col += vec3(glare * 0.55 + sheen * 0.06) * (1.0 + uLift * 0.4);
        col += vec3(rimHi * 0.35) - vec3(rimLo * 0.22);
        gl_FragColor = vec4(clamp(col, 0.0, 1.0) * sil, sil);
      }`;

const STYLE = `
  :host {
    display: block;
    position: relative;
    touch-action: pan-y;
    -webkit-tap-highlight-color: transparent;
    user-select: none;
    -webkit-user-select: none;
  }
  :host([hidden]) { display: none; }
  .wrap { position: relative; width: 100%; aspect-ratio: var(--ratio, 1.47); perspective: 1200px; }
  .sticker, .shadow { position: absolute; inset: 0; }
  .sticker { will-change: transform; cursor: grab; }
  .sticker:active { cursor: grabbing; }
  .shadow { pointer-events: none; will-change: transform, filter, opacity; }
  :host([shadow="off"]) .shadow { display: none; }
  canvas, img { display: block; width: 100%; height: 100%; }
`;

function define() {
  if (customElements.get('shiroi-sticker')) return;

  const loadImage = (src) => new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error('Could not load image: ' + src.slice(0, 60)));
    im.src = src;
  });
  const svgUrl = (text) => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(text);
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Parses "translate(x y) scale(s)" or "matrix(a b c d e f)" into {e, f, a, d}. Rotation is not supported.
  function parseTransform(str) {
    const m = { a: 1, d: 1, e: 0, f: 0 };
    if (!str) return m;
    const num = (s) => s.trim().split(/[\s,]+/).map(Number);
    const mat = str.match(/matrix\(([^)]*)\)/);
    if (mat) { const v = num(mat[1]); return { a: v[0], d: v[3], e: v[4], f: v[5] }; }
    const tr = str.match(/translate\(([^)]*)\)/);
    if (tr) { const v = num(tr[1]); m.e = v[0]; m.f = v[1] || 0; }
    const sc = str.match(/scale\(([^)]*)\)/);
    if (sc) { const v = num(sc[1]); m.a = v[0]; m.d = v.length > 1 ? v[1] : v[0]; }
    return m;
  }

  class ShiroiSticker extends HTMLElement {
    static get observedAttributes() { return ['src', 'finish', 'rotate']; }

    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${STYLE}</style>
        <div class="wrap" part="wrap"><div class="shadow"></div><div class="sticker" part="sticker"></div></div>`;
      this._wrap = root.querySelector('.wrap');
      this._sticker = root.querySelector('.sticker');
      this._shadowBox = root.querySelector('.shadow');
      this._mode = FINISHES.rare;
      this._loadId = 0;
      this._visible = true;
      this._raf = 0;
      this._s = { x: 0, y: 0, vx: 0, vy: 0, lift: 0, vl: 0 };
      this._target = { x: 0, y: 0 };
      this._liftTarget = 0;
      this._lastInput = -1e9;
      this._pressing = false;
      this._draw = null;
      this._cleanup = [];
    }

    get finish() { return Object.keys(FINISHES).find((k) => FINISHES[k] === this._mode); }
    set finish(v) { this.setAttribute('finish', v); }

    _cycle(step) {
      const names = Object.keys(FINISHES);
      this.finish = names[(this._mode + step + names.length) % names.length];
    }

    attributeChangedCallback(name) {
      if (name === 'finish') {
        const f = (this.getAttribute('finish') || 'rare').toLowerCase();
        this._mode = f in FINISHES ? FINISHES[f] : FINISHES.rare;
      } else if (name === 'src' && this.isConnected) {
        this._load();
      }
      if (this.isConnected) this._schedule();
    }

    connectedCallback() {
      this._bindInput();
      if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
          this._visible = entries[entries.length - 1].isIntersecting;
          this._schedule();
        }, { rootMargin: '100px' });
        io.observe(this);
        this._cleanup.push(() => io.disconnect());
      }
      const onVis = () => this._schedule();
      document.addEventListener('visibilitychange', onVis);
      this._cleanup.push(() => document.removeEventListener('visibilitychange', onVis));
      if (reduceMotion()) this._target = { x: 9, y: -6 };
      this._load();
    }

    disconnectedCallback() {
      cancelAnimationFrame(this._raf);
      this._raf = 0;
      this._cleanup.forEach((fn) => fn());
      this._cleanup = [];
      this._teardownGL();
    }

    _num(name, def) {
      const v = parseFloat(this.getAttribute(name));
      return Number.isFinite(v) ? v : def;
    }

    // ---------- loading ----------
    async _load() {
      const src = this.getAttribute('src');
      if (!src) return;
      const id = ++this._loadId;
      try {
        const res = await fetch(src);
        if (!res.ok) throw new Error(`Could not fetch ${src} (${res.status})`);
        const text = await res.text();
        if (id !== this._loadId || !this.isConnected) return;
        await this._setup(text, new URL(src, document.baseURI).href, id);
      } catch (err) {
        console.error('[shiroi-sticker]', err);
      }
    }

    async _setup(svgText, baseHref, id) {
      const doc = new DOMParser().parseFromString(svgText, 'image/svg+xml');
      const svg = doc.documentElement;
      if (!svg || svg.nodeName.toLowerCase() !== 'svg') throw new Error('src is not an SVG file');

      let vb = (svg.getAttribute('viewBox') || '').trim().split(/[\s,]+/).map(Number);
      if (vb.length !== 4 || vb.some((n) => !Number.isFinite(n))) {
        vb = [0, 0, parseFloat(svg.getAttribute('width')) || 1000, parseFloat(svg.getAttribute('height')) || 1000];
      }

      // Halftone ink layer: the first embedded <image>
      let ink = null;
      const imgEl = svg.querySelector('image');
      if (imgEl) {
        const href = imgEl.getAttribute('href') || imgEl.getAttributeNS('http://www.w3.org/1999/xlink', 'href');
        const t = parseTransform(imgEl.getAttribute('transform'));
        const x = parseFloat(imgEl.getAttribute('x')) || 0, y = parseFloat(imgEl.getAttribute('y')) || 0;
        const w = parseFloat(imgEl.getAttribute('width')), h = parseFloat(imgEl.getAttribute('height'));
        if (href && w && h) {
          ink = { href: new URL(href, baseHref).href, w, h, ox: t.e + t.a * x, oy: t.f + t.d * y, sx: t.a, sy: t.d };
        }
        imgEl.remove();
      }
      svg.removeAttribute('width');
      svg.removeAttribute('height');
      // Round stroke joins so sharp corners don't throw miter spikes out of the die-cut border
      svg.setAttribute('stroke-linejoin', 'round');
      const serialize = (box, pw, ph) => {
        svg.setAttribute('viewBox', box.join(' '));
        svg.setAttribute('width', pw);
        svg.setAttribute('height', ph);
        return new XMLSerializer().serializeToString(svg);
      };

      // Find the sticker's real bounds so the element hugs the die-cut, not the artboard
      const probeW = 700, probeH = Math.max(1, Math.round(probeW * vb[3] / vb[2]));
      const probe = await loadImage(svgUrl(serialize(vb, probeW, probeH)));
      const pc = document.createElement('canvas');
      pc.width = probeW; pc.height = probeH;
      const pctx = pc.getContext('2d', { willReadFrequently: true });
      pctx.drawImage(probe, 0, 0, probeW, probeH);
      const pd = pctx.getImageData(0, 0, probeW, probeH).data;
      let minX = probeW, minY = probeH, maxX = -1, maxY = -1;
      for (let yy = 0; yy < probeH; yy++) {
        for (let xx = 0; xx < probeW; xx++) {
          if (pd[(yy * probeW + xx) * 4 + 3] > 8) {
            if (xx < minX) minX = xx; if (xx > maxX) maxX = xx;
            if (yy < minY) minY = yy; if (yy > maxY) maxY = yy;
          }
        }
      }
      if (maxX < 0) throw new Error('The SVG has no visible shapes');
      const k = vb[2] / probeW, pad = 0.015 * vb[2];
      const crop = {
        x: vb[0] + minX * k - pad, y: vb[1] + minY * k - pad,
        w: (maxX - minX + 1) * k + pad * 2, h: (maxY - minY + 1) * k + pad * 2,
      };
      this._wrap.style.setProperty('--ratio', String(crop.w / crop.h));

      const SIL_W = 2048, SIL_H = Math.round(SIL_W * crop.h / crop.w);
      const silImg = await loadImage(svgUrl(serialize([crop.x, crop.y, crop.w, crop.h], SIL_W, SIL_H)));
      const inkImg = ink ? await loadImage(ink.href) : null;
      if (id !== this._loadId || !this.isConnected) return;

      const fallbackSrc = svgUrl(svgText.replace(/viewBox="[^"]*"/, `viewBox="${crop.x} ${crop.y} ${crop.w} ${crop.h}" stroke-linejoin="round"`)
        .replace(/<svg([^>]*?)\swidth="[^"]*"/, '<svg$1').replace(/<svg([^>]*?)\sheight="[^"]*"/, '<svg$1'));

      this._teardownGL();
      this._sticker.textContent = '';
      this._shadowBox.textContent = '';

      const sh = document.createElement('canvas');
      sh.width = 600; sh.height = Math.max(1, Math.round(600 * crop.h / crop.w));
      sh.getContext('2d').drawImage(silImg, 0, 0, sh.width, sh.height);
      this._shadowBox.appendChild(sh);

      if (!this._initGL(silImg, SIL_W, SIL_H, inkImg, ink, crop)) {
        const img = document.createElement('img');
        img.alt = '';
        img.src = fallbackSrc;
        this._sticker.appendChild(img);
        this._draw = null;
      }
      this._schedule();
    }

    // ---------- WebGL ----------
    _initGL(silImg, SIL_W, SIL_H, inkImg, ink, crop) {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
      if (!gl) return false;

      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
        return s;
      };
      let prog;
      try {
        prog = gl.createProgram();
        gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
        gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
        gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
      } catch (err) {
        console.error('[shiroi-sticker]', err);
        return false;
      }
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const silCanvas = document.createElement('canvas');
      silCanvas.width = SIL_W; silCanvas.height = SIL_H;
      silCanvas.getContext('2d').drawImage(silImg, 0, 0, SIL_W, SIL_H);

      let inkSource = inkImg;
      if (!inkSource) { inkSource = document.createElement('canvas'); inkSource.width = inkSource.height = 1; }

      const makeTex = (unit, source, filter) => {
        const tex = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      };
      makeTex(0, silCanvas, gl.LINEAR);
      makeTex(1, inkSource, gl.NEAREST);

      const U = (n) => gl.getUniformLocation(prog, n);
      gl.uniform1i(U('uSil'), 0);
      gl.uniform1i(U('uInk'), 1);
      gl.uniform4f(U('uCrop'), crop.x, crop.y, crop.w, crop.h);
      if (ink) {
        gl.uniform4f(U('uInkXf'), ink.ox, ink.oy, ink.sx, ink.sy);
        gl.uniform2f(U('uInkSize'), ink.w, ink.h);
      } else {
        gl.uniform4f(U('uInkXf'), -1e6, -1e6, 1, 1);
        gl.uniform2f(U('uInkSize'), 1, 1);
      }
      gl.uniform2f(U('uTexel'), 1 / SIL_W, 1 / SIL_H);
      gl.uniform1f(U('uAspect'), crop.w / crop.h);
      const uN = U('uN'), uLift = U('uLift'), uMode = U('uMode');
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

      this._sticker.appendChild(canvas);
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        const r = this._wrap.getBoundingClientRect();
        const w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
        if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
      };
      const ro = new ResizeObserver(() => { resize(); this._schedule(); });
      ro.observe(this._wrap);
      resize();

      const onLost = (e) => { e.preventDefault(); this._load(); };
      canvas.addEventListener('webglcontextlost', onLost);

      this._gl = { gl, canvas, ro, onLost };
      this._draw = (N, lift) => {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform3f(uN, N[0], N[1], N[2]);
        gl.uniform1f(uLift, lift);
        gl.uniform1f(uMode, this._mode);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      };
      return true;
    }

    _teardownGL() {
      if (!this._gl) return;
      const { gl, canvas, ro, onLost } = this._gl;
      ro.disconnect();
      canvas.removeEventListener('webglcontextlost', onLost);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
      this._gl = null;
      this._draw = null;
    }

    // ---------- input ----------
    _bindInput() {
      const aim = (cx, cy, page) => {
        const r = this._wrap.getBoundingClientRect();
        const hw = page ? Math.max(r.width / 2, window.innerWidth / 2) : r.width / 2;
        const hh = page ? Math.max(r.height / 2, window.innerHeight / 2) : r.height / 2;
        const max = this._num('tilt', 16);
        const nx = Math.max(-1.25, Math.min(1.25, (cx - (r.left + r.width / 2)) / hw));
        const ny = Math.max(-1.25, Math.min(1.25, (cy - (r.top + r.height / 2)) / hh));
        this._target = { x: nx * max, y: ny * max };
        this._lastInput = performance.now();
        this._schedule();
      };
      const onMove = (e) => {
        if (this.getAttribute('track') === 'page') return;
        if (e.pointerType === 'mouse' || this._pressing) aim(e.clientX, e.clientY, false);
      };
      const onPageMove = (e) => {
        if (this.getAttribute('track') === 'page' && !this._pressing) aim(e.clientX, e.clientY, true);
      };
      const onLeave = () => { if (!this._pressing) this._lastInput = performance.now() - 1500; };
      const onDown = (e) => {
        this._pressing = true;
        this._liftTarget = 1;
        try { this._sticker.setPointerCapture(e.pointerId); } catch (_) {}
        aim(e.clientX, e.clientY, false);
      };
      const onUp = () => {
        this._pressing = false; this._liftTarget = 0; this._lastInput = performance.now();
        if (this.hasAttribute('secret-finishes')) {
          const now = performance.now();
          if (now - (this._lastTap || 0) < 320) { this._cycle(1); this._lastTap = 0; } else { this._lastTap = now; }
        }
        this._schedule();
      };
      const onKey = (e) => {
        if (!this.hasAttribute('secret-finishes') || e.metaKey || e.ctrlKey || e.altKey) return;
        const el = e.target;
        if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
        const n = parseInt(e.key, 10);
        const names = Object.keys(FINISHES);
        if (n >= 1 && n <= names.length) this.finish = names[n - 1];
      };
      window.addEventListener('keydown', onKey);
      this._cleanup.push(() => window.removeEventListener('keydown', onKey));

      this.addEventListener('pointermove', onMove);
      this.addEventListener('pointerleave', onLeave);
      window.addEventListener('pointermove', onPageMove, { passive: true });
      this._sticker.addEventListener('pointerdown', onDown);
      this._sticker.addEventListener('pointerup', onUp);
      this._sticker.addEventListener('pointercancel', onUp);
      this._cleanup.push(() => {
        this.removeEventListener('pointermove', onMove);
        this.removeEventListener('pointerleave', onLeave);
        window.removeEventListener('pointermove', onPageMove);
        this._sticker.removeEventListener('pointerdown', onDown);
        this._sticker.removeEventListener('pointerup', onUp);
        this._sticker.removeEventListener('pointercancel', onUp);
      });
    }

    // ---------- animation ----------
    _schedule() {
      const active = this.isConnected && this._visible && document.visibilityState !== 'hidden';
      if (active && !this._raf) {
        this._prev = performance.now();
        this._raf = requestAnimationFrame((t) => this._tick(t));
      } else if (!active && this._raf) {
        cancelAnimationFrame(this._raf);
        this._raf = 0;
      }
    }

    _tick(now) {
      this._raf = 0;
      const dt = Math.min(0.033, (now - this._prev) / 1000);
      this._prev = now;
      const s = this._s, t = now / 1000;
      const idle = this.getAttribute('idle') !== 'off' && !reduceMotion();

      if (idle && !this._pressing && now - this._lastInput > 2500) {
        this._target = { x: Math.sin(t * 0.55) * 12, y: Math.sin(t * 0.9 + 1.2) * 8 };
      } else if (!idle && !this._pressing && now - this._lastInput > 2500) {
        this._target = reduceMotion() ? { x: 9, y: -6 } : { x: 0, y: 0 };
      }

      const K = 90, D = 14, KL = 140, DL = 15;
      s.vx += ((this._target.x - s.x) * K - s.vx * D) * dt;
      s.vy += ((this._target.y - s.y) * K - s.vy * D) * dt;
      s.vl += ((this._liftTarget - s.lift) * KL - s.vl * DL) * dt;
      s.x += s.vx * dt; s.y += s.vy * dt; s.lift += s.vl * dt;

      const rotY = s.x, rotX = -s.y, lift = Math.max(0, s.lift);
      const rz = this._num('rotate', 0);
      this._sticker.style.transform =
        `rotateZ(${rz}deg) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) ` +
        `translateZ(${(lift * 34).toFixed(1)}px) scale(${(1 + lift * 0.035).toFixed(4)})`;

      const a = rotY * Math.PI / 180, b = rotX * Math.PI / 180;
      const N = [Math.sin(a), Math.cos(a) * Math.sin(b), Math.cos(a) * Math.cos(b)];

      const scale = this._wrap.clientWidth / 700;
      const sx = (7 + lift * 26 - N[0] * 14) * scale, sy = (11 + lift * 34 + N[1] * 14) * scale;
      this._shadowBox.style.transform = `translate(${sx.toFixed(1)}px, ${sy.toFixed(1)}px) rotateZ(${rz}deg) scale(${(1 + lift * 0.05).toFixed(4)})`;
      this._shadowBox.style.filter = `brightness(0) blur(${((5 + lift * 16) * scale).toFixed(1)}px)`;
      this._shadowBox.style.opacity = (0.5 - lift * 0.18).toFixed(3);

      if (this._draw) this._draw(N, lift);

      // Keep animating while moving, idling, or settling; otherwise stop until the next input.
      const settling = Math.abs(s.vx) + Math.abs(s.vy) + Math.abs(s.vl) > 0.01 ||
        Math.abs(this._target.x - s.x) + Math.abs(this._target.y - s.y) + Math.abs(this._liftTarget - s.lift) > 0.01;
      if (idle || settling || this._pressing) this._schedule();
    }
  }

  customElements.define('shiroi-sticker', ShiroiSticker);
}

// Safe to import during server-side rendering: it only registers in a browser.
if (typeof window !== 'undefined' && window.customElements) define();
