# CHANGELOG.md

Historial de cambios del frontend de Code Quest 2026.

## 2026-09-20

### Corregido

- Evitadas las solicitudes 404 de rutas de aprendizaje: el frontend ahora
  muestra el estado vacío cuando el backend real aún no expone endpoints de
  paths, manteniendo el modo mock separado.

## 2026-09-19

### Cambiado

- Alineación de stores, assessment, componentes de dashboard y galaxia con el
  contrato principal de `README.md`.
- Consolidación de estilos en `src/styles/index.css` y eliminación de CSS por
  página y del componente no documentado `Starfield`.
- Traslado de la lógica Canvas de fondo y mapa a `useStarMap.ts`.
- Alineación de Docker y Nginx con la configuración documentada.

Formato: fecha (`YYYY-MM-DD`) y lista de cambios relevantes, agrupados por
tipo cuando aplica (Añadido, Cambiado, Corregido, Documentación).

## 2026-09-16

### Añadido

- Inicialización del proyecto con Vite (React + TypeScript).
- Instalación de dependencias principales del scaffold inicial.

### Documentación

- Creación de los archivos de documentación base del proyecto:
  `CLAUDE.md`, `RULES.md`, `CONTEXT.md`, `TASKS.md`, `CHANGELOG.md` y
  `DECISIONS.md` en `docs/`.

## 2026-09-17

### Añadido

- Sustitución del scaffold de Vite por una SPA visual navegable de Code Quest.
- Landing pública, dashboard, evaluación inicial y detalle de ruta estelar.
- Identidad sci-fi inspirada en los mockups: universo oscuro, acentos lima /
  morado, tipografía monoespaciada y responsive layout.

### Cambiado

- Alineación del package con React 18 y las dependencias definidas en el
  README: Tailwind, Zustand, Axios, Router, Framer Motion, Lucide, RHF, Zod y
  Sonner.
- Separación de la aplicación en `pages`, `router`, `services`, `stores`,
  `types`, `utils` y estilos Tailwind.
- Creación de componentes UI reutilizables, layout, panel de estrellas y
  vista estelar con Canvas API.
- Implementación del cuestionario de cuatro pasos con React Hook Form y Zod.
- Regeneración del lockfile y reinstalación limpia de dependencias con React
  18.
- Corrección de compatibilidad TypeScript con React 18 y validación exitosa de
  `npm run build` y `npm run lint`.
- Añadido modo mock para trabajar sin backend, carga del dashboard desde
  `usePathsStore` y datos demo de rutas.
- Añadidos `Dockerfile`, `.dockerignore` y configuración Nginx para SPA.
- Rediseño de la landing pública para reproducir el mockup: branding
  DevTalles, mascota Devi, navegación, título Code Quest 2026, CTA Discord,
  nebulosa estelar y tarjetas de funcionalidades.

## 2026-09-18

### Corregido

- Ajuste responsive de la landing para evitar que las tarjetas de
  funcionalidades se superpongan al hero en pantallas de escritorio con poca
  altura; el contenido conserva su separación y permite desplazamiento
  vertical cuando es necesario.

- Alineación de rutas, stores y servicios con el contrato técnico: assessment
  parametrizado, rutas `/paths`, estado `activePath` y acciones de dominio.
- Integración del detalle de ruta con el parámetro de URL y `usePathsStore`.
- Implementación de lectura y envío de assessments mediante los endpoints
  parametrizados `/assessments/:id` y `/assessments/:id/submit`.
- Configuración del entorno de ejemplo en modo mock para que la landing y el
  flujo local puedan ejecutarse sin backend.

## 2026-09-22

### Añadido

- Galaxia 3D de cursos en `/starmap` (SPEC 02): `StarMap3D` consume
  `GET /courses/galaxy` y muestra una nebulosa por galaxia, una esfera por
  curso (color de su galaxia, tamaño según nivel, anillo si pertenece a una
  segunda galaxia, atenuada si está inactiva) y líneas rojas / azules hacia
  prerequisitos y cursos relacionados al hacer hover.
- Tipos `CourseLevel`, `Galaxy`, `GalaxyCourse` y `CourseGalaxyResponse`, y
  `coursesService.getCourseGalaxy()`.
- Galaxia demo (`src/services/galaxy.mock.ts`) que se muestra sin sesión, con
  `VITE_MOCK_MODE=true` o si falla la petición (con toast de aviso), junto a
  un banner con CTA de login con Discord.
- Hooks `useCourseGalaxy` (datos) y `useGalaxyScene` (escena Three.js), y
  componentes `CourseTooltip` y `CoursePanel`.
- Búsqueda por título, tags y galaxia (sin mayúsculas ni acentos), filtro de
  nivel, leyenda de galaxias y zoom animado al seleccionar un curso.
- Enlace "Explorar galaxia →" en el panel "Mapa general" del Dashboard.

### Cambiado

- `StarMap3D.tsx` pasa de 1261 líneas a un orquestador: la lógica de Three.js
  vive en `useGalaxyScene` y la navegación usa `OrbitControls`.
- `StarMap3D` se carga con `React.lazy`: Three.js queda en un chunk separado
  del bundle principal.
- Eliminados los cursos mock de astrofísica, `STATUS_CONFIG`, las
  estadísticas de completados, el botón de sonido y el branding anterior.

### Corregido

- `three` y `@types/three` declarados en `package.json`.
- Los filtros actualizan la escena (antes el effect corría una sola vez).
- El tooltip se posiciona por ref: el hover ya no re-renderiza React en cada
  frame.
- Los rebuilds de la escena hacen `dispose()` de geometrías, materiales y
  texturas.
