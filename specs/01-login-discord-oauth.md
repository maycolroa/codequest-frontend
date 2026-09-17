# SPEC 01 — Login vía Discord OAuth

> **Status:** aprobado
> **Depends on:** (ninguno, es el primer spec)
> **Date:** 2026-09-17
> **Objective:** Implementar el login vía Discord OAuth (landing, login, callback y guard de rutas privadas) junto con el setup base del proyecto (Tailwind, router, store de auth, servicio de Axios) que lo sostiene.

## Por qué existe este spec

El scaffold actual solo tiene Vite + React + TypeScript; no existen Tailwind, React Router, Zustand, Axios ni la estructura de carpetas descrita en `docs/CONTEXT.md`. El login no puede funcionar sin esa base, así que este spec la incluye como parte de la implementación en vez de crear un spec de setup separado. Además, el mockup (`docs/Code Quest 2026 UI mockups (1)/Code Quest 2026.dc.html`, opción `3a`, y `docs/images/login.png`) confirma que la autenticación es exclusivamente vía Discord OAuth — no existe formulario de email/password en ninguna de las 4 variantes de diseño exploradas. No hay backend disponible todavía, así que el flujo real de Discord se implementa contra un contrato asumido (documentado abajo como provisional) y se desarrolla/prueba con `VITE_MOCK_MODE=true`.

## Scope

**In:**

- Instalación y configuración mínima de: `tailwindcss` (+ `postcss`, `autoprefixer`), `react-router-dom`, `zustand`, `axios`.
- Estructura de carpetas de `docs/CONTEXT.md`: `components/ui`, `hooks`, `pages`, `router`, `services`, `stores`, `types`.
- Alias `@` → `src/` en `vite.config.ts` y `tsconfig.app.json`.
- `.env.example` con `VITE_API_URL` y `VITE_MOCK_MODE`.
- `src/types/user.ts` con la interfaz `User` (según `docs/CONTEXT.md`).
- `src/services/api.ts`: instancia de Axios con `baseURL` desde `VITE_API_URL` e interceptor que agrega `Authorization: Bearer <token>` cuando hay sesión.
- `src/services/auth.service.ts`: helper de la URL de login de Discord y `fetchMe(token)`.
- `src/stores/auth.store.ts`: store de Zustand (`user`, `token`, `isAuthenticated`, `isLoading`, `login`, `handleCallback`, `logout`, `setUser`) con `persist` en `localStorage`, con rama mock y rama real.
- `src/components/ui/Button.tsx`: botón genérico reutilizable (usado por el CTA de Discord).
- `src/pages/LandingPage.tsx`: hero fiel al mockup opción `3a` (badge, título, CTA, 3 feature cards, contador).
- `src/pages/LoginPage.tsx`: idéntica a `LandingPage` (mismo hero completo), montada en `/login`.
- `src/pages/AuthCallbackPage.tsx`: loader mientras se procesa el login real; redirige a `/dashboard` en éxito o a `/login` con mensaje de error en fallo.
- `src/pages/DashboardPage.tsx`: placeholder ("Hola, {user.name}" + botón "Cerrar sesión") para poder probar el flujo end-to-end.
- `src/router/ProtectedRoute.tsx` (guard) y `src/router/AppRouter.tsx` con rutas públicas (`/`, `/login`, `/auth/callback`) y privada (`/dashboard`).
- Copiar `logo-devtalles.png` y `devi-hello.png` desde el mockup a `src/assets/`.
- Fuente JetBrains Mono (Google Fonts) y tokens de color del mockup (morado `#7C3AED`, lima `#A3E635`, fondo `#050814`/`#07061a`) en `tailwind.config.js`.
- Actualizar `docs/CONTEXT.md`, `docs/TASKS.md` y `docs/CHANGELOG.md` al finalizar.

**Out of scope (para specs futuros):**

- Integración real con el backend/Discord — se desarrolla y prueba con `VITE_MOCK_MODE=true`; cuando el backend exista, se ajusta el contrato asumido.
- Diseño final de `DashboardPage` y demás páginas privadas (`PathDetailPage`, `AssessmentPage`).
- Componente `StarMap`.
- Componentes UI `Badge`, `ProgressBar`, `Card` (no los usa el login).
- `courses.service.ts`, `paths.service.ts`, `assessments.service.ts`.
- Refresh token automático / expiración de sesión.
- Docker, `nginx.conf`, deploy a DigitalOcean.
- Las otras 3 variantes visuales del mockup (turnos `t1`, `t2`, `t4`) — solo se implementa la opción `3a`.
- Registro de usuario / recuperación de contraseña (no aplica: solo OAuth).

## Data model

```ts
// src/types/user.ts
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "student" | "admin";
  createdAt: string;
}
```

```ts
// src/stores/auth.store.ts
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => Promise<void>;
  handleCallback: (token: string) => Promise<void>;
  logout: () => void;
  setUser: (user: User) => void;
}
```

Persistencia: `persist` de Zustand, storage `localStorage`, key `codequest-auth-storage`, guardando solo `token` (el resto se re-deriva llamando a `/auth/me` al cargar la app, o se resuelve directo en modo mock).

Usuario mock (usado cuando `VITE_MOCK_MODE=true`):

```ts
const MOCK_USER: User = {
  id: "mock-user-1",
  name: "Explorador Mock",
  email: "explorador@mock.dev",
  role: "student",
  createdAt: new Date().toISOString(),
};
```

**Contrato de backend asumido (provisional, sin backend real todavía):**

- `GET {VITE_API_URL}/auth/discord` — navegación de browser (no llamada Axios); el backend redirige a Discord y procesa el callback de Discord.
- Éxito: el backend redirige a `${origin}/auth/callback?token=<JWT>`.
- Error: el backend redirige a `${origin}/auth/callback?error=<mensaje>`.
- `GET {VITE_API_URL}/auth/me` con header `Authorization: Bearer <token>` → devuelve `User`.

## Implementation plan

1. Instalar `react-router-dom`, `zustand`, `axios`, `tailwindcss`, `postcss`, `autoprefixer`. Verificar que `npm run dev` sigue funcionando.
2. Configurar Tailwind (`tailwind.config.js`, `postcss.config.js`, directivas en `src/index.css`) con los tokens de color y fuente JetBrains Mono del mockup; enlazar la fuente en `index.html`.
3. Configurar el alias `@` → `src/` en `vite.config.ts` y `tsconfig.app.json`.
4. Crear la estructura de carpetas (`components/ui`, `hooks`, `pages`, `router`, `services`, `stores`, `types`).
5. Crear `.env.example` con `VITE_API_URL` y `VITE_MOCK_MODE=true`; crear `.env` local (no versionado) a partir de la plantilla.
6. Crear `src/types/user.ts` con la interfaz `User`.
7. Crear `src/services/api.ts`: instancia Axios con `baseURL` e interceptor de `Authorization`.
8. Crear `src/services/auth.service.ts`: `getDiscordAuthUrl()` y `fetchMe(token)`.
9. Crear `src/stores/auth.store.ts` con Zustand + `persist`, incluyendo la rama mock (`VITE_MOCK_MODE`) y la rama real.
10. Crear `src/components/ui/Button.tsx` con variantes `primary` y `discord`.
11. Crear `src/pages/LandingPage.tsx` fiel al mockup `3a`, usando `Button` para el CTA de Discord.
12. Crear `src/pages/LoginPage.tsx` reutilizando el mismo hero de `LandingPage`.
13. Crear `src/pages/AuthCallbackPage.tsx`: loader, lee `token`/`error` de los query params, llama a `handleCallback`, redirige a `/dashboard` o a `/login?error=...`.
14. Crear `src/pages/DashboardPage.tsx` placeholder con saludo y botón "Cerrar sesión" (llama a `logout()` y navega a `/`).
15. Crear `src/router/ProtectedRoute.tsx` y `src/router/AppRouter.tsx`; montar el router en `App.tsx`.
16. Copiar `logo-devtalles.png` y `devi-hello.png` a `src/assets/`.
17. Probar manualmente el flujo completo en modo mock: `/` → click "INICIAR CON DISCORD" → `/dashboard` → "Cerrar sesión" → `/`; y el guard: navegar directo a `/dashboard` sin sesión → redirige a `/login`.
18. Ejecutar `npx tsc --noEmit` y `npm run lint`; corregir lo que falle.
19. Actualizar `docs/CONTEXT.md` (marcar lo implementado), `docs/TASKS.md` (mover ítems a "Completado") y `docs/CHANGELOG.md` (entrada bajo `2026-09-17`).

## Acceptance criteria

- [ ] `npm run dev` levanta la app sin errores en consola.
- [ ] `/` muestra la `LandingPage` fiel al mockup: badge "EXPEDICIÓN 2026 · ABIERTA", título "CODE QUEST 2026", botón "INICIAR CON DISCORD", 3 feature cards y contador de exploradores.
- [ ] `/login` muestra el mismo hero que `/`.
- [ ] Con `VITE_MOCK_MODE=true`, click en "INICIAR CON DISCORD" autentica con el usuario mock y navega a `/dashboard` sin pasar por `/auth/callback`.
- [ ] `/dashboard` muestra "Hola, {nombre del usuario}" y un botón "Cerrar sesión".
- [ ] Click en "Cerrar sesión" limpia el store, borra la sesión persistida en `localStorage` y navega a `/`.
- [ ] Recargar la página estando autenticado mantiene la sesión (no redirige a `/login`).
- [ ] Navegar directo a `/dashboard` sin sesión activa redirige a `/login`.
- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] `npm run lint` no reporta errores.
- [ ] Ningún archivo nuevo usa `any`.
- [ ] `docs/CONTEXT.md`, `docs/TASKS.md` y `docs/CHANGELOG.md` quedan actualizados reflejando lo implementado.

## Decisions

- **Sí:** autenticación 100% vía Discord OAuth, sin formulario email/password — es el único CTA presente en las 4 variantes de diseño del mockup y coincide con `/auth/callback` (OAuth/SSO) de `docs/CONTEXT.md`.
- **Sí:** el backend maneja todo el flujo de OAuth (redirect a Discord + callback de Discord); el frontend solo enlaza a `${VITE_API_URL}/auth/discord` y recibe el resultado en `/auth/callback`. Evita exponer client secret o manejar `state`/PKCE en el cliente.
- **Sí:** el contrato de backend (`/auth/discord`, `/auth/callback?token=`, `/auth/me`) se documenta explícitamente como asumido/provisional, ya que no hay backend todavía; se ajustará cuando exista.
- **Sí:** `VITE_MOCK_MODE=true` simula sesión inmediata con usuario hardcodeado (sin pasar por `/auth/callback`) — permite desarrollar y probar todo el flujo, incluido el guard, sin backend.
- **Sí:** se incluye el setup base (Tailwind, router, stores, servicios, estructura de carpetas) en este mismo spec porque el login no puede funcionar sin ellos y no existe un spec previo que los cubra.
- **Sí:** se crea un `DashboardPage` placeholder (solo saludo + logout) para verificar el flujo end-to-end, aunque su diseño real quede fuera de este spec.
- **Sí:** `LoginPage` es idéntica a `LandingPage` (mismo hero completo) — decisión explícita para reutilizar el mismo componente/hero en ambas rutas.
- **No:** refresh token automático / expiración de sesión — no hay contrato de backend real todavía; se resuelve cuando exista.
- **No:** componentes UI `Badge`, `ProgressBar`, `Card` — el login no los necesita; quedan para los specs de las páginas que sí los usan.
- **No:** `courses.service.ts`, `paths.service.ts`, `assessments.service.ts` — fuera del alcance de login.

## Risks

| Riesgo                                                      | Mitigación                                                                                                                                                    |
| ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| El contrato de backend asumido no coincide con el real      | Está documentado explícitamente como provisional en "Data model"; al integrar el backend real solo se ajustan`auth.service.ts` y `AuthCallbackPage.tsx`. |
| `localStorage` deshabilitado (modo privado del navegador) | La sesión simplemente no persiste entre recargas; el resto del flujo sigue funcionando dentro de la misma pestaña.                                           |
| Tokens de Tailwind mal definidos afectan páginas futuras   | Se limita la configuración a lo que usa el mockup`3a` (colores, fuente); cualquier extensión queda para el spec de la página que la necesite.             |

## What is **not** in this spec

- Integración real con el backend/Discord (se usa mock mientras tanto).
- Diseño final de `DashboardPage`, `PathDetailPage` y `AssessmentPage`.
- Componente `StarMap`.
- Componentes UI `Badge`, `ProgressBar`, `Card`.
- Refresh token / expiración de sesión.
- Docker, `nginx.conf`, deploy.

Cada uno de estos, si se implementa, va en su propio spec.
