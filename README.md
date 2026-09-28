<p align="center">
  <img src="https://vitejs.dev/logo.svg" width="60" alt="Vite Logo" />
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="60" alt="React Logo" />
</p>

# 🎨 Code Quest 2026 — Frontend

> Aplicación web construida con **React 18 + TypeScript + Vite + Three.js + Tailwind CSS + Zustand + Axios**
> Generador de Rutas de Aprendizaje con IA · DevTalles · CQ03-2026

---

## 📋 Tabla de contenidos

1. [Visión general](#visión-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Páginas y rutas](#páginas-y-rutas)
5. [Estado global con Zustand](#estado-global-con-zustand)
6. [Comunicación con el backend](#comunicación-con-el-backend)
7. [Estilos con Tailwind CSS](#estilos-con-tailwind-css)
8. [Galaxy 3D](#galaxy-3d)
9. [Variables de entorno](#variables-de-entorno)
10. [Guía para levantar el proyecto](#-guía-para-levantar-el-proyecto)
11. [Docker](#docker)
12. [Deploy en DigitalOcean (CI/CD)](#deploy-en-digitalocean-cicd)
13. [Ramas de Git](#ramas-de-git)
14. [Costos](#costos)

---

## Visión general

El frontend es una SPA (Single Page Application) que convierte el catálogo de
cursos de DevTalles en un universo explorable: cada curso es un planeta y cada
ruta de aprendizaje una galaxia. El mapa 3D (`/starmap`) usa **Three.js de forma
imperativa**, sin React Three Fiber: un hook monta la escena WebGL sobre un
`<canvas>` y se comunica con React solo mediante refs y callbacks.

Permite:

- **Login con Discord** a través del backend OAuth2
- **Cuestionario de 4 pasos** para evaluar intereses y nivel
- **Visualización 3D de cursos agrupados en galaxias** con Three.js: planetas por curso, nebulosas por galaxia y líneas de prerrequisitos
- **Seguimiento de progreso** marcando cursos completados nodo por nodo
- **Dashboard** con métricas y múltiples rutas guardadas
- Diseño **sci-fi oscuro** con nebulosa animada inspirado en DevTalles

---

## Stack tecnológico

| Capa | Tecnología | Versión | Por qué |
|------|-----------|---------|---------|
| UI Framework | React | 18.3 | Ecosistema enorme, hooks modernos |
| Lenguaje | TypeScript | 5.7 | Tipado fuerte, mejor DX |
| Build Tool | Vite | 5.4 | Rapidísimo, HMR instantáneo |
| Gráficos 3D | Three.js | 0.186 | Mapa galáctico en WebGL, usado de forma imperativa (sin React Three Fiber) |
| Estilos | Tailwind CSS | 3.4 | Utility-first, consistencia visual |
| Estado global | Zustand | 4.5 | Simple, sin boilerplate, TypeScript nativo |
| HTTP Client | Axios | 1.8 | Interceptores, instancia configurada |
| Routing | React Router | 6.28 | Estándar de facto en React |
| Animaciones | Framer Motion | 11.18 | Animaciones fluidas con mínimo código |
| Iconos | Lucide React | 0.468 | Ligero, tree-shakeable, consistente |
| Formularios | React Hook Form | 7.54 | Sin re-renders, validación eficiente |
| Validación | Zod | 3.24 | Schema-first, integra con RHF |
| Notificaciones | Sonner | 1.7 | Toast mínimo y elegante |
| Canvas 2D | API nativa | — | Starfield y efecto warp de fondo, texturas procedurales de los planetas |
| Contenedor | Docker | node:20-alpine (build) + nginx:1.27-alpine (producción) | Build multi-stage; Nginx sirve `dist/` con fallback SPA |

---

## Estructura del proyecto

```
codequest-frontend/
│
├── public/
│   ├── favicon.svg
│   └── assets/
│       ├── devi-hello.png         # Mascota DevTalles saludando
│       ├── devi-laptop.png        # Mascota con laptop
│       └── logo-devtalles.png     # Logo blanco para navbar
│
├── src/
│   ├── main.tsx                   # Entrada de la app
│   ├── App.tsx                    # Rutas principales
│   │
│   ├── pages/                     # Una página por ruta
│   │   ├── LandingPage.tsx        # Hero + Login Discord
│   │   ├── LoginPage.tsx          # Pantalla de acceso al universo
│   │   ├── AuthCallbackPage.tsx   # Captura token de Discord
│   │   ├── DashboardPage.tsx      # Mis rutas de aprendizaje
│   │   ├── AssessmentPage.tsx     # Cuestionario 4 pasos
│   │   ├── RoutesPage.tsx         # Rutas del usuario: agregar y eliminar
│   │   ├── PathDetailPage.tsx     # Detalle de una ruta con sus cursos
│   │   ├── CourseLearningPage.tsx # Lecciones del curso + progreso
│   │   └── galaxy-effect.css      # Estilos del warp del dashboard
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx         # Nav con avatar + logout
│   │   │   └── PageLayout.tsx     # Wrapper con navbar
│   │   │
│   │   ├── ui/                    # Componentes reutilizables
│   │   │   ├── Button.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   ├── Card.tsx
│   │   │   └── LoadingSpinner.tsx
│   │   │
│   │   ├── assessment/            # Pasos del cuestionario
│   │   │   ├── StepIndicator.tsx
│   │   │   ├── InterestsStep.tsx
│   │   │   ├── LevelStep.tsx
│   │   │   ├── GoalsStep.tsx
│   │   │   └── TechStep.tsx
│   │   │
│   │   ├── dashboard/
│   │   │   ├── PathCard.tsx
│   │   │   └── EmptyState.tsx
│   │   │
│   │   ├── devi/
│   │   │   ├── DeviChat.tsx       # Chat flotante de Devi (rutas protegidas)
│   │   │   └── devi-chat.css
│   │   │
│   │   └── galaxy/
│   │       ├── StarMap3D.tsx      # Mapa 3D con Three.js (ruta /starmap)
│   │       ├── CoursePanel.tsx    # Panel del curso seleccionado
│   │       ├── CourseLinks.tsx    # Prerrequisitos y relacionados
│   │       ├── CourseTooltip.tsx  # Tooltip del planeta en hover
│   │       ├── StarMap.tsx        # Canvas principal 2D
│   │       ├── StarPanel.tsx      # Panel lateral al clickear
│   │       └── ViewToggle.tsx     # Toggle galaxia/lista
│   │
│   ├── lib/
│   │   └── galaxy/                # Lógica 3D sin React
│   │       ├── planetVisuals.ts   # 7 texturas procedurales en canvas 2D
│   │       ├── galaxyHighlight.ts # Funciones puras de resaltado
│   │       ├── relationLines.ts   # Line2/LineMaterial + partículas
│   │       ├── idleScheduler.ts   # requestIdleCallback + fallback
│   │       ├── deviceTier.ts      # Resolución según la gama del dispositivo
│   │       └── hash.ts            # hashString (FNV-1a) determinista
│   │
│   ├── stores/                    # Estado global Zustand
│   │   ├── auth.store.ts
│   │   └── paths.store.ts
│   │
│   ├── services/                  # Axios por módulo
│   │   ├── api.ts                 # Instancia base configurada
│   │   ├── auth.service.ts
│   │   ├── courses.service.ts
│   │   ├── assessments.service.ts
│   │   ├── paths.service.ts
│   │   └── galaxy.mock.ts         # Datos de la galaxia en modo mock
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── usePaths.ts
│   │   ├── useStarMap.ts          # Starfield 2D en canvas
│   │   ├── useCourseGalaxy.ts     # Carga galaxias y cursos (API o mock)
│   │   ├── useGalaxyScene.ts      # Escena Three.js imperativa del mapa 3D
│   │   └── useGalaxyWarp.ts       # Efecto warp 2D del dashboard
│   │
│   ├── types/
│   │   └── index.ts               # Tipos TypeScript globales
│   │
│   ├── utils/
│   │   ├── token.ts               # getToken, setToken, removeToken
│   │   └── format.ts              # formatHours, calcProgress
│   │
│   └── styles/
│       └── index.css              # Tailwind + clases globales
│
├── docs/                          # Documentación del proyecto
│   ├── CLAUDE.md                  # Instrucciones para Claude Code
│   ├── RULES.md                   # Reglas de código
│   ├── CONTEXT.md                 # Contexto técnico
│   ├── CHANGELOG.md               # Historial de cambios
│   ├── TASKS.md                   # Tareas pendientes
│   ├── DECISIONS.md               # Decisiones técnicas
│   ├── architecture-frontend.html # Arquitectura del frontend
│   ├── architecture-backend.html  # Arquitectura del backend
│   └── architecture-fullstack.html # Ambas en una sola página
│
├── .github/workflows/
│   └── deploy.yml                 # Build + push de la imagen Docker
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── postcss.config.js
├── Dockerfile
├── nginx.conf
├── .env.example
├── .gitignore
└── README.md
```

---

## Páginas y rutas

| Ruta | Página | Auth | Descripción |
|------|--------|------|-------------|
| `/` | `LandingPage` | Público | Hero + botón Discord + features |
| `/login` | `LoginPage` | Público | Acceso al universo estilo terminal |
| `/auth/callback` | `AuthCallbackPage` | Público | Captura el JWT (`?token=`) del redirect de Discord y carga el perfil |
| `/starmap` | `StarMap3D` | Público | Visualización 3D de cursos en galaxias con Three.js; se carga con `React.lazy` + `Suspense` |
| `/dashboard` | `DashboardPage` | 🔒 JWT | Bitácora: progreso, racha y efecto warp |
| `/assessment` | `AssessmentPage` | 🔒 JWT | Cuestionario 4 pasos |
| `/routes` | `RoutesPage` | 🔒 JWT | Rutas de aprendizaje del usuario: agregar y eliminar |
| `/paths/:id` | `PathDetailPage` | 🔒 JWT | Detalle de una ruta con sus cursos |
| `/courses/:id` | `CourseLearningPage` | 🔒 JWT | Lecciones del curso y progreso por lección |
| `*` | `Navigate → /` | — | Comodín: cualquier ruta desconocida redirige a `/` |

Las rutas protegidas comparten el layout `ProtectedRoutes` de `App.tsx`: si no
hay sesión redirige a `/login`, y si la hay renderiza la página junto al chat
flotante **`DeviChat`**, que no tiene ruta propia. Además, `TokenRedirectHandler`
captura `?token=` en cualquier ruta (salvo `/auth/callback`), lo quita de la URL
y lleva al usuario a `/dashboard`.

---

## Estado global con Zustand

### `auth.store.ts`
```typescript
// Maneja: usuario actual, token JWT, login/logout
const useAuthStore = create<AuthState>((set, get) => ({
  user:            null,
  token:           getToken(),      // lee localStorage al iniciar
  isAuthenticated: false,

  setToken:         (token) => { setToken(token); set({ token }) },
  fetchMe:          async () => { /* llama a GET /auth/me */ },
  logout:           () => { removeToken(); set({ user: null, token: null }) },
  loginWithDiscord: () => { window.location.href = `${API_URL}/auth/discord` },
}))
```

### `paths.store.ts`
```typescript
// Maneja: rutas de aprendizaje, progreso por curso
const usePathsStore = create<PathsState>((set) => ({
  paths:       [],
  currentPath: null,
  loading:     false,

  fetchPaths:     async () => { /* llama a GET /learning-paths */ },
  fetchPath:      async (id) => { /* llama a GET /learning-paths/:id */ },
  toggleProgress: async (pathId, courseId, completed) => {
    /* llama a PATCH y actualiza estado local sin refetch */
  },
  deletePath:     async (id) => { /* llama a DELETE */ },
}))
```

---

## Comunicación con el backend

### Instancia Axios configurada (`services/api.ts`)

```typescript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 30000,   // 30s — IA puede tardar
})

// Adjunta JWT automáticamente en cada request
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Redirige al landing si el token expiró (401)
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)
```

### Servicios disponibles

| Servicio | Métodos |
|----------|---------|
| `auth.service.ts` | `getMe()` |
| `courses.service.ts` | `getAll()`, `getById()`, `getCategories()` |
| `assessments.service.ts` | `create(payload)` |
| `paths.service.ts` | `getAll()`, `getById()`, `toggleProgress()`, `delete()` |

> Estado actual de integración: el backend real todavía no expone endpoints
> de rutas de aprendizaje (`/paths` o `/learning-paths`). Con
> `VITE_MOCK_MODE=false`, el frontend muestra `EmptyState` y no genera
> solicitudes a endpoints inexistentes. La integración real de paths queda
> pendiente de la implementación correspondiente en el backend.

---

## Estilos con Tailwind CSS

### Paleta de colores

```javascript
// tailwind.config.js
colors: {
  brand: {
    darker: '#050814',   // fondo espacio profundo
    dark:   '#0F0C2E',   // fondo cards
    purple: '#7C3AED',   // acento principal
    violet: '#4C1D95',   // hover del morado
    lime:   '#A3E635',   // acento completado
  }
}
```

### Clases globales reutilizables

```css
/* src/styles/index.css */
.btn-primary    → botón morado con glow
.btn-secondary  → botón borde morado
.card           → card glassmorphism oscura
.card-hover     → card con hover animado
.input          → input oscuro con focus morado
.badge-beginner     → verde (básico)
.badge-intermediate → amarillo (intermedio)
.badge-advanced     → rojo (avanzado)
.chip           → chip seleccionable del cuestionario
.chip-active    → chip seleccionado (lima)
.chip-inactive  → chip no seleccionado (gris)
```

---

## Galaxy 3D

La vista más importante. `StarMap3D` (ruta `/starmap`) obtiene galaxias y cursos
con `useCourseGalaxy`, filtra por búsqueda y nivel, y entrega todo a
`useGalaxyScene`, que monta la escena Three.js. La lógica 3D reutilizable vive
en `src/lib/galaxy/`, sin dependencias de React.

```
StarMap3D.tsx → useCourseGalaxy → useGalaxyScene → planetVisuals · relationLines · galaxyHighlight → WebGLRenderer
```

| Módulo | Qué hace |
|--------|----------|
| `src/hooks/useGalaxyScene.ts` | Escena Three.js **imperativa** (sin React Three Fiber): renderer, cámara, `OrbitControls` con damping, 2 500 estrellas de fondo, nebulosas con shaders y `Raycaster` para hover y click. El hover se guarda en una variable del closure del efecto (`let hoveredSlug`), no en estado de React, así el loop de `requestAnimationFrame` no provoca renders; React solo recibe el aviso por el callback `onHover`. Libera geometrías, materiales y texturas al desmontar. |
| `src/lib/galaxy/planetVisuals.ts` | **7 texturas procedurales** pintadas en canvas 2D, una por galaxia (circuit, ocean, rock, sand, metal, volcanic, crystal; `noise` como fallback). Se pintan por partes en callbacks idle. La orientación, órbita, tono y variante de cada planeta son deterministas por `courseId` gracias a `hashString` (FNV-1a de 32 bits), definido en `src/lib/galaxy/hash.ts`. |
| `src/lib/galaxy/galaxyHighlight.ts` | Funciones puras de resaltado: `resolveActiveGalaxies` (foco > hover > nada), `courseEmphasis` (`highlighted` / `dimmed` / `neutral`) y `resolveIntensifiedNebula`. |
| `src/lib/galaxy/relationLines.ts` | Líneas de prerrequisitos (rojas, sólidas) y cursos relacionados (azules, discontinuas) con `Line2` / `LineMaterial` de `three/addons`, que permiten grosor en píxeles. Partículas `Points` que viajan hacia cada prerrequisito y animación del dash (`dashOffset`) en cada frame. |
| `src/lib/galaxy/idleScheduler.ts` | `scheduleIdle()`: `requestIdleCallback` con timeout de 500 ms y fallback a `setTimeout` (Safari) con un presupuesto de 40 ms. Lo llama `planetVisuals` para generar las texturas sin bloquear el render. |
| `src/lib/galaxy/deviceTier.ts` | Resolución adaptativa de las texturas: gama baja (256×128) si `navigator.deviceMemory` ≤ 4 GB o `navigator.hardwareConcurrency` ≤ 4 núcleos; si no, 512×256. |
| `src/hooks/useGalaxyWarp.ts` | Efecto de warp 2D (estelas en canvas) del fondo de **`DashboardPage`**. No lo usa `StarMap3D`. |

Todo el movimiento respeta `prefers-reduced-motion`.

### Mapa 2D con Canvas (`useStarMap`)

Las pantallas de Landing, Login y Dashboard usan además un starfield 2D con la
API nativa de Canvas (`src/hooks/useStarMap.ts`).

### Efectos visuales

| Efecto | Descripción |
|--------|-------------|
| 🌌 Galaxia espiral | 900 partículas en 2 brazos girando lentamente |
| ⚡ Warp speed | 280 estrellas viajando desde el centro hacia afuera |
| ✦ Destellos en cruz | 4 rayos al hacer hover sobre una estrella |
| 🔗 Constelaciones | Líneas animadas con partículas viajando entre cursos |
| 🎯 Zoom con cámara | Interpolación suave al seleccionar una estrella |
| 📋 Panel lateral | Info del curso con slide desde la derecha |

### Estados de estrella

| Estado | Color | Significado |
|--------|-------|-------------|
| `done` | Amarillo/dorado brillante | Curso completado |
| `doing` | Morado pulsante | En progreso |
| `todo` | Azul tenue parpadeante | Sin empezar |

---

## Variables de entorno

La plantilla está en `.env.example`. Copia a `.env` (no versionado) y ajusta
los valores. **Nunca** subas el `.env` al repositorio.

| Variable | Obligatoria | Descripción | Ejemplo / formato |
|----------|-------------|-------------|-------------------|
| `VITE_API_URL` | Sí (si `VITE_MOCK_MODE=false`) | URL base del backend, **sin slash final** e incluyendo el prefijo `/api/v1`. La usan `services/api.ts` (baseURL de Axios) y el login con Discord (`<VITE_API_URL>/auth/discord`). | Local: `http://localhost:3000/api/v1` · Prod: `https://<backend>.ondigitalocean.app/api/v1` |
| `VITE_MOCK_MODE` | No (`false`) | `true` usa datos simulados (galaxia demo, login mock) sin llamar al backend. Útil para desarrollar sin backend. Solo el string exacto `true` lo activa. | `true` / `false` |
| `VITE_APP_NAME` | No | Nombre de la aplicación. | `Code Quest 2026` |

Ejemplo de `.env` para desarrollo local:

```bash
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Code Quest 2026
VITE_MOCK_MODE=true
```

En producción:

```bash
VITE_API_URL=https://<backend>.ondigitalocean.app/api/v1
VITE_MOCK_MODE=false
```

Vite reemplaza `import.meta.env.VITE_*` por su valor **en tiempo de build**. La
imagen de producción solo sirve archivos estáticos con Nginx, así que
`VITE_API_URL` se inyecta en el `docker build` con `--build-arg` y cambiarla
exige reconstruir la imagen. Cualquier `VITE_*` queda visible en el JavaScript
público: no guardes secretos en ellas.

### Secrets requeridos en GitHub

Configúralos en *Settings → Secrets and variables → Actions* del repositorio:

| Secret | Valor | Uso |
|--------|-------|-----|
| `DIGITALOCEAN_ACCESS_TOKEN` | Token de API de DigitalOcean | `doctl registry login` para poder hacer `docker push` |
| `VITE_API_URL` | URL del backend de producción (`https://<backend>.ondigitalocean.app/api/v1`) | `--build-arg` del `docker build` |

---

## ⚡ Guía para levantar el proyecto

> Sigue estos pasos en orden. Cada paso depende del anterior.

### URLs

| Entorno | URL del frontend |
|---------|------------------|
| Local (`npm run dev`) | `http://localhost:5173` |
| Local (`npm run preview`) | `http://localhost:4173` |
| Local (Docker) | `http://localhost:80` |
| Producción | https://codequest-frontend-m26va.ondigitalocean.app |

### Inicio rápido

```bash
git clone https://github.com/maycolroa/codequest-frontend.git
cd codequest-frontend
npm install
cp .env.example .env
# Editar VITE_API_URL / VITE_MOCK_MODE en .env
npm run dev
# App en http://localhost:5173
```

---

### Requisitos previos

| Herramienta | Versión | Necesaria para |
|-------------|---------|----------------|
| Node.js | 20.x o superior (la imagen Docker usa `node:20-alpine`) | Correr Vite y el build |
| npm | 9.x o superior | Instalar dependencias y correr scripts |
| Git | cualquiera | Clonar el repositorio |
| Docker | 24+ (opcional) | Solo para probar la imagen de producción |

Verifica que tienes instalado:

```bash
node --version    # v20.x.x o superior
npm --version     # 9.x.x o superior
```

Si no tienes Node.js → descargar en [nodejs.org](https://nodejs.org) versión LTS.

---

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/maycolroa/codequest-frontend.git
cd codequest-frontend
```

---

### Paso 2 — Instalar dependencias

```bash
npm install
```

Instala todo lo que declara `package.json`, incluidos Three.js, Tailwind CSS y
el resto de bibliotecas. `tailwind.config.js`, `postcss.config.js` y el alias
`@ → src` de `vite.config.ts` ya vienen configurados en el repositorio: no hay
que crearlos ni reemplazarlos.

---

### Paso 3 — Configurar variables de entorno

```bash
cp .env.example .env
```

Abre `.env` y ajusta las variables (ver [Variables de entorno](#variables-de-entorno)):

```bash
# Backend local
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Code Quest 2026
VITE_MOCK_MODE=true    # true = datos de prueba sin backend
```

---

### Paso 4 — Correr en modo desarrollo

```bash
npm run dev
```

Debes ver:
```
  VITE v5.x.x  ready in 400ms
  ➜  Local:   http://localhost:5173/
```

Abre `http://localhost:5173` en el navegador. El puerto es fijo
(`strictPort: true`): si el 5173 está ocupado, Vite falla en lugar de usar otro.

---

### Paso 5 — Verificar que todo compila

```bash
# Verificar TypeScript sin compilar
npx tsc --noEmit

# Build de producción (verificar antes de hacer PR)
npm run build
```

Si `npm run build` termina sin errores estás listo. ✅

---

### Paso 6 — Conectar con el backend (opcional)

Si ya tienes el backend corriendo en `localhost:3000`:

1. Cambiar en `.env`:
```bash
VITE_MOCK_MODE=false
```

2. Reiniciar el servidor:
```bash
# Ctrl+C para detener
npm run dev
```

3. Ir a `http://localhost:5173` y probar el login con Discord.

---

### Comandos del día a día

| Comando | Qué hace |
|---------|----------|
| `npm run dev` | Servidor de desarrollo de Vite con hot-reload en `http://localhost:5173` |
| `npm run build` | `tsc -b && vite build`: verifica tipos y genera el build de producción en `dist/` |
| `npm run preview` | Sirve el contenido de `dist/` en `http://localhost:4173` (requiere `npm run build` antes) |
| `npm run lint` | ESLint sobre todo el proyecto |
| `npx tsc --noEmit` | Verifica tipos TypeScript sin generar archivos |

Las variables `VITE_*` se leen al arrancar `dev` y al ejecutar `build`: si
cambias el `.env`, reinicia `npm run dev` o vuelve a hacer `npm run build`.

---

### Solución de problemas comunes

**❌ Error: `Cannot find module 'react-router-dom'`**
```bash
npm install react-router-dom
```

**❌ Error: `Unknown at rule @tailwind`**
```bash
# Verificar que postcss.config.js existe
npx tailwindcss init -p
```

**❌ Pantalla en blanco en el navegador**
```bash
# Ver errores en la consola del navegador (F12)
# Generalmente es un error de TypeScript en App.tsx
npx tsc --noEmit
```

**❌ Error: `VITE_API_URL is not defined`**
```bash
# Falta el archivo .env
cp .env.example .env
# Reiniciar el servidor después
```

**❌ Error de CORS al conectar con el backend**
```bash
# Verificar que el backend tiene FRONTEND_URL correcto
# En el backend .env:
FRONTEND_URL=http://localhost:5173
```

---

## Docker

### Dockerfile (multi-stage con Nginx)

```dockerfile
# Stage 1: Build (node:20-alpine)
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Producción — servir con Nginx (nginx:1.27-alpine)
FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### nginx.conf (SPA fallback)

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;

  # React Router — fallback a index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache de assets
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  gzip on;
  gzip_types text/plain text/css application/json application/javascript;
}
```

### Correr con Docker localmente

```bash
# Build
docker build \
  --build-arg VITE_API_URL=http://localhost:3000/api/v1 \
  -t codequest-frontend .

# Correr
docker run -p 80:80 codequest-frontend

# Ver en: http://localhost:80
```

---

## Deploy en DigitalOcean (CI/CD)

### Flujo

```
push a main → GitHub Actions → docker build --build-arg VITE_API_URL
            → docker push registry.digitalocean.com/codequest/frontend:latest
            → App Platform (Autodeploy ON) detecta la imagen nueva y redespliega
```

El workflow `.github/workflows/deploy.yml` («Build & Deploy Frontend») se
ejecuta en cada push a `main` y:

1. Hace checkout, instala `doctl` y ejecuta `doctl registry login` con el secret `DIGITALOCEAN_ACCESS_TOKEN`.
2. Construye la imagen con la URL del backend incrustada:
   ```bash
   docker build \
     --build-arg VITE_API_URL=${{ secrets.VITE_API_URL }} \
     -t registry.digitalocean.com/codequest/frontend:latest \
     -t registry.digitalocean.com/codequest/frontend:${{ github.sha }} \
     .
   ```
3. Hace `docker push` de `registry.digitalocean.com/codequest/frontend:latest`
   (y también del tag `:${{ github.sha }}`).

El workflow **no tiene un paso de deploy explícito**. El despliegue lo hace
DigitalOcean App Platform: la app está configurada con **Autodeploy ON** sobre
la imagen `:latest` del registry y redespliega en cuanto detecta una nueva.

La variable `VITE_API_URL` no se configura en App Platform: llega al bundle en
el `docker build` (ver [Secrets requeridos en GitHub](#secrets-requeridos-en-github)).

### Checklist pre-entrega

```
[ ] npm run build termina sin errores
[ ] VITE_API_URL apunta al backend de producción
[ ] Login con Discord redirige correctamente
[ ] Cuestionario genera ruta y va a /paths/:id
[ ] Mapa de galaxia carga y responde al hover/click
[ ] Progreso se guarda y persiste al recargar
[ ] Funciona en Chrome, Firefox y móvil
[ ] No hay commits después del 28 sep 10:00AM GMT-6
```

---

## Ramas de Git

```
main                       ← producción (protegida)
develop                    ← integración
├── feature/landing        ← página de inicio y login
├── feature/auth-flow      ← callback Discord + guards
├── feature/assessment     ← cuestionario 4 pasos
├── feature/dashboard      ← grid de rutas
├── feature/galaxy-map     ← canvas de estrellas
├── feature/progress       ← sistema de progreso
└── feature/docker         ← Dockerfile + nginx
```

**Flujo:**
```
feature/* → PR a develop → revisión → merge → PR a main → deploy
```

---

## Costos

| Servicio | Plan | Precio/mes |
|---|---|---|
| App Platform — Frontend (contenedor Docker) | Basic (512MB) | **$5.00** |
| **Total frontend** | | **$5.00** |

El frontend ya no es un Static Site: se despliega como contenedor Docker
(Nginx) en App Platform, con el mismo plan Basic de 512MB que el backend.

### Para el hackathon

DigitalOcean otorga **$200 en créditos gratuitos** a cuentas nuevas, así que el
costo real del hackathon sigue siendo **$0.00** 💚.

---

## Dependencias del proyecto

```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "axios": "^1.8.4",
    "framer-motion": "^11.18.2",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-hook-form": "^7.54.2",
    "react-router-dom": "^6.28.0",
    "sonner": "^1.7.1",
    "three": "^0.186.0",
    "zod": "^3.24.1",
    "zustand": "^4.5.5"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/node": "^24.13.3",
    "@types/react": "^19.2.18",
    "@types/react-dom": "^19.2.7",
    "@types/three": "^0.186.0",
    "@vitejs/plugin-react": "^4.3.4",
    "autoprefixer": "^10.4.20",
    "eslint": "^10.10.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.6",
    "globals": "^17.12.0",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "~5.7.2",
    "typescript-eslint": "^8.69.0",
    "vite": "^5.4.11"
  }
}
```

---

## Licencia

MIT — ver `LICENSE`

---

*Code Quest 2026 · DevTalles · Equipo [nombre del equipo]*
