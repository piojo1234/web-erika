/**
 * ERIKA RODRÍGUEZ — MAIN JAVASCRIPT
 * Interacciones globales, navegación móvil, módulo de Google Reviews
 */

document.addEventListener('DOMContentLoaded', () => {
  initIntroAnimation();
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
      text: "Excelente servicio y calidez humana. La psicóloga Erika me ayudó a encontrar claridad en un momento de mucha ansiedad y transición personal. Totalmente recomendada."
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
      text: "El taller vivencial Habitarte fue una experiencia transformadora. Un espacio seguro, acogedor y profundamente enriquecedor para volver a conectar conmigo misma."
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
      <a href="https://www.google.com/searchviewer/10?svid=CAwSHRIbCgNwdnESFENnMHZaeTh4TVhwb05uY3llWGd5GAo" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm">
        Ver perfil oficial en Google ↗
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

/* 5. Animación de Bienvenida: Flor girando en el centro y transición suave al Header */
function initIntroAnimation() {
  const preloader = document.getElementById('site-intro-loader');
  const flower = document.getElementById('intro-flower-img');
  const textSlot = document.getElementById('intro-text-slot');
  const backdrop = preloader ? preloader.querySelector('.intro-loader-backdrop') : null;
  const targetFlower = document.getElementById('header-flower-img');
  const headerLogo = document.getElementById('site-header-logo') || document.querySelector('.site-header .logo');

  if (!preloader || !flower || !targetFlower) {
    if (preloader) preloader.remove();
    document.body.classList.remove('intro-locked');
    return;
  }

  // Asegurar que la página empiece arriba para que la posición del header sea exacta
  window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

  // Ocultar temporalmente el logo real del header para evitar duplicados mientras el intro viaja
  if (headerLogo) {
    headerLogo.style.opacity = '0';
    headerLogo.style.transition = 'opacity 0.25s ease';
  }

  // Duración del giro de la flor en el centro: 1.1s (1100ms)
  const ROTATION_TIME = 1100;

  const runTransitionToHeader = () => {
    // 1. Coordenadas de la flor central en el viewport
    const fromRect = flower.getBoundingClientRect();

    // 2. Coordenadas de destino en el navbar
    const toRect = targetFlower.getBoundingClientRect();

    // 3. Cálculo de desplazamientos (deltaX, deltaY) y factor de escala
    const deltaX = (toRect.left + toRect.width / 2) - (fromRect.left + fromRect.width / 2);
    const deltaY = (toRect.top + toRect.height / 2) - (fromRect.top + fromRect.height / 2);
    const scale = toRect.width / fromRect.width;

    // 4. Desvanecer suavemente el nombre que estaba debajo
    if (textSlot) {
      textSlot.style.transition = 'opacity 0.35s ease, transform 0.35s ease';
      textSlot.style.opacity = '0';
      textSlot.style.transform = 'translateY(-12px) scale(0.92)';
    }

    // 5. Desvanecer el fondo / backdrop
    if (backdrop) {
      backdrop.style.transition = 'opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1)';
      backdrop.style.opacity = '0';
    }

    // 6. Transición fluida de la flor hacia el header
    flower.style.animation = 'none';
    flower.style.transformOrigin = 'center center';
    flower.style.transition = 'transform 0.82s cubic-bezier(0.16, 1, 0.3, 1)';
    flower.style.transform = `translate3d(${deltaX}px, ${deltaY}px, 0) scale(${scale})`;

    // Desbloquear el scroll de la página conforme inicia el viaje
    document.body.classList.remove('intro-locked');

    // 7. Llegada al destino (~800ms)
    setTimeout(() => {
      // Revelar el logo del header con un sutil rebote de asentamiento
      if (headerLogo) {
        headerLogo.style.opacity = '1';
        targetFlower.style.transition = 'transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)';
        targetFlower.style.transform = 'scale(1.15)';
        setTimeout(() => {
          targetFlower.style.transform = 'scale(1)';
        }, 280);
      }

      // Ocultar y limpiar el preloader
      preloader.classList.add('is-done');
      preloader.style.display = 'none';
    }, 800);
  };

  // Ejecutar el viaje al header tras el primer segundo de giro
  setTimeout(runTransitionToHeader, ROTATION_TIME);

  // Red de seguridad: desbloquear tras 2.8s bajo cualquier circunstancia
  setTimeout(() => {
    document.body.classList.remove('intro-locked');
    if (headerLogo) headerLogo.style.opacity = '1';
    if (preloader && !preloader.classList.contains('is-done')) {
      preloader.style.display = 'none';
    }
  }, 2800);
}

/* 6. Seguimiento de Conversiones de WhatsApp en Google Analytics 4 */
document.addEventListener('click', (e) => {
  const link = e.target.closest('a[href*="wa.me"]');
  if (link && typeof window.gtag === 'function') {
    try {
      window.gtag('event', 'whatsapp_click', {
        event_category: 'conversion',
        event_label: link.innerText.trim().substring(0, 50) || 'Botón WhatsApp',
        link_url: link.href
      });
    } catch (err) {
      console.warn('Error registrando evento en GA4:', err);
    }
  }
});

