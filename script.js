const eventDate = new Date('2024-12-07T09:00:00+07:00');

function updateCountdown() {
  const now = new Date();
  const diff = eventDate - now;
  const countdownElements = {
    days: document.getElementById('days'),
    hours: document.getElementById('hours'),
    minutes: document.getElementById('minutes'),
    seconds: document.getElementById('seconds'),
  };

  if (!countdownElements.days) return;

  if (diff <= 0) {
    countdownElements.days.textContent = '00';
    countdownElements.hours.textContent = '00';
    countdownElements.minutes.textContent = '00';
    countdownElements.seconds.textContent = '00';
    return;
  }

  const seconds = Math.floor(diff / 1000);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  countdownElements.days.textContent = String(days).padStart(2, '0');
  countdownElements.hours.textContent = String(hours).padStart(2, '0');
  countdownElements.minutes.textContent = String(minutes).padStart(2, '0');
  countdownElements.seconds.textContent = String(secs).padStart(2, '0');
}

function setupNavigation() {
  const toggle = document.querySelector('.nav-toggle');
  const navLinks = document.querySelector('.nav-links');
  const links = navLinks?.querySelectorAll('a');

  if (!toggle || !navLinks || !links) return;

  toggle.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', navLinks.classList.contains('open'));
  });

  links.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });

  const sections = Array.from(links, (link) => {
    const target = document.querySelector(link.getAttribute('href'));
    return target ? { link, section: target } : null;
  }).filter(Boolean);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const active = sections.find((item) => item.section === entry.target);
        if (!active) return;

        if (entry.isIntersecting) {
          sections.forEach((item) => item.link.classList.remove('active'));
          active.link.classList.add('active');
        }
      });
    },
    { threshold: 0.6 }
  );

  sections.forEach((item) => observer.observe(item.section));
}

function setupAnimations() {
  const animated = document.querySelectorAll('.animate-on-scroll');
  if (!animated.length) return;

  const observer = new IntersectionObserver(
    (entries, obs) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          obs.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  animated.forEach((el) => observer.observe(el));
}

function setupGallery() {
  const galleryImages = document.querySelectorAll('.moment-grid img');
  const lightbox = document.querySelector('.lightbox');
  const lightboxImage = lightbox?.querySelector('img');
  const lightboxClose = lightbox?.querySelector('.lightbox-close');

  if (!galleryImages.length || !lightbox || !lightboxImage || !lightboxClose) return;

  const openLightbox = (src, alt) => {
    lightboxImage.src = src;
    lightboxImage.alt = alt;
    lightbox.removeAttribute('hidden');
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    lightbox.setAttribute('hidden', '');
    lightboxImage.src = '';
    document.body.style.overflow = '';
  };

  galleryImages.forEach((img) => {
    img.addEventListener('click', () => openLightbox(img.src, img.alt));
  });

  lightboxClose.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (event) => {
    if (event.target === lightbox) {
      closeLightbox();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !lightbox.hasAttribute('hidden')) {
      closeLightbox();
    }
  });
}

function setupRsvpForm() {
  const form = document.querySelector('.rsvp-form');
  const message = form?.querySelector('.form-message');

  if (!form || !message) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const values = Object.fromEntries(formData.entries());

    const requiredFields = ['name', 'email', 'phone', 'guests'];
    const missing = requiredFields.filter((field) => !values[field]?.trim());

    if (missing.length) {
      message.textContent = 'Vui lòng điền đầy đủ thông tin trước khi gửi.';
      message.style.color = '#d9534f';
      return;
    }

    message.textContent = 'Cảm ơn bạn! Chúng tôi đã nhận được lời xác nhận.';
    message.style.color = '#9f6b99';
    form.reset();
  });
}

function init() {
  updateCountdown();
  setInterval(updateCountdown, 1000);
  setupNavigation();
  setupAnimations();
  setupGallery();
  setupRsvpForm();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
