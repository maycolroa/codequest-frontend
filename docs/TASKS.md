# TASKS.md

Lista de tareas del frontend de Code Quest 2026. Mantener actualizada:
mover ítems de "Por hacer" a "Completado" a medida que se resuelven.

## Por hacer

### Setup

- [ ] Configurar Tailwind CSS (instalación, `tailwind.config.js`, tema del
      proyecto)
- [ ] Crear la estructura de carpetas del proyecto (`components/`, `hooks/`,
      `pages/`, `router/`, `services/`, `stores/`, `types/`)
- [ ] Crear archivo `.env.example` con `VITE_API_URL` y `VITE_MOCK_MODE`
- [ ] Configurar alias `@` en `vite.config.ts` (y en `tsconfig.app.json`)
      apuntando a `src/`

### Stores

- [ ] Crear `auth.store.ts` con Zustand (estado de sesión, login/logout)
- [ ] Crear `paths.store.ts` con Zustand (rutas de aprendizaje y progreso)

### Servicios

- [ ] Crear `api.ts` con instancia de Axios configurada (baseURL,
      interceptores)
- [ ] Crear servicios por módulo: `auth.service.ts`, `courses.service.ts`,
      `assessments.service.ts`, `paths.service.ts`

### Router

- [ ] Configurar React Router con las rutas de la app y guards de
      autenticación para rutas privadas

### Páginas

- [ ] `LandingPage`
- [ ] `LoginPage`
- [ ] `AuthCallbackPage`
- [ ] `DashboardPage`
- [ ] `AssessmentPage`
- [ ] `PathDetailPage`

### Componentes UI

- [ ] `Button`
- [ ] `Badge`
- [ ] `ProgressBar`
- [ ] `Card`

### Componente StarMap

- [ ] Implementar componente `StarMap`: canvas con galaxia interactiva para
      visualizar rutas de aprendizaje y progreso del usuario

### Docker

- [ ] Crear `Dockerfile` para build de producción
- [ ] Crear `nginx.conf` para servir el build estático

### Deploy

- [ ] Conectar el repositorio con DigitalOcean App Platform

## Completado

- [x] Inicializar proyecto con Vite + React + TypeScript
- [x] Instalar dependencias principales
- [x] Crear archivos de documentación
