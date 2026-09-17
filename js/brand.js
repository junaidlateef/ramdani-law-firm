(function () {
  'use strict';
  var site = window.ramdaniSite;
  var escape = function (value) { var el = document.createElement('span'); el.textContent = value; return el.innerHTML; };
  var path = location.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
  function links(items) { return items.map(function (item) {
    var active = (item[0].replace(/\.html$/, '').replace(/\/$/, '') || '/') === path;
    return '<a href="' + item[0] + '" data-i18n="' + item[1] + '"' + (active ? ' aria-current="page"' : '') + '>' + item[2] + '</a>';
  }).join(''); }
  var brand = '<a class="brand" href="/" aria-label="Ramdani Law Firm — Home"><img src="' + site.logo + '" width="56" height="56" alt="" /><span>' + site.name + '</span></a>';
  var header = document.querySelector('.site-header');
  if (header) header.innerHTML = '<div class="wrap header-inner">' + brand + '<div class="header-controls"><a class="btn btn-primary header-cta" href="/pages/consultation.html" data-i18n="nav_consult">Consultation</a><div class="lang-switch" aria-label="Language"><button type="button" data-lang-btn="en" lang="en">EN</button><button type="button" data-lang-btn="ur" lang="ur">اردو</button></div><button type="button" class="theme-btn" id="themeBtn" aria-label="Toggle dark theme" aria-pressed="false">◐</button><button type="button" class="menu-toggle" aria-controls="primaryNav" aria-expanded="false">Menu</button></div><nav id="primaryNav" class="nav" aria-label="Primary">' + links(site.primaryNavigation || site.navigation) + '</nav></div>';
  var footer = document.querySelector('.site-footer');
  if (footer) footer.innerHTML = '<div class="wrap footer-grid"><div>' + brand + '<p class="footer-tagline" lang="en" dir="ltr">' + site.tagline + '</p><p>' + site.location + '</p><div class="social-slots" aria-label="Social profiles"></div></div><div><h2 class="footer-heading">Quick links</h2><nav class="footer-links" aria-label="Footer">' + links(site.navigation.slice(1)) + '</nav></div><div><h2 class="footer-heading" data-i18n="nav_consult">Consultation</h2><a class="btn footer-cta" href="/pages/consultation.html" data-i18n="cta_consult">Request a Consultation</a><p class="privacy-note" data-i18n="footer_note">Public website only. Private client and case files are not stored on these pages.</p></div></div><div class="wrap footer-bottom"><small>© ' + new Date().getFullYear() + ' ' + site.name + '. All rights reserved.</small><nav aria-label="Legal and staff"><a href="/pages/privacy.html">Privacy Policy (draft)</a><a href="/pages/legal.html">Terms / Legal Notice (draft)</a><a href="/admin/" data-i18n="nav_admin">Staff</a></nav></div>';
  var labels = { instagram: 'Instagram', facebook: 'Facebook', linkedin: 'LinkedIn', tiktok: 'TikTok', x: 'X' };
  document.querySelectorAll('.social-slots').forEach(function (container) {
    container.replaceChildren();
    Object.keys(site.socialLinks).forEach(function (key) {
      var value = site.socialLinks[key]; if (!value) return;
      try { var url = new URL(value); if (url.protocol !== 'https:') return; } catch (_) { return; }
      var a = document.createElement('a'); a.href = url.href; a.rel = 'noopener noreferrer';
      a.innerHTML = '<span class="social-icon" aria-hidden="true">' + escape(key === 'linkedin' ? 'in' : labels[key].charAt(0)) + '</span>' + escape(labels[key]);
      container.appendChild(a);
    });
    container.hidden = !container.children.length;
  });
  var menu = document.querySelector('.menu-toggle');
  var nav = document.getElementById('primaryNav');
  function closeMenu() { if (!menu) return; menu.setAttribute('aria-expanded', 'false'); nav.classList.remove('is-open'); }
  if (menu) {
    menu.addEventListener('click', function () { var open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); } });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) closeMenu(); });
    document.addEventListener('click', function (e) { if (!header.contains(e.target)) closeMenu(); });
    matchMedia('(min-width: 1200px)').addEventListener('change', closeMenu);
  }
  document.querySelectorAll('.form-status').forEach(function (el) { el.setAttribute('role', 'status'); el.setAttribute('aria-live', 'polite'); });
  var theme = document.getElementById('themeBtn');
  function syncTheme() { if (theme) theme.setAttribute('aria-pressed', String(document.documentElement.getAttribute('data-theme') === 'dark')); }
  new MutationObserver(syncTheme).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); syncTheme();
})();
