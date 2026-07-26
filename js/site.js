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

  // 1. Enter your WhatsApp phone number with country code (no + or spaces)
  const whatsappNumber = "923087092039";

  // 2. Get values from form inputs
  const name = document.getElementById('bk-name')?.value || 'Not specified';
  const phone = document.getElementById('bk-phone')?.value || 'Not specified';
  const date = document.getElementById('bk-date')?.value || 'Not specified';
  const eventType = document.getElementById('bk-event')?.value || 'Not specified';
  const style = document.getElementById('bk-style')?.value || 'Not specified';
  const people = document.getElementById('bk-people')?.value || 'Not specified';
  const location = document.getElementById('bk-location')?.value || 'Not specified';
  const notes = document.getElementById('bk-notes')?.value || 'None';

  // 3. Create the formatted WhatsApp message
  const message = `✨ *New Mehndi Booking Request* ✨\n\n` +
                  `👤 *Name:* ${name}\n` +
                  `📞 *Phone:* ${phone}\n` +
                  `📅 *Event Date:* ${date}\n` +
                  `🎉 *Event Type:* ${eventType}\n` +
                  `🎨 *Style:* ${style}\n` +
                  `👥 *People:* ${people}\n` +
                  `📍 *Location:* ${location}\n` +
                  `📝 *Notes:* ${notes}`;

  // 4. Show toast notification & open WhatsApp link
  showNotify('✓ Redirecting to WhatsApp... 🌸');
  
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');

  return false;
}

// ─── ADDED: Helper function to build WhatsApp Order URL for uploaded items ───
function getWhatsAppOrderUrl(itemTitle) {
  const whatsappNumber = "923087092039";
  const title = itemTitle || "this item";
  const message = `Hi! I would like to order: ${title}`;
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
}

document.addEventListener('DOMContentLoaded', () => {
  // Existing animation logic
  document.querySelectorAll('.hero-text > *, .booking-hero-text > *').forEach((el, i) => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = `opacity 0.7s ${i * 0.12}s, transform 0.7s ${i * 0.12}s`;
    setTimeout(() => { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; }, 100);
  });

  // Mobile Hamburger Menu Toggle Logic
  const toggleBtn = document.getElementById('navToggle');
  const navMenu = document.getElementById('navMenu');

  if (toggleBtn && navMenu) {
    toggleBtn.addEventListener('click', () => {
      toggleBtn.classList.toggle('active');
      navMenu.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!toggleBtn.contains(e.target) && !navMenu.contains(e.target)) {
        toggleBtn.classList.remove('active');
        navMenu.classList.remove('open');
      }
    });
  }
});