# TASKS.md

Lista de tareas del frontend de Code Quest 2026. Mantener actualizada:
mover ítems de "Por hacer" a "Completado" a medida que se resuelven.

## Por hacer

### Setup

- [x] Configurar Tailwind CSS (instalación, `tailwind.config.js`, tema del
      proyecto)
- [x] Crear la estructura de carpetas del proyecto (`components/`, `hooks/`,
      `pages/`, `services/`, `stores/`, `types/`, `utils/`, `styles/`)
- [x] Crear archivo `.env.example` con `VITE_API_URL` y `VITE_MOCK_MODE`
- [x] Configurar alias `@` en `vite.config.ts` (y en `tsconfig.app.json`)
      apuntando a `src/`

### Stores

- [x] Crear `auth.store.ts` con Zustand (estado de sesión, login/logout)
- [x] Crear `paths.store.ts` con Zustand (rutas de aprendizaje y progreso)

### Servicios

- [x] Crear `api.ts` con instancia de Axios configurada (baseURL,
      interceptores)
- [x] Crear servicios por módulo: `auth.service.ts`, `courses.service.ts`,
      `assessments.service.ts`, `paths.service.ts`

### Router

- [x] Configurar React Router en `App.tsx` con las rutas de la app y guards de
      autenticación para rutas privadas

### Páginas

- [x] `LandingPage`
- [x] `LoginPage`
- [x] `AuthCallbackPage`
- [x] `DashboardPage`
- [x] `AssessmentPage`
- [x] `PathDetailPage`

### Componentes UI

- [x] `Button`
- [x] `Badge`
- [x] `ProgressBar`
- [x] `Card`

### Componente StarMap

- [x] Implementar componente `StarMap`: canvas con galaxia interactiva para
      visualizar rutas de aprendizaje y progreso del usuario

### Docker

- [x] Crear `Dockerfile` para build de producción
- [x] Crear `nginx.conf` para servir el build estático

### Galaxia 3D de cursos (SPEC 02)

- [ ] Implementar `GET /api/v1/courses/galaxy` en `codequest-backend`
      (hasta entonces el frontend muestra la galaxia demo)

### Deploy

- [ ] Conectar el repositorio con DigitalOcean App Platform

## Completado

- [x] Inicializar proyecto con Vite + React + TypeScript
- [x] Instalar dependencias principales
- [x] Crear archivos de documentación
- [x] Implementar SPA navegable con landing, dashboard, evaluación y detalle
      de ruta estelar
- [x] Aplicar identidad visual sci-fi del mockup y layout responsive
- [x] Configurar Tailwind CSS, tema brand y PostCSS
- [x] Configurar alias `@` en Vite y TypeScript
- [x] Crear páginas y rutas públicas/privadas con React Router
- [x] Crear stores `auth` y `paths` con Zustand
- [x] Crear instancia Axios e implementar servicios de dominio
- [x] Crear tipos, utilidades de token y formato
- [x] Crear componentes UI, layout, assessment, dashboard y galaxy
- [x] Implementar `StarMap` con Canvas API, partículas y animación
- [x] Implementar assessment de cuatro pasos con React Hook Form + Zod
- [x] Integrar Sonner para notificaciones globales
- [x] Regenerar `package-lock.json` con React 18 y reinstalar dependencias
- [x] Verificar compilación con `npm run build`
- [x] Verificar calidad de código con `npm run lint`
- [x] Declarar `three` y `@types/three` en `package.json`
- [x] Tipos `Galaxy`, `GalaxyCourse`, `CourseGalaxyResponse` y `CourseLevel`
- [x] `coursesService.getCourseGalaxy()` y galaxia demo `galaxy.mock.ts`
- [x] Hook `useCourseGalaxy` con fallback a la galaxia demo
- [x] Hook `useGalaxyScene` con Three.js, `OrbitControls` y `dispose()`
      completo en cada rebuild
- [x] Nebulosas por galaxia, esferas por nivel, anillo de segunda galaxia y
      cursos inactivos atenuados
- [x] Hover con líneas de prerequisitos / relacionados y `CourseTooltip`
- [x] Click / tap con zoom animado y `CoursePanel`
- [x] Búsqueda, filtro de nivel, leyenda y banner demo en `StarMap3D`
- [x] Lazy load de `/starmap` en un chunk separado
- [x] Enlace "Explorar galaxia →" en el Dashboard
- [x] Foco de galaxia (nebulosa, leyenda, `Esc`, "Vista general", click en
      el vacío) con zoom a su centro (SPEC 03)
- [x] Resaltado y atenuado de estrellas y nebulosas por hover y foco, con
      lerp en el loop
- [x] Picking de nebulosas con prioridad de la estrella
- [x] Leyenda interactiva con `aria-pressed`
- [x] Líneas `Line2` con grosor, partículas de prerequisitos, dash animado,
      crecimiento y pulso
- [x] Líneas persistentes del curso seleccionado
- [x] Soporte de `prefers-reduced-motion` en la galaxia 3D
- [x] Tono de las esferas más suave (emissive 0.6 y color mezclado un 40 %
      hacia gris oscuro)
- [x] Texturas procedurales por galaxia con canvas 2D: 7 patrones más el
      fallback `noise` (SPEC 04)
- [x] Giro e inclinación iniciales deterministas por curso
- [x] Aura de polvo cósmico en todos los planetas, en lugar del halo
- [x] Órbita inclinada en los cursos avanzados
- [x] Geometrías y texturas de planetas compartidas y cacheadas con la escena
- [x] Atmósfera del color puro de la galaxia, con opacity por galaxia y
      subida en hover/selección
- [x] Emissive base por galaxia y brillo × 1.6 del planeta en hover o
      seleccionado (gana `dimmed`)
- [x] Anillo decorativo fino en todos los planetas
- [x] Variación por curso: tono del aura, superficie espejada, contraste y
      saturación/luminosidad del core
- [x] Carga diferida de las texturas de superficie: placeholder 1×1 y
      generación en tiempo idle por chunks de 40 ms (SPEC 05)
- [x] Fallback con `setTimeout` cuando no existe `requestIdleCallback`
- [x] Resolución adaptativa de las superficies (256×128 en gama baja)
- [x] Prioridad de generación por distancia a la cámara
- [x] Clon espejado compartido por patrón en `PlanetAssets`
