/* ─── GLOBAL UTILITIES & STATE ─── */
let currentCategory = 'all';

// Initialize layout on DOM load
document.addEventListener('DOMContentLoaded', () => {
  initNavToggle();
  initActiveNavLink();
  
  // Page-specific initializations based on present elements
  if (document.getElementById('slideshow-container')) {
    initSlideshow();
  }
  if (document.getElementById('gallery-grid')) {
    loadGalleryItems();
  }
  if (document.getElementById('category-grid')) {
    loadCategoryGrid();
  }
  if (document.getElementById('reviews-grid')) {
    loadPublicReviews();
  }
  if (document.getElementById('booking-form')) {
    initBookingForm();
  }
  if (document.getElementById('review-form')) {
    initReviewForm();
  }
  if (document.getElementById('dash-lock-screen')) {
    initDashboard();
  }
});

/* ─── NAVIGATION ─── */
function initNavToggle() {
  const toggleBtn = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      toggleBtn.classList.toggle('active');
      navLinks.classList.toggle('open');
    });

    // Close menu when clicking outside or on a link
    document.addEventListener('click', (e) => {
      if (!toggleBtn.contains(e.target) && !navLinks.contains(e.target)) {
        toggleBtn.classList.remove('active');
        navLinks.classList.remove('open');
      }
    });
  }
}

function initActiveNavLink() {
  const links = document.querySelectorAll('.nav-links a');
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';

  links.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

/* ─── NOTIFICATION SYSTEM ─── */
function showNotification(message, isError = false) {
  let notifyEl = document.getElementById('notification');
  if (!notifyEl) {
    notifyEl = document.createElement('div');
    notifyEl.id = 'notification';
    notifyEl.className = 'notify';
    document.body.appendChild(notifyEl);
  }

  notifyEl.textContent = message;
  notifyEl.className = `notify show ${isError ? 'error' : ''}`;

  setTimeout(() => {
    notifyEl.classList.remove('show');
  }, 4000);
}

/* ─── HOMEPAGE SLIDESHOW (DYNAMIC FETCH) ─── */
async function initSlideshow() {
  const container = document.getElementById('slideshow-container');
  const dotsContainer = document.getElementById('slideshow-dots');
  if (!container) return;

  let slidesData = [];

  try {
    // Fetch uploaded images from Vercel API endpoint
    const response = await fetch('/api/slideshow');
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data) && data.length > 0) {
        slidesData = data;
      }
    }
  } catch (err) {
    console.warn('Could not fetch uploaded slideshow images, using fallback.', err);
  }

  // Fallback images if database is empty
  if (slidesData.length === 0) {
    slidesData = [
      { url: 'https://via.placeholder.com/1200x600/3d1f1a/ffffff?text=Bridal+Henna', title: 'Bridal Henna' },
      { url: 'https://via.placeholder.com/1200x600/0b4041/ffffff?text=Party+Henna', title: 'Party Henna' }
    ];
  }

  // Clear loading state message
  container.innerHTML = '';
  if (dotsContainer) dotsContainer.innerHTML = '';

  let currentIndex = 0;

  // Render dynamic slides
  slidesData.forEach((slide, index) => {
    const slideImgUrl = slide.url || slide.src || slide;

    // Create Slide Element
    const slideDiv = document.createElement('div');
    slideDiv.className = `slide ${index === 0 ? 'active' : ''}`;
    slideDiv.innerHTML = `<img src="${slideImgUrl}" alt="${slide.title || 'Slide Image'}">`;
    container.appendChild(slideDiv);

    // Create Navigation Dot
    if (dotsContainer) {
      const dot = document.createElement('button');
      dot.className = `slideshow-dot ${index === 0 ? 'active' : ''}`;
      dot.addEventListener('click', () => goToSlide(index));
      dotsContainer.appendChild(dot);
    }
  });

  function goToSlide(index) {
    const slides = container.querySelectorAll('.slide');
    const dots = dotsContainer ? dotsContainer.querySelectorAll('.slideshow-dot') : [];

    if (slides[currentIndex]) slides[currentIndex].classList.remove('active');
    if (dots[currentIndex]) dots[currentIndex].classList.remove('active');

    currentIndex = index;

    if (slides[currentIndex]) slides[currentIndex].classList.add('active');
    if (dots[currentIndex]) dots[currentIndex].classList.add('active');
  }

  // Auto advance every 5 seconds
  if (slidesData.length > 1) {
    setInterval(() => {
      const nextIndex = (currentIndex + 1) % slidesData.length;
      goToSlide(nextIndex);
    }, 5000);
  }
}

/* ─── BOOKING FORM ─── */
function initBookingForm() {
  const form = document.getElementById('booking-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const name = form.querySelector('[name="name"]').value;
    const phone = form.querySelector('[name="phone"]').value;
    const service = form.querySelector('[name="service"]').value;
    const date = form.querySelector('[name="date"]').value;
    const notes = form.querySelector('[name="notes"]')?.value || '';

    const message = `Hello! I would like to book an appointment.\n\n*Name:* ${name}\n*Phone:* ${phone}\n*Service:* ${service}\n*Date:* ${date}\n*Notes:* ${notes}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    showNotification('Redirecting to WhatsApp to send booking details...');
    setTimeout(() => {
      window.open(whatsappUrl, '_blank');
      form.reset();
    }, 1500);
  });
}

/* ─── GALLERY & CATEGORIES ─── */
function filterGallery(category) {
  currentCategory = category;
  
  const buttons = document.querySelectorAll('.filter-btn');
  buttons.forEach(btn => {
    if (btn.getAttribute('data-category') === category) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  loadGalleryItems();
}

function loadGalleryItems() {
  const galleryGrid = document.getElementById('gallery-grid');
  if (!galleryGrid) return;

  const items = [
    { title: 'Bridal Full Hands', cat: 'bridal', img: 'https://via.placeholder.com/400?text=Bridal+Mehndi' },
    { title: 'Minimal Party Henna', cat: 'party', img: 'https://via.placeholder.com/400?text=Party+Mehndi' },
    { title: 'Arabic Floral Wrist', cat: 'arabic', img: 'https://via.placeholder.com/400?text=Arabic+Mehndi' },
    { title: 'Custom Portrait Canvas', cat: 'art', img: 'https://via.placeholder.com/400?text=Canvas+Art' }
  ];

  const filtered = currentCategory === 'all' 
    ? items 
    : items.filter(item => item.cat === currentCategory);

  if (filtered.length === 0) {
    galleryGrid.innerHTML = `<div class="gallery-empty">No designs found in this category.</div>`;
    return;
  }

  galleryGrid.innerHTML = filtered.map(item => `
    <div class="gallery-item">
      <div class="gallery-item-inner">
        <img src="${item.img}" alt="${item.title}">
        <div class="gallery-item-overlay">
          <h3>${item.title}</h3>
          <p>${item.cat.toUpperCase()}</p>
          <a href="booking.html" class="btn-order-wa">Book Design</a>
        </div>
      </div>
    </div>
  `).join('');
}

function loadCategoryGrid() {
  const catGrid = document.getElementById('category-grid');
  if (!catGrid) return;

  const categories = [
    { name: 'Bridal Henna', icon: '💍', tag: 'bridal', desc: 'Intricate bridal packages for full arms and feet.' },
    { name: 'Party Henna', icon: '✨', tag: 'party', desc: 'Elegant designs for guests, family & festivities.' },
    { name: 'Arabic Art', icon: '🌿', tag: 'arabic', desc: 'Flowing, bold floral and geometric trails.' },
    { name: 'Custom Paintings', icon: '🎨', tag: 'art', desc: 'Handcrafted acrylic & calligraphy canvases.' }
  ];

  catGrid.innerHTML = categories.map(c => `
    <a href="gallery.html?cat=${c.tag}" class="category-card">
      <div class="category-card-body">
        <div class="category-card-icon">${c.icon}</div>
        <h3>${c.name}</h3>
        <p>${c.desc}</p>
      </div>
    </a>
  `).join('');
}

/* ─── REVIEWS ─── */
function loadPublicReviews() {
  const container = document.getElementById('reviews-grid');
  if (!container) return;

  const sampleReviews = [
    { name: 'Ayesha K.', rating: 5, tag: 'Bridal Mehndi', comment: 'Absolutely stunning work! The stain turned out so dark and beautiful.', date: 'July 2026' },
    { name: 'Sania M.', rating: 5, tag: 'Party Henna', comment: 'Super quick, highly detailed, and very professional service.', date: 'June 2026' }
  ];

  container.innerHTML = sampleReviews.map(r => `
    <div class="review-card">
      <div>
        <div class="rc-header">
          <span class="rc-name">${r.name}</span>
          <span class="rc-stars">${'★'.repeat(r.rating)}</span>
        </div>
        <div class="rc-tag">${r.tag}</div>
        <p class="rc-comment">"${r.comment}"</p>
      </div>
      <div class="rc-date">${r.date}</div>
    </div>
  `).join('');
}

function initReviewForm() {
  const form = document.getElementById('review-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    showNotification('Thank you! Your review has been submitted for approval.');
    form.reset();
  });
}

/* ─── DASHBOARD MANAGEMENT ─── */
function initDashboard() {
  const lockScreen = document.getElementById('dash-lock-screen');
  const dashContent = document.getElementById('dash-content');
  const passInput = document.getElementById('dash-pass-input');
  const loginBtn = document.getElementById('dash-login-btn');
  const errEl = document.getElementById('dash-err');

  if (loginBtn) {
    loginBtn.addEventListener('click', () => {
      if (passInput.value === 'admin123') {
        if (lockScreen) lockScreen.style.display = 'none';
        if (dashContent) dashContent.style.display = 'block';
      } else if (errEl) {
        errEl.textContent = 'Incorrect password. Please try again.';
      }
    });
  }
}