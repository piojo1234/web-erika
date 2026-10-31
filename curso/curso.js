/**
 * MANUAL DEL MIGRANTE: 7 DÍAS DE RECONSTRUCCIÓN EMOCIONAL
 * Lógica Frontend & Conexión Supabase Cloud
 * Dra. Erika Rodríguez — Psicóloga Universidad Cooperativa de Colombia (UCC)
 */

// 1. OBJETO DE CONTENIDOS EN JAVASCRIPT (Suministro de datos de los 7 Días)
export const CONTENIDOS_GUIA = {
  1: {
    titulo: "Día 1: Reconciliación con tu Historia y Duelo Migratorio",
    concepto: "El duelo migratorio no es debilidad, es el costo de tu valentía. Es normal extrañar tu tierra, los olores, la comida y la cercanía de tu gente sin sentirte culpable.",
    audio_url: "audio/dia1.mp3",
    preguntas: [
      "1. En una sola frase, ¿qué es lo que más has extrañado de tu país esta semana?",
      "2. ¿En qué momento del día sientes que la nostalgia se vuelve más pesada?"
    ]
  },
  2: {
    titulo: "Día 2: Desmontando el Síndrome de la Impostora",
    concepto: "Tu valor personal no lo define tu estatus migratorio ni el empleo que realizas hoy. La resiliencia que te trajo aquí es tu mayor credencial.",
    audio_url: "https://tu-supabase-storage/audios/dia2.mp3",
    preguntas: [
      "1. Escribe 3 situaciones difíciles que ya lograste superar en tu vida.",
      "2. ¿De qué fortaleza tuya te sientes orgullosa hoy?"
    ]
  },
  3: {
    titulo: "Día 3: Sanar la Culpabilidad y el Aislamiento",
    concepto: "Trabajar sin parar y no permitirte un descanso es una trampa. La culpa por cuidarte a ti misma es una emoción prestada que debes aprender a soltar.",
    audio_url: "https://tu-supabase-storage/audios/dia3.mp3",
    preguntas: [
      "1. ¿Qué actividad de 15 minutos te regalarías hoy únicamente para tu disfrute?",
      "2. Escribe una afirmación para liberarte de la culpa cuando descansas."
    ]
  },
  4: {
    titulo: "Día 4: Aprender a Decir NO (Límites Emocionales y Financieros)",
    concepto: "Poner límites a la familia en tu país no es dejar de amarlos, es proteger tu salud mental y tu estabilidad en el nuevo país.",
    audio_url: "https://tu-supabase-storage/audios/dia4.mp3",
    preguntas: [
      "1. ¿En qué situación reciente te costó poner un límite claro?",
      "2. Escribe el mensaje asertivo que te gustaría enviarle a esa persona."
    ]
  },
  5: {
    titulo: "Día 5: Desarticular la Voz Crítica Interna",
    concepto: "La forma en que te hablas a ti misma determina tu paz. Es momento de reemplazar a la jueza interna por una voz compasiva y mentora.",
    audio_url: "https://tu-supabase-storage/audios/dia5.mp3",
    preguntas: [
      "1. ¿Cuál es el pensamiento negativo automático que más se repite en tu mente?",
      "2. ¿Cómo le responderías a ese pensamiento si le hablaras a tu mejor amiga?"
    ]
  },
  6: {
    titulo: "Día 6: Redefinir tus Metas en el Nuevo País",
    concepto: "No viniste a Estados Unidos solo a pagar cuentas. Es momento de reconectar con el sueño y el propósito real que te motivó a emigrar.",
    audio_url: "https://tu-supabase-storage/audios/dia6.mp3",
    preguntas: [
      "1. ¿Cuál era tu sueño principal al tomar la decisión de emigrar?",
      "2. Nombra 2 metas personales (no laborales) que quieras cumplir este año."
    ]
  },
  7: {
    titulo: "Día 7: Tu Plan de Mantenimiento Emocional",
    concepto: "La salud mental es una práctica diaria. Construye tu botiquín de emergencia para los días en que vuelva la tormenta o la sobrecarga.",
    audio_url: "https://tu-supabase-storage/audios/dia7.mp3",
    preguntas: [
      "1. Lista 3 anclas de paz (una canción, una respiración, llamar a alguien) para tus días difíciles.",
      "2. Escribe una nota de agradecimiento a la mujer valiente que eres hoy."
    ]
  }
};

// 2. CONFIGURACIÓN DEL CLIENTE SUPABASE
// Puedes definir estas variables globalmente en window o reemplazarlas con tus credenciales de Supabase Cloud
const SUPABASE_URL = window.SUPABASE_URL || "https://autoestima-workbook-app.supabase.co";
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || "tu-anon-key-publica";

// Inicialización del cliente Supabase mediante CDN
let supabase = null;
if (window.supabase && typeof window.supabase.createClient === 'function') {
  try {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (err) {
    console.warn("Aviso al inicializar cliente Supabase:", err);
  }
}

// Estado de la aplicación
export class ManualMigranteApp {
  constructor() {
    this.currentDay = 1;
    this.currentUser = null;
    this.token = null;
    this.savedResponsesMap = {}; // Cache de respuestas { [dia]: { respuestas, actualizado_en } }
    this.isDemoMode = false;
  }

  async init() {
    // 1. Leer el parámetro 'token' de la URL
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');

    // Validación de Token
    if (!token) {
      this.showInvalidToken("No se encontró ningún enlace de acceso en la dirección URL.");
      return;
    }

    this.token = token;

    // Modo demo para previsualización inmediata si se pasa ?token=demo
    if (token === 'demo' || token === 'a4f8e912c3b5') {
      this.isDemoMode = true;
      this.currentUser = {
        id: 'user-demo-migrante-01',
        nombre: 'Valiente',
        token_acceso: token,
        email: 'valiente@ejemplo.com'
      };
      this.setupPortal();
      return;
    }

    // Consulta en Supabase mediante la función RPC segura 'guia_obtener_usuario'
    try {
      if (!supabase || SUPABASE_ANON_KEY === 'tu-anon-key-publica') {
        console.info("Credenciales de Supabase en modo desarrollo o pendientes. Abriendo sesión demostrativa.");
        this.isDemoMode = true;
        this.currentUser = {
          id: `usr-${token.substring(0, 8)}`,
          nombre: 'Compañera de Ruta',
          token_acceso: token
        };
        this.setupPortal();
        return;
      }

      const { data: u, error } = await supabase.rpc('guia_obtener_usuario', { p_token: token });

      if (error || !u || !u.length) {
        console.warn("Token no encontrado o inválido en RPC guia_obtener_usuario:", error);
        this.showInvalidToken("El enlace que estás utilizando no coincide con ningún registro activo o ya ha caducado.");
        return;
      }

      this.currentUser = u[0];
      this.setupPortal();

    } catch (err) {
      console.error("Error al verificar token con Supabase:", err);
      this.showInvalidToken("Ocurrió un error al verificar tu acceso. Por favor comunícate con nosotros.");
    }
  }

  showInvalidToken(customMsg) {
    const invalidScreen = document.getElementById('invalidTokenScreen');
    const validPortal = document.getElementById('validPortal');
    const descEl = document.getElementById('invalidReasonText');

    if (descEl && customMsg) {
      descEl.innerText = customMsg;
    }

    if (invalidScreen) invalidScreen.style.display = 'block';
    if (validPortal) validPortal.style.display = 'none';
  }

  async setupPortal() {
    const invalidScreen = document.getElementById('invalidTokenScreen');
    const validPortal = document.getElementById('validPortal');

    if (invalidScreen) invalidScreen.style.display = 'none';
    if (validPortal) validPortal.style.display = 'block';

    // Recuperar nombre: 1) parámetro 'nombre' en URL, 2) caché local si lo editó, 3) nombre del usuario
    const urlParams = new URLSearchParams(window.location.search);
    const urlName = urlParams.get('nombre');
    const cachedCustomName = localStorage.getItem(`erika_custom_name_${this.currentUser.id || this.token}`);
    
    if (urlName && urlName.trim()) {
      this.currentUser.nombre = decodeURIComponent(urlName.trim());
    } else if (cachedCustomName) {
      this.currentUser.nombre = cachedCustomName;
    }

    // Aplicar personalización del nombre en toda la plataforma
    this.applyUserName(this.currentUser.nombre || 'Valiente');

    // Manejo de dedicatoria si el cuaderno es un regalo
    this.setupGiftDedication();

    // Cargar historial de respuestas desde Supabase (o LocalStorage como respaldo)
    await this.loadAllUserResponses();

    // Renderizar las pestañas de navegación (Días 1 al 7)
    this.renderTabs();

    // Cargar el Día 1 (o el primer día sin responder)
    this.selectDay(1);

    // Enlazar eventos de guardado y navegación
    this.bindEvents();
  }

  applyUserName(name) {
    if (!name) return;
    this.currentUser.nombre = name;

    const userNameEl = document.getElementById('userName');
    if (userNameEl) userNameEl.innerText = name;

    // Actualizar todos los elementos con clase .user-inline-name
    document.querySelectorAll('.user-inline-name').forEach(el => {
      el.innerText = name;
    });

    // Actualizar badge del día
    const dayBadgeEl = document.getElementById('dayBadge');
    if (dayBadgeEl) {
      dayBadgeEl.innerText = `DÍA ${this.currentDay} DE 7 • CUADERNO PERSONAL DE ${name.toUpperCase()}`;
    }
  }

  setupGiftDedication() {
    const urlParams = new URLSearchParams(window.location.search);
    const giftFrom = urlParams.get('regalo_de') || this.currentUser.regalo_de;
    const giftMsg = urlParams.get('mensaje') || this.currentUser.mensaje_regalo;

    const giftBox = document.getElementById('giftDedicationBox');
    const giftMsgEl = document.getElementById('giftMessageText');
    const giftAuthorEl = document.getElementById('giftAuthorText');

    if (giftBox && (giftFrom || giftMsg)) {
      if (giftMsgEl && giftMsg) {
        giftMsgEl.innerText = `"${decodeURIComponent(giftMsg)}"`;
      } else if (giftMsgEl) {
        giftMsgEl.innerText = `"Este cuaderno es un regalo especial para acompañarte en tu camino y recordarte lo valiente que eres."`;
      }

      if (giftAuthorEl && giftFrom) {
        giftAuthorEl.innerText = `— Con todo el cariño de ${decodeURIComponent(giftFrom)}`;
      }

      giftBox.style.display = 'flex';
    }
  }

  async loadAllUserResponses() {
    this.savedResponsesMap = {};

    // 1. Cargar desde Supabase mediante la función RPC segura 'guia_obtener_respuestas'
    if (supabase && !this.isDemoMode && this.token) {
      try {
        const { data: guardadas, error } = await supabase.rpc('guia_obtener_respuestas', { p_token: this.token });

        if (!error && Array.isArray(guardadas)) {
          guardadas.forEach(item => {
            this.savedResponsesMap[item.dia] = item;
          });
        } else if (error) {
          console.warn("Aviso al consultar respuestas por RPC:", error);
        }
      } catch (e) {
        console.warn("Aviso al consultar respuestas en Supabase:", e);
      }
    }

    // 2. Respaldo local en LocalStorage (Offline-first)
    const storageKeyId = this.currentUser?.id || this.token;
    for (let d = 1; d <= 7; d++) {
      const localKey = `erika_guia_resp_${storageKeyId}_dia_${d}`;
      const localData = localStorage.getItem(localKey);
      if (localData && !this.savedResponsesMap[d]) {
        try {
          this.savedResponsesMap[d] = JSON.parse(localData);
        } catch (e) {}
      }
    }

    this.updateProgressBar();
  }

  renderTabs() {
    const tabsContainer = document.getElementById('daysTabsList');
    if (!tabsContainer) return;

    tabsContainer.innerHTML = '';

    for (let d = 1; d <= 7; d++) {
      const dayData = CONTENIDOS_GUIA[d];
      const isCompleted = !!this.savedResponsesMap[d];
      const isActive = d === this.currentDay;

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `day-tab-btn ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`;
      btn.id = `tab-day-${d}`;
      btn.setAttribute('aria-label', `Ir al Día ${d}`);

      // Short label del día
      const shortTitle = dayData.titulo.split(':')[1]?.trim() || `Día ${d}`;

      btn.innerHTML = `
        <div class="day-tab-header">
          <span class="day-tab-num">Día ${d}</span>
          <span class="day-tab-check" id="tab-check-${d}">${isCompleted ? '✓' : d}</span>
        </div>
        <span class="day-tab-name" title="${shortTitle}">${shortTitle}</span>
      `;

      btn.addEventListener('click', () => this.selectDay(d));
      tabsContainer.appendChild(btn);
    }
  }

  async selectDay(dayNumber) {
    if (!CONTENIDOS_GUIA[dayNumber]) return;

    this.currentDay = dayNumber;
    const dayData = CONTENIDOS_GUIA[dayNumber];

    // Actualizar estado activo en pestañas
    document.querySelectorAll('.day-tab-btn').forEach(btn => btn.classList.remove('active'));
    const currentTabBtn = document.getElementById(`tab-day-${dayNumber}`);
    if (currentTabBtn) {
      currentTabBtn.classList.add('active');
      currentTabBtn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
    }

    // 1. Actualizar Badge y Título con nombre personalizado
    const dayBadgeEl = document.getElementById('dayBadge');
    const dayTitleEl = document.getElementById('dayTitle');
    const currentName = (this.currentUser && this.currentUser.nombre) ? this.currentUser.nombre.toUpperCase() : 'VALIENTE';
    if (dayBadgeEl) dayBadgeEl.innerText = `DÍA ${dayNumber} DE 7 • CUADERNO PERSONAL DE ${currentName}`;
    if (dayTitleEl) dayTitleEl.innerText = dayData.titulo;

    // 2. Actualizar Concepto Terapéutico
    const conceptTextEl = document.getElementById('conceptText');
    if (conceptTextEl) conceptTextEl.innerText = `"${dayData.concepto}"`;

    // 3. Actualizar Reproductor de Audio (usando bucket audios-guia de Supabase Storage)
    const audioEl = document.getElementById('guiaAudioPlayer');
    if (audioEl) {
      const storageAudioUrl = `${SUPABASE_URL}/storage/v1/object/public/audios-guia/dia${dayNumber}.mp3`;
      audioEl.src = (dayData.audio_url && !dayData.audio_url.includes('tu-supabase-storage'))
        ? dayData.audio_url
        : storageAudioUrl;
      audioEl.load();
    }

    // 4. Generar dinámicamente los <textarea> con las preguntas de ese día
    const questionsListEl = document.getElementById('questionsList');
    if (questionsListEl) {
      questionsListEl.innerHTML = '';

      // Obtener respuestas previas si existen
      let respuestasPrevias = {};
      if (this.savedResponsesMap[dayNumber] && this.savedResponsesMap[dayNumber].respuestas) {
        respuestasPrevias = this.savedResponsesMap[dayNumber].respuestas;
      }

      dayData.preguntas.forEach((pregunta, index) => {
        const pKey = `pregunta_${index + 1}`;
        const previousValue = respuestasPrevias[pKey] || respuestasPrevias[index + 1] || '';

        const groupDiv = document.createElement('div');
        groupDiv.className = 'question-group';

        const label = document.createElement('label');
        label.className = 'question-label';
        label.htmlFor = `textarea_${dayNumber}_${index}`;
        label.innerText = pregunta;

        const textarea = document.createElement('textarea');
        textarea.className = 'question-textarea';
        textarea.id = `textarea_${dayNumber}_${index}`;
        textarea.name = pKey;
        textarea.placeholder = "Escribe aquí tu respuesta y reflexión personal...";
        textarea.value = previousValue;

        // Auto-guardado temporal al tipear (en memoria y sesión)
        textarea.addEventListener('input', () => {
          this.updateSaveStatusIndicator("Cambios sin guardar en la nube...");
        });

        groupDiv.appendChild(label);
        groupDiv.appendChild(textarea);
        questionsListEl.appendChild(groupDiv);
      });
    }

    // 5. Actualizar botones de navegación anterior / siguiente
    this.updateNavigationButtons();

    // 6. Estado del indicador
    if (this.savedResponsesMap[dayNumber]) {
      const dateStr = this.savedResponsesMap[dayNumber].actualizado_en
        ? new Date(this.savedResponsesMap[dayNumber].actualizado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'recientemente';
      this.updateSaveStatusIndicator(`✓ Respuestas guardadas (${dateStr})`);
    } else {
      this.updateSaveStatusIndicator("Listo para registrar tus reflexiones de hoy.");
    }
  }

  updateNavigationButtons() {
    const prevBtn = document.getElementById('btnPrevDay');
    const nextBtn = document.getElementById('btnNextDay');

    if (prevBtn) {
      prevBtn.style.visibility = this.currentDay > 1 ? 'visible' : 'hidden';
      prevBtn.onclick = () => this.selectDay(this.currentDay - 1);
    }

    if (nextBtn) {
      nextBtn.style.visibility = this.currentDay < 7 ? 'visible' : 'hidden';
      nextBtn.onclick = () => this.selectDay(this.currentDay + 1);
    }
  }

  bindEvents() {
    // Botón CTA Terracota: "Guardar mi Reflexión del Día"
    const saveBtn = document.getElementById('btnSaveReflection');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveCurrentDayReflection());
    }

    // Modal para personalizar nombre / apodo (Botón lápiz ✏️)
    const btnEditName = document.getElementById('btnEditName');
    const editModal = document.getElementById('editNameModal');
    const editForm = document.getElementById('editNameForm');
    const inputCustomName = document.getElementById('inputCustomName');
    const btnCancelEdit = document.getElementById('btnCancelEditName');

    if (btnEditName && editModal) {
      btnEditName.addEventListener('click', () => {
        if (inputCustomName) {
          inputCustomName.value = this.currentUser?.nombre || '';
        }
        editModal.showModal();
        if (inputCustomName) inputCustomName.focus();
      });
    }

    if (btnCancelEdit && editModal) {
      btnCancelEdit.addEventListener('click', () => {
        editModal.close();
      });
    }

    if (editForm && editModal) {
      editForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newName = inputCustomName ? inputCustomName.value.trim() : '';
        if (newName.length > 0) {
          this.applyUserName(newName);
          localStorage.setItem(`erika_custom_name_${this.currentUser.id || this.token}`, newName);

          // Sincronizar en Supabase si la sesión está conectada
          if (supabase && !this.isDemoMode && this.token) {
            supabase.rpc('guia_actualizar_nombre', { p_token: this.token, p_nuevo_nombre: newName })
              .catch(err => console.warn("Aviso al sincronizar nombre en Supabase:", err));
          }

          this.showToast(`¡Tu cuaderno ahora está personalizado para ${newName}! ✨`, 'success');
        }
        editModal.close();
      });
    }

    // Modal de Graduación & Botiquín Emocional
    const openGradBtn = document.getElementById('btnOpenGraduationBanner');
    const closeGradBtn = document.getElementById('btnCloseGraduationModal');
    const closeGradBtnBottom = document.getElementById('btnCloseGradModalBottom');
    const printBtn = document.getElementById('btnPrintBotiquin');

    if (openGradBtn) {
      openGradBtn.addEventListener('click', () => this.openGraduationModal());
    }

    if (closeGradBtn) {
      closeGradBtn.addEventListener('click', () => this.closeGraduationModal());
    }

    if (closeGradBtnBottom) {
      closeGradBtnBottom.addEventListener('click', () => this.closeGraduationModal());
    }

    if (printBtn) {
      printBtn.addEventListener('click', () => window.print());
    }
  }

  async saveCurrentDayReflection() {
    const saveBtn = document.getElementById('btnSaveReflection');
    const dayData = CONTENIDOS_GUIA[this.currentDay];
    if (!dayData) return;

    // Recolectar las respuestas de los textareas del día actual
    const respuestasObj = {};
    let hasAtLeastOneAnswer = false;

    dayData.preguntas.forEach((_, index) => {
      const pKey = `pregunta_${index + 1}`;
      const textarea = document.getElementById(`textarea_${this.currentDay}_${index}`);
      const val = textarea ? textarea.value.trim() : '';
      respuestasObj[pKey] = val;
      if (val.length > 0) hasAtLeastOneAnswer = true;
    });

    if (!hasAtLeastOneAnswer) {
      this.showToast("Por favor escribe tu reflexión antes de guardar.", "error");
      return;
    }

    const originalBtnHtml = saveBtn.innerHTML;
    saveBtn.innerHTML = `<span>Guardando en tu diario seguro... 🕊️</span>`;
    saveBtn.disabled = true;

    const timestamp = new Date().toISOString();
    const payload = {
      usuario_id: this.currentUser.id,
      dia: this.currentDay,
      respuestas: respuestasObj,
      actualizado_en: timestamp
    };

    try {
      // 1. Guardar en Supabase mediante la función RPC segura 'guia_guardar_respuesta'
      if (supabase && !this.isDemoMode && this.token) {
        const { error } = await supabase.rpc('guia_guardar_respuesta', {
          p_token: this.token,
          p_dia: this.currentDay,
          p_respuestas: respuestasObj
        });

        if (error) {
          console.warn("Aviso al guardar en Supabase por RPC:", error);
          // Continuamos para guardar en localStorage de forma segura
        }
      }

      // 2. Guardar en LocalStorage para respaldo inmediato y offline
      const storageKeyId = this.currentUser?.id || this.token;
      localStorage.setItem(`erika_guia_resp_${storageKeyId}_dia_${this.currentDay}`, JSON.stringify(payload));
      this.savedResponsesMap[this.currentDay] = payload;

      // 3. Actualizar UI
      this.showToast(`¡Tus reflexiones del Día ${this.currentDay} han sido guardadas con éxito! ✨`, "success");
      this.updateSaveStatusIndicator(`✓ Guardado con éxito a las ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`);

      // 4. Actualizar estado del tab
      const tabBtn = document.getElementById(`tab-day-${this.currentDay}`);
      const tabCheck = document.getElementById(`tab-check-${this.currentDay}`);
      if (tabBtn) tabBtn.classList.add('completed');
      if (tabCheck) tabCheck.innerText = '✓';

      // 5. Actualizar barra de progreso
      this.updateProgressBar();

      // Si no es el último día, sugerir avanzar
      if (this.currentDay < 7) {
        setTimeout(() => {
          const proceed = confirm(`¿Deseas continuar hacia el Día ${this.currentDay + 1}: "${CONTENIDOS_GUIA[this.currentDay + 1].titulo.split(':')[1]?.trim()}"?`);
          if (proceed) {
            this.selectDay(this.currentDay + 1);
          }
        }, 1200);
      } else if (this.currentDay === 7) {
        // Al completar el Día 7, abrir la experiencia de graduación y entrega del Botiquín
        setTimeout(() => {
          this.openGraduationModal();
        }, 900);
      }

    } catch (err) {
      console.error("Error al guardar reflexión:", err);
      this.showToast("No pudimos conectar con la base de datos, pero tu respuesta se guardó en este dispositivo.", "error");
    } finally {
      saveBtn.innerHTML = originalBtnHtml;
      saveBtn.disabled = false;
    }
  }

  openGraduationModal() {
    const modal = document.getElementById('graduationModal');
    const container = document.getElementById('botiquinDaysCompiled');
    if (!modal || !container) return;

    // Renderizar las respuestas compiladas de los 7 días
    container.innerHTML = '';

    for (let d = 1; d <= 7; d++) {
      const dayData = CONTENIDOS_GUIA[d];
      const saved = this.savedResponsesMap[d];
      const respuestas = saved?.respuestas || {};

      const dayItem = document.createElement('div');
      dayItem.className = 'botiquin-day-item';

      let answersHtml = '';
      dayData.preguntas.forEach((q, idx) => {
        const val = respuestas[`pregunta_${idx + 1}`] || '<em>(Sin respuesta registrada aún)</em>';
        answersHtml += `
          <div style="margin-top: 8px;">
            <div class="botiquin-question-label">${q}</div>
            <div class="botiquin-day-answer">${val.replace(/\n/g, '<br>')}</div>
          </div>
        `;
      });

      dayItem.innerHTML = `
        <div class="botiquin-day-title">${dayData.titulo}</div>
        <div class="botiquin-day-concept">"${dayData.concepto}"</div>
        ${answersHtml}
      `;

      container.appendChild(dayItem);
    }

    modal.showModal();
  }

  closeGraduationModal() {
    const modal = document.getElementById('graduationModal');
    if (modal) modal.close();
  }

  updateProgressBar() {
    const totalDays = 7;
    let completedCount = 0;

    for (let d = 1; d <= totalDays; d++) {
      if (this.savedResponsesMap[d]) {
        completedCount++;
      }
    }

    const percentage = Math.round((completedCount / totalDays) * 100);

    const fillEl = document.getElementById('progressFill');
    const textEl = document.getElementById('progressText');

    if (fillEl) fillEl.style.width = `${percentage}%`;
    if (textEl) {
      textEl.innerText = `${completedCount} de ${totalDays} días completados (${percentage}%)`;
    }

    // Mostrar el banner de graduación si completó los 7 días
    const gradBanner = document.getElementById('graduationBanner');
    if (gradBanner) {
      gradBanner.style.display = completedCount === 7 ? 'block' : 'none';
    }
  }

  updateSaveStatusIndicator(text) {
    const statusEl = document.getElementById('saveStatusIndicator');
    if (statusEl) statusEl.innerText = text;
  }

  showToast(message, type = 'success') {
    const toast = document.getElementById('toastNotification');
    if (!toast) return;

    toast.innerText = message;
    toast.className = `toast-notification ${type} show`;

    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }
}

// Inicialización al cargar el DOM
document.addEventListener('DOMContentLoaded', () => {
  const app = new ManualMigranteApp();
  window.manualMigranteApp = app;
  app.init();
});
