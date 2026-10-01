/*!
 * <flatpack-chair> — the slotted cardboard lounge chair, drawn entirely in code (plain WebGL, no libraries).
 *
 * Usage:
 *   <script src="flatpack-chair.js" defer></script>   (a normal script; works as type="module" too)
 *   <flatpack-chair finish="cardboard" style="width: 100%; max-width: 900px"></flatpack-chair>
 *
 * Attributes
 *   finish        cardboard | blueprint | model   (default: cardboard)
 *   explode       present = exploded view
 *   transparent   no background of its own, only the floor shadow (use on dark or busy pages)
 *
 * Interaction: drag to turn it (page scroll still works on phones).
 * Hidden keys, active only while the pointer is over the chair or it has focus:
 *   1 cardboard, 2 blueprint, 3 plain model, E exploded view.
 * Size it with CSS width; the height follows aspect-ratio (default 4 / 3, override with CSS).
 */

(() => {
const FINISH_NAMES = ['cardboard', 'blueprint', 'model'];

function mount(host, canvas) {
  // ---------------- chair dimensions (cm), from the build sketch ----------------
  const T = 0.6;          // corrugated board thickness
  const W = 72, D = 72;   // width and depth
  const H_BACK = 88, H_ARM = 53, H_SEAT = 41;
    const ARM_W = 13;       // armrest width: 3 fins per arm
  const TAB = 4;          // strips and cross boards run past both sides, like the real build

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------- 2D shape helpers ----------------
  function path() {
    const pts = [];
    const api = {
      move(x, y) { pts.push([x, y]); return api; },
      line(x, y) { pts.push([x, y]); return api; },
      cubic(ax, ay, bx, by, x, y, n = 16) {
        const [sx, sy] = pts[pts.length - 1];
        for (let i = 1; i <= n; i++) {
          const t = i / n, u = 1 - t;
          pts.push([u * u * u * sx + 3 * u * u * t * ax + 3 * u * t * t * bx + t * t * t * x,
                    u * u * u * sy + 3 * u * u * t * ay + 3 * u * t * t * by + t * t * t * y]);
        }
        return api;
      },
      quad(cx, cy, x, y, n = 8) {
        const [sx, sy] = pts[pts.length - 1];
        for (let i = 1; i <= n; i++) {
          const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t;
          pts.push([a * sx + b * cx + c * x, a * sy + b * cy + c * y]);
        }
        return api;
      },
      pts,
    };
    return api;
  }

  function cleanPoly(pts) {
    let p = pts.filter((q, i) => {
      const r = pts[(i + 1) % pts.length];
      return Math.hypot(q[0] - r[0], q[1] - r[1]) > 1e-4;
    });
    const area = p.reduce((s, q, i) => { const r = p[(i + 1) % p.length]; return s + q[0] * r[1] - r[0] * q[1]; }, 0);
    if (area < 0) p.reverse();
    let changed = true;
    while (changed && p.length > 3) {
      changed = false;
      for (let i = 0; i < p.length; i++) {
        const a = p[(i + p.length - 1) % p.length], b = p[i], c = p[(i + 1) % p.length];
        const cr = (b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]);
        if (Math.abs(cr) < 1e-6) { p.splice(i, 1); changed = true; break; }
      }
    }
    return p;
  }

  function triangulate(p) {
    const idx = p.map((_, i) => i), tris = [];
    const inTri = (P, A, B, C) => {
      const s = (u, v, w) => (u[0] - w[0]) * (v[1] - w[1]) - (v[0] - w[0]) * (u[1] - w[1]);
      const d1 = s(P, A, B), d2 = s(P, B, C), d3 = s(P, C, A);
      return !((d1 < 0 || d2 < 0 || d3 < 0) && (d1 > 0 || d2 > 0 || d3 > 0));
    };
    let guard = 0;
    while (idx.length > 3 && guard++ < 10000) {
      let clipped = false;
      for (let i = 0; i < idx.length; i++) {
        const a = idx[(i + idx.length - 1) % idx.length], b = idx[i], c = idx[(i + 1) % idx.length];
        const A = p[a], B = p[b], C = p[c];
        if ((B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]) <= 1e-9) continue;
        let ok = true;
        for (const j of idx) {
          if (j === a || j === b || j === c) continue;
          if (inTri(p[j], A, B, C)) { ok = false; break; }
        }
        if (!ok) continue;
        tris.push(a, b, c);
        idx.splice(i, 1);
        clipped = true;
        break;
      }
      if (!clipped) break;
    }
    if (idx.length === 3) tris.push(idx[0], idx[1], idx[2]);
    return tris;
  }

  // Extrude a 2D outline into a board. Vertex: pos3, normal3, uv2, kind1 (0 face, 1 cut edge)
  function extrude(rawPts) {
    const p = cleanPoly(rawPts);
    const tri = triangulate(p);
    const v = [], lines = [];
    const h = T / 2;
    const push = (x, y, z, nx, ny, nz, u, w, k) => v.push(x, y, z, nx, ny, nz, u, w, k);
    for (let i = 0; i < tri.length; i += 3) {
      const [a, b, c] = [p[tri[i]], p[tri[i + 1]], p[tri[i + 2]]];
      push(a[0], a[1], h, 0, 0, 1, a[0], a[1], 0);
      push(b[0], b[1], h, 0, 0, 1, b[0], b[1], 0);
      push(c[0], c[1], h, 0, 0, 1, c[0], c[1], 0);
      push(a[0], a[1], -h, 0, 0, -1, a[0], a[1], 0);
      push(c[0], c[1], -h, 0, 0, -1, c[0], c[1], 0);
      push(b[0], b[1], -h, 0, 0, -1, b[0], b[1], 0);
    }
    let s = 0;
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
      const nx = dy / len, ny = -dx / len, s2 = s + len;
      push(a[0], a[1], h, nx, ny, 0, s, 0, 1);
      push(a[0], a[1], -h, nx, ny, 0, s, T, 1);
      push(b[0], b[1], -h, nx, ny, 0, s2, T, 1);
      push(a[0], a[1], h, nx, ny, 0, s, 0, 1);
      push(b[0], b[1], -h, nx, ny, 0, s2, T, 1);
      push(b[0], b[1], h, nx, ny, 0, s2, 0, 1);
      s = s2;
      lines.push(a[0], a[1], h, b[0], b[1], h, a[0], a[1], -h, b[0], b[1], -h);
      const pr = p[(i + p.length - 1) % p.length];
      const d1 = [a[0] - pr[0], a[1] - pr[1]], turn = Math.abs(Math.atan2(d1[0] * dy - d1[1] * dx, d1[0] * dx + d1[1] * dy));
      if (turn > 0.35) lines.push(a[0], a[1], h, a[0], a[1], -h);
    }
    return { verts: new Float32Array(v), lines: new Float32Array(lines) };
  }

  // ---------------- the panels ----------------
  // Side-profile fins. u runs back (0) to front (D), v is height.
  // Soft rounded bottom corners, a thick backrest with a rounded top that leans back slightly.
  const backAndBase = (P) => P
    .cubic(15, H_BACK + 1.5, 0.5, H_BACK + 1.5, -2.5, H_BACK - 6)   // rounded top of the backrest
    .cubic(-2.5, 55, 0, 30, 0, 11)                                   // back edge, leaning back toward the top
    .quad(0, 0, 11, 0);                                              // soft back-bottom corner
  const armFin = () => backAndBase(path().move(11, 0).line(D - 11, 0).quad(D, 0, D, 11)
    .line(D, H_ARM - 6).quad(D, H_ARM, D - 6, H_ARM)
    .line(31, H_ARM)
    .cubic(22, H_ARM, 17.5, H_ARM + 5, 17.5, H_ARM + 15)            // sweep from the arm up into the back
    .cubic(17.5, 76, 17, 81, 15.5, H_BACK - 4))
    .pts;
  const seatFin = () => backAndBase(path().move(11, 0).line(D - 11, 0).quad(D, 0, D, 11)
    .line(D, H_SEAT - 8).quad(D, H_SEAT + 0.5, D - 9, H_SEAT + 0.5)   // rounded seat nose
    .cubic(50, H_SEAT + 0.5, 36, H_SEAT - 1.5, 29, H_SEAT - 0.5)      // slight dip in the seat
    .cubic(22, H_SEAT, 19, H_SEAT + 6, 19.5, H_SEAT + 15)            // curve up into the back
    .cubic(20, H_SEAT + 27, 16.5, H_BACK - 15, 15.5, H_BACK - 4))    // lumbar, then reclined
    .pts;

  // Back and front edge of the outer panel at height v (used to fit the backrest strips)
  function spanAt(pts, v) {
    const us = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      if (y1 !== y2 && (y1 - v) * (y2 - v) <= 0) us.push(x1 + (v - y1) * (x2 - x1) / (y2 - y1));
    }
    return [Math.min(...us), Math.max(...us)];
  }
  const X = W / 2 + TAB;           // how far strips and tabs reach past the sides
  const IN = W / 2 - T / 2;        // inner parts end inside the outer panels, like a slot
  // Horizontal strips, rounded where they stick out
  const strip = (depth) => path().move(-X + 2, 0).line(X - 2, 0).quad(X, 0, X, 2).line(X, depth - 2).quad(X, depth, X - 2, depth)
    .line(-X + 2, depth).quad(-X, depth, -X, depth - 2).line(-X, 2).quad(-X, 0, -X + 2, 0).pts;
  // Base cross boards: full width up to the seat, with short tabs poking out both sides at the bottom
  const baseCross = (tab = 14) => path().move(-X, 0).line(X, 0).line(X, tab - 3).quad(X, tab, X - 3, tab).line(IN, tab)
    .line(IN, H_SEAT - 3).line(-IN, H_SEAT - 3).line(-IN, tab).line(-X + 3, tab).quad(-X, tab, -X, tab - 3).pts;
  // Arm cross pieces: from the inner arm fin out through the side panel, flush with the arm top
  const armCross = (sgn) => {
    const inner = W / 2 - ARM_W, top = H_ARM, bot = 34;   // flush with the arm top, so the joint shows
    const P = path();
    if (sgn > 0) P.move(inner, bot).line(X, bot).line(X, top - 3).quad(X, top, X - 3, top).line(inner, top);
    else P.move(-inner, bot).line(-inner, top).line(-X + 3, top).quad(-X, top, -X, top - 3).line(-X, bot);
    return P.pts;
  };
  // ---------------- quaternion / matrix math ----------------
  const qAxis = (x, y, z, a) => { const s = Math.sin(a / 2); return [x * s, y * s, z * s, Math.cos(a / 2)]; };
  const qMul = (a, b) => [
    a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
    a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
    a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
    a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
  ];
  function qSlerp(a, b, t) {
    let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3];
    let bb = b;
    if (d < 0) { d = -d; bb = b.map((x) => -x); }
    if (d > 0.9995) {
      const r = a.map((x, i) => x + (bb[i] - x) * t), l = Math.hypot(...r);
      return r.map((x) => x / l);
    }
    const th = Math.acos(d), s = Math.sin(th), wa = Math.sin((1 - t) * th) / s, wb = Math.sin(t * th) / s;
    return a.map((x, i) => x * wa + bb[i] * wb);
  }
  function mTR(q, t) {
    const [x, y, z, w] = q;
    return new Float32Array([
      1 - 2 * (y * y + z * z), 2 * (x * y + z * w), 2 * (x * z - y * w), 0,
      2 * (x * y - z * w), 1 - 2 * (x * x + z * z), 2 * (y * z + x * w), 0,
      2 * (x * z + y * w), 2 * (y * z - x * w), 1 - 2 * (x * x + y * y), 0,
      t[0], t[1], t[2], 1,
    ]);
  }
  function mMul(a, b) {
    const o = new Float32Array(16);
    for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
    return o;
  }
  function mPersp(fov, asp, n, f) {
    const t = 1 / Math.tan(fov / 2);
    return new Float32Array([t / asp, 0, 0, 0, 0, t, 0, 0, 0, 0, (f + n) / (n - f), -1, 0, 0, 2 * f * n / (n - f), 0]);
  }
  function mOrtho(l, r, b, t, n, f) {
    return new Float32Array([2 / (r - l), 0, 0, 0, 0, 2 / (t - b), 0, 0, 0, 0, -2 / (f - n), 0,
      -(r + l) / (r - l), -(t + b) / (t - b), -(f + n) / (f - n), 1]);
  }
  function mLook(e, c, u) {
    let z = [e[0] - c[0], e[1] - c[1], e[2] - c[2]]; let l = Math.hypot(...z); z = z.map((v) => v / l);
    let x = [u[1] * z[2] - u[2] * z[1], u[2] * z[0] - u[0] * z[2], u[0] * z[1] - u[1] * z[0]]; l = Math.hypot(...x); x = x.map((v) => v / l);
    const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]];
    const d = (a) => a[0] * e[0] + a[1] * e[1] + a[2] * e[2];
    return new Float32Array([x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -d(x), -d(y), -d(z), 1]);
  }
  const lerp3 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  // ---------------- build the piece list ----------------
  const pieces = [];
  const FINS = 15;
  const QFIN = qAxis(0, 1, 0, -Math.PI / 2);   // profile stands up, board faces sideways
  const QFLAT = qAxis(1, 0, 0, Math.PI / 2);   // board lies flat
  const QUP = [0, 0, 0, 1];                    // board stands facing the front
  let rand = 7;
  const rnd = () => ((rand = (rand * 16807) % 2147483647) / 2147483647 - 0.5);
  const add = (group, geo, asmPos, asmQ, explode, flat) => pieces.push({ group, geo: extrude(geo), asmPos, asmQ, explode, flat });

  // 1. Base cross boards, slotted up from the bottom between the fins
  [19, 26, 33, 40, 47, 54, 61].forEach((d) => add('base', baseCross(d > 57 ? 11 - T / 2 : 14), [0, 0, -D / 2 + d], QUP, [0, 0, 0], { x: -42, z: -20 }));
  // 2. Fins: 3 per arm, 9 for the seat
  for (let i = 0; i < FINS; i++) {
    const x = -W / 2 + T / 2 + (i * (W - T)) / (FINS - 1);
    const arm = Math.abs(x) > W / 2 - ARM_W;
    add('fin', arm ? armFin() : seatFin(), [x, 0, -D / 2], QFIN, [x * 0.9, 0, 0], { x: 10, z: -42 });
  }
  // 3. Front strips (deep, sticking out the sides), then back strips up the back edge
  [11, 17.5, 24].forEach((h) => add('strip', strip(16), [0, h, -D / 2 + D - 15], QFLAT, [0, 0, 22], { x: -42, z: -40 }));
  const outline = armFin();
  [12, 20, 28, 36, 44].forEach((h) => {
    const back = spanAt(outline, h)[0];
    add('strip', strip(15), [0, h, -D / 2 + back - 1], QFLAT, [0, 0, -22], { x: -42, z: -40 });
  });
  // Backrest strips, same size as the others: the top and bottom ones stick out the back,
  // the middle one sticks out the front of the backrest.
  const seatOutline = seatFin();
  [60, 76].forEach((h) => {
    const back = spanAt(outline, h)[0];
    add('strip', strip(15), [0, h, -D / 2 + back - 1], QFLAT, [0, 0, -22], { x: -42, z: -40 });
  });
  {
    const h = 68, front = Math.max(spanAt(outline, h)[1], spanAt(seatOutline, h)[1]);
    add('strip', strip(15), [0, h, -D / 2 + front + 1 - 15], QFLAT, [0, 0, 22], { x: -42, z: -40 });
  }
  // 4. Arm cross pieces, interlocking at the top of each arm and sticking out the side
  [26, 33, 40, 47, 54, 61].forEach((d) => {
    add('arm', armCross(1), [0, 0, -D / 2 + d], QUP, [18, 10, 0], { x: -105, z: -10 });
    add('arm', armCross(-1), [0, 0, -D / 2 + d], QUP, [-18, 10, 0], { x: -42, z: -10 });
  });

  // Flat-pack piles, like the floor photo. Pieces leave in build order, top of each pile first.
  pieces.forEach((p, i) => { p.order = i; p.lift = 22 + (i % 3) * 7; });
  const stackY = (k) => T / 2 + k * (T + 0.12);
  for (const g of ['base', 'fin', 'strip', 'arm']) {
    const list = pieces.filter((p) => p.group === g);
    list.forEach((p, i) => {
      const k = list.length - 1 - i;
      p.flatPos = [p.flat.x + rnd() * 2, stackY(k), p.flat.z + rnd() * 2];
      p.flatQ = qMul(qAxis(0, 1, 0, rnd() * 0.05), QFLAT);
    });
  }

  // ---------------- WebGL ----------------
  const transparent = host.hasAttribute('transparent');
  const gl = canvas.getContext('webgl', { antialias: true, alpha: transparent, premultipliedAlpha: true });
  if (!gl) { host.shadowRoot.querySelector('.fallback').hidden = false; return null; }

  const SHADOW = 2048;
  const common = `
    precision highp float;
    uniform sampler2D uShadow;
    uniform mat4 uLightVP;
    uniform vec3 uLightDir;
    float unpack(vec4 c) { return dot(c, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0)); }
    float shadowAt(vec3 w, vec3 n) {
      vec4 lp = uLightVP * vec4(w + n * 0.5, 1.0);
      vec3 p = lp.xyz / lp.w * 0.5 + 0.5;
      if (p.x < 0.0 || p.x > 1.0 || p.y < 0.0 || p.y > 1.0) return 1.0;
      float s = 0.0;
      for (int i = -2; i <= 2; i++) for (int j = -2; j <= 2; j++) {
        vec2 o = vec2(float(i), float(j)) * (1.25 / ${SHADOW}.0);
        s += (p.z - 0.0012 > unpack(texture2D(uShadow, p.xy + o))) ? 0.0 : 1.0;
      }
      return s / 25.0;
    }`;

  const VS_PIECE = `
    attribute vec3 aPos; attribute vec3 aNor; attribute vec2 aUV; attribute float aKind;
    uniform mat4 uProj, uView, uGroup, uPiece;
    varying vec3 vW, vN, vC; varying vec2 vUV; varying float vKind;
    void main() {
      vec4 c = uPiece * vec4(aPos, 1.0);
      vec4 w = uGroup * c;
      vC = c.xyz; vW = w.xyz;
      vN = mat3(uGroup) * (mat3(uPiece) * aNor);
      vUV = aUV; vKind = aKind;
      gl_Position = uProj * uView * w;
    }`;

  const FS_PIECE = common + `
    varying vec3 vW, vN, vC; varying vec2 vUV; varying float vKind;
    uniform vec3 uCam; uniform float uMode; uniform float uAsm;
    float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
      return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
    }
    // Studio for the chrome finish, in the portfolio's steel range with a thin amber/blue split at the horizon
    vec3 env(vec3 r) {
      vec3 light = vec3(0.780, 0.796, 0.831), dark = vec3(0.376, 0.435, 0.471);
      float y = r.y;
      vec3 sky = mix(mix(dark, light, 0.55), light, smoothstep(0.02, 0.6, y));
      vec3 ground = mix(dark * 0.55, dark, smoothstep(-0.7, -0.08, y));
      vec3 c = y > 0.0 ? sky : ground;
      c = mix(c, dark * 0.7, exp(-pow(y / 0.03, 2.0)));
      c += vec3(0.95, 0.62, 0.30) * 0.55 * exp(-pow((y - 0.055) / 0.018, 2.0));
      c += vec3(0.25, 0.50, 0.95) * 0.55 * exp(-pow((y + 0.075) / 0.02, 2.0));
      c += vec3(0.93, 0.95, 0.97) * 0.9 * exp(-pow(length(r.xz - vec2(-0.45, 0.25)) * 3.2, 2.0)) * step(0.2, y);
      return c;
    }
    void main() {
      vec3 N = normalize(vN), V = normalize(uCam - vW), L = normalize(uLightDir);
      float sh = shadowAt(vW, N);
      float ndl = max(dot(N, L), 0.0);
      // Fake occlusion deep inside the waffle, only once assembled
      float depthIn = min(37.0 - abs(vC.x), 36.0 - abs(vC.z));
      float occ = uAsm * smoothstep(1.5, 15.0, depthIn) * (1.0 - 0.75 * max(N.y, 0.0));
      float ao = 1.0 - 0.45 * occ;
      vec3 col;
      if (uMode < 0.5) {
        float fib = noise(vUV * vec2(2.4, 0.3)) * 0.55 + noise(vUV * 11.0) * 0.45;
        vec3 face = vec3(0.82, 0.64, 0.43) * (0.9 + 0.14 * fib);
        face *= 1.0 - 0.18 * step(0.985, hash(floor(vUV * 6.0)));
        vec3 edge = vec3(0.66, 0.49, 0.31) * (0.86 + 0.14 * sin(vUV.x * 14.0));
        vec3 base = vKind > 0.5 ? edge : face;
        vec3 amb = mix(vec3(0.62, 0.57, 0.52), vec3(0.98, 0.96, 0.93), N.y * 0.5 + 0.5);
        float wrap = max(dot(N, L) * 0.5 + 0.5, 0.0);
        col = base * (amb * 0.72 * ao + vec3(1.0, 0.96, 0.9) * (ndl * sh * 0.5 + wrap * 0.12) * mix(1.0, ao, 0.5));
      } else if (uMode < 1.5) {
        vec3 base = vKind > 0.5 ? vec3(0.20, 0.36, 0.55) : vec3(0.075, 0.19, 0.31);
        col = base * (0.7 + 0.45 * ndl * sh) * (0.75 + 0.25 * ao);
      } else {
        // Plain model view: matte clay, soft light, occlusion and shadows only
        vec3 base = vec3(0.86, 0.86, 0.84) * (vKind > 0.5 ? 0.9 : 1.0);
        vec3 amb = mix(vec3(0.55, 0.56, 0.58), vec3(1.0), N.y * 0.5 + 0.5);
        float wrap = max(dot(N, L) * 0.5 + 0.5, 0.0);
        col = base * (amb * 0.62 * ao + (ndl * sh * 0.42 + wrap * 0.14) * mix(1.0, ao, 0.5));
      }
      gl_FragColor = vec4(col, 1.0);
    }`;

  const VS_DEPTH = `
    attribute vec3 aPos;
    uniform mat4 uLightVP, uGroup, uPiece;
    void main() { gl_Position = uLightVP * uGroup * uPiece * vec4(aPos, 1.0); }`;
  const FS_DEPTH = `
    precision highp float;
    void main() {
      vec4 e = fract(gl_FragCoord.z * vec4(1.0, 255.0, 65025.0, 16581375.0));
      e -= e.yzww * vec4(1.0/255.0, 1.0/255.0, 1.0/255.0, 0.0);
      gl_FragColor = e;
    }`;

  const VS_FLOOR = `
    attribute vec3 aPos;
    uniform mat4 uProj, uView;
    varying vec3 vW;
    void main() { vW = aPos; gl_Position = uProj * uView * vec4(aPos, 1.0); }`;
  const FS_FLOOR = common + `
    varying vec3 vW;
    uniform float uMode; uniform vec3 uShadeCol; uniform float uShadeAmt; uniform vec2 uYawCS;
    void main() {
      float sh = shadowAt(vW, vec3(0.0, 1.0, 0.0));
      float fade = 1.0 - smoothstep(90.0, 240.0, length(vW.xz));
      float a = (1.0 - sh) * uShadeAmt * fade;
      vec3 col = uShadeCol;
      if (uMode > 0.5 && uMode < 1.5) {
        vec2 g = vec2(uYawCS.x * vW.x - uYawCS.y * vW.z, uYawCS.y * vW.x + uYawCS.x * vW.z);
        vec2 f10 = abs(fract(g / 10.0 - 0.5) - 0.5) * 10.0, f50 = abs(fract(g / 50.0 - 0.5) - 0.5) * 50.0;
        float w = fwidthApprox(g);
        float l1 = 1.0 - smoothstep(0.0, 0.35, min(f10.x, f10.y));
        float l2 = 1.0 - smoothstep(0.0, 0.5, min(f50.x, f50.y));
        float grid = max(l1 * 0.22, l2 * 0.45) * fade;
        col = mix(col, vec3(0.62, 0.78, 0.95), grid / max(a + grid, 1e-3));
        a = max(a, grid);
      }
      gl_FragColor = vec4(col, a);
    }`.replace('float w = fwidthApprox(g);', '');

  const VS_LINE = `
    attribute vec3 aPos;
    uniform mat4 uProj, uView, uGroup, uPiece;
    void main() { gl_Position = uProj * uView * uGroup * uPiece * vec4(aPos, 1.0); }`;
  const FS_LINE = `precision highp float; uniform vec4 uColor; void main() { gl_FragColor = uColor; }`;

  function program(vs, fs) {
    const mk = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, mk(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) { const nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); }
    const a = {}, na = gl.getProgramParameter(p, gl.ACTIVE_ATTRIBUTES);
    for (let i = 0; i < na; i++) { const nm = gl.getActiveAttrib(p, i).name; a[nm] = gl.getAttribLocation(p, nm); }
    return { p, u, a };
  }
  const P = program(VS_PIECE, FS_PIECE), PD = program(VS_DEPTH, FS_DEPTH), PF = program(VS_FLOOR, FS_FLOOR), PL = program(VS_LINE, FS_LINE);

  pieces.forEach((pc) => {
    pc.vbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pc.vbo); gl.bufferData(gl.ARRAY_BUFFER, pc.geo.verts, gl.STATIC_DRAW);
    pc.count = pc.geo.verts.length / 9;
    pc.lbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, pc.lbo); gl.bufferData(gl.ARRAY_BUFFER, pc.geo.lines, gl.STATIC_DRAW);
    pc.lcount = pc.geo.lines.length / 3;
  });
  const floorBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, floorBuf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-500, -0.02, -500, 500, -0.02, -500, -500, -0.02, 500, -500, -0.02, 500, 500, -0.02, -500, 500, -0.02, 500]), gl.STATIC_DRAW);

  const shadowTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, shadowTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, SHADOW, SHADOW, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const shadowFB = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, shadowTex, 0);
  const rb = gl.createRenderbuffer();
  gl.bindRenderbuffer(gl.RENDERBUFFER, rb);
  gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, SHADOW, SHADOW);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, rb);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);

  function bindPiece(prog, pc) {
    gl.bindBuffer(gl.ARRAY_BUFFER, pc.vbo);
    const st = 36;
    const at = (name, size, off) => { const l = prog.a[name]; if (l === undefined || l < 0) return; gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, size, gl.FLOAT, false, st, off); };
    at('aPos', 3, 0); at('aNor', 3, 12); at('aUV', 2, 24); at('aKind', 1, 32);
  }

  // ---------------- finishes (hidden: keys 1–3) ----------------
  const MODES = [
    { name: 'cardboard', bg: [0.906, 0.890, 0.867], ink: '#3b3129', muted: '#8a7d70', shade: [0.30, 0.22, 0.15], amt: 0.42, scheme: 'light' },
    { name: 'blueprint', bg: [0.051, 0.133, 0.220], ink: '#dbe9f7', muted: '#7ea3c6', shade: [0.0, 0.03, 0.07], amt: 0.45, scheme: 'dark' },
    { name: 'model', bg: [0.925, 0.925, 0.918], ink: '#2e2e2c', muted: '#8d8d88', shade: [0.12, 0.12, 0.13], amt: 0.38, scheme: 'light' },
  ];
  let mode = 0, bg = MODES[0].bg.slice();
  function setMode(i) {
    mode = i;
  }

  // ---------------- interaction ----------------
  let yaw = -0.62, yawVel = 0, el = 0.36, dragging = false, lastX = 0, lastY = 0, moved = 0, lastInput = -1e9, lastTap = 0, pType = 'mouse';
  let A = 1, targetA = 1, E = 0, targetE = 0;

  canvas.addEventListener('pointerdown', (e) => {
    schedule();
    dragging = true; moved = 0; lastX = e.clientX; lastY = e.clientY; pType = e.pointerType; lastInput = performance.now();
    try { canvas.setPointerCapture(e.pointerId); } catch (_) {}
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY; moved += Math.abs(dx) + Math.abs(dy);
    yaw += dx * 0.008; yawVel = dx * 0.008 * 60;
    if (pType === 'mouse') el = Math.min(0.85, Math.max(0.08, el + dy * 0.004));
    lastInput = performance.now();
  });
  const up = () => {
    if (!dragging) return;
    dragging = false; lastInput = performance.now();
  };
  canvas.addEventListener('pointerup', up);
  canvas.addEventListener('pointercancel', up);
  // Hidden keys only work while the pointer is over the chair or it has focus,
  // so they never clash with other shortcuts on the page.
  let hovered = false;
  const onEnter = () => { hovered = true; schedule(); }, onLeave = () => { hovered = false; };
  host.addEventListener('pointerenter', onEnter);
  host.addEventListener('pointerleave', onLeave);
  const onKey = (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    if (!hovered && host.shadowRoot.activeElement !== canvas) return;
    if (e.key >= '1' && e.key <= '3') setMode(+e.key - 1);
    else if (e.key === 'e' || e.key === 'E') targetE = targetE > 0.5 ? 0 : 1;
    else return;
    schedule();
  };
  window.addEventListener('keydown', onKey);

  // ---------------- render loop ----------------
  let raf = 0, prev = performance.now();
  const LDIR = (() => { const v = [-0.42, 1.0, 0.72], l = Math.hypot(...v); return v.map((x) => x / l); })();
  const lightView = mLook([LDIR[0] * 300, 20 + LDIR[1] * 300, LDIR[2] * 300], [0, 20, 0], [0, 1, 0]);
  const lightVP = mMul(mOrtho(-118, 118, -118, 118, 1, 700), lightView);

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  }

  function frame(now) {
    raf = 0;
    const real = Math.min(0.25, (now - prev) / 1000), dt = Math.min(0.05, real); prev = now;
    resize();

    // Assembly and explode progress
    const speed = 1 / 3.4;
    A += Math.sign(targetA - A) * Math.min(Math.abs(targetA - A), speed * real * (reduceMotion ? 50 : 1));
    E += (targetE - E) * Math.min(1, dt * 3.5);

    // Turntable: inertia after a drag, slow idle spin after a pause
    if (!dragging) {
      const idle = !reduceMotion && now - lastInput > 3500;
      yawVel += ((idle ? 0.14 : 0) - yawVel) * Math.min(1, dt * (idle ? 0.8 : 3.0));
      yaw += yawVel * dt;
    }
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const group = mTR(qAxis(0, 1, 0, yaw), [0, 0, 0]);

    // Piece transforms
    const S = 1.4, N = pieces.length;
    let asmSum = 0;
    for (const pc of pieces) {
      const s = (pc.order / (N - 1)) * S;
      const p = Math.min(1, Math.max(0, A * (1 + S) - s)), e = ease(p);
      const pos = lerp3(pc.flatPos, pc.asmPos, e);
      pos[1] += Math.sin(Math.PI * e) * pc.lift;
      const ex = E * e;
      pos[0] += pc.explode[0] * ex; pos[1] += pc.explode[1] * ex; pos[2] += pc.explode[2] * ex;
      pc.m = mTR(qSlerp(pc.flatQ, pc.asmQ, e), pos);
      pc.asm = e * (1 - E);
      asmSum += e;
    }
    const aVis = asmSum / N;

    // Camera frames the flat-pack piles, then pulls in on the chair
    const aspect = canvas.width / Math.max(1, canvas.height);
    const vf = 30 * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * aspect);
    const radius = 88 + (68 - 88) * aVis + E * 30;
    const dist = radius / Math.sin(Math.min(vf, hf) / 2);
    const target = [0, 6 + 32 * aVis + E * 6, 0];
    const eye = [target[0], target[1] + Math.sin(el) * dist, target[2] + Math.cos(el) * dist];
    const proj = mPersp(vf, aspect, 5, 3000), view = mLook(eye, target, [0, 1, 0]);

    // 1. Shadow depth
    gl.bindFramebuffer(gl.FRAMEBUFFER, shadowFB);
    gl.viewport(0, 0, SHADOW, SHADOW);
    gl.clearColor(1, 1, 1, 1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.enable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    gl.useProgram(PD.p);
    gl.uniformMatrix4fv(PD.u.uLightVP, false, lightVP);
    gl.uniformMatrix4fv(PD.u.uGroup, false, group);
    for (const pc of pieces) {
      bindPiece(PD, pc);
      gl.uniformMatrix4fv(PD.u.uPiece, false, pc.m);
      gl.drawArrays(gl.TRIANGLES, 0, pc.count);
    }

    // 2. Scene
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, canvas.width, canvas.height);
    const m = MODES[mode];
    for (let i = 0; i < 3; i++) bg[i] += (m.bg[i] - bg[i]) * Math.min(1, dt * 5);
    if (transparent) gl.clearColor(0, 0, 0, 0); else gl.clearColor(bg[0], bg[1], bg[2], 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, shadowTex);

    // Floor: shadow (and the blueprint grid)
    gl.useProgram(PF.p);
    gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.depthMask(false);
    gl.uniformMatrix4fv(PF.u.uProj, false, proj); gl.uniformMatrix4fv(PF.u.uView, false, view);
    gl.uniformMatrix4fv(PF.u.uLightVP, false, lightVP); gl.uniform1i(PF.u.uShadow, 0);
    gl.uniform3fv(PF.u.uLightDir, LDIR); gl.uniform1f(PF.u.uMode, mode);
    gl.uniform3fv(PF.u.uShadeCol, m.shade); gl.uniform1f(PF.u.uShadeAmt, m.amt);
    gl.uniform2f(PF.u.uYawCS, Math.cos(yaw), Math.sin(yaw));
    gl.bindBuffer(gl.ARRAY_BUFFER, floorBuf);
    gl.enableVertexAttribArray(PF.a.aPos); gl.vertexAttribPointer(PF.a.aPos, 3, gl.FLOAT, false, 12, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.disableVertexAttribArray(PF.a.aPos);
    gl.depthMask(true); gl.disable(gl.BLEND);

    // Panels
    gl.useProgram(P.p);
    gl.uniformMatrix4fv(P.u.uProj, false, proj); gl.uniformMatrix4fv(P.u.uView, false, view);
    gl.uniformMatrix4fv(P.u.uGroup, false, group); gl.uniformMatrix4fv(P.u.uLightVP, false, lightVP);
    gl.uniform1i(P.u.uShadow, 0); gl.uniform3fv(P.u.uLightDir, LDIR); gl.uniform3fv(P.u.uCam, eye);
    gl.uniform1f(P.u.uMode, mode);
    if (mode === 1) { gl.enable(gl.POLYGON_OFFSET_FILL); gl.polygonOffset(1, 1); }
    for (const pc of pieces) {
      bindPiece(P, pc);
      gl.uniformMatrix4fv(P.u.uPiece, false, pc.m);
      gl.uniform1f(P.u.uAsm, pc.asm);
      gl.drawArrays(gl.TRIANGLES, 0, pc.count);
    }
    for (const k of ['aNor', 'aUV', 'aKind']) if (P.a[k] >= 0) gl.disableVertexAttribArray(P.a[k]);
    gl.disable(gl.POLYGON_OFFSET_FILL);

    // Blueprint linework
    if (mode === 1) {
      gl.useProgram(PL.p);
      gl.enable(gl.BLEND); gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.uniformMatrix4fv(PL.u.uProj, false, proj); gl.uniformMatrix4fv(PL.u.uView, false, view);
      gl.uniformMatrix4fv(PL.u.uGroup, false, group); gl.uniform4f(PL.u.uColor, 0.86, 0.93, 1.0, 0.9);
      for (const pc of pieces) {
        gl.bindBuffer(gl.ARRAY_BUFFER, pc.lbo);
        gl.enableVertexAttribArray(PL.a.aPos); gl.vertexAttribPointer(PL.a.aPos, 3, gl.FLOAT, false, 12, 0);
        gl.uniformMatrix4fv(PL.u.uPiece, false, pc.m);
        gl.drawArrays(gl.LINES, 0, pc.lcount);
      }
      gl.disable(gl.BLEND);
    }
    schedule();
  }

  // Pause while scrolled off screen. Starts "visible" so it never freezes before the first check,
  // and any pointer or key input wakes it up again.
  let visible = true;
  function schedule() { if (visible && !raf) { prev = performance.now(); raf = requestAnimationFrame(frame); } }
  let io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver((entries) => {
      visible = entries[entries.length - 1].isIntersecting;
      if (visible) schedule(); else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { rootMargin: '150px' });
    io.observe(host);
  }
  const onVis = () => { prev = performance.now(); schedule(); };
  document.addEventListener('visibilitychange', onVis);
  schedule();

  return {
    setMode: (i) => { setMode(i); schedule(); },
    get mode() { return mode; },
    setExplode: (on) => { targetE = on ? 1 : 0; schedule(); },
    destroy() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0; visible = false;
      if (io) io.disconnect();
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('visibilitychange', onVis);
      host.removeEventListener('pointerenter', onEnter);
      host.removeEventListener('pointerleave', onLeave);
      const ext = gl.getExtension('WEBGL_lose_context');
      if (ext) ext.loseContext();
    },
  };
}

const STYLE = `
  :host { display: block; position: relative; aspect-ratio: 4 / 3; max-width: 100%; }
  :host([hidden]) { display: none; }
  canvas { display: block; width: 100%; height: 100%; cursor: grab; touch-action: pan-y; outline: none; }
  canvas:active { cursor: grabbing; }
  canvas:focus-visible { outline: 2px solid currentColor; outline-offset: 2px; }
  .fallback { position: absolute; inset: 0; display: grid; place-items: center; font: 13px/1.4 system-ui, sans-serif; opacity: 0.7; }
  .fallback[hidden] { display: none; }
`;

// Safe to import during server-side rendering: it only defines itself in a browser.
if (typeof window !== 'undefined' && window.customElements && !customElements.get('flatpack-chair')) {
  class FlatpackChair extends HTMLElement {
    static get observedAttributes() { return ['finish', 'explode']; }
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
      root.innerHTML = `<style>${STYLE}</style><canvas tabindex="0" part="canvas"
        aria-label="Slotted cardboard lounge chair. Drag to turn it."></canvas>
        <div class="fallback" hidden>3D view needs WebGL, which this browser has turned off.</div>`;
      this._canvas = root.querySelector('canvas');
      this._api = null;
    }
    get finish() { return FINISH_NAMES[this._api ? this._api.mode : 0]; }
    set finish(v) { this.setAttribute('finish', v); }
    connectedCallback() {
      if (!this._api) this._api = mount(this, this._canvas);
      this._apply();
    }
    disconnectedCallback() {
      if (this._api) { this._api.destroy(); this._api = null; }
    }
    attributeChangedCallback() { this._apply(); }
    _apply() {
      if (!this._api) return;
      const i = FINISH_NAMES.indexOf((this.getAttribute('finish') || 'cardboard').toLowerCase());
      this._api.setMode(i < 0 ? 0 : i);
      this._api.setExplode(this.hasAttribute('explode'));
    }
  }
  customElements.define('flatpack-chair', FlatpackChair);
}
})();
