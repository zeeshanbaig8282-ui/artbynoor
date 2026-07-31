let savedPasscode = '';

const CATEGORIES = [
  { id: 'crochet', label: 'Crochet' },
  { id: 'painting', label: 'Painting' },
  { id: 'crafts', label: 'Crafts' },
  { id: 'mehndi', label: 'Mehndi' },
  { id: 'jewelry', label: 'Handmade Jewelery' },
  { id: 'charms', label: 'Charms' },
];

function tryUnlock() {
  const passcode = document.getElementById('passcodeInput').value.trim();
  const lockErr = document.getElementById('lockErr');

  if (!passcode) {
    lockErr.textContent = 'Please enter a passcode.';
    return;
  }

  // Check against the passcode
  if (passcode !== 'Am@ma143') {
    lockErr.textContent = 'Please enter the correct passcode';
    return;
  }

  // Clear any error message
  lockErr.textContent = '';

  // Store the passcode for API requests
  savedPasscode = passcode;

  // Reveal the dashboard UI
  document.getElementById('lockScreen').style.display = 'none';
  document.getElementById('dashContent').style.display = 'block';

  // Load existing images in all categories and render admin reviews
  loadAllCategories();
  renderAdminReviews();
}

// Preview image when selected
document.addEventListener('DOMContentLoaded', () => {
  const fileInput = document.getElementById('uploadFile');
  if (fileInput) {
    fileInput.addEventListener('change', function (e) {
      const file = e.target.files[0];
      const preview = document.getElementById('uploadPreview');
      if (file) {
        preview.src = URL.createObjectURL(file);
        preview.style.display = 'block';
      } else {
        preview.style.display = 'none';
      }
    });
  }

  const passInput = document.getElementById('passcodeInput');
  if (passInput) {
    passInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') tryUnlock();
    });
  }
});

async function uploadImage() {
  const btn = document.getElementById('uploadBtn');
  const fileInput = document.getElementById('uploadFile');
  const category = document.getElementById('uploadCategory').value;
  const title = document.getElementById('uploadTitle').value.trim();

  if (!fileInput.files || fileInput.files.length === 0) {
    alert('Please select a picture to upload.');
    return;
  }
  if (!title) {
    alert('Please enter a title for the picture.');
    return;
  }

  const file = fileInput.files[0];

  // Client-side image size check (4 MB limit)
  if (file.size > 4 * 1024 * 1024) {
    alert('Image is too large! Please select an image smaller than 4MB.');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Uploading...';

  try {
    const dataUrl = await fileToDataUrl(file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: savedPasscode, category, title, dataUrl }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || data.message || 'Upload failed');
    }

    alert('Picture uploaded successfully!');
    fileInput.value = '';
    document.getElementById('uploadTitle').value = '';
    document.getElementById('uploadPreview').style.display = 'none';

    // Refresh category grids
    loadAllCategories();
  } catch (err) {
    alert('Upload error: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Upload Picture';
  }
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Loads and displays uploaded images for every category with a Delete button
async function loadAllCategories() {
  const container = document.getElementById('galleryManager');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(
    (c) => `
    <div style="margin-top:25px; border-bottom:1px solid #eee; padding-bottom:10px;">
      <h3 style="margin-bottom:10px;">${c.label}</h3>
      <div class="dash-grid" id="dashGrid-${c.id}" style="display:flex; flex-wrap:wrap; gap:15px;">
        <div style="color:#777; font-size:14px;">Loading pictures...</div>
      </div>
    </div>
  `
  ).join('');

  CATEGORIES.forEach((c) => loadCategory(c.id));
}

async function loadCategory(category) {
  const grid = document.getElementById('dashGrid-' + category);
  if (!grid) return;

  try {
    const res = await fetch(`/api/images?category=${category}`);
    const data = await res.json();
    const images = data.images || [];

    if (images.length === 0) {
      grid.innerHTML = '<div style="color:#888; font-size:13px;">No uploaded pictures in this category yet.</div>';
      return;
    }

    grid.innerHTML = images
      .map(
        (img) => `
      <div style="position:relative; width:130px; text-align:center; border:1px solid #ddd; padding:8px; border-radius:6px; background:#fff;">
        <img src="${img.url}" alt="${escapeHtml(img.title)}" style="width:100%; height:100px; object-fit:cover; border-radius:4px;">
        <div style="font-size:12px; margin:6px 0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(img.title)}</div>
        <button onclick="deleteImage('${encodeURIComponent(img.url)}', this)" 
                style="background:#e74c3c; color:white; border:none; padding:4px 8px; border-radius:4px; font-size:11px; cursor:pointer; width:100%;">
          Delete ✕
        </button>
      </div>
    `
      )
      .join('');
  } catch (err) {
    grid.innerHTML = '<div style="color:#e74c3c; font-size:13px;">Could not load pictures.</div>';
  }
}

// Function to delete an image via /api/delete endpoint
async function deleteImage(encodedUrl, btn) {
  if (!confirm('Are you sure you want to delete this picture from the website?')) return;

  const url = decodeURIComponent(encodedUrl);
  btn.disabled = true;
  btn.textContent = 'Deleting...';

  try {
    const res = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: savedPasscode, url }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || 'Delete failed');
    }

    alert('Picture deleted successfully!');
    loadAllCategories();
  } catch (err) {
    alert('Error deleting picture: ' + err.message);
    btn.disabled = false;
    btn.textContent = 'Delete ✕';
  }
}

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str == null ? '' : str;
  return d.innerHTML;
}

/* ══════════════════════════════════
   ADMIN REVIEW MANAGEMENT (VERCEL API)
══════════════════════════════════ */

async function renderAdminReviews() {
  const container = document.getElementById("adminReviewsContainer");
  if (!container) return;

  try {
    const res = await fetch('/api/reviews');
    const reviews = await res.json();

    if (!Array.isArray(reviews) || reviews.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; color: var(--light-text); font-size: 0.85rem; padding: 30px; border: 1px dashed rgba(201,169,110,0.3);">
          No client reviews posted yet.
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="admin-reviews-list">
        ${reviews.map((r) => `
          <div class="admin-review-item">
            <div class="admin-review-content">
              <div class="admin-review-meta">
                <strong class="admin-review-name">${escapeHtml(r.name)}</strong>
                <span class="admin-review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span>
                <span class="admin-review-tag">${escapeHtml(r.service)}</span>
              </div>
              <p class="admin-review-text">"${escapeHtml(r.comment)}"</p>
              <small class="admin-review-date">${r.date}</small>
            </div>
            <button type="button" class="admin-delete-btn" onclick="deleteReview('${r.id}')">
              Delete Review
            </button>
          </div>
        `).join('')}
      </div>
    `;
  } catch (err) {
    container.innerHTML = `
      <div style="text-align: center; color: #e74c3c; font-size: 0.85rem; padding: 20px;">
        Error loading reviews from database.
      </div>
    `;
  }
}

async function deleteReview(reviewId) {
  if (!confirm("Are you sure you want to delete this review from the live website?")) return;

  try {
    const res = await fetch('/api/delete-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, passcode: savedPasscode })
    });

    if (res.ok) {
      renderAdminReviews();
      if (typeof renderReviews === 'function') renderReviews();
      showNotify("✓ Review deleted from live site");
    } else {
      throw new Error("Failed to delete review");
    }
  } catch (err) {
    showNotify("Error deleting review. Please try again.", true);
  }
}