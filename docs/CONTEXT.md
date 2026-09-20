# CONTEXT.md

Contexto técnico del frontend de Code Quest 2026.

> **Nota:** el proyecto está en etapa inicial (scaffold de Vite + React +
> TypeScript). Lo que describe este documento es la **arquitectura objetivo**
> hacia la que se está construyendo el proyecto, en línea con `TASKS.md`.
> A medida que cada pieza se implemente, actualiza este archivo para que
> refleje el estado real del código.

## Páginas y rutas de la app

| Ruta | Página | Descripción | Acceso |
|---|---|---|---|
| `/` | `LandingPage` | Página pública de presentación de Code Quest 2026 | Público |
| `/login` | `LoginPage` | Inicio de sesión del usuario | Público |
| `/auth/callback` | `AuthCallbackPage` | Callback del flujo de autenticación (OAuth/SSO) | Público |
| `/dashboard` | `DashboardPage` | Panel principal del usuario autenticado (progreso, rutas activas) | Privado |
| `/assessment` | `AssessmentPage` | Cuestionario de cuatro pasos | Privado |
| `/paths/:id` | `PathDetailPage` | Detalle de una ruta de aprendizaje (learning path) | Privado |

Las rutas privadas deben estar protegidas por un guard que valide la sesión
del usuario contra `useAuthStore` y redirija a `/login` si no hay sesión
activa.

## Estructura de carpetas

```
codequest-frontend/
├── docs/                      # Documentación del proyecto (este directorio)
├── public/                    # Archivos estáticos servidos tal cual
├── src/
│   ├── components/
│   │   ├── ui/                    # Componentes UI genéricos: Button, Badge,
│   │   │                          # ProgressBar, Card
│   │   └── galaxy/                # Componentes del mapa de galaxia
│   ├── hooks/                   # Custom hooks (lógica reutilizable)
│   ├── pages/                   # Componentes de página (uno por ruta)
│   ├── services/                # Instancia de Axios y servicios por módulo
│   │   ├── api.ts                 # Instancia Axios configurada
│   │   ├── auth.service.ts
│   │   ├── courses.service.ts
│   │   ├── assessments.service.ts
│   │   └── paths.service.ts
│   ├── stores/                  # Stores de Zustand, uno por dominio
│   │   ├── auth.store.ts
│   │   └── paths.store.ts
│   ├── types/                   # Tipos e interfaces TypeScript compartidos
│   ├── App.tsx
│   ├── main.tsx
│   └── styles/index.css          # Tailwind y clases globales
├── .env.example                # Plantilla de variables de entorno
├── tailwind.config.js
├── vite.config.ts               # Incluye alias @ -> src/
├── Dockerfile
├── nginx.conf
└── package.json
```

## Stores de Zustand

### `useAuthStore` (`src/stores/auth.store.ts`)

Maneja el estado de autenticación del usuario.

- **Estado:** `user: User | null`, `token: string | null`,
  `isAuthenticated: boolean`, `isLoading: boolean`.
- **Acciones:** `login(credentials)`, `logout()`, `setUser(user)`,
  `refreshToken()`.
- Persiste el token de forma segura (por ejemplo, vía middleware `persist`
  de Zustand) para mantener la sesión entre recargas.

### `usePathsStore` (`src/stores/paths.store.ts`)

Maneja las rutas de aprendizaje y el progreso del usuario en ellas.

- **Estado:** `paths: LearningPath[]`, `currentPath: LearningPath | null`,
  `progress: UserProgress[]`, `loading: boolean`.
- **Acciones:** `fetchPaths()`, `fetchPath(pathId)`,
  `toggleProgress(pathId, courseId, completed)`, `deletePath(id)`.

Ambos stores siguen la regla de `RULES.md`: nunca se muta el estado
directamente, todas las actualizaciones pasan por `set()`.

## Servicios de Axios

Todos los servicios consumen la instancia central definida en
`src/services/api.ts` (baseURL desde `VITE_API_URL`, interceptores de
request/response, manejo de token de autenticación y errores).

- **`auth.service.ts`** — login, logout, refresh de sesión, obtención del
  usuario autenticado (`/auth/login`, `/auth/logout`, `/auth/me`).
- **`courses.service.ts`** — listado y detalle de cursos/módulos
  (`/courses`, `/courses/:id`).
- **`assessments.service.ts`** — obtención y envío de evaluaciones
  (`/assessments/:id`, `/assessments/:id/submit`).
- **`paths.service.ts`** — listado, detalle y progreso de rutas de
  aprendizaje (`/paths`, `/paths/:id`, `/paths/:id/progress`).

## Tipos TypeScript principales

Ubicados en `src/types/`.

```ts
interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: "student" | "admin";
  createdAt: string;
}

interface Course {
  id: string;
  title: string;
  description: string;
  pathId: string;
  order: number;
  durationMinutes: number;
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: Course[];
  totalCourses: number;
  iconUrl?: string;
}

interface UserProgress {
  userId: string;
  pathId: string;
  completedCourseIds: string[];
  completionPercentage: number;
  lastActivityAt: string;
}
```

Estos tipos son la fuente de verdad para lo que devuelven los servicios de
Axios y lo que consumen los stores y componentes. Cualquier cambio en el
contrato de la API debe reflejarse primero aquí.

## Variables de entorno

Definidas en `.env` (no versionado) a partir de la plantilla `.env.example`.

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend consumido por `services/api.ts` |
| `VITE_MOCK_MODE` | `true`/`false` — cuando es `true`, los servicios devuelven datos simulados en lugar de llamar al backend real (útil para desarrollo sin backend disponible) |
