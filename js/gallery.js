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

function renderUploaded(grid, items, opts) {
  grid.innerHTML = '';
  items.forEach((item, i) => {
    const el = document.createElement('div');
    el.className = 'gallery-item';
    el.innerHTML = `
      <div class="gallery-item-inner">
        <img src="${item.url}" alt="${escapeHtml(item.title)}" loading="lazy">
      </div>
      <div class="gallery-item-overlay">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(opts.categoryLabel)}</p>
      </div>`;
    grid.appendChild(el);
  });
}

function renderFallback(grid, opts) {
  grid.innerHTML = '';
  (opts.fallback || []).forEach(item => {
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
      <div class="gallery-item-overlay">
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.desc)}</p>
      </div>`;
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
