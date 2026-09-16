# CLAUDE.md

Instrucciones para Claude Code al trabajar en este repositorio.

## Contexto del proyecto

Este repositorio contiene el **frontend de Code Quest 2026**, una plataforma
de aprendizaje gamificada donde los usuarios avanzan por rutas de aprendizaje
("learning paths"), realizan evaluaciones ("assessments") y visualizan su
progreso a través de un mapa estelar interactivo ("StarMap").

El proyecto está en etapa temprana: existe el scaffold inicial de Vite +
React + TypeScript, y se está construyendo la base de arquitectura (stores,
servicios, router, páginas y componentes UI). Consulta `TASKS.md` para ver
qué está pendiente y qué ya se completó.

## Stack tecnológico

- **React 18** — librería de UI
- **TypeScript** — tipado estático, estricto
- **Vite** — build tool y dev server
- **Tailwind CSS** — estilos utilitarios
- **Zustand** — manejo de estado global
- **Axios** — cliente HTTP
- **React Router 6** — enrutamiento
- **Framer Motion** — animaciones
- **React Hook Form + Zod** — formularios y validación de esquemas
- **Lucide React** — iconos
- **Sonner** — notificaciones toast

## Reglas de cómo ayudar

1. **Lee `docs/RULES.md` primero** antes de escribir o modificar código.
   Contiene las convenciones de código del proyecto (TypeScript, componentes,
   Zustand, Axios, Tailwind, nombres, commits).
2. **Actualiza `docs/CHANGELOG.md` después de cada cambio** relevante,
   agregando una entrada bajo la fecha correspondiente (formato
   `YYYY-MM-DD`) que resuma qué se hizo y por qué.
3. **Marca las tareas en `docs/TASKS.md`** — mueve los ítems completados de
   "Por hacer" a "Completado" a medida que se van resolviendo. No borres el
   historial de tareas completadas.
4. **Nunca uses `any` en TypeScript.** Si el tipo es genuinamente desconocido,
   usa `unknown` y haz un narrowing explícito. Ver detalles en `RULES.md`.
5. Antes de tomar decisiones de arquitectura no triviales, revisa
   `docs/CONTEXT.md` (contexto técnico: rutas, estructura de carpetas,
   stores, servicios, tipos) y `docs/DECISIONS.md` (decisiones técnicas ya
   tomadas y su justificación) para mantener coherencia con lo existente.

## Prefijos de comunicación

Al reportar cambios o proponer trabajo, usa estos prefijos para que el
contexto del mensaje sea inmediato:

- `FEAT:` — nueva funcionalidad
- `FIX:` — corrección de un bug
- `REFACTOR:` — cambio de código que no altera comportamiento externo
- `DOCS:` — cambios en documentación (`docs/`, `README.md`, comentarios)
- `TASK:` — actualización de tareas/planificación en `TASKS.md`

Ejemplo: `FEAT: agregar store de autenticación con Zustand`

## Comandos útiles

```bash
npm run dev          # levanta el servidor de desarrollo (Vite)
npm run build         # compila TypeScript y genera el build de producción
npm run lint           # corre ESLint sobre el proyecto
npx tsc --noEmit        # verifica tipos sin emitir archivos
```

Ejecuta `npx tsc --noEmit` y `npm run lint` antes de dar por terminado un
cambio de código para confirmar que no se rompió el tipado ni el linting.
