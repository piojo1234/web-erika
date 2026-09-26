/**
 * TESTS INTERACTIVOS — MOTOR DE CUESTIONARIOS
 * Manejo de pasos, respuestas, intl-tel-input y diagnóstico
 */

export class InteractiveQuiz {
  constructor(config) {
    this.quizType = config.quizType; // 'vocacional', 'autoestima', 'amor'
    this.totalQuestions = config.totalQuestions;
    this.diagnosisMap = config.diagnosisMap || {};
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

  initPhoneInput() {
    const phoneField = document.querySelector('#lead_phone');
    if (phoneField && window.intlTelInput) {
      this.phoneInputInstance = window.intlTelInput(phoneField, {
        initialCountry: "auto",
        geoIpLookup: (callback) => {
          fetch("https://ipapi.co/json")
            .then(res => res.json())
            .then(data => callback(data.country_code))
            .catch(() => callback("CO"));
        },
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/18.2.1/js/utils.js",
      });
    }
  }

  bindEvents() {
    const form = document.querySelector('#quizLeadForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

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
      // Paso de formulario
      const formStep = document.getElementById('step-form');
      if (formStep) formStep.classList.add('active');
      this.updateProgress(this.totalQuestions);
    }

    // Scroll al inicio de la tarjeta para móviles
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
        text.innerText = 'Paso Final: Tu Diagnóstico';
      }
    }
  }

  async handleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitQuiz');
    const originalText = btn ? btn.innerText : 'Enviar';

    if (btn) {
      btn.innerText = "Generando tu diagnóstico...";
      btn.disabled = true;
    }

    const name = document.getElementById('lead_name')?.value.trim() || 'Amigo/a';
    const email = document.getElementById('lead_email')?.value.trim() || '';
    const phone = this.phoneInputInstance ? this.phoneInputInstance.getNumber() : (document.getElementById('lead_phone')?.value || '');
    const notes = document.getElementById('lead_reto')?.value.trim() || '';

    const payload = {
      tipo_test: this.quizType,
      nombre: name,
      email: email,
      telefono: phone,
      comentario_adicional: notes,
      respuestas: this.userAnswers,
      fecha: new Date().toISOString()
    };

    try {
      // Intento de envío a webhook (opcional / configurable)
      const webhookUrl = window.TESTS_WEBHOOK_URL;
      if (webhookUrl && webhookUrl.startsWith('http')) {
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => console.log('Webhook notice:', err));
      }

      // Mostrar pantalla de éxito
      this.showSuccess(payload);
    } catch (err) {
      console.error(err);
      this.showSuccess(payload);
    } finally {
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
    }

    // Configurar botón directo de WhatsApp con prellenado de diagnóstico
    const waBtn = document.getElementById('btnWhatsAppResult');
    if (waBtn) {
      const summaryText = encodeURIComponent(
        `Hola Erika, acabo de completar el test ${this.quizType.toUpperCase()} en su sitio web.\n\n` +
        `Mi nombre es ${payload.nombre} y me gustaría recibir mi reporte personalizado y conocer los siguientes pasos.`
      );
      waBtn.href = `https://wa.me/573176588270?text=${summaryText}`;
    }
  }
}

window.InteractiveQuiz = InteractiveQuiz;
