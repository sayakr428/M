// "বাংলা / English" switch for the main site. The site is a compiled React export, so
// instead of separate Bengali pages, this swaps the page's text for prepared Bengali
// translations (sbc/i18n-bn.json) after React has rendered, and keeps them applied when
// React updates the page. The choice is remembered per visitor.
(function () {
  var STORE = "sbc-lang";
  var SKIP = /^(SCRIPT|STYLE|NOSCRIPT|SVG|TEXTAREA|CODE)$/;
  // Must match the grouping used when the translations were extracted.
  var BLOCK = /^(P|LI|H[1-6]|TD|TH|DT|DD|FIGCAPTION|BUTTON|A|LABEL|SUMMARY|BLOCKQUOTE|OPTION|DIV|SECTION|ARTICLE|HEADER|FOOTER|NAV|MAIN|FORM|UL|OL|TABLE|DL|ASIDE)$/;
  var ATTRS = ["placeholder", "aria-label", "alt"];

  var lang = "en";
  try { lang = localStorage.getItem(STORE) === "bn" ? "bn" : "en"; } catch (e) {}
  var dict = null, loading = null, observer = null, button = null;
  var original = new Map();   // text node -> English text
  var written = new Map();    // text node -> what we last wrote
  var attrOriginal = new Map(); // element -> {attr: English}
  var titleEn = document.title;

  function norm(s) { return s.replace(/\s+/g, " ").trim(); }
  function skipped(el) {
    for (var e = el; e; e = e.parentElement) {
      if (SKIP.test(e.tagName.toUpperCase()) || e.id === "sbc-voice" || e.id === "sbc-lang-btn" || (e.hasAttribute && e.hasAttribute("data-sbc-no-translate"))) return true;
    }
    return false;
  }
  function blockOf(el) { while (el && !BLOCK.test(el.tagName)) el = el.parentElement; return el; }
  function nodesOf(block) {
    var out = [], w = document.createTreeWalker(block, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) {
      var en = original.has(n) ? original.get(n) : n.nodeValue;
      if (!norm(en) || skipped(n.parentElement) || blockOf(n.parentElement) !== block) continue;
      out.push(n);
    }
    return out;
  }
  function write(n, bn) {
    if (!original.has(n)) original.set(n, n.nodeValue);
    var en = original.get(n);
    var v = bn === "" ? "" : en.match(/^\s*/)[0] + bn + en.match(/\s*$/)[0];
    written.set(n, v);
    if (n.nodeValue !== v) n.nodeValue = v;
  }
  function translateBlock(block) {
    var nodes = nodesOf(block);
    if (!nodes.length) return;
    var en = nodes.map(function (n) { return norm(original.has(n) ? original.get(n) : n.nodeValue); });
    var bn = dict.blocks[JSON.stringify(en)];
    nodes.forEach(function (n, i) {
      var t = bn ? bn[i] : dict.segs[en[i]];
      if (t !== undefined && t !== null) write(n, t);
    });
  }
  function translateAttrs(root) {
    var els = root.querySelectorAll ? root.querySelectorAll("[placeholder],[aria-label],img[alt]") : [];
    Array.prototype.forEach.call(els, function (el) {
      if (skipped(el)) return;
      ATTRS.forEach(function (a) {
        var cur = el.getAttribute(a);
        if (!cur) return;
        var saved = attrOriginal.get(el) || {};
        if (saved[a + ":bn"] === cur) return; // already ours
        var bn = dict.segs[norm(cur)] || (dict.blocks[JSON.stringify([norm(cur)])] || [])[0];
        if (bn) { saved[a] = cur; saved[a + ":bn"] = bn; attrOriginal.set(el, saved); el.setAttribute(a, bn); }
      });
    });
  }
  function translateAll(root) {
    var blocks = new Set(), w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), n;
    while ((n = w.nextNode())) if (norm(n.nodeValue) && !skipped(n.parentElement)) { var b = blockOf(n.parentElement); if (b) blocks.add(b); }
    blocks.forEach(translateBlock);
    translateAttrs(root.nodeType === 1 ? root : document.body);
    var t = dict.blocks[JSON.stringify([norm(titleEn)])];
    if (t && t[0]) document.title = t[0];
  }

  function watch() {
    if (observer) return;
    var pending = new Set(), scheduled = false;
    observer = new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === "characterData") {
          var n = m.target;
          if (written.get(n) === n.nodeValue) return; // our own change
          original.set(n, n.nodeValue);                // React wrote new English text
          var b = blockOf(n.parentElement); if (b) pending.add(b);
        } else if (m.type === "attributes") {
          pending.add(m.target);
        } else {
          m.addedNodes.forEach(function (a) {
            if (a.nodeType === 1) pending.add(a);
            else if (a.parentElement) pending.add(blockOf(a.parentElement) || a.parentElement);
          });
        }
      });
      if (!scheduled && pending.size) {
        scheduled = true;
        requestAnimationFrame(function () {
          scheduled = false;
          var list = Array.from(pending); pending.clear();
          list.forEach(function (el) { if (el.isConnected && !skipped(el)) translateAll(el); });
        });
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  function toBengali() {
    loading = loading || fetch("/sbc/i18n-bn.json").then(function (r) { return r.json(); });
    return loading.then(function (d) {
      dict = d;
      if (lang !== "bn") return;
      document.documentElement.lang = "bn";
      translateAll(document.body);
      watch();
    });
  }
  function toEnglish() {
    if (observer) { observer.disconnect(); observer = null; }
    original.forEach(function (en, n) { if (n.isConnected && n.nodeValue === written.get(n)) n.nodeValue = en; });
    original.clear(); written.clear();
    attrOriginal.forEach(function (saved, el) {
      ATTRS.forEach(function (a) { if (saved[a] !== undefined && el.getAttribute(a) === saved[a + ":bn"]) el.setAttribute(a, saved[a]); });
    });
    attrOriginal.clear();
    document.title = titleEn;
    document.documentElement.lang = "en";
  }

  function label() {
    if (!button) return;
    button.textContent = lang === "bn" ? "English" : "বাংলা";
    button.setAttribute("aria-label", lang === "bn" ? "Read this page in English" : "এই পাতাটি বাংলায় পড়ুন");
    button.setAttribute("lang", lang === "bn" ? "en" : "bn");
  }
  function toggle() {
    lang = lang === "bn" ? "en" : "bn";
    try { localStorage.setItem(STORE, lang); } catch (e) {}
    label();
    if (lang === "bn") toBengali(); else toEnglish();
  }

  function addButton() {
    if (document.getElementById("sbc-lang-btn")) return;
    // Bengali labels run longer than English: keep the header on one line on small screens.
    var css = document.createElement("style");
    css.textContent =
      "html[lang=bn] header nav a{white-space:nowrap}" +
      "@media(max-width:767px){html[lang=bn] header a[href^='/contact']{padding-left:12px!important;padding-right:12px!important;font-size:13px!important;gap:6px!important}" +
      "html[lang=bn] header a[href^='/contact'] svg{display:none}}";
    document.head.appendChild(css);
    button = document.createElement("button");
    button.type = "button";
    button.id = "sbc-lang-btn";
    button.style.cssText = "flex:none;height:36px;padding:0 14px;border-radius:999px;border:1px solid rgba(15,42,29,.35);background:rgba(255,255,255,.85);color:#0f2a1d;font:500 14px/1 'Noto Sans Bengali','Hind Siliguri',Roboto,system-ui,sans-serif;cursor:pointer;white-space:nowrap";
    button.addEventListener("click", toggle);
    label();
    var slot = document.querySelector("[data-sbc-lang-slot]");
    var menu = document.querySelector("header button[aria-label='Open menu']");
    var phone = window.matchMedia("(max-width: 767px)").matches;
    if (slot) slot.appendChild(button);
    else if (menu && menu.parentElement && !phone) menu.parentElement.insertBefore(button, menu);
    else {
      // Phones: the header is already full, so float above the Call / WhatsApp bar (mascot is on the right).
      button.style.cssText += ";position:fixed;left:12px;bottom:calc(84px + env(safe-area-inset-bottom));z-index:90;width:auto!important;padding:0 14px!important;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.18)";
      document.body.appendChild(button);
    }
  }

  // Wait until React has finished hydrating before touching the page.
  function start() {
    addButton();
    if (lang === "bn") toBengali();
  }
  function later() { (window.requestIdleCallback || setTimeout)(start, { timeout: 800 }); }
  if (document.readyState === "complete") later(); else window.addEventListener("load", later);
})();
