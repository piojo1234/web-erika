/**
 * PROYÉCTATE LANDING — JAVASCRIPT
 * Acordeón de FAQs, interacciones y manejo de consultas
 */

document.addEventListener('DOMContentLoaded', () => {
  initAccordion();
});

function initAccordion() {
  const triggers = document.querySelectorAll('.accordion-trigger');

  triggers.forEach(trigger => {
    trigger.addEventListener('click', () => {
      const item = trigger.closest('.accordion-item');
      const isOpen = item.classList.contains('active');

      // Cerrar otros acordeones si se prefiere solo uno abierto
      document.querySelectorAll('.accordion-item').forEach(other => {
        if (other !== item) {
          other.classList.remove('active');
        }
      });

      // Alternar estado actual
      if (isOpen) {
        item.classList.remove('active');
      } else {
        item.classList.add('active');
      }
    });
  });
}
