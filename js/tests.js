/**
 * TESTS INTERACTIVOS — MOTOR DE CUESTIONARIOS DIAGNÓSTICOS
 * Dra. Erika Rodríguez — Psicóloga Universidad Cooperativa de Colombia (UCC)
 * Manejo de pasos interactivos, intl-tel-input con geolocalización por IP
 * y envío de leads por fetch() POST hacia Webhook de n8n.
 */

// Webhook por defecto para n8n (puede sobrescribirse en window.TESTS_WEBHOOK_URL)
const DEFAULT_N8N_WEBHOOK = "https://n8n.webhook.erikarodriguezpsicologia.com/webhook/diagnostico-leads";

export class InteractiveQuiz {
  constructor(config) {
    this.quizType = config.quizType; // 'autoestima', 'amor', 'vocacional'
    this.totalQuestions = config.totalQuestions;
    this.diagnosisMap = config.diagnosisMap || {};
    this.webhookUrl = window.TESTS_WEBHOOK_URL || DEFAULT_N8N_WEBHOOK;
    this.currentStep = 0;
    this.userAnswers = [];
    this.phoneInputInstance = null;

    this.init();
  }

  init() {
    this.initPhoneInput();
    this.bindEvents();
    this.updateProgress(0);
  }

  /**
   * Inicializa intl-tel-input con detección automática de país por IP
   */
  initPhoneInput() {
    const phoneField = document.querySelector('#lead_phone');
    if (phoneField && window.intlTelInput) {
      try {
        this.phoneInputInstance = window.intlTelInput(phoneField, {
          initialCountry: "auto",
          geoIpLookup: (callback) => {
            fetch("https://ipapi.co/json")
              .then(res => res.json())
              .then(data => callback(data && data.country_code ? data.country_code : "CO"))
              .catch(() => callback("CO"));
          },
          utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/utils.js",
          preferredCountries: ["co", "us", "es", "mx", "cl"],
          separateDialCode: true
        });
      } catch (err) {
        console.warn("Aviso al inicializar intl-tel-input:", err);
      }
    }
  }

  bindEvents() {
    const form = document.querySelector('#quizLeadForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  /**
   * Avanza entre preguntas o pasos del diagnóstico
   */
  goToStep(stepNumber, answer = null) {
    if (answer !== null) {
      this.userAnswers.push(answer);
    }

    this.currentStep = stepNumber;
    const allSteps = document.querySelectorAll('.quiz-step');
    allSteps.forEach(el => el.classList.remove('active'));

    if (stepNumber === 0) {
      // Intro
      const intro = document.getElementById('step-intro');
      if (intro) intro.classList.add('active');
      this.updateProgress(0);
    } else if (stepNumber <= this.totalQuestions) {
      // Pregunta actual
      const qStep = document.getElementById(`step-q${stepNumber}`);
      if (qStep) qStep.classList.add('active');
      this.updateProgress(stepNumber);
    } else {
      // Paso de formulario de captura de lead
      const formStep = document.getElementById('step-form');
      if (formStep) formStep.classList.add('active');
      this.updateProgress(this.totalQuestions);
    }

    // Scroll suave a la tarjeta para dispositivos móviles
    const card = document.querySelector('.quiz-card');
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  updateProgress(current) {
    const fill = document.getElementById('quiz-progress-fill');
    const text = document.getElementById('quiz-progress-text');
    const percent = Math.round((current / this.totalQuestions) * 100);

    if (fill) fill.style.width = `${percent}%`;
    if (text) {
      if (current === 0) {
        text.innerText = 'Inicio';
      } else if (current <= this.totalQuestions) {
        text.innerText = `Pregunta ${current} de ${this.totalQuestions} (${percent}%)`;
      } else {
        text.innerText = 'Paso Final: Generar Diagnóstico';
      }
    }
  }

  /**
   * Envío del formulario de captura hacia el Webhook de n8n
   */
  async handleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitQuiz');
    const originalText = btn ? btn.innerText : 'Generar Mi Diagnóstico';

    if (btn) {
      btn.innerText = "Procesando tu diagnóstico profesional... ⏳";
      btn.disabled = true;
    }

    const name = document.getElementById('lead_name')?.value.trim() || 'Participante';
    const email = document.getElementById('lead_email')?.value.trim() || '';
    
    // Obtener número internacional formateado si existe intl-tel-input
    let phone = '';
    if (this.phoneInputInstance) {
      phone = this.phoneInputInstance.getNumber();
    } else {
      phone = document.getElementById('lead_phone')?.value.trim() || '';
    }

    const notes = document.getElementById('lead_reto')?.value.trim() || '';

    // Estructura completa del Lead para el Webhook de n8n
    const payload = {
      tipo_test: this.quizType,
      nombre: name,
      email: email,
      telefono: phone,
      comentario_adicional: notes,
      respuestas: this.userAnswers,
      origen_url: window.location.href,
      user_agent: navigator.userAgent,
      fecha: new Date().toISOString()
    };

    // Respaldo en LocalStorage
    try {
      localStorage.setItem(`erika_lead_quiz_${this.quizType}`, JSON.stringify(payload));
    } catch (e) {}

    // Envío por fetch() POST hacia el Webhook de n8n
    try {
      if (this.webhookUrl && this.webhookUrl.startsWith('http')) {
        await fetch(this.webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          },
          body: JSON.stringify(payload)
        }).catch(err => {
          console.warn("Nota: Webhook n8n no respondió directamente (posible CORS o webhook demo):", err);
        });
      }
    } catch (err) {
      console.warn("Aviso al contactar webhook de n8n:", err);
    } finally {
      // Siempre mostramos el diagnóstico sin bloquear a la persona usuaria
      this.showSuccess(payload);

      if (btn) {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    }
  }

  showSuccess(payload) {
    const allSteps = document.querySelectorAll('.quiz-step');
    allSteps.forEach(el => el.classList.remove('active'));

    const successStep = document.getElementById('step-success');
    if (successStep) {
      successStep.classList.add('active');
      successStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Configurar enlace directo a WhatsApp con mensaje personalizado
    const waBtn = document.getElementById('btnWhatsAppResult');
    if (waBtn) {
      const typeLabel = {
        'autoestima': 'Autoestima & Límites Personales',
        'amor': 'Los 5 Lenguajes del Amor',
        'vocacional': 'Orientación Vocacional & Propósito'
      }[this.quizType] || this.quizType.toUpperCase();

      const summaryText = encodeURIComponent(
        `Hola Dra. Erika Rodríguez, acabo de completar el Test de ${typeLabel} en su sitio web.\n\n` +
        `Mi nombre es ${payload.nombre} (${payload.telefono || ''}).\n` +
        `Me gustaría recibir mis recomendaciones personalizadas y conocer cómo podemos trabajar juntas.`
      );
      waBtn.href = `https://wa.me/573219315490?text=${summaryText}`;
    }
  }
}

// Registro global
window.InteractiveQuiz = InteractiveQuiz;
