/**
 * TESTS INTERACTIVOS — MOTOR DE CUESTIONARIOS DIAGNÓSTICOS & EMBUDOS DE CONVERSIÓN
 * Psicóloga Erika Rodríguez — Egresada Universidad Cooperativa de Colombia (UCC), ReTHUS
 * 
 * Funcionalidades:
 * - Progresión por pasos y validación
 * - Detección telefónica internacional intl-tel-input
 * - Algoritmos clínicos dinámicos (Autoestima, Lenguajes del Amor, Vocacional)
 * - Renderizado de diagnósticos personalizados con prescripción clínica directa
 * - Medición de conversiones en Google Analytics 4 (GA4 ID: G-2HV6E6V8L0)
 * - Botones inteligentes hacia WhatsApp con mensajes contextualizados
 * - Respaldo seguro en LocalStorage y webhook
 */

const DEFAULT_N8N_WEBHOOK = "https://n8n.webhook.erikarodriguezpsicologia.com/webhook/diagnostico-leads";

export class InteractiveQuiz {
  constructor(config) {
    this.quizType = config.quizType; // 'autoestima', 'amor', 'vocacional'
    this.totalQuestions = config.totalQuestions;
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
   * Inicializa intl-tel-input con detección de país
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
        console.warn("Aviso intl-tel-input:", err);
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
      const intro = document.getElementById('step-intro');
      if (intro) intro.classList.add('active');
      this.updateProgress(0);
    } else if (stepNumber <= this.totalQuestions) {
      const qStep = document.getElementById(`step-q${stepNumber}`);
      if (qStep) qStep.classList.add('active');
      this.updateProgress(stepNumber);
    } else {
      const formStep = document.getElementById('step-form');
      if (formStep) formStep.classList.add('active');
      this.updateProgress(this.totalQuestions);
    }

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
   * Envío del formulario de captura y procesamiento
   */
  async handleSubmit(e) {
    e.preventDefault();
    const btn = document.getElementById('btnSubmitQuiz');
    const originalText = btn ? btn.innerText : 'Generar Mi Diagnóstico';

    if (btn) {
      btn.innerText = "Tabulando tu diagnóstico clínico... ⏳";
      btn.disabled = true;
    }

    const name = document.getElementById('lead_name')?.value.trim() || 'Participante';
    const email = document.getElementById('lead_email')?.value.trim() || '';
    
    let phone = '';
    if (this.phoneInputInstance) {
      phone = this.phoneInputInstance.getNumber();
    } else {
      phone = document.getElementById('lead_phone')?.value.trim() || '';
    }

    const notes = document.getElementById('lead_reto')?.value.trim() || '';

    // Estructura del Lead
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
      const history = JSON.parse(localStorage.getItem('erika_all_leads') || '[]');
      history.push(payload);
      localStorage.setItem('erika_all_leads', JSON.stringify(history));
    } catch (e) {}

    // Envío asíncrono al Webhook (silencioso si no responde)
    try {
      if (this.webhookUrl && this.webhookUrl.startsWith('http')) {
        await fetch(this.webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(err => {
          console.warn("Webhook n8n en segundo plano:", err);
        });
      }
    } catch (err) {
      console.warn("Aviso webhook:", err);
    } finally {
      this.showSuccess(payload);

      if (btn) {
        btn.innerText = originalText;
        btn.disabled = false;
      }
    }
  }

  /**
   * Cálculo clínico dinámico según las respuestas del usuario
   */
  computeDiagnosis(payload) {
    const answers = this.userAnswers;

    if (this.quizType === 'autoestima') {
      let score = 0;
      answers.forEach(ans => {
        const text = String(ans).toLowerCase();
        if (text.includes('crítico') || text.includes('cediendo') || text.includes('no los merezco') || text.includes('cuesta mucho decir que no') || text.includes('dudo mucho')) {
          score += 1;
        } else if (text.includes('frustro') || text.includes('dependiendo') || text.includes('a veces') || text.includes('evalúo opciones')) {
          score += 2;
        } else {
          score += 3;
        }
      });
      // Fallback si no hay respuestas registradas
      if (score === 0) score = 8;

      if (score <= 8) {
        return {
          icon: '🌱',
          badge: 'NIVEL PRIORITARIO • AUTOEXIGENCIA ALTA',
          profileTitle: 'Autoexigencia Severa y Límites Vulnerables',
          scoreLabel: `Puntaje de Asertividad: ${score}/15`,
          summary: 'Tus respuestas reflejan una voz interior altamente perfeccionista y una marcada dificultad para decir "no" por temor a decepcionar o generar conflicto. Sueles anteponer las necesidades de los demás a costa de tu propio descanso y paz mental.',
          clinicalInsight: 'La autoexigencia extrema opera como un mecanismo de defensa para buscar validación, pero a mediano plazo genera agotamiento emocional, síndrome del impostor y resentimiento silencioso.',
          prescription: 'Terapia de Autoestima & Reconstrucción del Diálogo Interno con la psicóloga Erika Rodríguez. Es momento de aprender a poner límites firmes sin sentir culpa.',
          recommendationName: 'Programa "Habitarte en 90 Días" / Sesión Individual',
          recommendationUrl: 'index.html#recursos',
          recommendationBtnText: 'Conocer Programa Habitarte en 90 Días ↗',
          whatsappIntro: `Hola Dra. Erika, completé el Test de Autoestima. Mi perfil arrojó *Autoexigencia Severa y Límites Vulnerables* (Puntaje: ${score}/15). ${payload.comentario_adicional ? `Mi mayor reto hoy es: "${payload.comentario_adicional}". ` : ''}Deseo agendar una sesión diagnóstica y recibir mis pautas personalizadas.`
        };
      } else if (score <= 12) {
        return {
          icon: '🌿',
          badge: 'NIVEL INTERMEDIO • EN RECONSTRUCCIÓN',
          profileTitle: 'Autoestima en Reconstrucción / Fluctuante',
          scoreLabel: `Puntaje de Asertividad: ${score}/15`,
          summary: 'Reconoces tus capacidades y virtudes en varias facetas, pero en momentos de alta exigencia o vínculos cercanos tiendes a dudar de ti mismo/a, minimizas tus logros y necesitas aprobación externa para sentir certeza.',
          clinicalInsight: 'Tu autoestima es vulnerable a las circunstancias externas. Trabajar en el autoconcepto nuclear te permitirá tomar decisiones con serenidad sin depender del reconocimiento ajeno.',
          prescription: 'Consolidación de la Autonomía Emocional y Diálogo Compasivo. Ejercicios clínicos para blindar tu seguridad frente a la incertidumbre.',
          recommendationName: 'Cuaderno de Trabajo de Autoestima & Consulta Terapéutica',
          recommendationUrl: 'index.html#recursos',
          recommendationBtnText: 'Ver Cuadernos de Autoestima y Recursos ↗',
          whatsappIntro: `Hola Dra. Erika, completé el Test de Autoestima. Mi perfil arrojó *Autoestima en Reconstrucción* (Puntaje: ${score}/15). ${payload.comentario_adicional ? `Mi mayor reto hoy es: "${payload.comentario_adicional}". ` : ''}Me gustaría recibir la guía recomendada y consultar sobre una consulta individual.`
        };
      } else {
        return {
          icon: '🌸',
          badge: 'NIVEL CONSCIENTE • BASE SALUDABLE',
          profileTitle: 'Autoestima Consciente y Diálogo Asertivo',
          scoreLabel: `Puntaje de Asertividad: ${score}/15`,
          summary: 'Mantienes una relación compasiva y respetuosa contigo mismo/a. Aceptas el aprecio sincero, reconoces tus errores como oportunidades de aprendizaje y sabes poner límites sanos sin agredir ni someterte.',
          clinicalInsight: 'Cuentas con una estructura emocional madura. Tu siguiente paso evolutivo es alinear esta estabilidad con proyectos de vida de mayor impacto y plenitud.',
          prescription: 'Sesiones de Claridad de Vida y Expansión de Proyectos con Erika Rodríguez para materializar metas profundas conservando tu equilibrio interior.',
          recommendationName: 'Sesión de Claridad & Propósito con Erika Rodríguez',
          recommendationUrl: 'psicologa-villavicencio.html',
          recommendationBtnText: 'Consultar por Sesión Presencial u Online ↗',
          whatsappIntro: `Hola Dra. Erika, completé el Test de Autoestima con resultado *Autoestima Consciente y Asertiva* (${score}/15). ${payload.comentario_adicional ? `Mi reto actual: "${payload.comentario_adicional}". ` : ''}Deseo consultar sobre sesiones de crecimiento personal y propósito.`
        };
      }
    }

    if (this.quizType === 'amor') {
      const counts = {
        'Palabras de Afirmación': 0,
        'Tiempo de Calidad': 0,
        'Actos de Servicio': 0,
        'Contacto Físico': 0,
        'Regalos & Detalles': 0
      };

      answers.forEach(ans => {
        const text = String(ans).toLowerCase();
        if (text.includes('palabra') || text.includes('carta') || text.includes('aprecio sincero') || text.includes('admira')) {
          counts['Palabras de Afirmación']++;
        } else if (text.includes('tiempo') || text.includes('escucharme') || text.includes('pantalla') || text.includes('conversación profunda')) {
          counts['Tiempo de Calidad']++;
        } else if (text.includes('servicio') || text.includes('tarea pesada') || text.includes('cena') || text.includes('apoyarme')) {
          counts['Actos de Servicio']++;
        } else if (text.includes('contacto') || text.includes('abrace') || text.includes('masaje') || text.includes('mano')) {
          counts['Contacto Físico']++;
        } else if (text.includes('detalle') || text.includes('regalo') || text.includes('postre')) {
          counts['Regalos & Detalles']++;
        }
      });

      const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      const primaryLang = sorted[0][0];
      const secondaryLang = sorted[1][1] > 0 ? sorted[1][0] : 'Tiempo de Calidad';

      const descriptions = {
        'Palabras de Afirmación': 'Tu corazón se nutre del reconocimiento verbal sincero, palabras de admiración y notas de aprecio. Las críticas destructivas o el silencio prolongado te lastiman con especial profundidad.',
        'Tiempo de Calidad': 'Tu mayor prueba de amor es la atención plena, mirarse a los ojos y compartir conversaciones o momentos sin teléfonos celulares ni distracciones. Sentir que tu pareja está distraída te hace sentir invisible.',
        'Actos de Servicio': 'Para ti el amor verdadero se traduce en hechos tangibles. Que tu pareja tenga la iniciativa espontánea de aliviar tus cargas o resolver situaciones cotidianas te hace sentir profundamente cuidado/a y en equipo.',
        'Contacto Físico': 'Los abrazos espontáneos, tomarse de la mano, las caricias y la cercanía física son tu canal directo de recarga emocional y seguridad afectiva.',
        'Regalos & Detalles': 'Para ti los obsequios no tienen que ver con el valor monetario, sino con el mensaje simbólico: "vi esto y me acordé de ti". Cada detalle es una prueba física de que existes en sus pensamientos.'
      };

      return {
        icon: '🤍',
        badge: 'DIAGNÓSTICO VINCULAR • LOS 5 LENGUAJES DEL AMOR',
        profileTitle: `Lenguaje Primario: ${primaryLang}`,
        scoreLabel: `Secundario: ${secondaryLang}`,
        summary: `Tus elecciones revelan que tu lenguaje principal de afecto es **${primaryLang}**, complementado fuertemente por **${secondaryLang}**. ${descriptions[primaryLang]}`,
        clinicalInsight: 'El conflicto más frecuente en pareja surge cuando damos amor en nuestro propio idioma esperando que el otro lo traduzca por arte de magia. Cuando cada miembro aprende a hablar el dialecto emocional del otro, los reproches se disuelven y renace la intimidad.',
        prescription: 'Terapia de Pareja o Consulta Individual de Vínculos con Erika Rodríguez (Presencial en Villavicencio u Online). Descubran cómo alinear sus lenguajes y sanar la comunicación.',
        recommendationName: 'Terapia de Pareja & Caja de Conexión de Pareja',
        recommendationUrl: 'psicologa-villavicencio.html#pareja',
        recommendationBtnText: 'Consultar por Terapia de Pareja en Villavicencio u Online ↗',
        whatsappIntro: `Hola Dra. Erika, completé el Test de Lenguajes del Amor. Mi lenguaje primario fue *${primaryLang}* (y secundario *${secondaryLang}*). ${payload.comentario_adicional ? `Nuestro desafío actual es: "${payload.comentario_adicional}". ` : ''}Deseo agendar una sesión de pareja / asesoría vincular con usted.`
      };
    }

    if (this.quizType === 'vocacional') {
      let mainObstacle = 'Falta de un método estructurado';
      let mainMoment = 'Búsqueda de claridad profesional';

      answers.forEach(ans => {
        const text = String(ans).toLowerCase();
        if (text.includes('miedo a la inestabilidad') || text.includes('viable')) {
          mainObstacle = 'Miedo a la inestabilidad económica y financiera';
        } else if (text.includes('impostor')) {
          mainObstacle = 'Síndrome del impostor y duda de las propias capacidades';
        } else if (text.includes('presión')) {
          mainObstacle = 'Presión social o mandatos familiares sobre el deber ser';
        } else if (text.includes('falta de un plan')) {
          mainObstacle = 'Ausencia de un plan paso a paso y dispersión de ideas';
        }

        if (text.includes('drena')) {
          mainMoment = 'Agotamiento en el trabajo actual y desconexión de propósito';
        } else if (text.includes('transición')) {
          mainMoment = 'Deseo de transición laboral segura o emprendimiento';
        }
      });

      return {
        icon: '🧭',
        badge: 'ORIENTACIÓN VOCACIONAL INTERDISCIPLINAR',
        profileTitle: 'Perfil de Transición de Carrera & Propósito Vital',
        scoreLabel: `Foco: ${mainMoment}`,
        summary: `Tus respuestas indican un perfil con alto potencial analítico y deseos de autorrealización, pero frenado principalmente por: **${mainObstacle}**.`,
        clinicalInsight: 'La orientación vocacional madura no se soluciona con un simple test de aptitudes. Requiere un abordaje interdisciplinar que combine la psicología de la autoestima (desactivar el miedo al juicio y la culpa) con el criterio pedagógico de educadores expertos para trazar una ruta económica y profesional viable.',
        prescription: 'Postulación prioritaria al Programa Proyéctate de Erika Rodríguez: 4 fases de autoconocimiento, baterías vocacionales, mapeo de talentos junto a educadores expertos y plan de acción de 90 días.',
        recommendationName: 'Programa "Proyéctate" (Psicología + Educadores Expertos)',
        recommendationUrl: 'proyectate.html',
        recommendationBtnText: 'Ver Metodología Completa del Programa Proyéctate ↗',
        whatsappIntro: `Hola Dra. Erika, realicé el Test Vocacional en su web. Mi perfil es *Transición de Carrera & Propósito* y mi principal obstáculo es: *${mainObstacle}*. ${payload.comentario_adicional ? `Mi profesión/reto: "${payload.comentario_adicional}". ` : ''}Deseo postularme al Programa Proyéctate y agendar una llamada diagnóstica.`
      };
    }

    // Fallback general
    return {
      icon: '✨',
      badge: 'DIAGNÓSTICO COMPLETADO',
      profileTitle: 'Mapa de Bienestar Personal',
      scoreLabel: 'Evaluación Completada',
      summary: 'Tus respuestas han sido procesadas con éxito por el sistema clínico de Erika Rodríguez (UCC).',
      clinicalInsight: 'Cuentas con las herramientas para iniciar un proceso consciente de transformación.',
      prescription: 'Acompañamiento personalizado presencial en Villavicencio o en modalidad online.',
      recommendationName: 'Consulta Psicológica con Erika Rodríguez',
      recommendationUrl: 'index.html#contacto',
      recommendationBtnText: 'Agendar Sesión con Erika Rodríguez ↗',
      whatsappIntro: `Hola Dra. Erika Rodríguez, completé el test en su sitio web y deseo recibir mis recomendaciones personalizadas.`
    };
  }

  /**
   * Muestra la pantalla de éxito con diagnósticos dinámicos y seguimiento GA4
   */
  showSuccess(payload) {
    const diagnosis = this.computeDiagnosis(payload);

    const allSteps = document.querySelectorAll('.quiz-step');
    allSteps.forEach(el => el.classList.remove('active'));

    const successStep = document.getElementById('step-success');
    if (successStep) {
      // Reemplazo completo del contenido del paso de éxito con el diseño optimizado
      successStep.innerHTML = `
        <div class="quiz-result-header animate-on-scroll">
          <div class="quiz-result-icon">${diagnosis.icon}</div>
          <div class="quiz-result-badge">${diagnosis.badge}</div>
          <h2 class="quiz-result-title">${diagnosis.profileTitle}</h2>
          <div class="quiz-result-subtitle">${diagnosis.scoreLabel} • Para ${payload.nombre}</div>
        </div>

        <div class="diagnosis-result-box">
          <h4>🔍 Lectura Terapéutica Personalizada:</h4>
          <p>${diagnosis.summary}</p>
          <div style="margin-top: 14px; padding-top: 14px; border-top: 1px dashed var(--beige-dark);">
            <strong style="color: var(--teal-dark);">💡 Clave Clínica:</strong>
            <p style="margin-top: 6px; font-size: 0.92rem; color: var(--text-muted);">${diagnosis.clinicalInsight}</p>
          </div>
        </div>

        <div class="quiz-prescription-card">
          <div class="rx-badge">📋 PRESCRIPCIÓN CLÍNICA RECOMENDADA</div>
          <h4 style="margin: 8px 0; color: var(--teal-dark);">${diagnosis.prescription}</h4>
          <p style="font-size: 0.9rem; color: var(--text-muted); margin-bottom: 0;">
            Recurso vinculado: <strong>${diagnosis.recommendationName}</strong>
          </p>
        </div>

        <div class="quiz-actions-container">
          <a id="btnWhatsAppResult" href="https://wa.me/573219315490?text=${encodeURIComponent(diagnosis.whatsappIntro)}" target="_blank" rel="noopener noreferrer" class="btn btn-terracota btn-lg" style="width: 100%; box-shadow: var(--shadow-terracota);">
            Recibir Recomendaciones por WhatsApp con Erika 💬
          </a>
          <a href="${diagnosis.recommendationUrl}" class="btn btn-secondary btn-lg" style="width: 100%;">
            ${diagnosis.recommendationBtnText}
          </a>
        </div>

        <div style="margin-top: 22px; font-size: 0.78rem; color: #8C9BA5; text-align: center;">
          ✓ Diagnóstico confidencial procesado bajo criterios de la Ley 1090 de 2006 (Código Deontológico de Psicología).
        </div>
      `;

      successStep.classList.add('active');
      successStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // DISPARO DE EVENTOS DE CONVERSIÓN EN GOOGLE ANALYTICS 4
    if (typeof window.gtag === 'function') {
      try {
        // Evento 1: Generación de Lead
        window.gtag('event', 'generate_lead', {
          event_category: 'quiz',
          quiz_type: this.quizType,
          lead_name: payload.nombre,
          lead_email: payload.email ? 'provided' : 'empty'
        });

        // Evento 2: Diagnóstico Completado con Arquetipo
        window.gtag('event', 'quiz_completed', {
          event_category: 'diagnostico',
          quiz_type: this.quizType,
          profile_result: diagnosis.profileTitle
        });
      } catch (err) {
        console.warn("Error al emitir eventos a GA4:", err);
      }
    }

    // Listener para el clic del botón de WhatsApp en la pantalla de resultados
    const waBtn = document.getElementById('btnWhatsAppResult');
    if (waBtn) {
      waBtn.addEventListener('click', () => {
        if (typeof window.gtag === 'function') {
          window.gtag('event', 'quiz_whatsapp_click', {
            event_category: 'conversion',
            quiz_type: this.quizType,
            profile: diagnosis.profileTitle
          });
        }
      });
    }
  }
}

// Registro global
window.InteractiveQuiz = InteractiveQuiz;
