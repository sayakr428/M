/* Shantiban City - full-screen hamburger menu.
   The header's own menu button is shown at every width (see enhance.css) and
   its clicks are taken over here, so the app's built-in mobile menu never
   opens. The menu lists every link from the header's Primary and Secondary
   navs; picking one clicks the original header link, so in-app navigation and
   smooth scrolling still behave as they do from the header. */
(function () {
  if (window.__sbcNavMenu) return;
  window.__sbcNavMenu = true;

  var BTN = 'header button[aria-expanded]';
  var root = document.documentElement;
  var menu, list, closeTimer;

  // Photos for the menu's image panel; each open shows the next one.
  // menu-feature.jpg stands in for overview-1 until a generated image replaces it.
  var PHOTOS = [
    ['/images/menu-feature.jpg', 'Baruipur'],
    ['/images/amenity-club-house.jpg', 'The Clubhouse'],
    ['/images/overview-2.jpg', 'Shantiban City'],
    ['/images/amenity-fishing-deck.jpg', 'The Fishing Deck'],
    ['/images/overview-3.jpg', 'Shantiban City'],
    ['/images/amenity-club-house-fountain.jpg', 'Clubhouse Fountain'],
    ['/images/amenity-bbq-deck.jpg', 'The BBQ Deck']
  ];
  var photoIndex = -1;
  try {
    var saved = sessionStorage.getItem('sbc-menu-photo');
    if (saved !== null && !isNaN(+saved)) photoIndex = +saved;
  } catch (e) {}

  function headerLinks() {
    return Array.prototype.slice.call(
      document.querySelectorAll('header nav[aria-label="Primary"] a, header nav[aria-label="Secondary"] a')
    );
  }

  function build() {
    menu = document.createElement('div');
    menu.id = 'sbc-menu';
    menu.setAttribute('role', 'dialog');
    menu.setAttribute('aria-modal', 'true');
    menu.setAttribute('aria-label', 'Site menu');
    menu.setAttribute('aria-hidden', 'true');
    menu.innerHTML =
      '<div class="sbc-menu-inner">' +
        '<div class="sbc-menu-main">' +
          '<p class="sbc-menu-eyebrow"><span></span>Menu</p>' +
          '<ol class="sbc-menu-links"></ol>' +
        '</div>' +
        '<figure class="sbc-menu-media" aria-hidden="true">' +
          '<img alt="" decoding="async">' +
          '<figcaption>22.4410&deg; N / 88.4330&deg; E &middot; <span></span></figcaption>' +
        '</figure>' +
        '<div class="sbc-menu-foot">' +
          '<a class="sbc-menu-cta" href="/contact/" data-sbc-cta>Book a Site Visit' +
            '<svg width="16" height="16" fill="currentColor" viewBox="0 0 256 256" aria-hidden="true"><path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z"></path></svg>' +
          '</a>' +
          '<a class="sbc-menu-tel" href="tel:+919830050189">+91 98300 50189</a>' +
        '</div>' +
      '</div>';
    list = menu.querySelector('.sbc-menu-links');
    document.body.appendChild(menu);

    menu.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (!a || a.classList.contains('sbc-menu-tel')) return;
      var orig = a.hasAttribute('data-sbc-cta')
        ? document.querySelector('header a[href^="/contact"]')
        : headerLinks()[+a.getAttribute('data-sbc-i')];
      if (!orig) return;
      e.preventDefault();
      close();
      // Let the menu start closing before the page scrolls or changes.
      setTimeout(function () { orig.click(); }, 260);
    });
  }

  function fill() {
    var here = location.pathname.replace(/\/+$/, '') || '/';
    list.innerHTML = '';
    headerLinks().forEach(function (src, i) {
      var path = (src.getAttribute('href') || '').split('#')[0].replace(/\/+$/, '');
      var li = document.createElement('li');
      li.style.setProperty('--i', i);
      li.innerHTML =
        '<a href="' + src.getAttribute('href') + '" data-sbc-i="' + i + '">' +
          '<span class="sbc-menu-num">' + String(i + 1).padStart(2, '0') + '</span>' +
          '<span class="sbc-menu-label"></span>' +
        '</a>';
      li.querySelector('.sbc-menu-label').textContent = src.textContent.trim();
      if (path && path === here) li.firstChild.setAttribute('aria-current', 'page');
      list.appendChild(li);
    });
    menu.style.setProperty('--n', list.children.length);
  }

  function nextPhoto() {
    photoIndex = (photoIndex + 1) % PHOTOS.length;
    try { sessionStorage.setItem('sbc-menu-photo', photoIndex); } catch (e) {}
    var photo = PHOTOS[photoIndex];
    menu.querySelector('.sbc-menu-media img').src = photo[0];
    menu.querySelector('.sbc-menu-media figcaption span').textContent = photo[1];
    // Warm the cache so the next open reveals a loaded image.
    new Image().src = PHOTOS[(photoIndex + 1) % PHOTOS.length][0];
  }

  function setButtons(open) {
    document.querySelectorAll(BTN).forEach(function (b) {
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
  }

  function open(btn) {
    if (!menu) build();
    clearTimeout(closeTimer);
    fill();
    nextPhoto();
    var r = btn.getBoundingClientRect();
    menu.style.setProperty('--x', r.left + r.width / 2 + 'px');
    menu.style.setProperty('--y', r.top + r.height / 2 + 'px');
    menu.setAttribute('aria-hidden', 'false');
    menu.classList.add('is-mounted');
    menu.offsetWidth; // commit the closed state so the reveal transitions
    root.classList.add('sbc-menu-open');
    setButtons(true);
    var first = list.querySelector('a');
    if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, 450);
  }

  function close() {
    if (!menu || !root.classList.contains('sbc-menu-open')) return;
    root.classList.remove('sbc-menu-open');
    menu.setAttribute('aria-hidden', 'true');
    setButtons(false);
    closeTimer = setTimeout(function () { menu.classList.remove('is-mounted'); }, 900);
  }

  // Capture on window so this runs before React's handler on the document.
  window.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest(BTN);
    if (!btn) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    if (root.classList.contains('sbc-menu-open')) close(); else open(btn);
  }, true);

  window.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && root.classList.contains('sbc-menu-open')) {
      close();
      var b = document.querySelector(BTN);
      if (b) b.focus();
    }
  });
})();
