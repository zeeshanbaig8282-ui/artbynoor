// Renders a gallery grid for one category.
// Tries the live /api/images endpoint (populated via the dashboard) first;
// falls back to hardcoded sample pieces if nothing has been uploaded yet
// (or if the API isn't set up yet, e.g. Blob storage not connected).

function initGallery(opts) {
  const grid = document.getElementById(opts.gridId);
  if (!grid) return;

  grid.innerHTML = '<div class="gallery-loading">Loading gallery…</div>';

  fetch(`/api/images?category=${encodeURIComponent(opts.category)}`)
    .then(res => {
      if (!res.ok) throw new Error('api not ready');
      return res.json();
    })
    .then(data => {
      const items = (data && data.images) || [];
      if (items.length === 0) {
        renderFallback(grid, opts);
      } else {
        renderUploaded(grid, items, opts);
      }
    })
    .catch(() => renderFallback(grid, opts));
}

function buildOrderUrl(title, price) {
  const whatsappNumber = "923218516727";
  const label = title || 'this item';
  const message = price
    ? `Hi! I'd like to order: ${label} — Rs ${price}`
    : `Hi! I'd like to order: ${label}`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

function renderUploaded(grid, items, opts) {
  grid.innerHTML = '';

items.forEach((item, index) => {
    const whatsappUrl = buildOrderUrl(item.title, item.price);
    const priceLabel = item.price ? `Rs ${item.price}` : '';

    const el = document.createElement('div');
    el.className = 'gallery-item';
    el.innerHTML = `
      <div class="gallery-item-inner" style="cursor: pointer;">
        <img src="${item.url}" alt="${escapeHtml(item.title)}" loading="lazy">
      </div>
      ${priceLabel ? `<div class="gallery-item-price" style="padding: 10px 0 0; text-align: center; font-family:'Cormorant Garamond', serif; font-size:1.15rem; font-weight:600; color:#c26c60;">${escapeHtml(priceLabel)}</div>` : ''}
      <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-order-wa">
        Order Now
      </a>`;

    const imgContainer = el.querySelector('.gallery-item-inner');
    if (imgContainer) {
      imgContainer.addEventListener('click', () => openGalleryLightbox(items, index));
    }

    grid.appendChild(el);
  });

function renderFallback(grid, opts) {
  grid.innerHTML = '';

  (opts.fallback || []).forEach(item => {
    const whatsappUrl = buildOrderUrl(item.title, item.price);
    const priceLabel = item.price ? `Rs ${item.price}` : '';

    const el = document.createElement('div');
    el.className = 'gallery-item' + (item.size ? ' ' + item.size : '');
    el.innerHTML = `
      <div class="gallery-item-inner" style="background:${item.bg}">
        <div class="gallery-item-fallback">
          <div class="gallery-item-emoji">${item.emoji}</div>
          <div class="gallery-item-cat">${escapeHtml(opts.categoryLabel)}</div>
          <div class="gallery-item-title">${escapeHtml(item.title)}</div>
        </div>
      </div>
      ${priceLabel ? `<div class="gallery-item-price" style="padding: 10px 0 0; text-align: center; font-family:'Cormorant Garamond', serif; font-size:1.15rem; font-weight:600; color:#c26c60;">${escapeHtml(priceLabel)}</div>` : ''}
      <a href="${whatsappUrl}" target="_blank" rel="noopener noreferrer" class="btn-order-wa">
        Order Now
      </a>`;
    grid.appendChild(el);
  });
  if (!opts.fallback || opts.fallback.length === 0) {
    grid.innerHTML = '<div class="gallery-empty">No pieces added yet — check back soon 🌸</div>';
  }
}
function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str == null ? '' : str;
  return d.innerHTML;
}
// ─── GALLERY LIGHTBOX WITH NAVIGATION ───
let currentGalleryItems = [];
let currentGalleryIndex = 0;

function openGalleryLightbox(items, index) {
  currentGalleryItems = items;
  currentGalleryIndex = index;
  ensureGalleryModalExists();
  updateGalleryModalContent();
  document.getElementById('gallery-lightbox').classList.add('open');
}

function updateGalleryModalContent() {
  const item = currentGalleryItems[currentGalleryIndex];
  if (!item) return;

  const modalImg = document.getElementById('gallery-lightbox-img');
  const modalTitle = document.getElementById('gallery-lightbox-title');
  const modalPrice = document.getElementById('gallery-lightbox-price');
  const modalOrder = document.getElementById('gallery-lightbox-order');

  modalImg.src = item.url;
  modalImg.alt = item.title || '';
  modalTitle.textContent = item.title || '';
  modalPrice.textContent = item.price ? `Rs ${item.price}` : '';
  modalOrder.href = buildOrderUrl(item.title, item.price);
}

function ensureGalleryModalExists() {
  if (document.getElementById('gallery-lightbox')) return;

  const modal = document.createElement('div');
  modal.id = 'gallery-lightbox';
  modal.className = 'cert-modal';
  modal.innerHTML = `
    <div class="cert-modal-backdrop"></div>
    <div class="cert-modal-box gallery-lightbox-box">
      <button class="cert-modal-close" aria-label="Close">&times;</button>
      <button class="gallery-nav-btn prev" aria-label="Previous">&#10094;</button>
      <img id="gallery-lightbox-img" class="cert-modal-img" src="" alt="" />
      <button class="gallery-nav-btn next" aria-label="Next">&#10095;</button>
      <div id="gallery-lightbox-title" class="cert-modal-title"></div>
      <div id="gallery-lightbox-price" style="font-family:'Cormorant Garamond', serif; font-size:1.15rem; font-weight:600; color:#c26c60; margin-top: 4px;"></div>
      <a id="gallery-lightbox-order" href="" target="_blank" rel="noopener noreferrer" class="btn-order-wa" style="margin-top: 12px; border-radius: 999px; padding: 10px 24px;">
        Order Now
      </a>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.cert-modal-backdrop').addEventListener('click', closeGalleryLightbox);
  modal.querySelector('.cert-modal-close').addEventListener('click', closeGalleryLightbox);

  modal.querySelector('.gallery-nav-btn.prev').addEventListener('click', (e) => {
    e.stopPropagation();
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length;
    updateGalleryModalContent();
  });

  modal.querySelector('.gallery-nav-btn.next').addEventListener('click', (e) => {
    e.stopPropagation();
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryItems.length;
    updateGalleryModalContent();
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeGalleryLightbox();
    if (e.key === 'ArrowLeft') {
      currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length;
      updateGalleryModalContent();
    }
    if (e.key === 'ArrowRight') {
      currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryItems.length;
      updateGalleryModalContent();
    }
  });
}

function closeGalleryLightbox() {
  const modal = document.getElementById('gallery-lightbox');
  if (modal) modal.classList.remove('open');
}
// ─── GALLERY LIGHTBOX WITH NAVIGATION ───
let currentGalleryItems = [];
let currentGalleryIndex = 0;

function openGalleryLightbox(items, index) {
  currentGalleryItems = items;
  currentGalleryIndex = index;
  ensureGalleryModalExists();
  updateGalleryModalContent();
  document.getElementById('gallery-lightbox').classList.add('open');
}

function updateGalleryModalContent() {
  const item = currentGalleryItems[currentGalleryIndex];
  if (!item) return;

  const modalImg = document.getElementById('gallery-lightbox-img');
  const modalTitle = document.getElementById('gallery-lightbox-title');
  const modalPrice = document.getElementById('gallery-lightbox-price');
  const modalOrder = document.getElementById('gallery-lightbox-order');

  modalImg.src = item.url;
  modalImg.alt = item.title || '';
  modalTitle.textContent = item.title || '';
  modalPrice.textContent = item.price ? `Rs ${item.price}` : '';
  modalOrder.href = buildOrderUrl(item.title, item.price);
}

function ensureGalleryModalExists() {
  if (document.getElementById('gallery-lightbox')) return;

  const modal = document.createElement('div');
  modal.id = 'gallery-lightbox';
  modal.className = 'cert-modal';
  modal.innerHTML = `
    <div class="cert-modal-backdrop"></div>
    <div class="cert-modal-box gallery-lightbox-box">
      <button class="cert-modal-close" aria-label="Close">&times;</button>
      <button class="gallery-nav-btn prev" aria-label="Previous">&#10094;</button>
      <img id="gallery-lightbox-img" class="cert-modal-img" src="" alt="" />
      <button class="gallery-nav-btn next" aria-label="Next">&#10095;</button>
      <div id="gallery-lightbox-title" class="cert-modal-title"></div>
      <div id="gallery-lightbox-price" style="font-family:'Cormorant Garamond', serif; font-size:1.15rem; font-weight:600; color:#c26c60; margin-top: 4px;"></div>
      <a id="gallery-lightbox-order" href="" target="_blank" rel="noopener noreferrer" class="btn-order-wa" style="margin-top: 12px; border-radius: 999px; padding: 10px 24px; width: auto; display: inline-block;">
        Order Now
      </a>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector('.cert-modal-backdrop').addEventListener('click', closeGalleryLightbox);
  modal.querySelector('.cert-modal-close').addEventListener('click', closeGalleryLightbox);

  modal.querySelector('.gallery-nav-btn.prev').addEventListener('click', (e) => {
    e.stopPropagation();
    currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length;
    updateGalleryModalContent();
  });

  modal.querySelector('.gallery-nav-btn.next').addEventListener('click', (e) => {
    e.stopPropagation();
    currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryItems.length;
    updateGalleryModalContent();
  });

  document.addEventListener('keydown', (e) => {
    if (!modal.classList.contains('open')) return;
    if (e.key === 'Escape') closeGalleryLightbox();
    if (e.key === 'ArrowLeft') {
      currentGalleryIndex = (currentGalleryIndex - 1 + currentGalleryItems.length) % currentGalleryItems.length;
      updateGalleryModalContent();
    }
    if (e.key === 'ArrowRight') {
      currentGalleryIndex = (currentGalleryIndex + 1) % currentGalleryItems.length;
      updateGalleryModalContent();
    }
  });
}

function closeGalleryLightbox() {
  const modal = document.getElementById('gallery-lightbox');
  if (modal) modal.classList.remove('open');
}