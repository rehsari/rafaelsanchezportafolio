/* ------------------------------------------------------------------ *
 * nibble-orb.js — Nibble's body.
 *
 * A faithful vanilla-ES5 port of the engine in
 *   https://github.com/Jakubantalik/thinking-orbs  (MIT, Jakub Antalik)
 *
 * Carried over verbatim in behaviour:
 *   - hashD / fibDir / angleDelta / makeProj / radiusScale(size, pow),
 *     where radii are tuned against a 300pt frame, not the render size.
 *   - finalizeFrame: drop a < 0.02, clamp r to rMin, z-sort far -> near.
 *   - The mode painters: ring (breathing), globe (searching),
 *     orbits (working), wave (listening).
 *   - BASE_PROFILES + scaleCounts / scaleRadii, where 2-D lattice pairs
 *     each take sqrt(scale) so the TOTAL dot count scales by `scale`.
 *   - The baked PRESETS for the two shipped sizes (64 and 20), including
 *     their speed multipliers and `extra` option bags.
 *
 * DEPTH IS CARRIED BY INK WEIGHT (`white`) AND DOT RADIUS — never by
 * alpha alone. That is the whole reason the upstream orbs read as solid
 * volumes rather than flat scatter.
 *
 * The one deliberate departure: upstream paints grayscale, since it
 * targets paper-like light/dark substrates. Here the same ink value runs
 * through a blackbody ramp plus a cool silhouette rim, so the depth
 * signal reads as a lit, volumetric object on Nibble's #080808 ground.
 *
 * Still plain 2D canvas arcs only: no WebGL, no SVG filters, no
 * ctx.filter, DPR capped at 2.
 * ------------------------------------------------------------------ */
(function () {
  'use strict';

  var TAU = Math.PI * 2;

  /* ---------------- core primitives (upstream engine/core.ts) ------- */

  function hashD(a, b) {
    var h = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
    return h - Math.floor(h);
  }

  /* Stable directions on a unit sphere (Fibonacci lattice) — no banding. */
  function fibDir(i, n, out) {
    var golden = Math.PI * (3 - Math.sqrt(5));
    var y = 1 - (2 * (i + 0.5)) / n;
    var rad = Math.sqrt(1 - y * y);
    var a = i * golden;
    out[0] = rad * Math.cos(a);
    out[1] = y;
    out[2] = rad * Math.sin(a);
    return out;
  }

  function angleDelta(a, b) {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
  }

  /* Shared spin + tilt + orthographic projection. */
  function makeProj(yaw, tilt, cx, cy, scale) {
    var st = Math.sin(tilt), ct = Math.cos(tilt);
    var sy = Math.sin(yaw), cyw = Math.cos(yaw);
    return function (x, y, z, out) {
      var x1 = x * cyw + z * sy;
      var z1 = -x * sy + z * cyw;
      var y1 = y * ct - z1 * st;
      var z2 = y * st + z1 * ct;
      out[0] = cx + x1 * scale;
      out[1] = cy - y1 * scale;
      out[2] = z2;
      return out;
    };
  }

  /* Radii were tuned for a 300pt frame; sub-linear so small orbs stay legible. */
  function radiusScale(size, pow) {
    return Math.pow(size / 300, pow);
  }

  function byZ(a, b) { return a.z - b.z; }

  /* Drop invisible marks, clamp radii to the floor, z-sort far -> near.
     Runs in the geometry step, so a frame is a finished draw list. */
  function finalizeFrame(dots, rMin) {
    if (rMin === undefined) rMin = 0.3;
    var out = [];
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      if ((d.a === undefined ? 1 : d.a) < 0.02) continue;
      if (d.r < rMin) d.r = rMin;
      out.push(d);
    }
    out.sort(byZ);
    return out;
  }

  /* ---------------- modes ------------------------------------------ */

  var P = [0, 0, 0];
  var D3 = [0, 0, 0];

  function num(o, k, dflt) {
    var v = o[k];
    return v === undefined ? dflt : v;
  }

  /* Globe — a lat/long field with a scan meridian sweeping through it.
     Nibble's "searching": the request is out, nothing has come back. */
  function frameGlobe(size, t, o) {
    var spin = 0.5;
    var cx = size / 2, cy = size / 2;
    var radius = (size / 2) * 0.82;
    var tilt = 0.4 + 0.06 * Math.sin(t * 0.35);
    var pt = makeProj(t * spin, tilt, cx, cy, radius);
    var scan = t * (spin + (1.7 - spin) * num(o, 'scanMul', 1));
    var rs = radiusScale(size, num(o, 'rsPow', 0.6));
    var dimBase = num(o, 'dimBase', 1);
    var rBase = num(o, 'rBase', 0.6), rDepth = num(o, 'rDepth', 1.7);
    var rBoost = num(o, 'rBoost', 1);
    var inkFar = num(o, 'inkFar', 0.62), inkSpan = num(o, 'inkSpan', 0.54);
    var energy = num(o, 'energy', 0);

    var dots = [];
    var latRings = num(o, 'latRings', 17);
    var lonDensity = num(o, 'lonDensity', 44);
    for (var li = 0; li <= latRings; li++) {
      var lat = -Math.PI / 2 + (li / latRings) * Math.PI;
      var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
      var lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
      for (var lj = 0; lj < lonCount; lj++) {
        var lon = (lj / lonCount) * TAU;
        pt(cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon), P);
        var depth = (P[2] + 1) / 2;
        // the scan: a moving meridian read as a size ripple, not a shine
        var dd = angleDelta(lon + t * spin, scan);
        var boost = Math.exp(-(dd * dd) / 0.18) * Math.max(0, P[2]);
        dots.push({
          x: P[0], y: P[1], z: P[2],
          r: (rBase + rDepth * depth + rBoost * boost * (1 + 0.7 * energy)) * rs,
          white: inkFar - inkSpan * depth - 0.1 * boost,
          a: dimBase + (1 - dimBase) * Math.min(1, boost)
        });
      }
    }
    return finalizeFrame(dots, o.rMin);
  }

  /* --- the solver heartbeat behind rubik ---------------------------
     Rapid eased moves scramble the sphere, then replay in reverse
     (palindrome) so everything clicks back to solved, rests, repeats. */

  function makeMoves(count) {
    var moves = [];
    for (var i = 0; i < count; i++) {
      var axis = Math.min(2, Math.floor(hashD(i, 2.3) * 3));
      var lo = -1.0 + 0.5 * Math.min(3, Math.floor(hashD(i, 5.9) * 4));
      var dir = hashD(i, 7.7) < 0.5 ? 1 : -1;
      moves.push({ axis: axis, lo: lo, hi: lo + 0.5, ang: (dir * Math.PI) / 2 });
    }
    return moves;
  }

  function solveCycle(time, count, slotDur, rest) {
    var cyc = 2 * count * slotDur + rest;
    var tc = time % cyc;
    var amount = new Array(count), i;
    for (i = 0; i < count; i++) amount[i] = 0;
    var active = -1;
    if (tc < 2 * count * slotDur) {
      var slot = Math.floor(tc / slotDur);
      var p = (tc - slot * slotDur) / slotDur;
      var cl = Math.min(1, p / 0.7);
      var ep = 1 - Math.pow(1 - cl, 3); // machine ease-out
      if (slot < count) {
        for (i = 0; i < slot; i++) amount[i] = 1;
        amount[slot] = ep;
        active = slot;
      } else {
        var u = 2 * count - 1 - slot;
        for (i = 0; i < u; i++) amount[i] = 1;
        amount[u] = 1 - ep;
        active = u;
      }
    }
    return { amount: amount, active: active };
  }

  var RB = [0, 0, 0];

  function applyMoves(px, py, pz, moves, sc) {
    var x = px, y = py, z = pz, inActive = false;
    for (var i = 0; i < moves.length; i++) {
      if (sc.amount[i] <= 0) continue;
      var mv = moves[i];
      var coord = mv.axis === 0 ? x : (mv.axis === 1 ? y : z);
      if (coord < mv.lo || coord >= mv.hi) continue;
      if (i === sc.active) inActive = true;
      var a = mv.ang * sc.amount[i];
      var ca = Math.cos(a), sa = Math.sin(a);
      if (mv.axis === 0) {
        var y2 = y * ca - z * sa;
        z = y * sa + z * ca;
        y = y2;
      } else if (mv.axis === 1) {
        var x2 = x * ca + z * sa;
        z = -x * sa + z * ca;
        x = x2;
      } else {
        var x3 = x * ca - y * sa;
        y = x * sa + y * ca;
        x = x3;
      }
    }
    RB[0] = x; RB[1] = y; RB[2] = z;
    return inActive;
  }

  /* Rubik — bands twist in quarter turns, scramble then solve.
     Nibble's "solving": visibly working a problem, not just spinning. */
  function frameRubik(size, t, o) {
    var cx = size / 2, cy = size / 2;
    var R = (size / 2) * 0.82;
    var pt = makeProj(t * 0.55, 0.35 + 0.1 * Math.sin(t * 0.9), cx, cy, R);
    var rs = radiusScale(size, num(o, 'rsPow', 0.6));
    var moveCount = num(o, 'moveCount', 14);
    var moves = makeMoves(moveCount);
    var energy = num(o, 'energy', 0);
    var sc = solveCycle(t * (1 + 0.5 * energy), moveCount, 0.42, 1.2);
    var rBase = num(o, 'rBase', 0.6), rDepth = num(o, 'rDepth', 1.7);
    var rActive = num(o, 'rActive', 0.3);
    var inkFar = num(o, 'inkFar', 0.62), inkSpan = num(o, 'inkSpan', 0.54);

    var dots = [];
    var latRings = num(o, 'latRings', 15);
    var lonDensity = num(o, 'lonDensity', 40);
    for (var li = 0; li <= latRings; li++) {
      var lat = -Math.PI / 2 + (li / latRings) * Math.PI;
      var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
      var lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
      for (var lj = 0; lj < lonCount; lj++) {
        var lon = (lj / lonCount) * TAU;
        var inActive = applyMoves(cosLat * Math.cos(lon), sinLat, cosLat * Math.sin(lon), moves, sc);
        pt(RB[0], RB[1], RB[2], P);
        var depth = (P[2] + 1) / 2;
        // the band being turned inks a touch brighter — the "hand"
        dots.push({
          x: P[0], y: P[1], z: P[2],
          r: (rBase + rDepth * depth + (inActive ? rActive : 0)) * rs,
          white: inkFar - inkSpan * depth - (inActive ? 0.14 : 0)
        });
      }
    }
    return finalizeFrame(dots, o.rMin);
  }

  /* Orbits — particles running tilted orbits, no nucleus.
     Nibble's "working": tokens are moving, work is visibly underway. */
  function frameOrbits(size, t, o) {
    var cx = size / 2, cy = size / 2;
    var R = (size / 2) * 0.82;
    var pt = makeProj(t * 0.12, 0.3, cx, cy, 1);
    var rs = radiusScale(size, num(o, 'rsPow', 0.6));
    var orbitN = num(o, 'orbitN', 12);
    var ghostN = num(o, 'ghostN', 40);
    var particles = num(o, 'particles', 3);
    var ghostR = num(o, 'ghostR', 0.9), ghostA = num(o, 'ghostA', 0.5);
    var partR = num(o, 'partR', 1.2), partRDepth = num(o, 'partRDepth', 1.6);
    var energy = num(o, 'energy', 0);

    var dots = [];
    for (var orb = 0; orb < orbitN; orb++) {
      var h1 = hashD(orb, 1.7), h2 = hashD(orb, 5.2), h3 = hashD(orb, 8.9);
      var ro = R * (0.45 + 0.52 * h1);
      var th = h1 * TAU;
      var phi = Math.acos(2 * h2 - 1);
      // orbit plane basis (u, v perpendicular to normal n)
      var nx = Math.sin(phi) * Math.cos(th);
      var ny = Math.cos(phi);
      var nz = Math.sin(phi) * Math.sin(th);
      var ux = -ny, uy = nx, uz = 0;
      var ul = Math.max(1e-6, Math.sqrt(ux * ux + uy * uy));
      ux /= ul; uy /= ul;
      var vx = ny * uz - nz * uy;
      var vy = nz * ux - nx * uz;
      var vz = nx * uy - ny * ux;
      var speed = (0.25 + 0.55 * h3) * (h3 > 0.5 ? 1 : -1) * (1 + 0.6 * energy);

      for (var k = 0; k < ghostN; k++) {
        var a = (k / ghostN) * TAU;
        var ca = Math.cos(a), sa = Math.sin(a);
        pt((ux * ca + vx * sa) * ro, (uy * ca + vy * sa) * ro, (uz * ca + vz * sa) * ro, P);
        var gd = (P[2] / ro + 1) / 2;
        dots.push({
          x: P[0], y: P[1], z: P[2],
          r: ghostR * rs,
          white: 0.72 - 0.16 * gd,
          a: ghostA * (0.4 + 0.6 * gd)
        });
      }
      for (var m = 0; m < particles; m++) {
        var pa = t * speed + (m / particles) * TAU + h2 * 6;
        var pc = Math.cos(pa), ps = Math.sin(pa);
        pt((ux * pc + vx * ps) * ro, (uy * pc + vy * ps) * ro, (uz * pc + vz * ps) * ro, P);
        var pd = (P[2] / ro + 1) / 2;
        dots.push({
          x: P[0], y: P[1], z: P[2],
          r: (partR + partRDepth * pd) * rs,
          white: 0.3 - 0.22 * pd
        });
      }
    }
    return finalizeFrame(dots, o.rMin);
  }

  /* Wave — a waveform rolling through stacked rings.
     Nibble's "listening": the body moves with the words. */
  function frameWave(size, t, o) {
    var cx = size / 2, cy = size / 2;
    // 0.76 base x 1.15 — the undulation pulls the sphere inward, so wave
    // read ~15% smaller than the other lattice modes; scaled up to match
    var R = (size / 2) * 0.874;
    var pt = makeProj(t * 0.18, 0.38, cx, cy, 1);
    var rs = radiusScale(size, num(o, 'rsPow', 0.6));
    var rBase = num(o, 'rBase', 0.6), rDepth = num(o, 'rDepth', 1.7);
    var energy = num(o, 'energy', 0);
    var amp = 0.105 * (1 + 0.85 * energy);

    var dots = [];
    var rings = num(o, 'rings', 15);
    var lonDensity = num(o, 'lonDensity', 40);
    for (var ri = 0; ri <= rings; ri++) {
      var lat = -Math.PI / 2 + (ri / rings) * Math.PI;
      var cosLat = Math.cos(lat), sinLat = Math.sin(lat);
      // two waves, different tempi — organic, never quite repeating
      var w = 0.62 * Math.sin(t * 2.1 - ri * 0.52) + 0.38 * Math.sin(t * 1.27 + ri * 0.83);
      var rr = R * (0.88 + amp * w);
      var lonCount = Math.max(1, Math.round(Math.abs(cosLat) * lonDensity));
      var crest = Math.max(0, w);
      for (var lj = 0; lj < lonCount; lj++) {
        var lon = (lj / lonCount) * TAU;
        pt(cosLat * Math.cos(lon) * rr, sinLat * rr, cosLat * Math.sin(lon) * rr, P);
        var depth = (P[2] / R + 1) / 2;
        dots.push({
          x: P[0], y: P[1], z: P[2],
          r: (rBase + rDepth * depth) * (1 + (0.4 + 0.5 * energy) * crest) * rs,
          white: 0.66 - 0.56 * depth - 0.1 * crest
        });
      }
    }
    return finalizeFrame(dots, o.rMin);
  }

  /* Ribbon / Ring — parallel strands riding a great circle.
     `faceOn` cancels the camera tilt (ta = -camTilt) so the band reads as
     a true circle rather than the flat ellipse an untilted great circle
     collapses into, and moves the undulation onto the in-plane RADIUS so
     lobes genuinely swell outward instead of being re-normalised back
     onto the sphere. The lanes then stack along the view axis, which is
     what gives the ring its depth.
     Nibble's "breathing": at rest, but alive. */
  function frameRibbon(size, t, o) {
    var cx = size / 2, cy = size / 2;
    var R = (size / 2) * 0.78;
    var spin = num(o, 'spin', 1);
    var camTilt = 0.3;
    var pt = makeProj(t * 0.1 * spin, camTilt, cx, cy, 1);
    var rs = radiusScale(size, num(o, 'rsPow', 0.6));
    var faceOn = !!o.faceOn;
    var energy = num(o, 'energy', 0);

    var dots = [];
    var ghostN = num(o, 'ghostN', 150);
    for (var i = 0; i < ghostN; i++) {
      fibDir(i, ghostN, D3);
      pt(D3[0] * R, D3[1] * R, D3[2] * R, P);
      var gdep = (P[2] / R + 1) / 2;
      dots.push({ x: P[0], y: P[1], z: P[2], r: 0.8 * rs, white: 0.78, a: 0.1 + 0.22 * gdep });
    }

    var ya = t * 0.24 * spin;
    var ta = faceOn ? -camTilt : 0.55 + 0.3 * Math.sin(t * 0.18) * spin;
    var ux = Math.cos(ya), uy = 0, uz = Math.sin(ya);
    var vx = -uz * Math.sin(ta), vy = Math.cos(ta), vz = ux * Math.sin(ta);
    // plane normal n = u x v
    var nx = uy * vz - uz * vy;
    var ny = uz * vx - ux * vz;
    var nz = ux * vy - uy * vx;

    // Radial lobes swell past R, so pull the base radius in by most of the
    // wobble amplitude; the silhouette then stays inside the frame.
    var wobMul = num(o, 'wobMul', 1) * (1 + 1.1 * energy);
    var wobAmp = 0.23 * wobMul;
    var baseR = faceOn ? R / (1 + 0.85 * wobAmp) : R;

    var lanes = Math.max(1, Math.round(num(o, 'lanes', 5) * num(o, 'bandMul', 1)));
    var segs = num(o, 'segs', 88);
    var rBase = num(o, 'rBase', 1.1), rDepth = num(o, 'rDepth', 1.7);
    for (var w = 0; w < lanes; w++) {
      var laneOff = (w - (lanes - 1) / 2) * 0.075;
      var edge = Math.abs(w - (lanes - 1) / 2) / Math.max(1, (lanes - 1) / 2);
      for (var k = 0; k < segs; k++) {
        var a = (k / segs) * TAU;
        // two traveling waves along the band
        var wob = (0.16 * Math.sin(a * 3 - t * 1.7 + w * 0.22) +
                   0.07 * Math.sin(a * 5 + t * 1.1)) * wobMul;
        var radial = faceOn ? 1 + wob : 1;
        var off = faceOn ? laneOff : laneOff + wob;
        var ca = Math.cos(a), sa = Math.sin(a);
        var x = ux * ca + vx * sa + nx * off;
        var y = uy * ca + vy * sa + ny * off;
        var z = uz * ca + vz * sa + nz * off;
        var l = Math.sqrt(x * x + y * y + z * z);
        var rr = baseR * radial;
        pt((x / l) * rr, (y / l) * rr, (z / l) * rr, P);
        var depth = (P[2] / R + 1) / 2;
        dots.push({
          x: P[0], y: P[1], z: P[2],
          r: (rBase + rDepth * depth) * (1 - 0.25 * edge) * rs,
          white: 0.52 - 0.44 * depth + 0.18 * edge,
          a: 0.4 + 0.6 * depth
        });
      }
    }
    return finalizeFrame(dots, o.rMin);
  }

  var MODES = {
    globe: frameGlobe,
    rubik: frameRubik,
    orbits: frameOrbits,
    wave: frameWave,
    ring: frameRibbon,
    ribbon: frameRibbon
  };

  /* ---------------- profiles (upstream engine/profiles.ts) ---------- */

  var COUNT_PAIRS = [['latRings', 'lonDensity'], ['rings', 'lonDensity'], ['lanes', 'segs']];
  var COUNT_KEYS = ['orbitN', 'ghostN', 'nodeN', 'strandN', 'signals'];
  var RADIUS_KEYS = ['rBase', 'rDepth', 'rActive', 'rDot', 'ghostR', 'partR',
                     'partRDepth', 'nodeR', 'nodeRDepth'];

  function copy(o) {
    var out = {}, k;
    for (k in o) if (Object.prototype.hasOwnProperty.call(o, k)) out[k] = o[k];
    return out;
  }

  function merge(target, extra) {
    if (!extra) return target;
    for (var k in extra) if (Object.prototype.hasOwnProperty.call(extra, k)) target[k] = extra[k];
    return target;
  }

  function scaleCounts(opts, scale) {
    var out = copy(opts), done = {}, rt = Math.sqrt(scale), i, k;
    for (i = 0; i < COUNT_PAIRS.length; i++) {
      var a = COUNT_PAIRS[i][0], b = COUNT_PAIRS[i][1];
      if (out[a] != null && out[b] != null && !done[a] && !done[b]) {
        out[a] = Math.max(2, Math.round(out[a] * rt));
        out[b] = Math.max(2, Math.round(out[b] * rt));
        done[a] = true; done[b] = true;
      }
    }
    for (i = 0; i < COUNT_KEYS.length; i++) {
      k = COUNT_KEYS[i];
      // 0 means the mode opted out of that layer (ring has no ghost sphere);
      // scaling must not resurrect it as one stray dot
      if (out[k] != null && out[k] !== 0 && !done[k]) {
        out[k] = Math.max(1, Math.round(out[k] * scale));
      }
    }
    return out;
  }

  function scaleRadii(opts, scale) {
    var out = copy(opts);
    for (var i = 0; i < RADIUS_KEYS.length; i++) {
      var k = RADIUS_KEYS[i];
      if (out[k] != null) out[k] = out[k] * scale;
    }
    return out;
  }

  var BASE_PROFILES = {
    globe: { latRings: 17, lonDensity: 44, rBase: 0.6, rDepth: 1.7, rBoost: 1.0,
             inkFar: 0.62, inkSpan: 0.54, rsPow: 0.6, rMin: 0.3 },
    orbits: { orbitN: 12, ghostN: 40, ghostR: 0.9, ghostA: 0.5, particles: 3,
              partR: 1.2, partRDepth: 1.6, rsPow: 0.6, rMin: 0.3 },
    rubik: { latRings: 15, lonDensity: 40, moveCount: 14, rBase: 0.6, rDepth: 1.7,
             rActive: 0.3, inkFar: 0.62, inkSpan: 0.54, rsPow: 0.6, rMin: 0.3 },
    wave: { rings: 15, lonDensity: 40, rBase: 0.6, rDepth: 1.7, rsPow: 0.6, rMin: 0.3 },
    ribbon: { lanes: 5, segs: 88, ghostN: 150, rBase: 1.1, rDepth: 1.7, rsPow: 0.6, rMin: 0.3 },
    ring: { lanes: 5, segs: 88, ghostN: 0, faceOn: 1, rBase: 1.1, rDepth: 1.7,
            rsPow: 0.6, rMin: 0.3 }
  };

  /* The baked tuning session from upstream presets.ts. Only two sizes ship;
     the `count` multipliers REDUCE density and `size` enlarges what is left,
     which is what keeps a small orb from turning into visual noise. */
  var PRESETS = {
    orbits: {
      64: { speed: 1.885, count: 1, size: 1 },
      20: { speed: 3.9, count: 0.238, size: 2.4 }
    },
    globe: {
      64: { speed: 2.015, count: 0.42, size: 1.15, extra: { scanMul: 4.08, dimBase: 0.45 } },
      20: { speed: 2.665, count: 0.105, size: 1.75, extra: { scanMul: 4.335, dimBase: 0.45 } }
    },
    rubik: {
      64: { speed: 1.82, count: 0.35, size: 1.05 },
      20: { speed: 1.95, count: 0.088, size: 1.9 }
    },
    ribbon: {
      64: { speed: 2.34, count: 0.25, size: 0.85, extra: { spin: 0, bandMul: 3.9, wobMul: 1 } },
      20: { speed: 3.12, count: 0.051, size: 1.073, extra: { spin: 0, bandMul: 4.94, wobMul: 1 } }
    },
    wave: {
      64: { speed: 4.388, count: 0.341, size: 1 },
      20: { speed: 3.998, count: 0.105, size: 1.6 }
    },
    ring: {
      64: { speed: 3.24, count: 0.25, size: 0.956, extra: { spin: 0, bandMul: 3.627, wobMul: 0.368 } },
      20: { speed: 3.78, count: 0.028, size: 1.622, extra: { spin: 0, bandMul: 3.968, wobMul: 0.565 } }
    }
  };

  var presetCache = {};

  function resolvePreset(mode, size) {
    var bucket = size <= 34 ? 20 : 64;
    var key = mode + ':' + bucket;
    if (presetCache[key]) return presetCache[key];
    var p = PRESETS[mode][bucket];
    var opts = merge(scaleRadii(scaleCounts(BASE_PROFILES[mode], p.count), p.size), p.extra);
    presetCache[key] = { opts: opts, speed: p.speed, bucket: bucket };
    return presetCache[key];
  }

  /* ---------------- the colour ramp painter ------------------------ *
   * Upstream maps ink to grayscale: g = (1 - white) * 255 on dark.
   * We keep `white` as the depth carrier and run the SAME value through a
   * blackbody ramp, so near dots glow hot and far dots sink into shadow.
   * A cool rim is mixed in near the silhouette — the second light that
   * separates the body from the #080808 ground and sells the volume.
   * ---------------------------------------------------------------- */

  /* Each stop is luminance-matched to the gray upstream would have painted
     for the same ink (rel. luminance of the stop ~= its position x 255).
     Without that calibration the low end collapses — a red-only channel
     carries barely a third of the light of the equivalent gray, which is
     what makes ghost layers disappear and the whole orb read as cheap. */
  var THEMES = {
    ember: {
      ramp: [[0.00, 8, 3, 8], [0.22, 72, 10, 12], [0.45, 150, 16, 14],
             [0.66, 224, 26, 12], [0.84, 255, 92, 26], [0.94, 255, 158, 70],
             [1.00, 255, 232, 196]],
      rim: [120, 150, 215],
      rimMax: 0.24
    },
    ice: {
      ramp: [[0.00, 4, 8, 12], [0.22, 5, 44, 52], [0.45, 6, 92, 102],
             [0.66, 0, 170, 176], [0.84, 56, 214, 214], [0.94, 140, 236, 236],
             [1.00, 214, 250, 255]],
      rim: [170, 140, 255],
      rimMax: 0.22
    }
  };

  var LUM_STEPS = 96, RIM_STEPS = 6;

  function sampleRamp(ramp, u) {
    var last = ramp[ramp.length - 1];
    if (u <= 0) return [ramp[0][1], ramp[0][2], ramp[0][3]];
    if (u >= 1) return [last[1], last[2], last[3]];
    for (var i = 1; i < ramp.length; i++) {
      if (u <= ramp[i][0]) {
        var a = ramp[i - 1], b = ramp[i];
        var f = (u - a[0]) / (b[0] - a[0]);
        return [a[1] + (b[1] - a[1]) * f,
                a[2] + (b[2] - a[2]) * f,
                a[3] + (b[3] - a[3]) * f];
      }
    }
    return [last[1], last[2], last[3]];
  }

  function buildLut(theme) {
    var lut = new Array(LUM_STEPS * RIM_STEPS);
    for (var i = 0; i < LUM_STEPS; i++) {
      var c = sampleRamp(theme.ramp, i / (LUM_STEPS - 1));
      for (var j = 0; j < RIM_STEPS; j++) {
        var m = (j / (RIM_STEPS - 1)) * theme.rimMax;
        lut[i * RIM_STEPS + j] =
          Math.round(c[0] + (theme.rim[0] - c[0]) * m) + ',' +
          Math.round(c[1] + (theme.rim[1] - c[1]) * m) + ',' +
          Math.round(c[2] + (theme.rim[2] - c[2]) * m);
      }
    }
    return lut;
  }

  var lutCache = {};
  function lutFor(name) {
    if (!lutCache[name]) lutCache[name] = buildLut(THEMES[name] || THEMES.ember);
    return lutCache[name];
  }

  /* fillStyle strings get reused thousands of times a frame; cache them. */
  var styleCache = {};
  function styleFor(rgb, alphaStep) {
    var key = rgb + '|' + alphaStep;
    var hit = styleCache[key];
    if (hit) return hit;
    var v = alphaStep >= 20 ? 'rgb(' + rgb + ')' : 'rgba(' + rgb + ',' + (alphaStep / 20) + ')';
    styleCache[key] = v;
    return v;
  }

  function paintDots(ctx, dots, size, lut) {
    var half = size / 2;
    for (var i = 0; i < dots.length; i++) {
      var d = dots[i];
      var w = d.white < 0 ? 0 : (d.white > 1 ? 1 : d.white);
      var li = ((1 - w) * (LUM_STEPS - 1) + 0.5) | 0;
      var dx = d.x - half, dy = d.y - half;
      var rf = (Math.sqrt(dx * dx + dy * dy) / half - 0.58) / 0.40;
      rf = rf < 0 ? 0 : (rf > 1 ? 1 : rf);
      var rgb = lut[li * RIM_STEPS + ((rf * (RIM_STEPS - 1) + 0.5) | 0)];
      var a = d.a === undefined ? 1 : d.a;
      ctx.fillStyle = styleFor(rgb, a >= 1 ? 20 : Math.max(1, Math.round(a * 20)));
      ctx.beginPath();
      ctx.arc(d.x, d.y, d.r, 0, TAU);
      ctx.fill();
    }
  }

  /* Render one instant of `mode` into a 2D context sized `size` CSS px. */
  function render(ctx, mode, size, t, themeName, extra) {
    var pre = resolvePreset(mode, size);
    var opts = extra ? merge(copy(pre.opts), extra) : pre.opts;
    paintDots(ctx, MODES[mode](size, t, opts), size, lutFor(themeName));
  }

  /* ---------------- instances -------------------------------------- */

  var STATE_MODE = {
    idle: 'ribbon',     // breathing - at rest, but alive
    loading: 'globe',   // searching - request out, nothing back yet
    thinking: 'rubik',  // solving   - the sphere twists itself straight
    typing: 'wave'      // listening - the body moves with the words
  };

  var instances = [];
  var running = false;
  var lastNow = 0;
  var energy = 0;
  var reduced = false;
  try {
    reduced = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  } catch (e) {}

  function currentTheme() {
    return document.body && document.body.classList.contains('shiny') ? 'ice' : 'ember';
  }

  function Orb(host, size, state) {
    this.host = host;
    this.size = size;
    this.state = state || 'idle';
    this.mode = STATE_MODE[this.state] || 'ribbon';
    // detune each instance so two orbs on screen never lock into lockstep
    this.phase = hashD(instances.length + 1, 3.1) * 9;
    var c = document.createElement('canvas');
    c.className = 'nibble-orb';
    c.setAttribute('aria-hidden', 'true');
    c.style.width = size + 'px';
    c.style.height = size + 'px';
    c.style.display = 'block';
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = Math.round(size * dpr);
    c.height = Math.round(size * dpr);
    this.canvas = c;
    this.ctx = c.getContext('2d');
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    host.appendChild(c);
  }

  Orb.prototype.draw = function (t) {
    this.ctx.clearRect(0, 0, this.size, this.size);
    render(this.ctx, this.mode, this.size, t, currentTheme(),
           energy > 0.004 ? { energy: energy } : null);
  };

  Orb.prototype.advance = function (dt) {
    this.phase += dt * resolvePreset(this.mode, this.size).speed;
    this.draw(this.phase);
  };

  function tick(now) {
    if (!running) return;
    var dt = lastNow ? Math.min(0.1, (now - lastNow) / 1000) : 0;
    lastNow = now;
    energy *= Math.exp(-dt * 2.6);
    if (energy < 0.004) energy = 0;
    for (var i = instances.length - 1; i >= 0; i--) {
      var o = instances[i];
      // self-reap: transient hosts (the typing row) are removed by the chat UI
      if (!o.canvas.isConnected) { instances.splice(i, 1); continue; }
      o.advance(dt);
    }
    if (!instances.length) { running = false; lastNow = 0; return; }
    requestAnimationFrame(tick);
  }

  function start() {
    if (running || reduced || !instances.length) return;
    running = true;
    lastNow = 0;
    requestAnimationFrame(tick);
  }

  function hostsFor(target) {
    if (!target) return [];
    if (target.nodeType === 1) return [target];
    return Array.prototype.slice.call(document.querySelectorAll(target));
  }

  window.NibbleOrb = {
    /* Mount an orb inside `host`, or return the one already there. */
    attach: function (host, size, state) {
      if (!host) return null;
      for (var i = 0; i < instances.length; i++) {
        if (instances[i].host === host) return instances[i];
      }
      var orb = new Orb(host, size, state);
      instances.push(orb);
      // Paint one frame synchronously. rAF does not run in a backgrounded
      // tab, so without this the body is blank until the tab is focused —
      // and a still orb is a far better failure than an empty box.
      orb.draw(orb.phase);
      if (!reduced) start();
      return orb;
    },

    /* Swap the mode driving every orb under `target` (element or selector). */
    setState: function (target, state) {
      var mode = STATE_MODE[state];
      if (!mode) return;
      var hosts = hostsFor(target);
      for (var i = 0; i < instances.length; i++) {
        var o = instances[i];
        if (hosts.indexOf(o.host) === -1) continue;
        o.state = state;
        if (o.mode !== mode) {
          o.mode = mode;
          // repaint now for the same reason as attach: the new state must
          // be on screen even where rAF is suspended or motion is reduced
          o.draw(o.phase);
        }
      }
      if (!reduced) start();
    },

    /* One word spoken. Bumps the shared energy the modes read, so the body
       answers its own speech instead of looping indifferently. */
    pulse: function (amount) {
      energy = Math.min(1, energy + (amount === undefined ? 0.34 : amount));
      start();
    },

    /* --- introspection / offline rendering (filmstrip lab, tests) --- */
    render: render,
    frame: function (mode, size, t, extra) {
      var pre = resolvePreset(mode, size);
      return MODES[mode](size, t, extra ? merge(copy(pre.opts), extra) : pre.opts);
    },
    resolvePreset: resolvePreset,
    stateMode: STATE_MODE,
    themes: THEMES,

    /* Force every mounted orb to an absolute phase and repaint. The only
       way to observe motion where rAF is suspended. */
    step: function (t) {
      for (var i = 0; i < instances.length; i++) {
        var o = instances[i];
        o.phase = t * resolvePreset(o.mode, o.size).speed;
        o.draw(o.phase);
      }
      return instances.length;
    },
    setEnergy: function (v) { energy = v; },
    getEnergy: function () { return energy; },
    instances: instances
  };
})();
