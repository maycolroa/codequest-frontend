# RULES.md

Reglas de código para el frontend de Code Quest 2026. Estas reglas aplican
a todo el código nuevo y deben respetarse al modificar código existente.

## TypeScript

- Tipar siempre los props de los componentes y los valores de retorno de
  funciones y hooks, incluso cuando TypeScript podría inferirlos.
- **Nunca usar `any`.** Si el tipo es desconocido en tiempo de escritura,
  usar `unknown` y aplicar narrowing (`typeof`, `instanceof`, type guards)
  antes de operar sobre el valor.
- Usar `interface` para describir la forma de objetos (props, modelos de
  dominio, respuestas de API). Reservar `type` para uniones, intersecciones,
  tipos primitivos con alias y utility types.
- Evitar `as` para forzar tipos salvo en casos justificados (por ejemplo,
  al tipar respuestas de librerías externas sin tipos); preferir validación
  con Zod cuando el dato viene de una fuente externa (API, `localStorage`).

## Componentes React

- **Un componente por archivo.** El nombre del archivo debe reflejar el
  nombre del componente exportado.
- Usar **functional components** con hooks; no se permiten componentes de
  clase.
- Extraer lógica compleja (efectos, suscripciones, cálculos derivados
  reutilizables) a **custom hooks** ubicados en `src/hooks/`. Un componente
  no debería tener más de un par de `useEffect` no triviales; si crece,
  extraer a un hook.
- Mantener los componentes de presentación (UI) separados de los que
  orquestan datos (fetch, stores) cuando sea razonable.

## Zustand

- Los stores viven en `src/stores/`.
- **Un store por dominio** (por ejemplo, `auth.store.ts`, `paths.store.ts`).
  No crear un store global monolítico.
- **Nunca mutar el estado directamente.** Todas las actualizaciones deben
  pasar por `set()` devolviendo un nuevo objeto/valor, siguiendo el patrón
  de inmutabilidad de Zustand.
- Exponer del store solo lo necesario (estado + acciones); evitar exponer
  setters genéricos que permitan mutaciones arbitrarias desde fuera.

## Axios

- **Siempre usar la instancia configurada en `src/services/api.ts`** (con
  baseURL, headers e interceptores ya definidos).
- **Nunca hacer `fetch` directo ni crear instancias de Axios sueltas dentro
  de componentes.** Toda llamada HTTP debe pasar por un servicio en
  `src/services/`.

## Tailwind CSS

- Usar las clases y tokens del tema definidos en `tailwind.config.js`
  (colores, espaciados, tipografía del proyecto) en lugar de valores
  arbitrarios (`bg-[#123456]`) salvo necesidad puntual justificada.
- **No usar estilos inline** (`style={{ ... }}`) salvo para valores
  verdaderamente dinámicos que no puedan expresarse como clases (por
  ejemplo, una posición calculada en el canvas del StarMap).

## Convenciones de nombres

- **Componentes:** `PascalCase` (`DashboardPage.tsx`, `ProgressBar.tsx`).
- **Hooks:** prefijo `use` + nombre descriptivo (`useAuth.ts`,
  `useLearningPath.ts`).
- **Stores:** prefijo `use` + nombre + sufijo `Store`
  (`useAuthStore`, `usePathsStore`).
- **Archivos:** `kebab-case` para archivos que no exportan un componente
  React como export principal (`api.ts`, `auth.service.ts`,
  `format-date.ts`). Los archivos de componentes usan `PascalCase.tsx`.

## Commits

- Usar **Conventional Commits en español**, con el formato:
  `tipo(alcance opcional): descripción breve en minúsculas`.
- Tipos permitidos: `feat`, `fix`, `refactor`, `docs`, `style`, `test`,
  `chore`, `perf`.
- Ejemplos:
  - `feat(auth): agregar store de autenticación con Zustand`
  - `fix(dashboard): corregir cálculo de progreso del usuario`
  - `docs: actualizar changelog con avances de la semana`
