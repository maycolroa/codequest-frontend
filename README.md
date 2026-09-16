# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```

You can also install [eslint-plugin-react-x](https://npmx.dev/package/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://npmx.dev/package/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])

```
<p align="center">
  <img src="https://vitejs.dev/logo.svg" width="60" alt="Vite Logo" />
  <img src="https://upload.wikimedia.org/wikipedia/commons/a/a7/React-icon.svg" width="60" alt="React Logo" />
</p>

# 🎨 Code Quest 2026 — Frontend

> Aplicación web construida con **React 18 + TypeScript + Vite + Tailwind CSS + Zustand + Axios**
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
8. [Mapa de galaxia interactivo](#mapa-de-galaxia-interactivo)
9. [Variables de entorno](#variables-de-entorno)
10. [Guía para levantar el proyecto](#guía-para-levantar-el-proyecto)
11. [Docker](#docker)
12. [Deploy en DigitalOcean](#deploy-en-digitalocean)
13. [Ramas de Git](#ramas-de-git)
14. [Costos](#costos)

---

## Visión general

El frontend es una SPA (Single Page Application) que permite:

- **Login con Discord** a través del backend OAuth2
- **Cuestionario de 4 pasos** para evaluar intereses y nivel
- **Visualización de rutas** como un **mapa de galaxia interactivo** con Canvas API
- **Seguimiento de progreso** marcando cursos completados nodo por nodo
- **Dashboard** con métricas y múltiples rutas guardadas
- Diseño **sci-fi oscuro** con nebulosa animada inspirado en DevTalles

---

## Stack tecnológico

| Capa | Tecnología | Versión | Por qué |
|------|-----------|---------|---------|
| UI Framework | React | 18 | Ecosistema enorme, hooks modernos |
| Lenguaje | TypeScript | 5.x | Tipado fuerte, mejor DX |
| Build Tool | Vite | 5.x | Rapidísimo, HMR instantáneo |
| Estilos | Tailwind CSS | 3.x | Utility-first, consistencia visual |
| Estado global | Zustand | 4.x | Simple, sin boilerplate, TypeScript nativo |
| HTTP Client | Axios | 1.x | Interceptores, instancia configurada |
| Routing | React Router | 6.x | Estándar de facto en React |
| Animaciones | Framer Motion | 11.x | Animaciones fluidas con mínimo código |
| Iconos | Lucide React | 0.4x | Ligero, tree-shakeable, consistente |
| Formularios | React Hook Form | 7.x | Sin re-renders, validación eficiente |
| Validación | Zod | 3.x | Schema-first, integra con RHF |
| Notificaciones | Sonner | 1.x | Toast mínimo y elegante |
| Canvas | API nativa | — | Mapa de galaxia sin dependencias |

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
│   │   └── PathDetailPage.tsx     # Mapa galaxia + progreso
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
│   │   └── galaxy/
│   │       ├── StarMap.tsx        # Canvas principal
│   │       ├── StarPanel.tsx      # Panel lateral al clickear
│   │       └── ViewToggle.tsx     # Toggle galaxia/lista
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
│   │   └── paths.service.ts
│   │
│   ├── hooks/                     # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── usePaths.ts
│   │   └── useStarMap.ts          # Lógica del canvas
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
│   └── DECISIONS.md               # Decisiones técnicas
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
| `/auth/callback` | `AuthCallbackPage` | Público | Captura `?token=` del redirect |
| `/dashboard` | `DashboardPage` | 🔒 JWT | Grid de rutas con progreso |
| `/assessment` | `AssessmentPage` | 🔒 JWT | Cuestionario 4 pasos |
| `/paths/:id` | `PathDetailPage` | 🔒 JWT | Mapa galaxia + panel de progreso |

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

## Mapa de galaxia interactivo

La vista más importante — usa Canvas API pura sin librerías externas.

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

```bash
# URL base del backend (sin trailing slash)
VITE_API_URL=http://localhost:3000/api/v1

# Nombre de la app
VITE_APP_NAME=Code Quest 2026

# Modo mock — true para desarrollo sin backend
VITE_MOCK_MODE=false
```

En producción:
```bash
VITE_API_URL=https://tu-backend.ondigitalocean.app/api/v1
VITE_MOCK_MODE=false
```

---

## ⚡ Guía para levantar el proyecto

> Sigue estos pasos en orden. Cada paso depende del anterior.

---

### Requisitos previos

Verifica que tienes instalado:

```bash
node --version    # v20.x.x o superior
npm --version     # 9.x.x o superior
```

Si no tienes Node.js → descargar en [nodejs.org](https://nodejs.org) versión LTS.

---

### Paso 1 — Clonar el repositorio

```bash
git clone https://github.com/tu-equipo/codequest-frontend.git
cd codequest-frontend
```

---

### Paso 2 — Instalar dependencias base

```bash
npm install
```

---

### Paso 3 — Instalar bibliotecas del proyecto

```bash
# Bibliotecas principales
npm install react-router-dom axios zustand framer-motion \
  react-hook-form @hookform/resolvers zod lucide-react sonner
```

```bash
# Tailwind CSS y herramientas de estilos
npm install -D tailwindcss autoprefixer postcss
```

```bash
# Inicializar Tailwind (crea tailwind.config.js y postcss.config.js)
npx tailwindcss init -p
```

---

### Paso 4 — Configurar Tailwind

Abre `tailwind.config.js` y reemplaza el contenido con:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          darker: '#050814',
          dark:   '#0F0C2E',
          purple: '#7C3AED',
          violet: '#4C1D95',
          lime:   '#A3E635',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

Abre `src/index.css` y agrega al inicio:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

### Paso 5 — Configurar el alias @ en Vite

Abre `vite.config.ts` y reemplaza con:

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
  }
})
```

---

### Paso 6 — Configurar variables de entorno

```bash
cp .env.example .env
```

Abre `.env` y configura:

```bash
# Para desarrollo local (sin backend corriendo)
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Code Quest 2026
VITE_MOCK_MODE=true    # true = datos de prueba sin backend
```

---

### Paso 7 — Correr en modo desarrollo

```bash
npm run dev
```

Debes ver:
```
  VITE v5.x.x  ready in 400ms
  ➜  Local:   http://localhost:5173/
```

Abre `http://localhost:5173` en el navegador.

---

### Paso 8 — Verificar que todo compila

```bash
# Verificar TypeScript sin compilar
npx tsc --noEmit

# Build de producción (verificar antes de hacer PR)
npm run build
```

Si `npm run build` termina sin errores estás listo. ✅

---

### Paso 9 — Conectar con el backend (opcional)

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

```bash
# Desarrollo con hot-reload
npm run dev

# Verificar tipos TypeScript
npx tsc --noEmit

# Lint del código
npm run lint

# Build de producción
npm run build

# Preview del build
npm run preview
```

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
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# Stage 2: Servir con Nginx
FROM nginx:alpine AS production
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
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

## Deploy en DigitalOcean

### Static Site — GRATIS ✅

```
DigitalOcean → App Platform → Create App
  Fuente:           GitHub → codequest-frontend
  Branch:           main
  Tipo:             Static Site
  Build Command:    npm run build
  Output Directory: dist
  Plan:             Starter → $0/mes
```

Variable de entorno en DigitalOcean:
```
VITE_API_URL → https://tu-backend.ondigitalocean.app/api/v1
```

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
| App Platform — Frontend (Static Site) | Starter | **$0.00** |
| **Total frontend** | | **$0.00 🎉** |

El frontend es un Static Site — DigitalOcean lo sirve gratis con CDN incluido.

---

## Dependencias del proyecto

```json
{
  "dependencies": {
    "react":                "^18.3.0",
    "react-dom":            "^18.3.0",
    "react-router-dom":     "^6.26.0",
    "axios":                "^1.7.0",
    "zustand":              "^4.5.0",
    "framer-motion":        "^11.0.0",
    "react-hook-form":      "^7.52.0",
    "@hookform/resolvers":  "^3.9.0",
    "zod":                  "^3.23.0",
    "lucide-react":         "^0.400.0",
    "sonner":               "^1.5.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.0",
    "@types/react":         "^18.3.0",
    "@types/react-dom":     "^18.3.0",
    "typescript":           "^5.4.0",
    "vite":                 "^5.4.0",
    "tailwindcss":          "^3.4.0",
    "autoprefixer":         "^10.4.0",
    "postcss":              "^8.4.0",
    "eslint":               "^9.0.0"
  }
}
```

---

## Licencia

MIT — ver `LICENSE`

---

*Code Quest 2026 · DevTalles · Equipo [nombre del equipo]*