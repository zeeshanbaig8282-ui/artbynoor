const CATEGORIES = [
  { id: 'crochet', label: 'Crochet' },
  { id: 'painting', label: 'Painting' },
  { id: 'crafts', label: 'Crafts' },
  { id: 'mehndi', label: 'Mehndi' },
];

function getPasscode() {
  return sessionStorage.getItem('noor_dash_pass') || '';
}

function tryUnlock() {
  const val = document.getElementById('passcodeInput').value.trim();
  if (!val) return;
  sessionStorage.setItem('noor_dash_pass', val);
  checkAccess();
}

function checkAccess() {
  const pass = getPasscode();
  if (!pass) return;
  // We don't verify against the server here; the first real upload/delete
  // call will tell us if the passcode is wrong.
  document.getElementById('lockScreen').style.display = 'none';
  document.getElementById('dashContent').style.display = 'block';
  loadAllCategories();
}

document.addEventListener('DOMContentLoaded', () => {
  checkAccess();

  document.getElementById('passcodeInput').addEventListener('keydown', e => {
    if (e.key === 'Enter') tryUnlock();
  });

  document.getElementById('uploadFile').addEventListener('change', e => {
    const file = e.target.files[0];
    const preview = document.getElementById('uploadPreview');
    if (!file) { preview.style.display = 'none'; return; }
    const reader = new FileReader();
    reader.onload = ev => {
      preview.src = ev.target.result;
      preview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
});

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadImage() {
  const category = document.getElementById('uploadCategory').value;
  const title = document.getElementById('uploadTitle').value.trim();
  const fileInput = document.getElementById('uploadFile');
  const file = fileInput.files[0];
  const btn = document.getElementById('uploadBtn');

  if (!file) { showNotify('Choose a picture first', true); return; }
  if (!title) { showNotify('Add a title for this picture', true); return; }

  btn.disabled = true;
  btn.textContent = 'Uploading…';

  try {
    const dataUrl = await fileToDataUrl(file);
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: getPasscode(), category, title, dataUrl }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        sessionStorage.removeItem('noor_dash_pass');
        showNotify('Wrong passcode — please unlock again', true);
        location.reload();
        return;
      }
      throw new Error(data.error || 'Upload failed');
    }

    showNotify('✓ Picture uploaded to ' + category);
    document.getElementById('uploadTitle').value = '';
    fileInput.value = '';
    document.getElementById('uploadPreview').style.display = 'none';
    loadAllCategories();
  } catch (err) {
    showNotify(err.message || 'Something went wrong', true);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Upload Picture';
  }
}

async function loadAllCategories() {
  const container = document.getElementById('galleryManager');
  container.innerHTML = CATEGORIES.map(c => `
    <div class="dash-section-title">${c.label}</div>
    <div class="dash-grid" id="dashGrid-${c.id}">
      <div class="gallery-loading">Loading…</div>
    </div>
  `).join('');

  CATEGORIES.forEach(c => loadCategory(c.id));
}

async function loadCategory(category) {
  const grid = document.getElementById('dashGrid-' + category);
  try {
    const res = await fetch(`/api/images?category=${category}`);
    const data = await res.json();
    const images = data.images || [];

    if (images.length === 0) {
      grid.innerHTML = '<div class="gallery-empty" style="grid-column:1/-1;padding:20px 0;">Nothing uploaded here yet.</div>';
      return;
    }

    grid.innerHTML = images.map(img => `
      <div class="dash-item">
        <img src="${img.url}" alt="${escapeHtml(img.title)}">
        <div class="dash-item-title">${escapeHtml(img.title)}</div>
        <button class="dash-item-del" onclick="deleteImage('${encodeURIComponent(img.url)}', this)" title="Delete">×</button>
      </div>
    `).join('');
  } catch (err) {
    grid.innerHTML = '<div class="gallery-empty" style="grid-column:1/-1;">Could not load this category.</div>';
  }
}

async function deleteImage(encodedUrl, btn) {
  if (!confirm('Delete this picture? This cannot be undone.')) return;
  const url = decodeURIComponent(encodedUrl);
  btn.disabled = true;

  try {
    const res = await fetch('/api/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passcode: getPasscode(), url }),
    });
    const data = await res.json();

    if (!res.ok) {
      if (res.status === 401) {
        sessionStorage.removeItem('noor_dash_pass');
        showNotify('Wrong passcode — please unlock again', true);
        location.reload();
        return;
      }
      throw new Error(data.error || 'Delete failed');
    }

    showNotify('Picture deleted');
    loadAllCategories();
  } catch (err) {
    showNotify(err.message || 'Something went wrong', true);
    btn.disabled = false;
  }
}
