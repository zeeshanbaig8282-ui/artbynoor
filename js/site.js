// Shared across all pages: toast notifications + entrance animation

/* ══════════════════════════════════
   PWA INSTALL PROMPT (nav "Get the app" button)
══════════════════════════════════ */
let deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredInstallPrompt = e;
});

window.addEventListener('appinstalled', () => {
  deferredInstallPrompt = null;
  showNotify('✓ App installed! Welcome to Artt by Noor 🌸');
});

function installApp() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then((choice) => {
      deferredInstallPrompt = null;
      if (choice.outcome !== 'accepted') {
        showNotify('Install cancelled — you can try again anytime ✨');
      }
    });
  } else {
    // Browser doesn't support the prompt (e.g. iOS Safari) or app is already installed
    const isIos = /iphone|ipad|ipod/i.test(window.navigator.userAgent);
    if (isIos) {
      showNotify('On iPhone/iPad: tap Share → "Add to Home Screen" 🌸');
    } else {
      showNotify('App is already installed, or your browser doesn\'t support install yet ✨');
    }
  }
  return false;
}

function showNotify(message, isError) {
  let notify = document.getElementById('notify');
  if (!notify) {
    notify = document.createElement('div');
    notify.id = 'notify';
    notify.className = 'notify';
    document.body.appendChild(notify);
  }
  notify.textContent = message;
  notify.classList.toggle('error', !!isError);
  notify.classList.add('show');
  clearTimeout(notify._t);
  notify._t = setTimeout(() => notify.classList.remove('show'), 4000);
}

function submitBooking(e) {
  if (e) e.preventDefault();

  // 1. Put your target WhatsApp phone number here (with country code, no + or spaces)
  const whatsappNumber = "923218516727"; 

  // 2. Gather values using the field IDs from booking.html
  const name = document.getElementById('bk-name')?.value || '';
  const phone = document.getElementById('bk-phone')?.value || '';
  const date = document.getElementById('bk-date')?.value || 'Not specified';
  const eventType = document.getElementById('bk-event')?.value || 'Not selected';
  const style = document.getElementById('bk-style')?.value || 'Not selected';
  const people = document.getElementById('bk-people')?.value || 'Not selected';
  const location = document.getElementById('bk-location')?.value || 'Not provided';
  const notes = document.getElementById('bk-notes')?.value || 'None';

  // 3. Format the structured message
  const message = `✨ *NEW MEHNDI BOOKING REQUEST* ✨\n\n` +
    `👤 *Name:* ${name}\n` +
    `📞 *Phone:* ${phone}\n` +
    `📅 *Event Date:* ${date}\n` +
    `🎉 *Event Type:* ${eventType}\n` +
    `🎨 *Mehndi Style:* ${style}\n` +
    `👥 *Number of People:* ${people}\n` +
    `📍 *Location:* ${location}\n` +
    `📝 *Notes:* ${notes}`;

  // 4. Construct WhatsApp redirect link
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  // 5. Trigger notification toast and open WhatsApp
  showNotify('✓ Redirecting to WhatsApp with your booking details... 🌸');
  window.open(whatsappUrl, '_blank');

  return false;
}

/* ══════════════════════════════════
   REVIEWS SYSTEM (VERCEL KV / API)
══════════════════════════════════ */

// Fetch and render reviews globally from Vercel storage
async function renderReviews() {
  const container = document.getElementById("reviewsGrid");
  if (!container) return;

  try {
    const res = await fetch('/api/reviews');
    const reviews = await res.json();

    if (!Array.isArray(reviews) || reviews.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; color: var(--light-text); font-size: 0.85rem; padding: 40px 0;">
          No reviews yet. Be the first to leave a review below! ✨
        </div>
      `;
      return;
    }

    container.innerHTML = reviews.map(r => `
      <div class="review-card">
        <div class="rc-header">
          <div class="rc-name">${escapeHtml(r.name)}</div>
          <div class="rc-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</div>
        </div>
        <div class="rc-tag">${escapeHtml(r.service)}</div>
        <p class="rc-comment">${escapeHtml(r.comment)}</p>
        <div class="rc-date">${r.date}</div>
      </div>
    `).join("");
  } catch (err) {
    console.error("Error loading reviews:", err);
    container.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--light-text); font-size: 0.85rem; padding: 40px 0;">
        No reviews yet. Be the first to leave a review below! ✨
      </div>
    `;
  }
}

// Submit a new review to Vercel KV storage
async function submitReview(event) {
  if (event) event.preventDefault();
  const form = event.target;

  const newReview = {
    id: Date.now().toString(),
    name: form.elements['name'].value.trim(),
    service: form.elements['service'].value,
    rating: parseInt(form.elements['rating'].value, 10),
    comment: form.elements['comment'].value.trim(),
    date: new Date().toISOString().split('T')[0]
  };
  try {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newReview)
    });

    if (res.ok) {
      form.reset();
      renderReviews();
      showNotify("✓ Thank you! Your review has been published 🌸");
    } else {
      throw new Error("Failed to post review");
    }
  } catch (err) {
    showNotify("Error submitting review. Please try again.", true);
  }

  return false;
}

function escapeHtml(text) {
  return String(text == null ? '' : text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
/* ══════════════════════════════════
   FEATURED PRODUCTS (separate section on homepage)
══════════════════════════════════ */
const FEATURED_CAT_LABELS = {
  crochet: 'Crochet', painting: 'Painting', crafts: 'Crafts',
  mehndi: 'Mehndi', jewelry: 'Handmade Jewelery', charms: 'Charms'
};

async function renderFeatured() {
  const section = document.getElementById('featuredSection');
  const grid = document.getElementById('featuredGrid');
  if (!section || !grid) return;

  try {
    const res = await fetch('/api/featured');
    const data = await res.json();
    const items = (data && data.images) || [];
    if (items.length === 0) return; // section stays hidden until something is featured

    grid.innerHTML = items.map((img) => {
      const msg = "Hi! I'd like to order: " + img.title + (img.price ? ' — Rs ' + img.price : '');
      return `
        <div class="featured-card">
          <a class="featured-card-img" href="gallery-${img.category}.html">
            <img src="${img.url}" alt="${escapeHtml(img.title)}" loading="lazy">
          </a>
          <div class="featured-card-title">${escapeHtml(img.title)}</div>
          <div class="featured-card-cat">${escapeHtml(FEATURED_CAT_LABELS[img.category] || img.category)}</div>
          <div class="featured-card-price">${img.price ? 'Rs ' + escapeHtml(img.price) : ''}</div>
          <a class="featured-card-order" target="_blank" rel="noopener"
             href="https://wa.me/923218516727?text=${encodeURIComponent(msg)}">Order Now</a>
        </div>`;
    }).join('');
    section.style.display = 'block';

    const step = () => {
      const card = grid.querySelector('.featured-card');
      return card ? card.getBoundingClientRect().width + 20 : 300;
    };
    const prev = document.getElementById('featuredPrev');
    const next = document.getElementById('featuredNext');
    const updateArrows = () => {
      const max = grid.scrollWidth - grid.clientWidth - 2;
      prev.style.display = grid.scrollLeft > 2 ? 'flex' : 'none';
      next.style.display = grid.scrollLeft < max ? 'flex' : 'none';
    };
    // Slow, eased scroll so products glide across instead of jumping
    let anim = null;
    const glideTo = (target, duration = 1400) => {
      if (anim) cancelAnimationFrame(anim);
      const from = grid.scrollLeft;
      const dist = target - from;
      if (Math.abs(dist) < 1) return;
      const t0 = performance.now();
      const tick = (now) => {
        const t = Math.min(1, (now - t0) / duration);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; // easeInOut
        grid.scrollLeft = from + dist * e;
        anim = t < 1 ? requestAnimationFrame(tick) : null;
      };
      anim = requestAnimationFrame(tick);
    };

    // Auto-advance one product at a time, looping back to the start
    let autoTimer = null;
    const maxScroll = () => grid.scrollWidth - grid.clientWidth;
    const advance = () => {
      if (document.hidden || maxScroll() < 4) return;
      const atEnd = grid.scrollLeft >= maxScroll() - 4;
      glideTo(atEnd ? 0 : Math.min(grid.scrollLeft + step(), maxScroll()), atEnd ? 1800 : 1400);
    };
    const startAuto = () => { stopAuto(); autoTimer = setInterval(advance, 3500); };
    const stopAuto = () => { if (autoTimer) { clearInterval(autoTimer); autoTimer = null; } };

    prev.onclick = () => { glideTo(Math.max(0, grid.scrollLeft - step()), 700); startAuto(); };
    next.onclick = () => { glideTo(Math.min(maxScroll(), grid.scrollLeft + step()), 700); startAuto(); };
    grid.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    startAuto();
    updateArrows();
  } catch (err) {
    console.error('Error loading featured products:', err);
  }
}

/* ══════════════════════════════════
   SWIPE NAVIGATION (bottom nav pages)
══════════════════════════════════ */
const SWIPE_NAV_ORDER = ['index.html', 'gallery.html', 'booking.html', 'reviews.html'];
const SWIPE_MIN_DISTANCE = 60;   // px — minimum horizontal travel to count as a swipe
const SWIPE_MAX_ANGLE_RATIO = 1.3; // horizontal must dominate vertical by this much

function getSwipePageKey() {
  const file = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const normalized = file === '' ? 'index.html' : file;
  // Treat every gallery-*.html sub-page as the "gallery.html" slot
  if (normalized === 'gallery.html' || normalized.startsWith('gallery-')) {
    return 'gallery.html';
  }
  return normalized;
}

function isAnyModalOpen() {
  return !!document.querySelector('.cert-modal.open, .lightbox.open, .modal.open, [class*="modal"].open');
}

function isInstalledApp() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    navigator.standalone === true ||
    document.referrer.startsWith('android-app://')
  );
}

function initSwipeNavigation() {
  const order = SWIPE_NAV_ORDER;
  const currentKey = getSwipePageKey();
  const currentIndex = order.indexOf(currentKey);
  if (currentIndex === -1) return; // page not part of the swipeable set (e.g. dashboard)
  if (!isInstalledApp()) return;   // swipe navigation only works in the installed app, not the browser

  let startX = 0;
  let startY = 0;
  let tracking = false;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { tracking = false; return; }
    const target = e.target;
    // Don't hijack swipes that start on form controls or interactive sliders
    if (target.closest('input, textarea, select, .featured-grid')) {
      tracking = false;
      return;
    }
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
    tracking = true;
  }, { passive: true });

  document.addEventListener('touchend', (e) => {
    if (!tracking) return;
    tracking = false;
    if (isAnyModalOpen()) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX < SWIPE_MIN_DISTANCE) return;
    if (absX < absY * SWIPE_MAX_ANGLE_RATIO) return; // too vertical — it's a scroll

    let targetIndex = null;
    const direction = deltaX < 0 ? 'left' : 'right'; // direction of the swipe/travel
    if (deltaX < 0) {
      // swiped left → go to next page
      targetIndex = currentIndex + 1;
    } else {
      // swiped right → go to previous page
      targetIndex = currentIndex - 1;
    }

    if (targetIndex >= 0 && targetIndex < order.length) {
      navigateWithTransition(order[targetIndex], direction);
    }
  }, { passive: true });
}

function navigateWithTransition(url, direction) {
  try { sessionStorage.setItem('swipeNavDirection', direction); } catch (e) {}

  const page = document.querySelector('.page');
  if (!page) {
    window.location.href = url;
    return;
  }

  page.classList.add(direction === 'left' ? 'swipe-exit-left' : 'swipe-exit-right');
  // Navigate once the exit animation has (roughly) finished
  window.setTimeout(() => { window.location.href = url; }, 240);
}

function playEnterTransition() {
  const page = document.querySelector('.page');
  if (!page) return;
  const dir = document.documentElement.getAttribute('data-swipe-enter');
  if (!dir) return;

  // Double rAF: let the browser paint the offset "entering" state first,
  // then remove it so the transition animates into place.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      document.documentElement.removeAttribute('data-swipe-enter');
      try { sessionStorage.removeItem('swipeNavDirection'); } catch (e) {}
    });
  });
}

async function initCategoryThumbnails() {
  const thumbs = document.querySelectorAll('.category-thumb img[data-category]');
  if (!thumbs.length) return;

  await Promise.all(Array.from(thumbs).map(async (img) => {
    const category = img.dataset.category;
    try {
      const res = await fetch(`/api/images?category=${encodeURIComponent(category)}`);
      if (!res.ok) return;
      const data = await res.json();
      const firstImage = data.images && data.images[0];
      if (!firstImage || !firstImage.url) return;

      img.addEventListener('load', () => {
        img.parentElement.classList.add('has-image');
      }, { once: true });
      img.src = firstImage.url;
    } catch (err) {
      // Keep the emoji fallback when a category has no uploaded image.
    }
  }));
}

// Automatically initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  renderFeatured();
  renderReviews();
  initCategoryThumbnails();
  initSwipeNavigation();
  playEnterTransition();

  // ─── MOBILE MENU TOGGLE ───
  const navToggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close menu when tapping a link (optional, for smoother UX)
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navToggle.classList.remove('active');
        navLinks.classList.remove('open');
      });
    });
  }
});
