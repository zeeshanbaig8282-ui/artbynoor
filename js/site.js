// Shared across all pages: toast notifications + entrance animation

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
  showNotify('✓ Booking request sent! Noor will reach out soon 🌸');
  return false;
}

/* ══════════════════════════════════
   REVIEWS SYSTEM
══════════════════════════════════ */

// Retrieve reviews from localStorage (starts empty)
function getStoredReviews() {
  const stored = localStorage.getItem("artt_reviews");
  return stored ? JSON.parse(stored) : [];
}

// Render review cards into the #reviewsGrid container
function renderReviews() {
  const container = document.getElementById("reviewsGrid");
  if (!container) return;

  const reviews = getStoredReviews();

  // Show placeholder message when no reviews are present
  if (reviews.length === 0) {
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
}

// Handle review form submission
function submitReview(event) {
  if (event) event.preventDefault();
  const form = event.target;

  const newReview = {
    name: form.elements['name'].value.trim(),
    service: form.elements['service'].value,
    rating: parseInt(form.elements['rating'].value, 10),
    comment: form.elements['comment'].value.trim(),
    date: new Date().toISOString().split('T')[0]
  };

  const reviews = getStoredReviews();
  reviews.unshift(newReview);
  localStorage.setItem("artt_reviews", JSON.stringify(reviews));

  form.reset();
  renderReviews();
  showNotify("✓ Thank you! Your review has been submitted 🌸");
  return false;
}

// Security helper to sanitize user input before rendering
function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/* ══════════════════════════════════
   INIT, MOBILE MENU & ANIMATIONS
══════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Mobile Menu Toggle Listener
  const menuToggle = document.querySelector('.menu-toggle, .hamburger, .nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      menuToggle.classList.toggle('active');
    });

    // Close mobile menu when clicking a link
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('active');
        menuToggle.classList.remove('active');
      });
    });
  }

  // 2. Render reviews if container exists on current page
  renderReviews();

  // 3. Hero entrance animations
  document.querySelectorAll('.hero-text > *, .booking-hero-text > *, .reviews-hero > *').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.7s ${i * 0.12}s, transform 0.7s ${i * 0.12}s`;
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 100);
  });
});
