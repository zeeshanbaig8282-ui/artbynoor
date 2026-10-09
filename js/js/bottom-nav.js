/* ══════════════════════════════════════════════════════════════
   Artt by Noor — Instagram-style floating bottom tab bar
   Shows ONLY when the site is launched as an installed app (PWA).
   In a normal mobile browser, nothing changes.
   ══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 1. Are we running as an installed app? ───────────────── */
  function isStandalone() {
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches ||
      navigator.standalone === true ||               // iOS Safari
      document.referrer.startsWith('android-app://') // Android TWA
    );
  }

  if (!isStandalone()) return;   // browser → leave the site exactly as-is

  document.documentElement.classList.add('app-mode');

  /* ── 2. Tabs ──────────────────────────────────────────────── */
  var TABS = [
    { label: 'Home',     href: 'index.html',   match: ['index.html', ''] },
    { label: 'Gallery',  href: 'gallery.html', match: ['gallery.html', 'gallery-crochet.html', 'gallery-painting.html', 'gallery-crafts.html', 'gallery-mehndi.html', 'gallery-jewelry.html', 'gallery-charms.html'] },
    { label: 'Book',     href: 'booking.html', match: ['booking.html'] },
    { label: 'Reviews',  href: 'reviews.html', match: ['reviews.html'] },
    { label: 'Follow',   href: 'https://www.instagram.com/artt_by_noor?igsh=MWttc3hiaWtvczgzbg==', external: true, match: [] }
  ];

  /* Icons: 24x24, stroke-based so they inherit colour and can "fill" when active */
  var ICONS = {
    Home:    '<path d="M3 10.2 12 3l9 7.2V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    Gallery: '<rect x="3" y="4" width="18" height="16" rx="2.5"/><circle cx="8.5" cy="9.5" r="1.6"/><path d="m3.5 17.5 4.7-4.7a1.6 1.6 0 0 1 2.2 0l3.4 3.4a1.6 1.6 0 0 0 2.2 0l1.6-1.6a1.6 1.6 0 0 1 2.2 0l2.7 2.7"/>',
    Book:    '<rect x="3" y="5" width="18" height="16" rx="2.5"/><path d="M3 10h18M8 3v4M16 3v4"/><circle cx="12" cy="15.5" r="1.4"/>',
    Reviews: '<path d="m12 3.6 2.6 5.3 5.9.85-4.25 4.15 1 5.85L12 16.99 6.75 19.75l1-5.85L3.5 9.75l5.9-.85z"/>',
    Follow:  '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none"/>'
  };

  /* ── 3. Which tab is active? ──────────────────────────────── */
  var here = window.location.pathname.split('/').pop().toLowerCase();
  if (here === '') here = 'index.html';

  /* ── 4. Build the bar ─────────────────────────────────────── */
  function build() {
    var bar = document.createElement('div');
bar.setAttribute('role', 'navigation');
    bar.className = 'app-tabbar';
    bar.setAttribute('aria-label', 'App navigation');

    TABS.forEach(function (tab) {
      var a = document.createElement('a');
      a.className = 'app-tab';
      a.href = tab.href;
      a.setAttribute('aria-label', tab.label);

      if (tab.external) {
        a.target = '_blank';
        a.rel = 'noopener';
      }
      if (tab.match.indexOf(here) !== -1) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }

      a.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">' +
        ICONS[tab.label] + '</svg>';

      bar.appendChild(a);
    });

    document.body.appendChild(bar);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }
})();
