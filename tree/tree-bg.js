/* Shantiban City - scroll-grown tree background (home and About pages).
   Home: from the bottom of the #top banner to the bottom of #faq. About: from
   the top of the page content to its last section. Sits behind the page
   content. Uses tree-cutout.webp + tree-growth-map.png (R = growth time,
   G = moss mask, B = leaf mask) in a WebGL shader, blossoms on a 2D canvas. */
(function(){
  var ANCH = {"w": 1132, "h": 1684, "pts": [[1068, 285, 1.0], [523, 401, 1.0], [800, 977, 0.97], [848, 147, 0.963], [931, 1057, 0.961], [978, 1204, 0.944], [241, 851, 0.937], [285, 698, 0.907], [1067, 373, 0.905], [335, 763, 0.904], [434, 616, 0.868], [924, 1155, 0.843], [411, 673, 0.767], [382, 815, 0.746], [844, 1104, 0.69], [495, 628, 0.679], [453, 760, 0.58], [724, 999, 0.552], [764, 1214, 0.533], [746, 1278, 0.508], [687, 1279, 0.486], [671, 1364, 0.484], [592, 1336, 0.383]]};
  var BASE = '/tree/';
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function clamp(v, a, b){ a = a || 0; b = b === undefined ? 1 : b; return v < a ? a : v > b ? b : v; }
  function easeOut(t){ return 1 - Math.pow(1 - t, 3); }
  function easeBack(t){ var c1 = 1.4, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }
  function load(src){ return new Promise(function(res, rej){ var i = new Image(); i.onload = function(){ res(i); }; i.onerror = rej; i.src = src; }); }

  var VS = 'attribute vec2 aPos; uniform vec4 uRect; uniform vec2 uRes; varying vec2 vUv;' +
    'void main(){ vUv = aPos; vec2 px = uRect.xy + aPos * uRect.zw; vec2 c = px / uRes * 2.0 - 1.0; gl_Position = vec4(c.x, -c.y, 0.0, 1.0); }';
  var FS = [
    'precision mediump float; varying vec2 vUv; uniform sampler2D uTex, uData; uniform float uP, uGrow;',
    'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
    'float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);',
    '  return mix(mix(h(i), h(i+vec2(1.0,0.0)), f.x), mix(h(i+vec2(0.0,1.0)), h(i+vec2(1.0,1.0)), f.x), f.y); }',
    'void main(){',
    '  vec2 uv = vec2(vUv.x, 1.0 - vUv.y);',
    '  vec4 c = texture2D(uTex, uv); vec3 d = texture2D(uData, uv).rgb;',
    '  float t = d.r, moss = d.g, leaf = d.b;',
    '  float jit = (n(uv * vec2(34.0, 50.0)) - 0.5) * 0.05 + (n(uv * vec2(140.0, 200.0)) - 0.5) * 0.015;',
    '  float a = clamp((uGrow - (t + leaf * 0.10 + jit)) / 0.035, 0.0, 1.0);',
    '  if (uGrow <= 0.0) a = 0.0;',
    '  float rim = a * (1.0 - a) * 4.0;',
    '  float lum = dot(c.rgb, vec3(0.3, 0.59, 0.11));',
    '  vec3 bark = vec3(lum * 1.04, lum * 0.98, lum * 0.9);',
    '  float mt = 0.30 + t * 0.35 + (n(uv * vec2(60.0, 90.0)) - 0.5) * 0.12;',
    '  float mAmt = clamp((uP - mt) / 0.08, 0.0, 1.0);',
    '  vec3 col = mix(c.rgb, bark, moss * (1.0 - mAmt));',
    '  float lAmt = clamp((uP - (0.45 + t * 0.30 + jit)) / 0.06, 0.0, 1.0);',
    '  a *= mix(1.0, lAmt, leaf);',
    '  col += leaf * (1.0 - lAmt) * 0.25;',
    '  col = mix(col, vec3(1.0, 0.97, 0.88), rim * 0.35);',
    '  float al = c.a * a;',
    '  gl_FragColor = vec4(col * al, al);',
    '}'].join('\n');

  function makePetal(){
    var P = document.createElement('canvas'); P.width = 100; P.height = 124;
    var g = P.getContext('2d'); g.translate(50, 118);
    function path(){ g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-44, -22, -50, -82, -16, -104); g.quadraticCurveTo(0, -94, 16, -104); g.bezierCurveTo(50, -82, 44, -22, 0, 0); g.closePath(); }
    g.shadowColor = 'rgba(90,60,70,.28)'; g.shadowBlur = 5; g.shadowOffsetY = 2;
    var gr = g.createRadialGradient(0, -6, 2, 0, -40, 90);
    gr.addColorStop(0, '#E07F9C'); gr.addColorStop(0.3, '#F4BFCD'); gr.addColorStop(0.7, '#FCE6EC'); gr.addColorStop(1, '#FFFAFB');
    path(); g.fillStyle = gr; g.fill(); g.shadowColor = 'transparent';
    g.save(); path(); g.clip();
    g.strokeStyle = 'rgba(205,110,140,.22)'; g.lineWidth = 0.8;
    for (var k = -3; k <= 3; k++){ g.beginPath(); g.moveTo(0, -2); g.quadraticCurveTo(k * 7, -50, k * 11, -100); g.stroke(); }
    var sh = g.createLinearGradient(-45, 0, 45, 0); sh.addColorStop(0, 'rgba(120,70,90,.12)'); sh.addColorStop(.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(255,255,255,.25)');
    g.fillStyle = sh; g.fillRect(-50, -110, 100, 112); g.restore();
    path(); g.strokeStyle = 'rgba(225,150,172,.55)'; g.lineWidth = 0.9; g.stroke();
    return P;
  }

  function boot(route){
    if (!route || !route.range() || document.getElementById('sbc-tree')) return null;
    var dead = false, cleanup = [];
    function on(t, ev, fn, o){ t.addEventListener(ev, fn, o); cleanup.push(function(){ t.removeEventListener(ev, fn, o); }); }

    var wrap = document.createElement('div'); wrap.id = 'sbc-tree'; wrap.setAttribute('aria-hidden', 'true');
    var stick = document.createElement('div'); stick.className = 'sbc-tree-stick';
    var cv = document.createElement('canvas'), fx = document.createElement('canvas');
    stick.appendChild(cv); stick.appendChild(fx); wrap.appendChild(stick);
    document.body.appendChild(wrap);

    var c2 = fx.getContext('2d'), PET = makePetal();
    /* Blossoms only change when the scroll position does, so they are drawn
       into a cache canvas and blitted; the visible canvas then only redraws
       every frame for the drifting pollen and petals. */
    var bc = document.createElement('canvas'), bx = bc.getContext('2d'), imgs = null, mobile = false;
    var W = 0, H = 0, DPR = 1, rect = { x: 0, y: 0, w: 1, h: 1 }, gl = null, uni = {};
    var top0 = 0, span = 1, visible = true, cur = 0, last = -1, drawRect = rect, pollen = [], petals = [];

    var seed = 7; function rnd(){ seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    var blossoms = ANCH.pts.map(function(q){ return { x: q[0], y: q[1], rot: rnd() * 6.28, s: 0.8 + rnd() * 0.45, t: 0.70 + (1 - q[2]) * 0.14 + rnd() * 0.06, tone: rnd() }; });

    /* Readability: rather than fading the tree, any piece of copy the grown
       tree actually sits behind gets the class "sbc-on-tree", which the page
       CSS uses to lift the text (deeper ink + a soft white glow). Coverage is
       read from small CPU copies of the cutout alpha and the growth map, so
       it follows the tree as it grows and as you scroll. */
    var items = [], wrapA = 0, wrapB = 0, lastSy = -1, recollectT = 0, cov = null, lastGrow = -1;
    function opaqueBehind(el, stop){
      for (var e = el; e && e !== stop; e = e.parentElement){
        var bg = getComputedStyle(e).backgroundColor, m = bg.match(/rgba?\(([^)]+)\)/);
        if (m){ var v = m[1].split(','); if (v.length < 4 || parseFloat(v[3]) > 0.6) return true; }
        if (getComputedStyle(e).backgroundImage !== 'none') return true;
      }
      return false;
    }
    function collectText(){
      var sx = window.scrollX || 0, sy = window.scrollY || 0, rg = document.createRange(), byEl = new Map();
      var roots = document.querySelectorAll('main section:not(#top):not(#enquire), #top + div');
      for (var r = 0; r < roots.length; r++){
        var tw = document.createTreeWalker(roots[r], NodeFilter.SHOW_TEXT, null), n;
        while ((n = tw.nextNode())){
          if (!n.nodeValue.trim()) continue;
          var el = n.parentElement; if (!el) continue;
          /* moving marquee captions have their own glass band (CSS) */
          if (el.closest('[class*="animate-marquee"]')) continue;
          var it = byEl.get(el);
          if (it === undefined){ it = opaqueBehind(el, roots[r]) ? null : { el: el, rects: [], on: el.classList.contains('sbc-on-tree') }; byEl.set(el, it); }
          if (!it) continue;
          rg.selectNodeContents(n);
          var ls = rg.getClientRects();
          for (var k = 0; k < ls.length; k++){ var bb = ls[k]; if (bb.width >= 1 && bb.height >= 1) it.rects.push([bb.left + sx, bb.top + sy, bb.width, bb.height]); }
        }
      }
      var out = [];
      byEl.forEach(function(it){ if (it && it.rects.length) out.push(it); });
      items.forEach(function(o){ if (o.on && out.indexOf(o) < 0 && !byEl.get(o.el)) o.el.classList.remove('sbc-on-tree'); });
      items = out; lastSy = -1; lastGrow = -1;
    }
    function buildCoverage(img, dimg){
      var cw = Math.round(ANCH.w / 4), ch = Math.round(ANCH.h / 4);
      function px(im){ var c = document.createElement('canvas'); c.width = cw; c.height = ch; var g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0, cw, ch); return g.getImageData(0, 0, cw, ch).data; }
      try { cov = { w: cw, h: ch, a: px(img), d: px(dimg) }; } catch (e) { cov = null; }
    }
    function covered(x, y, R, grow){
      var u = (x - R.x) / R.w, v = (y - R.y) / R.h;
      if (u < 0 || u >= 1 || v < 0 || v >= 1) return false;
      var i = ((Math.floor((1 - v) * cov.h) * cov.w) + Math.floor(u * cov.w)) * 4;
      return cov.a[i + 3] > 90 && (cov.d[i] / 255 + (cov.d[i + 2] / 255) * 0.10) < grow;
    }
    function updateContrast(sy, grow){
      if (!cov) return;
      var stickTop = Math.min(Math.max(sy, wrapA), wrapB - H), R = drawRect;
      for (var i = 0; i < items.length; i++){
        var it = items[i], on = false;
        for (var k = 0; k < it.rects.length && !on; k++){
          var t = it.rects[k], y0 = t[1] - stickTop;
          if (y0 + t[3] < 0 || y0 > H) continue;
          for (var sxi = 0; sxi < 6 && !on; sxi++) for (var syi = 0; syi < 2 && !on; syi++)
            on = covered(t[0] + t[2] * (sxi + 0.5) / 6, y0 + t[3] * (syi + 0.5) / 2, R, grow);
        }
        if (on !== it.on){ it.on = on; it.el.classList.toggle('sbc-on-tree', on); }
      }
    }
    function measure(){
      var g = route.range(); if (!g) return;
      var a = g[0], b = g[1];
      wrap.style.top = a + 'px'; wrap.style.height = Math.max(0, b - a) + 'px';
      top0 = a - window.innerHeight; span = Math.max(1, b - a); wrapA = a; wrapB = b;
      collectText();
    }

    function layout(){
      W = stick.clientWidth; H = stick.clientHeight || window.innerHeight;
      mobile = W < 768;
      /* Phones get a lighter canvas: 1.5x pixel density is plenty behind content. */
      DPR = Math.min(mobile ? 1.5 : 2, window.devicePixelRatio || 1);
      [cv, fx, bc].forEach(function(c){ c.width = Math.round(W * DPR); c.height = Math.round(H * DPR); });
      var ar = ANCH.w / ANCH.h;
      /* The photo is flipped vertically so the trunk base hangs from the
         banner's bottom edge at the left and the tree grows down and right. */
      var h = H * (mobile ? 0.95 : 1.25), w = h * ar;
      if (!mobile && w > W * 0.62){ w = W * 0.62; h = w / ar; }
      rect = { x: -w * (mobile ? 0.12 : 0.04), y: -h * 0.015, w: w, h: h };
      var n = reduce ? 0 : mobile ? 18 : 40;
      pollen = []; for (var i = 0; i < n; i++) pollen.push({ x: Math.random() * W, y: Math.random() * H, r: 0.8 + Math.random() * 2, v: 0.12 + Math.random() * 0.3, ph: Math.random() * 6.28, a: 0.25 + Math.random() * 0.4 });
      last = -1;
    }

    function initGL(img, dimg){
      gl = cv.getContext('webgl', { premultipliedAlpha: true, alpha: true, antialias: false });
      if (!gl) return false;
      function sh(type, src){ var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; }
      var prog = gl.createProgram(); gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS)); gl.linkProgram(prog); gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0,0, 1,0, 0,1, 0,1, 1,0, 1,1]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, 'aPos'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      function tex(unit, im, raw){
        gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
        gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, raw ? gl.NONE : gl.BROWSER_DEFAULT_WEBGL);
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, im);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      }
      tex(0, img, false); tex(1, dimg, true);
      ['uTex', 'uData', 'uP', 'uGrow', 'uRect', 'uRes'].forEach(function(k){ uni[k] = gl.getUniformLocation(prog, k); });
      gl.uniform1i(uni.uTex, 0); gl.uniform1i(uni.uData, 1);
      gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      return true;
    }

    function renderTree(p){
      var sc = 0.96 + 0.04 * clamp(p / 0.9);
      var r = { x: rect.x, y: rect.y, w: rect.w * sc, h: rect.h * sc };
      if (gl){
        gl.viewport(0, 0, cv.width, cv.height); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform4f(uni.uRect, r.x, r.y, r.w, r.h); gl.uniform2f(uni.uRes, W, H);
        gl.uniform1f(uni.uP, p); gl.uniform1f(uni.uGrow, clamp((p - 0.04) / 0.58) * 1.03);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      }
      return r;
    }

    function drawPetal(L){ bx.drawImage(PET, -50 * L / 104, -118 * L / 104, 100 * L / 104, 124 * L / 104); }
    function drawBlossom(b, p, S, R){
      var q = clamp((p - b.t) / 0.1); if (q <= 0) return;
      var X = R.x + b.x / ANCH.w * R.w, Y = R.y + (1 - b.y / ANCH.h) * R.h, sz = S * b.s, k, L;
      if (q < 0.3){
        L = sz * 0.55 * easeOut(q / 0.3);
        [-1, 1].forEach(function(side){ bx.setTransform(DPR, 0, 0, DPR, X * DPR, Y * DPR); bx.rotate(b.rot + side * 0.18); bx.scale(0.55, 1); drawPetal(L); });
        return;
      }
      var o = easeBack(clamp((q - 0.3) / 0.7)), oc = clamp(o, 0, 1);
      L = sz * (0.55 + 0.45 * o);
      bx.globalAlpha = b.tone > 0.6 ? 0.92 : 1;
      for (k = 0; k < 5; k++){ bx.setTransform(DPR, 0, 0, DPR, X * DPR, Y * DPR); bx.rotate(b.rot + k * 1.2566 * clamp(o, 0, 1.05)); bx.scale(0.55 + 0.45 * oc, 1); drawPetal(L); }
      bx.globalAlpha = 1; bx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var cg = bx.createRadialGradient(X, Y, 0, X, Y, L * 0.22); cg.addColorStop(0, '#B8475F'); cg.addColorStop(1, 'rgba(224,127,156,0)');
      bx.fillStyle = cg; bx.beginPath(); bx.arc(X, Y, L * 0.22, 0, 6.283); bx.fill();
      bx.lineWidth = Math.max(0.6, L * 0.012);
      for (k = 0; k < 12; k++){
        var a = b.rot + k * 0.5236, rr = L * (0.2 + (k % 3) * 0.05) * oc, ex = X + Math.cos(a) * rr, ey = Y + Math.sin(a) * rr;
        bx.strokeStyle = 'rgba(214,150,160,.9)'; bx.beginPath(); bx.moveTo(X, Y); bx.lineTo(ex, ey); bx.stroke();
        bx.fillStyle = '#E9B949'; bx.beginPath(); bx.arc(ex, ey, Math.max(0.8, L * 0.022), 0, 6.283); bx.fill();
      }
    }

    function frame(now){
      if (dead) return;
      requestAnimationFrame(frame);
      if (!visible) return;
      var sy = window.scrollY || window.pageYOffset;
      var target = clamp((sy - top0) / span);
      cur += reduce ? (target - cur) : (target - cur) * 0.085;
      var p = 0.14 + 0.86 * cur;
      var changed = Math.abs(p - last) > 0.0003, S = drawRect.w * 0.034;
      if (changed){
        drawRect = renderTree(p); last = p; S = drawRect.w * 0.034;
        bx.setTransform(1, 0, 0, 1, 0, 0); bx.clearRect(0, 0, bc.width, bc.height);
        for (var i = 0; i < blossoms.length; i++) drawBlossom(blossoms[i], p, S, drawRect);
      }
      var moved = sy !== lastSy; lastSy = sy;
      var grow = clamp((p - 0.04) / 0.58) * 1.03;
      if (moved || Math.abs(grow - lastGrow) > 0.004){ lastGrow = grow; updateContrast(sy, grow); }
      if (!changed && !moved && (reduce || (!pollen.length && !petals.length))) return;
      c2.setTransform(1, 0, 0, 1, 0, 0); c2.clearRect(0, 0, fx.width, fx.height); c2.drawImage(bc, 0, 0);
      c2.setTransform(DPR, 0, 0, DPR, 0, 0);
      if (reduce) return;
      pollen.forEach(function(d){
        d.y -= d.v; d.x += Math.sin(now * 0.0006 + d.ph) * 0.25;
        if (d.y < -10){ d.y = H + 10; d.x = Math.random() * W; }
        c2.globalAlpha = d.a; c2.fillStyle = '#E3C77A'; c2.beginPath(); c2.arc(d.x, d.y, d.r, 0, 6.283); c2.fill();
      });
      c2.globalAlpha = 1;
      if (p > 0.86 && petals.length < (mobile ? 18 : 50) && Math.random() < (p - 0.86) * 2.5){
        var b = blossoms[(Math.random() * blossoms.length) | 0];
        if (p > b.t + 0.1) petals.push({ x: drawRect.x + b.x / ANCH.w * drawRect.w, y: drawRect.y + (1 - b.y / ANCH.h) * drawRect.h, vx: (Math.random() - 0.5) * 0.6, vy: 0.5 + Math.random() * 0.6, rot: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.05, s: S * (0.35 + Math.random() * 0.2), ph: Math.random() * 6.28 });
      }
      if (p < 0.82) petals.length = 0;
      petals = petals.filter(function(q){ return q.y < H + 40; });
      petals.forEach(function(q){
        q.y += q.vy; q.x += q.vx + Math.sin(now * 0.002 + q.ph) * 0.8; q.rot += q.vr;
        c2.setTransform(DPR, 0, 0, DPR, q.x * DPR, q.y * DPR); c2.rotate(q.rot); c2.scale(0.8, Math.abs(Math.cos(now * 0.003 + q.ph)) * 0.6 + 0.4);
        c2.drawImage(PET, -50 * q.s / 104, -62 * q.s / 104, 100 * q.s / 104, 124 * q.s / 104);
      });
    }

    if ('IntersectionObserver' in window){ var io = new IntersectionObserver(function(e){ visible = e[0].isIntersecting; }); io.observe(wrap); cleanup.push(function(){ io.disconnect(); }); }
    var lw = 0, lh = 0;
    function onResize(){ measure(); if (window.innerWidth !== lw || Math.abs(window.innerHeight - lh) > 140){ lw = window.innerWidth; lh = window.innerHeight; layout(); } }
    on(window, 'resize', onResize);
    /* Content fades/slides in and accordions open as you scroll: refresh the
       cached text positions shortly after scrolling settles. */
    on(window, 'scroll', function(){ clearTimeout(recollectT); recollectT = setTimeout(function(){ if (!dead) collectText(); }, 180); }, { passive: true });
    on(document, 'click', function(){ setTimeout(function(){ if (!dead) collectText(); }, 450); }, true);
    if ('ResizeObserver' in window){ var ro = new ResizeObserver(function(){ if (!dead) measure(); }); ro.observe(document.documentElement); cleanup.push(function(){ ro.disconnect(); }); }
    /* React can re-render the page after load (e.g. hydration recovery) and
       drop nodes it doesn't own; put the layer back if that happens. */
    var mo = new MutationObserver(function(){ if (!dead && !wrap.isConnected && route.range()){ document.body.appendChild(wrap); measure(); } });
    mo.observe(document.documentElement, { childList: true, subtree: true }); cleanup.push(function(){ mo.disconnect(); });

    Promise.all([load(BASE + 'tree-cutout.webp'), load(BASE + 'tree-growth-map.png')]).then(function(im){
      imgs = im;
      buildCoverage(im[0], im[1]);
      var ok = false; try { ok = initGL(im[0], im[1]); } catch (e) { ok = false; }
      /* Phones can drop the WebGL context (app switch, memory pressure). */
      cv.addEventListener('webglcontextlost', function(e){ e.preventDefault(); gl = null; });
      cv.addEventListener('webglcontextrestored', function(){ try { initGL(imgs[0], imgs[1]); } catch (e) {} last = -1; });
      onResize();
      if (!ok){ var f = document.createElement('img'); f.src = BASE + 'tree-cutout.webp'; f.alt = ''; f.className = 'sbc-tree-fallback'; Object.assign(f.style, { left: rect.x + 'px', top: rect.y + 'px', width: rect.w + 'px', transform: 'scaleY(-1)' }); stick.appendChild(f); }
      if (!dead) requestAnimationFrame(frame);
    }).catch(function(){ wrap.remove(); });

    return function destroy(){
      dead = true; clearTimeout(recollectT);
      cleanup.forEach(function(f){ try { f(); } catch (e) {} });
      items.forEach(function(it){ it.el.classList.remove('sbc-on-tree'); });
      document.querySelectorAll('.sbc-on-tree').forEach(function(el){ el.classList.remove('sbc-on-tree'); });
      if (gl){ var lc = gl.getExtension('WEBGL_lose_context'); if (lc) lc.loseContext(); gl = null; }
      wrap.remove();
    };
  }

  /* The site is a Next.js app: clicking a link swaps the page in place
     without a full reload, so this script can't rely on page load alone.
     It watches for route changes and runs the tree on the pages that have
     it (home and About), and removes it on every other page. */
  function pageY(el, edge){ var r = el.getBoundingClientRect(); return (edge === 'top' ? r.top : r.bottom) + (window.scrollY || window.pageYOffset); }
  var ROUTES = {
    /* home: from under the top banner to the end of the FAQ */
    home: { match: function(){ return !!(document.getElementById('top') && document.getElementById('overview') && document.getElementById('faq')); },
      range: function(){ var t = document.getElementById('top'), f = document.getElementById('faq');
      return (t && f && document.getElementById('overview')) ? [pageY(t, 'bottom'), pageY(f, 'bottom')] : null; } },
    /* About: from the top of the page content to the end of its last section */
    about: { match: function(){ return /^\/about\/?$/.test(location.pathname) && !!document.querySelector('main > section'); },
      range: function(){ if (!/^\/about\/?$/.test(location.pathname)) return null;
      var m = document.querySelector('main'); if (!m) return null;
      var secs = m.querySelectorAll(':scope > section'); if (!secs.length) return null;
      return [pageY(m, 'top'), pageY(secs[secs.length - 1], 'bottom')]; } }
  };
  function currentRoute(){ if (ROUTES.home.match()) return 'home'; if (ROUTES.about.match()) return 'about'; return null; }
  var destroy = null, active = null, pending = 0;
  function check(){
    pending = 0;
    var r = currentRoute();
    if (r && (r !== active || !document.getElementById('sbc-tree'))){
      if (destroy) destroy();
      destroy = boot(ROUTES[r]); active = destroy ? r : null;
    } else if (!r && destroy){ destroy(); destroy = null; active = null; }
    else if (!r){ var stray = document.getElementById('sbc-tree'); if (stray) stray.remove(); }
  }
  function schedule(delay){ clearTimeout(pending); pending = setTimeout(check, delay || 120); }
  ['pushState', 'replaceState'].forEach(function(k){
    var orig = history[k];
    history[k] = function(){ var r = orig.apply(this, arguments); schedule(); return r; };
  });
  window.addEventListener('popstate', function(){ schedule(); });
  function go(){
    check();
    new MutationObserver(function(){ if (currentRoute() !== active) schedule(); })
      .observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === 'complete') setTimeout(go, 200); else window.addEventListener('load', function(){ setTimeout(go, 200); });
})();
