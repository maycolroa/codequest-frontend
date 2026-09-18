# CHANGELOG.md

Historial de cambios del frontend de Code Quest 2026.

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
