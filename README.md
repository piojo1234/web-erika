# Sitio Web Oficial — Dra. Erika Rodríguez (Psicología & Desarrollo Personal)

Plataforma web estática moderna, modular y de alto rendimiento que incluye el sitio principal de la Dra. Erika Rodríguez, la landing page de ventas del programa insignia **Proyéctate**, y tres **tests clínicos interactivos** con captura de leads y diagnóstico personalizado.

---

## 📁 Estructura del Proyecto

```text
web-erika/
├── index.html                   # Página principal (Home): Trayectoria, Servicios, Tests, Google Reviews, Instagram, Contacto
├── proyectate.html              # Landing de ventas del Programa Proyéctate (Orientación Vocacional & Propósito)
├── test-vocacional.html         # Test interactivo de Orientación Vocacional (5 preguntas con intl-tel-input)
├── test-autoestima.html         # Test interactivo de Autoestima y Límites Personales
├── test-lenguaje-amor.html      # Test interactivo de los 5 Lenguajes del Amor (Dilemas de pareja)
├── css/
│   ├── main.css                 # Sistema de diseño Koto Brand OS (colores, tipografía, navbar, footer, utilidades)
│   ├── proyectate.css           # Estilos dedicados para la landing Proyéctate (fases, acordeones, pricing)
│   └── tests.css                # Estilos dedicados para los tests interactivos (progreso, opciones, diagnóstico)
├── js/
│   ├── main.js                  # Menú responsive, scroll sticky, renderizador de Google Reviews con estrellas
│   ├── proyectate.js            # Acordeón de preguntas frecuentes (FAQ) e interacciones de Proyéctate
│   └── tests.js                 # Motor modular de cuestionarios (InteractiveQuiz ES Module con intl-tel-input y WhatsApp)
├── assets/
│   └── images/
│       └── logo.png             # Logotipo oficial
├── package.json                 # Scripts de desarrollo y dependencias (Vite)
├── vite.config.js               # Configuración multi-página para compilación estática a /dist
├── .gitignore                   # Exclusión de node_modules, dist, etc.
└── legacy/                      # Respaldo seguro de archivos PHP/Python anteriores
```

---

## 🚀 Cómo Ejecutar en Local

### 1. Instalar dependencias
```bash
npm install
```

### 2. Iniciar servidor de desarrollo
```bash
npm run dev
```
Esto abrirá automáticamente tu navegador en `http://localhost:3000` con recarga rápida en vivo (HMR).

### 3. Compilar para Producción (Deploy)
```bash
npm run build
```
Genera la carpeta `dist/` con todo el HTML, CSS y JS optimizado y minificado, listo para subir a cualquier hosting.

### 4. Probar la versión de producción localmente
```bash
npm run preview
```

---

## 📦 Cómo Subir el Proyecto a Git / GitHub

Abre tu terminal en la carpeta del proyecto y ejecuta:

```bash
# 1. Inicializar repositorio Git local
git init

# 2. Agregar todos los archivos al staging
git add .

# 3. Crear el primer commit
git commit -m "feat: estructura estatica inicial con HTML, CSS, JS, Vite y tests interactivos"

# 4. Cambiar a la rama main
git branch -M main

# 5. Conectar con tu repositorio remoto de GitHub (reemplaza con tu URL de GitHub)
git remote add origin https://github.com/TU_USUARIO/web-erika-rodriguez.git

# 6. Subir los cambios a GitHub
git push -u origin main
```

---

## 🌐 Opciones para Hacer el Deploy

### Opción A: Hostinger (Hosting Estático o Git Auto-Deployment)
1. **Subida manual de `dist/`**:
   - Ejecuta `npm run build`.
   - Sube el contenido de la carpeta `dist/` a la carpeta `public_html/` de tu hosting en Hostinger (mediante el Administrador de Archivos o FTP).
2. **Git Auto Deployment en Hostinger**:
   - En el panel de Hostinger, ve a la sección **Avanzado > Git**.
   - Conecta el repositorio de GitHub y configura el despliegue automático.

### Opción B: Netlify / Vercel
1. Conecta tu repositorio de GitHub en Netlify o Vercel.
2. Comando de compilación: `npm run build`
3. Directorio de publicación: `dist`

### Opción C: GitHub Pages
1. Puedes desplegar la carpeta `dist/` o utilizar una GitHub Action estándar para Vite.

---

## ⚙️ Tecnologías Utilizadas
- **HTML5 Semántico**: Con metadatos optimizados para SEO y accesibilidad.
- **Vanilla CSS (Design Tokens)**: Paleta cromática clínica editorial (Petróleo profundo `#0D3B42`, Menta `#38C7B2`, Teal `#1A5B64`, Terracota `#D8836C`).
- **JavaScript Moderno (ES Modules)**: Cero dependencias pesadas, alta velocidad de carga.
- **Vite 6**: Empaquetador ultrarrápido y servidor local.
- **intl-tel-input**: Validación y formateo de teléfonos internacionales con bandera.
