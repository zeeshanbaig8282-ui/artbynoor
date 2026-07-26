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

document.addEventListener('DOMContentLoaded', () => {
  // Existing animation logic
  document.querySelectorAll('.hero-text > *, .booking-hero-text > *').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.7s ${i * 0.12}s, transform 0.7s ${i * 0.12}s`;
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 100);
  });

  // NEW: Mobile Hamburger Menu Toggle Logic
  const toggleBtn = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (toggleBtn && navMenu) {
    // Opens and closes menu when clicking the hamburger icon
    toggleBtn.addEventListener('click', () => {
      toggleBtn.classList.toggle('active');
      navMenu.classList.toggle('open');
    });

    // Automatically closes menu when tapping outside of it
    document.addEventListener('click', (e) => {
      if (!toggleBtn.contains(e.target) && !navMenu.contains(e.target)) {
        toggleBtn.classList.remove('active');
        navMenu.classList.remove('open');
      }
    });
  }
});