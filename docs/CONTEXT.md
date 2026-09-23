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
| `/starmap` | `StarMap3D` (lazy) | Galaxia 3D de cursos. Sin sesión muestra la galaxia demo y un CTA de login con Discord | Público |

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
│   │   ├── star-map/              # Componente StarMap (canvas de galaxia)
│   │   └── galaxy/                # StarMap3D, CourseTooltip, CoursePanel
│   ├── hooks/                   # Custom hooks (lógica reutilizable):
│   │                            # useCourseGalaxy (datos), useGalaxyScene (Three.js)
│   ├── lib/
│   │   └── galaxy/                # Módulos de la galaxia 3D que usa useGalaxyScene
│   │       ├── galaxyHighlight.ts   # Funciones puras de resaltado (sin three ni react)
│   │       └── relationLines.ts     # Líneas de relaciones con Line2 (Three.js)
│   ├── pages/                   # Componentes de página (uno por ruta)
│   ├── services/                # Instancia de Axios y servicios por módulo
│   │   ├── api.ts                 # Instancia Axios configurada
│   │   ├── auth.service.ts
│   │   ├── courses.service.ts
│   │   ├── galaxy.mock.ts         # Galaxia demo con el contrato de /courses/galaxy
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
  (`/courses`, `/courses/:id`) y galaxia de cursos (`/courses/galaxy`,
  `getCourseGalaxy()`).
  > **Nota:** `codequest-backend` todavía no expone `GET /courses/galaxy`.
  > `useCourseGalaxy` cae a la galaxia demo (`galaxy.mock.ts`) y muestra un
  > toast cuando la petición falla. Sin token no se llama al endpoint, para
  > que el interceptor de 401 no redirija al visitante anónimo.
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

### Galaxia de cursos (`GET /courses/galaxy`)

Tipos separados de `Course`, que no cambia.

```ts
type CourseLevel = Course["level"]; // 'beginner' | 'intermediate' | 'advanced'

interface Galaxy {
  key: string;
  name: string;
  color: string;
  center: { x: number; y: number; z: number };
}

interface GalaxyCourse {
  id: string; // UUID
  slug: string;
  title: string;
  category: string;
  level: CourseLevel;
  tags: string[];
  isActive: boolean;
  galaxies: string[]; // keys de Galaxy; [0] es la galaxia principal
  galaxyColor: string;
  positionX?: number | null;
  positionY?: number | null;
  positionZ?: number | null;
  prerequisites: string[]; // slugs
  related: string[]; // slugs
}

interface CourseGalaxyResponse {
  galaxies: Galaxy[];
  courses: GalaxyCourse[];
}
```

Estos tipos son la fuente de verdad para lo que devuelven los servicios de
Axios y lo que consumen los stores y componentes. Cualquier cambio en el
contrato de la API debe reflejarse primero aquí.

## Galaxia 3D (`/starmap`)

`StarMap3D` guarda el estado de React: búsqueda, nivel, curso seleccionado y
`focusedGalaxyKey`. `useGalaxyScene` gestiona la escena de Three.js. El hover
vive en variables del closure del loop de animación, para que mover el mouse
no provoque renders de React en cada frame.

- **Foco de galaxia**
  - **Qué es:** `focusedGalaxyKey: string | null` en `StarMap3D`.
  - **Cómo se activa:** con un click en una nebulosa, que el hook comunica
    mediante `onFocusGalaxy`, o con la leyenda, que funciona como toggle.
  - **Cómo se quita:** con un click en espacio vacío (no un arrastre), `Esc`,
    "Vista general" o al navegar desde el panel a un curso.
  - **Si la galaxia desaparece de los datos:** el valor que recibe el hook se
    deriva en render (`activeFocusKey`) y pasa a `null`.
  - **Cámara:** al enfocar, vuela a `galaxy.center`.
- **Resaltado**
  - Las funciones de `galaxyHighlight.ts` resuelven qué galaxias están
    activas: foco > hover > nada.
  - Un curso pertenece a una galaxia si su key está en cualquier posición de
    `galaxies[]`.
  - La nebulosa intensificada es la enfocada o la de `galaxies[0]` del curso
    en hover.
  - El set activo solo se recalcula cuando cambian el hover o el foco. En cada
    frame, el loop interpola la opacidad y el emissive de cada estrella, y la
    opacidad y la escala de cada nebulosa.
- **Tono de las esferas**
  - El color de la galaxia se mezcla un 40 % hacia `#262626` en el core, el
    halo y el anillo.
  - `emissiveIntensity` base: 0.6 en los cursos activos y 0.3 en los
    inactivos.
  - La point light, las líneas y las nebulosas usan el color original.
- **Relaciones** (`relationLines.ts`)
  - Cada juego de líneas es un `RelationLines` anclado en el curso origen.
  - Prerequisitos: rojos, con partículas en un solo `THREE.Points`.
    Relacionados: azules, con dash animado.
  - El grosor, en píxeles, depende del tipo y del orden del slug.
  - El hook mantiene dos slots:
    - `hoverLines`, con brillo completo;
    - `selectedLines`, con brillo 0.45, que sube a 1 con hover sobre el curso
      seleccionado.
  - Los dos slots se liberan con `dispose()` en cada rebuild de nodos.
- **Reduced motion:** el hook lee `prefers-reduced-motion: reduce` con
  `matchMedia` y reacciona a sus cambios. Con reduced motion:
  - no hay partículas, dash animado ni pulso;
  - las líneas aparecen completas;
  - el zoom a curso y a galaxia es instantáneo;
  - el resaltado y las líneas se siguen viendo.

## Variables de entorno

Definidas en `.env` (no versionado) a partir de la plantilla `.env.example`.

| Variable | Descripción |
|---|---|
| `VITE_API_URL` | URL base del backend consumido por `services/api.ts` |
| `VITE_MOCK_MODE` | `true`/`false` — cuando es `true`, los servicios devuelven datos simulados en lugar de llamar al backend real (útil para desarrollo sin backend disponible) |
