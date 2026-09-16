# 🎨 Code Quest 2026 — Frontend

> Aplicación web construida con **React + TypeScript + Tailwind CSS + Zustand + Axios**
> Generador de Rutas de Aprendizaje con IA · DevTalles · CQ03-2026

---

## 📋 Tabla de contenidos

1. [Visión general](#visión-general)
2. [Stack tecnológico](#stack-tecnológico)
3. [Estructura del proyecto](#estructura-del-proyecto)
4. [Páginas y rutas](#páginas-y-rutas)
5. [Componentes](#componentes)
6. [Estado global con Zustand](#estado-global-con-zustand)
7. [Comunicación con el backend (Axios)](#comunicación-con-el-backend-axios)
8. [Estilos con Tailwind CSS](#estilos-con-tailwind-css)
9. [Mapa de galaxia interactivo (Canvas)](#mapa-de-galaxia-interactivo-canvas)
10. [Variables de entorno](#variables-de-entorno)
11. [Correr en local](#correr-en-local)
12. [Docker](#docker)
13. [Deploy en DigitalOcean](#deploy-en-digitalocean)
14. [Ramas de Git](#ramas-de-git)
15. [Costos](#costos)

---

## Visión general

El frontend es una SPA (Single Page Application) que permite:

- **Login con Discord** a través del backend OAuth2
- **Cuestionario de 4 pasos** para evaluar intereses y nivel
- **Visualización de rutas** como un **mapa de galaxia interactivo** con Canvas API
- **Seguimiento de progreso** marcando cursos completados
- **Dashboard** con métricas y múltiples rutas guardadas
- Diseño **sci-fi oscuro** inspirado en la estética de DevTalles

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
| Canvas/Animación | API nativa | — | Mapa de galaxia sin dependencias externas |

---

## Estructura del proyecto

```
codequest-frontend/
│
├── public/
│   ├── favicon.svg                    # Ícono de la app
│   └── assets/
│       ├── devi-hello.png             # Mascota DevTalles saludando
│       ├── devi-laptop.png            # Mascota con laptop (cuestionario)
│       └── logo-devtalles.png         # Logo blanco para navbar
│
├── src/
│   ├── main.tsx                       # Entrada: React + Router + estilos
│   ├── App.tsx                        # Componente raíz con rutas
│   │
│   ├── pages/                         # Páginas (una por ruta)
│   │   ├── LandingPage.tsx            # Hero + Login Discord + features
│   │   ├── LoginPage.tsx              # Pantalla de acceso al universo
│   │   ├── AuthCallbackPage.tsx       # Captura token del redirect Discord
│   │   ├── DashboardPage.tsx          # Mis rutas de aprendizaje
│   │   ├── AssessmentPage.tsx         # Cuestionario 4 pasos
│   │   └── PathDetailPage.tsx         # Mapa de galaxia + progreso
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx             # Nav con avatar Discord + logout
│   │   │   └── PageLayout.tsx         # Wrapper con navbar para páginas auth
│   │   │
│   │   ├── ui/                        # Componentes reutilizables base
│   │   │   ├── Button.tsx             # Botón con variantes y loading state
│   │   │   ├── Badge.tsx              # Badge de nivel (básico/inter/avanzado)
│   │   │   ├── ProgressBar.tsx        # Barra de progreso animada
│   │   │   ├── Card.tsx               # Card con glassmorphism
│   │   │   └── LoadingSpinner.tsx     # Spinner animado
│   │   │
│   │   ├── assessment/
│   │   │   ├── StepIndicator.tsx      # Barra de pasos 1/4 2/4...
│   │   │   ├── InterestsStep.tsx      # Paso 1: chips de intereses
│   │   │   ├── LevelStep.tsx          # Paso 2: selector de nivel
│   │   │   ├── GoalsStep.tsx          # Paso 3: textarea + slider horas
│   │   │   └── TechStep.tsx           # Paso 4: tags de tecnologías
│   │   │
│   │   ├── dashboard/
│   │   │   ├── PathCard.tsx           # Tarjeta de ruta con % progreso
│   │   │   └── EmptyState.tsx         # Estado vacío con DEVI
│   │   │
│   │   └── galaxy/
│   │       ├── StarMap.tsx            # Canvas: galaxia + estrellas interactivas
│   │       ├── StarPanel.tsx          # Panel lateral al clickear estrella
│   │       └── ViewToggle.tsx         # Toggle galaxia / lista
│   │
│   ├── stores/                        # Estado global con Zustand
│   │   ├── auth.store.ts              # Usuario, token, login/logout
│   │   └── paths.store.ts             # Rutas de aprendizaje y progreso
│   │
│   ├── services/                      # Capa de comunicación con el backend
│   │   ├── api.ts                     # Instancia Axios configurada
│   │   ├── auth.service.ts            # getMe()
│   │   ├── courses.service.ts         # getAll(), getById(), getCategories()
│   │   ├── assessments.service.ts     # create()
│   │   └── paths.service.ts           # getAll(), getById(), toggleProgress(), delete()
│   │
│   ├── hooks/                         # Custom hooks
│   │   ├── useAuth.ts                 # Wrapper del auth store
│   │   ├── usePaths.ts                # Wrapper del paths store
│   │   └── useStarMap.ts              # Lógica del canvas de galaxia
│   │
│   ├── types/                         # Tipos TypeScript globales
│   │   └── index.ts                   # User, Course, LearningPath, Progress...
│   │
│   ├── utils/                         # Funciones auxiliares
│   │   ├── token.ts                   # getToken, setToken, removeToken
│   │   └── format.ts                  # formatHours, formatDate, calcProgress
│   │
│   └── styles/
│       └── index.css                  # Tailwind + clases globales personalizadas
│
├── index.html
├── vite.config.ts
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.app.json
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
| `/auth/callback` | `AuthCallbackPage` | Público | Captura `?token=` y guarda en store |
| `/dashboard` | `DashboardPage` | 🔒 JWT | Grid de rutas con progreso |
| `/assessment` | `AssessmentPage` | 🔒 JWT | Cuestionario 4 pasos |
| `/paths/:id` | `PathDetailPage` | 🔒 JWT | Mapa galaxia + panel de progreso |

### Configuración de rutas con guards

```tsx
// App.tsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route path="/"              element={<LandingPage />} />
        <Route path="/login"         element={<LoginPage />} />
        <Route path="/auth/callback" element={<AuthCallbackPage />} />

        {/* Rutas protegidas — redirigen al landing si no hay sesión */}
        <Route element={<PrivateRoute />}>
          <Route path="/dashboard"    element={<DashboardPage />} />
          <Route path="/assessment"   element={<AssessmentPage />} />
          <Route path="/paths/:id"    element={<PathDetailPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}

// PrivateRoute — guard de autenticación
function PrivateRoute() {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  return isAuthenticated ? <Outlet /> : <Navigate to="/" replace />
}
```

---

## Componentes

### Componentes UI base

#### `Button.tsx`
```tsx
// Variantes: primary | secondary | ghost | danger
// Props: variant, size, loading, disabled, onClick, children
<Button variant="primary" loading={isGenerating}>
  🚀 Generar mi ruta
</Button>
```

#### `Badge.tsx`
```tsx
// Mapea niveles a colores automáticamente
<Badge level="beginner">Básico</Badge>       // verde
<Badge level="intermediate">Intermedio</Badge> // amarillo
<Badge level="advanced">Avanzado</Badge>      // rojo
```

#### `ProgressBar.tsx`
```tsx
// Animación suave con Framer Motion
<ProgressBar value={67} color="lime" showLabel />
// → barra verde lima al 67% con "67%" a la derecha
```

### Componentes del cuestionario

El cuestionario usa **React Hook Form + Zod** para validación sin re-renders innecesarios:

```tsx
// AssessmentPage.tsx — flujo de 4 pasos
const schema = z.object({
  interests:              z.array(z.string()).min(1, 'Selecciona al menos uno'),
  currentLevel:           z.enum(['beginner', 'intermediate', 'advanced']),
  goals:                  z.string().min(20, 'Describe tu meta (mín. 20 caracteres)'),
  availableHoursPerWeek:  z.number().min(1).max(40),
  preferredTechnologies:  z.array(z.string()).optional(),
})

const { register, handleSubmit, watch, formState } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { availableHoursPerWeek: 10, interests: [] }
})
```

### Componente StarMap (galaxia interactiva)

El mapa de estrellas usa **Canvas API + requestAnimationFrame** sin librerías externas para máxima performance:

```tsx
// hooks/useStarMap.ts — lógica extraída al hook
const { canvasRef, selectedStar, setSelectedStar } = useStarMap({
  stars: mappedStars,     // cursos mapeados a estrellas
  onStarClick: (star) => setSelectedStar(star),
})

// galaxy/StarMap.tsx — solo renderiza
<canvas ref={canvasRef} className="star-canvas" />
{selectedStar && <StarPanel star={selectedStar} onClose={() => setSelectedStar(null)} />}
```

---

## Estado global con Zustand

Zustand es la opción recomendada para React en 2026: sin boilerplate de Redux, más simple que Context + useReducer, y con TypeScript nativo.

### `auth.store.ts`

```typescript
interface AuthState {
  user:            User | null
  token:           string | null
  loading:         boolean
  isAuthenticated: boolean

  setToken:        (token: string) => void
  fetchMe:         () => Promise<void>
  logout:          () => void
  loginWithDiscord: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user:            null,
  token:           getToken(),           // lee localStorage al iniciar
  loading:         false,
  isAuthenticated: false,

  setToken: (token) => {
    setToken(token)                      // utils/token.ts
    set({ token })
  },

  fetchMe: async () => {
    const { token } = get()
    if (!token) return
    set({ loading: true })
    try {
      const user = await authService.getMe()
      set({ user, isAuthenticated: true })
    } catch {
      get().logout()
    } finally {
      set({ loading: false })
    }
  },

  logout: () => {
    removeToken()
    set({ user: null, token: null, isAuthenticated: false })
  },

  loginWithDiscord: () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/discord`
  },
}))
```

### `paths.store.ts`

```typescript
interface PathsState {
  paths:       LearningPath[]
  currentPath: LearningPath | null
  loading:     boolean
  generating:  boolean

  fetchPaths:      () => Promise<void>
  fetchPath:       (id: string) => Promise<void>
  toggleProgress:  (pathId: string, courseId: string, completed: boolean) => Promise<void>
  deletePath:      (id: string) => Promise<void>
}

export const usePathsStore = create<PathsState>((set, get) => ({
  paths:       [],
  currentPath: null,
  loading:     false,
  generating:  false,

  fetchPaths: async () => {
    set({ loading: true })
    try {
      const paths = await pathsService.getAll()
      set({ paths })
    } finally {
      set({ loading: false })
    }
  },

  toggleProgress: async (pathId, courseId, completed) => {
    await pathsService.toggleProgress(pathId, courseId, completed)
    // Actualiza estado local sin refetch para UX instantánea
    set(state => ({
      currentPath: state.currentPath ? {
        ...state.currentPath,
        userProgress: state.currentPath.userProgress?.map(p =>
          p.courseId === courseId
            ? { ...p, completed, completedAt: completed ? new Date().toISOString() : null }
            : p
        )
      } : null
    }))
  },
}))
```

---

## Comunicación con el backend (Axios)

### Instancia configurada

```typescript
// services/api.ts
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,  // http://localhost:3000/api/v1
  timeout: 30000,                          // 30s (IA puede tardar)
  withCredentials: true,
})

// Interceptor REQUEST — adjunta JWT automáticamente
api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Interceptor RESPONSE — maneja errores globalmente
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      removeToken()
      window.location.href = '/'
    }
    if (error.response?.status === 429) {
      toast.error('Demasiadas solicitudes. Espera un momento.')
    }
    return Promise.reject(error)
  }
)
```

### Servicios por módulo

```typescript
// services/assessments.service.ts
export const assessmentsService = {
  create: (payload: CreateAssessmentPayload) =>
    api.post<{ assessment: Assessment; learningPath: LearningPath }>(
      '/assessments', payload
    ).then(r => r.data),
}

// services/paths.service.ts
export const pathsService = {
  getAll:          ()                            => api.get<LearningPath[]>('/learning-paths').then(r => r.data),
  getById:         (id: string)                  => api.get<LearningPath>(`/learning-paths/${id}`).then(r => r.data),
  toggleProgress:  (pathId, courseId, completed) => api.patch(`/learning-paths/${pathId}/progress/${courseId}`, { completed }),
  delete:          (id: string)                  => api.delete(`/learning-paths/${id}`),
}
```

---

## Estilos con Tailwind CSS

### Paleta de colores personalizada

```javascript
// tailwind.config.js
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          darker:  '#050814',   // fondo espacio profundo
          dark:    '#0F0C2E',   // fondo cards
          purple:  '#7C3AED',   // acento principal
          violet:  '#4C1D95',   // hover del morado
          lime:    '#A3E635',   // acento secundario (completado)
          glow:    '#6D28D9',   // glow en elementos activos
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'bob':       'bob 6s ease-in-out infinite',
        'blink':     'blink 2.6s steps(1) infinite',
        'pulse-glow':'pulseGlow 2.8s ease-in-out infinite',
        'glitch':    'glitch 4s infinite steps(1)',
      }
    },
  },
}
```

### Clases globales reutilizables

```css
/* src/styles/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  /* Botones */
  .btn-primary {
    @apply bg-brand-purple hover:bg-brand-violet text-white font-semibold
           px-6 py-3 rounded-full transition-all duration-200 font-mono
           disabled:opacity-50 disabled:cursor-not-allowed
           shadow-[0_0_30px_rgba(124,58,237,0.4)];
  }
  .btn-secondary {
    @apply border border-brand-purple text-brand-purple hover:bg-brand-purple
           hover:text-white font-semibold px-6 py-3 rounded-full
           transition-all duration-200 font-mono;
  }

  /* Cards */
  .card {
    @apply bg-brand-dark border border-purple-800/40 rounded-xl p-6
           shadow-lg shadow-purple-900/20 backdrop-blur-sm;
  }
  .card-hover {
    @apply card hover:border-purple-600/60 hover:-translate-y-1
           transition-all duration-200 cursor-pointer;
  }

  /* Inputs */
  .input {
    @apply bg-brand-darker border border-purple-700/50 text-white rounded-lg
           px-4 py-3 w-full focus:outline-none focus:border-brand-purple
           transition-colors placeholder-gray-500 font-mono;
  }

  /* Badges de nivel */
  .badge-beginner     { @apply bg-green-900/50 text-green-400 border border-green-700/50 text-xs px-3 py-1 rounded-full font-mono; }
  .badge-intermediate { @apply bg-yellow-900/50 text-yellow-400 border border-yellow-700/50 text-xs px-3 py-1 rounded-full font-mono; }
  .badge-advanced     { @apply bg-red-900/50 text-red-400 border border-red-700/50 text-xs px-3 py-1 rounded-full font-mono; }

  /* Chips del cuestionario */
  .chip {
    @apply px-4 py-2 rounded-full border cursor-pointer transition-all font-mono text-sm;
  }
  .chip-active {
    @apply border-brand-lime bg-brand-lime/10 text-brand-lime
           shadow-[0_0_20px_rgba(163,230,53,0.3)];
  }
  .chip-inactive {
    @apply border-purple-800/60 text-gray-400 hover:border-purple-600;
  }
}
```

---

## Mapa de galaxia interactivo (Canvas)

La vista más importante de la app. Usa Canvas API pura para máxima fluidez.

### Arquitectura del canvas

```
useStarMap hook
  ├── canvasRef               → referencia al elemento <canvas>
  ├── galaxyArms              → 900 puntos en espiral generados con RNG
  ├── warpStars               → 280 estrellas de fondo para efecto warp speed
  ├── camera                  → { x, y, scale } — zoom suave al clickear
  ├── hoverState              → estrella bajo el cursor (detección por distancia)
  └── animationLoop           → requestAnimationFrame con:
        ├── updateCamera()    → interpolación suave hacia estrella seleccionada
        ├── drawWarpSpeed()   → estrellas que vienen desde el centro (3D→2D)
        ├── drawGalaxy()      → espiral giratoria con gradiente radial
        ├── drawLinks()       → líneas de constelación con partículas viajando
        └── drawStars()       → estrellas con glow + destellos en cruz al hover
```

### Efectos visuales implementados

```
✦ Galaxia espiral giratoria       → 900 partículas en 2 brazos
⚡ Warp speed                     → 280 estrellas con efecto streak 3D→2D
🔗 Constelaciones animadas         → líneas que se iluminan con partículas viajando
✨ Destellos en cruz              → 4 rayos blancos + 4 diagonales al hover
🎯 Zoom con cámara                → interpolación suave al seleccionar estrella
📋 Panel lateral                  → slide desde la derecha con info del curso
```

### 3 estados de estrella

```typescript
type StarState = 'done' | 'doing' | 'todo'

const starColors = {
  done:  [255, 244, 190],  // amarillo/dorado — curso completado
  doing: [180, 120, 255],  // morado pulsante — en progreso
  todo:  [110, 150, 255],  // azul tenue — sin empezar
}
```

---

## Variables de entorno

```bash
# URL base del backend (sin trailing slash)
VITE_API_URL=http://localhost:3000/api/v1

# Nombre de la app (opcional, para SEO)
VITE_APP_NAME=Code Quest 2026

# Modo mock para desarrollo sin backend (true/false)
VITE_MOCK_MODE=false
```

En producción con DigitalOcean:
```bash
VITE_API_URL=https://tu-backend.ondigitalocean.app/api/v1
VITE_MOCK_MODE=false
```

---

## Correr en local

### Requisitos

- Node.js 20+
- npm o yarn
- Backend corriendo en `localhost:3000` (o `VITE_MOCK_MODE=true`)

### Pasos

```bash
# 1. Clonar el repo
git clone https://github.com/tu-equipo/codequest-frontend.git
cd codequest-frontend

# 2. Instalar dependencias
npm install

# 3. Configurar entorno
cp .env.example .env
# Editar VITE_API_URL si el backend está en otro puerto

# 4. Correr en modo desarrollo
npm run dev
# → http://localhost:5173

# 5. Build de producción (verificar antes de deploy)
npm run build
npm run preview   # preview del build en localhost:4173
```

### Scripts disponibles

```json
{
  "scripts": {
    "dev":          "vite",
    "build":        "tsc && vite build",
    "preview":      "vite preview",
    "lint":         "eslint src --ext ts,tsx",
    "lint:fix":     "eslint src --ext ts,tsx --fix",
    "type-check":   "tsc --noEmit"
  }
}
```

---

## Docker

### Dockerfile (multi-stage con Nginx)

```dockerfile
# ── Stage 1: Build ───────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build           # genera /app/dist/

# ── Stage 2: Servir con Nginx ─────────────────────────
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

  # Vue/React Router — fallback a index.html
  location / {
    try_files $uri $uri/ /index.html;
  }

  # Cache de assets estáticos (JS, CSS, imágenes)
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
  }

  # Compresión gzip
  gzip on;
  gzip_types text/plain text/css application/json application/javascript;
}
```

### Correr con Docker

```bash
# Build de la imagen
docker build \
  --build-arg VITE_API_URL=https://tu-backend.com/api/v1 \
  -t codequest-frontend .

# Correr contenedor
docker run -p 80:80 codequest-frontend
```

---

## Deploy en DigitalOcean

### Opción A — App Platform Static Site (recomendada ✅)

```
DigitalOcean → App Platform → Create App
  Fuente:           GitHub → codequest-frontend
  Branch:           main
  Tipo:             Static Site
  Build Command:    npm run build
  Output Directory: dist
  Plan:             Starter → $0/mes GRATIS
```

Agregar variable de entorno:
```
VITE_API_URL → https://tu-backend.ondigitalocean.app/api/v1
```

DigitalOcean agrega automáticamente el manejo de SPA (fallback a index.html).

### Opción B — Droplet con Docker

```bash
# En el servidor
git clone https://github.com/tu-equipo/codequest-frontend.git
cd codequest-frontend
docker build --build-arg VITE_API_URL=https://tu-backend.com/api/v1 -t frontend .
docker run -d -p 80:80 frontend
```

### Checklist pre-entrega

```
[ ] Build de producción sin errores (npm run build)
[ ] VITE_API_URL apunta al backend de producción
[ ] Login con Discord redirige correctamente
[ ] Cuestionario genera ruta y redirige a /paths/:id
[ ] Mapa de galaxia carga y responde al hover/click
[ ] Progreso de cursos se guarda y persiste al recargar
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
├── feature/galaxy-map     ← canvas de estrellas interactivo
├── feature/progress       ← sistema de progreso por curso
└── feature/docker         ← Dockerfile + nginx + deploy
```

**Flujo:**
```
feature/* → PR a develop → revisión → merge → PR a main → deploy automático
```

---

## Dependencias principales

```json
{
  "dependencies": {
    "react":              "^18.3.0",
    "react-dom":          "^18.3.0",
    "react-router-dom":   "^6.26.0",
    "axios":              "^1.7.0",
    "zustand":            "^4.5.0",
    "framer-motion":      "^11.0.0",
    "react-hook-form":    "^7.52.0",
    "zod":                "^3.23.0",
    "@hookform/resolvers": "^3.9.0",
    "lucide-react":       "^0.400.0",
    "sonner":             "^1.5.0"
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
    "eslint":               "^9.0.0",
    "@typescript-eslint/eslint-plugin": "^7.0.0"
  }
}
```

---

## Costos

| Servicio | Plan | Precio/mes |
|---|---|---|
| App Platform — Frontend (Static Site) | Starter | **$0.00** |
| **Total frontend** | | **$0.00** |

El frontend es un Static Site y DigitalOcean lo sirve **completamente gratis** con CDN incluido. 🎉

---

## Licencia

MIT — ver `LICENSE`

---

*Code Quest 2026 · DevTalles · Equipo [nombre del equipo]*