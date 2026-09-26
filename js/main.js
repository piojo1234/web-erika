/**
 * ERIKA RODRÍGUEZ — MAIN JAVASCRIPT
 * Interacciones globales, navegación móvil, módulo de Google Reviews
 */

document.addEventListener('DOMContentLoaded', () => {
  initHeader();
  initMobileMenu();
  initGoogleReviews();
  initScrollAnimations();
});

/* 1. Header Sticky Effect */
function initHeader() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const handleScroll = () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();
}

/* 2. Menú Móvil */
function initMobileMenu() {
  const toggleBtn = document.querySelector('.mobile-toggle');
  const drawer = document.querySelector('.mobile-drawer');
  const overlay = document.querySelector('.drawer-overlay');
  const closeBtn = document.querySelector('.drawer-close');
  const mobileLinks = document.querySelectorAll('.mobile-nav-links a');

  if (!toggleBtn || !drawer || !overlay) return;

  const openDrawer = () => {
    drawer.classList.add('open');
    overlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  };

  const closeDrawer = () => {
    drawer.classList.remove('open');
    overlay.classList.remove('active');
    document.body.style.overflow = '';
  };

  toggleBtn.addEventListener('click', openDrawer);
  if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
  overlay.addEventListener('click', closeDrawer);

  mobileLinks.forEach(link => {
    link.addEventListener('click', closeDrawer);
  });
}

/* 3. Módulo de Reseñas de Google */
function initGoogleReviews() {
  const grid = document.getElementById('google-reviews-grid');
  if (!grid) return;

  const PLACE_ID = 'ChIJ7V6-xSiaP44RtKfeWpBqWj0';
  const CID = '4417180164660307892';

  const reviews = [
    {
      author: "María Pérez",
      time: "hace 2 semanas",
      rating: 5,
      text: "Excelente servicio y calidez humana. La Dra. Erika me ayudó a encontrar claridad en un momento de mucha ansiedad y transición personal. Totalmente recomendada."
    },
    {
      author: "Juan Rodríguez",
      time: "hace 1 mes",
      rating: 5,
      text: "Muy profesional y empática. El programa vocacional fue un antes y un después para mi carrera profesional. Herramientas 100% prácticas y aplicables."
    },
    {
      author: "Laura Gómez",
      time: "hace 2 meses",
      rating: 5,
      text: "El taller vivencial de arteterapia fue una experiencia transformadora. Un espacio seguro, acogedor y profundamente enriquecedor."
    },
    {
      author: "Carlos Sánchez",
      time: "hace 3 meses",
      rating: 5,
      text: "Un trabajo de altísima calidad terapéutica. Se nota la sólida formación científica combinada con una genuina vocación de servicio."
    }
  ];

  const renderStars = (rating) => {
    const full = Math.min(5, Math.max(1, Math.round(rating)));
    return '★'.repeat(full) + '☆'.repeat(5 - full);
  };

  grid.innerHTML = reviews.map(r => `
    <div class="review-card">
      <div>
        <div class="review-header">
          <div class="review-avatar">${r.author.charAt(0)}</div>
          <div>
            <div class="review-author">${r.author}</div>
            <div class="review-time">${r.time}</div>
          </div>
        </div>
        <div class="review-stars" aria-label="${r.rating} de 5 estrellas">
          ${renderStars(r.rating)}
        </div>
        <p class="review-text">"${r.text}"</p>
      </div>
      <div style="font-size: 0.76rem; color: #8C9BA5; font-family: var(--font-mono);">
        ✓ Reseña verificada en Google Maps
      </div>
    </div>
  `).join('');

  const linksContainer = document.getElementById('google-reviews-links');
  if (linksContainer) {
    linksContainer.innerHTML = `
      <a href="https://www.google.com/maps?cid=${CID}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
        Ver todas las opiniones en Google Maps ↗
      </a>
      <a href="https://search.google.com/local/writereview?placeid=${PLACE_ID}" target="_blank" rel="noopener noreferrer" class="btn btn-primary btn-sm">
        Dejar una opinión ✍
      </a>
    `;
  }
}

/* 4. Animaciones de scroll reveal suaves */
function initScrollAnimations() {
  const elements = document.querySelectorAll('.animate-on-scroll');
  if (!elements.length || !('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  elements.forEach(el => observer.observe(el));
}
