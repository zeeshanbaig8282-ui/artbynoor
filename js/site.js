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
        <img src="${img.url}"