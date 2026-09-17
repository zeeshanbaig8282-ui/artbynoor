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
   HOMEPAGE SLIDESHOW
══════════════════════════════════ */
let slideIndex = 0;
let slideTimer = null;

async function renderSlideshow() {
  const container = document.getElementById('heroSlideshow');
  if (!container) return;

  try {
    const res = await fetch('/api/images?category=slideshow');
    const data = await res.json();
    const images = data.images || [];

    if (images.length === 0) {
      container.innerHTML = `<div class="slideshow-empty">No slideshow pictures yet ✨</div>`;
      return;
    }

    container.innerHTML = images.map((img, i) => `
      <div class="slide${i === 0 ? ' active' : ''}">
        <img src="${img.url}" alt="${escapeHtml(img.title)}">
        ${img.title ? `<div class="slide-caption">${escapeHtml(img.title)}</div>` : ''}
      </div>
    `).join('');

    // Start auto-rotation if there are multiple images
    if (images.length > 1) {
      startSlideshow(images.length);
    }
  } catch (err) {
    console.error('Error loading slideshow:', err);
    container.innerHTML = `<div class="slideshow-empty">Failed to load pictures.</div>`;
  }
}

function startSlideshow(total) {
  if (slideTimer) clearInterval(slideTimer);
  slideTimer = setInterval(() => {
    const slides = document.querySelectorAll('#heroSlideshow .slide');
    if (!slides.length) return;
    
    slides[slideIndex].classList.remove('active');
    slideIndex = (slideIndex + 1) % total;
    slides[slideIndex].classList.add('active');
  }, 4000); // Transitions every 4 seconds
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

function initSwipeNavigation() {
  const order = SWIPE_NAV_ORDER;
  const currentKey = getSwipePageKey();
  const currentIndex = order.indexOf(currentKey);
  if (currentIndex === -1) return; // page not part of the swipeable set (e.g. dashboard)

  let startX = 0;
  let startY = 0;
  let tracking = false;

  document.addEventListener('touchstart', (e) => {
    if (e.touches.length !== 1) { tracking = false; return; }
    const target = e.target;
    // Don't hijack swipes that start on form controls or interactive sliders
    if (target.closest('input, textarea, select, .slideshow-container')) {
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
    if (deltaX < 0) {
      // swiped left → go to next page
      targetIndex = currentIndex + 1;
    } else {
      // swiped right → go to previous page
      targetIndex = currentIndex - 1;
    }

    if (targetIndex >= 0 && targetIndex < order.length) {
      window.location.href = order[targetIndex];
    }
  }, { passive: true });
}

// Automatically initialize when page loads
document.addEventListener('DOMContentLoaded', () => {
  renderSlideshow();
  renderReviews();
  initSwipeNavigation();

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
