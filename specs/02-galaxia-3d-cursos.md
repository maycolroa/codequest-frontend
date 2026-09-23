# SPEC 02 — Galaxia 3D de cursos reales en /starmap

> **Status:** aprobado
> **Depends on:** SPEC 01
> **Date:** 2026-09-22
> **Objective:** Conectar `StarMap3D` en `/starmap` al endpoint `GET /courses/galaxy` para mostrar los cursos de DevTalles como una galaxia 3D, con nebulosas por galaxia, líneas de prerequisitos y relacionados y un panel de detalle, y caer a una galaxia demo cuando no hay sesión o falla el backend.

## Por qué existe este spec

`src/components/galaxy/StarMap3D.tsx` (1261 líneas, Three.js imperativo) ya tiene la base visual: shader de nebulosa y aurora, partículas, estrellas fugaces, esferas con halo, tooltip, zoom y panel. Pero usa 8 cursos mock hardcodeados con temática de astrofísica y no llama a ningún servicio.

Además tiene bugs que bloquean el uso con datos reales:

- Los filtros no actualizan la escena, porque el effect corre una sola vez con `[]`.
- `setScreenLabels` provoca un re-render de React en cada frame.
- Los rebuilds no hacen `dispose()`, así que pierden memoria.
- `three` no está declarado en `package.json`: una instalación limpia rompe el build.
- El botón de sonido no hace nada.

El backend (`codequest-backend`) todavía no expone `GET /api/v1/courses/galaxy` en ninguna rama. El contrato de abajo lo definió el usuario y es la fuente de verdad. Mientras el endpoint no exista, la UI usa la galaxia demo.

## Scope

**In:**

- Declarar `three` y `@types/three` en `package.json`.
- Tipos `Galaxy`, `GalaxyCourse`, `CourseGalaxyResponse` y `CourseLevel` en `src/types/index.ts`, sin modificar `Course`.
- `coursesService.getCourseGalaxy()` en `src/services/courses.service.ts` → `GET /courses/galaxy`.
- `src/services/galaxy.mock.ts`: galaxia demo con el mismo contrato.
- Hook de datos `src/hooks/useCourseGalaxy.ts`: usa el mock si no hay token o si `VITE_MOCK_MODE === 'true'`. Si falla la petición, cae al mock y muestra un toast de Sonner.
- Hook de escena `src/hooks/useGalaxyScene.ts`, que extrae de `StarMap3D.tsx` toda la lógica de Three.js:
  - Fondo `#000005`, shader de nebulosa y aurora, ~2500 partículas y estrellas fugaces (se reutilizan).
  - Una nebulosa (`THREE.Sprite`) por galaxia, en `galaxy.center` y con `galaxy.color`.
  - Una esfera por curso con color `galaxyColor`, radio según `level`, halo y point light. Lleva un anillo con el color de `galaxies[1]` si el curso pertenece a más de una galaxia.
  - Posición de respaldo determinista si faltan `positionX/Y/Z`.
  - Cursos con `isActive: false` atenuados.
  - Hover: la esfera crece con lerp, aparecen líneas rojas a los prerequisitos y azules a los relacionados, y se muestra el tooltip, posicionado por ref.
  - `OrbitControls` sustituye la órbita, la rueda y el pinch hechos a mano.
  - Click o tap (distinto de arrastrar): selecciona el curso y anima el zoom.
  - Eventos `pointer*`.
  - Rebuild de nodos al cambiar los cursos filtrados, con `dispose()` completo.
- `src/components/galaxy/StarMap3D.tsx` reducido a orquestador: header, búsqueda, filtro de nivel, leyenda, banner demo y spinner de carga.
- Componentes nuevos `src/components/galaxy/CourseTooltip.tsx` y `src/components/galaxy/CoursePanel.tsx`.
- Lazy load de `StarMap3D` en `src/App.tsx` con `React.lazy` + `Suspense`, para que Three.js quede en un chunk aparte.
- Enlace "Explorar galaxia →" a `/starmap` en el panel "Mapa general" de `DashboardPage`, sin más cambios en el Dashboard.
- Actualizar `docs/CHANGELOG.md`, `docs/TASKS.md` y `docs/CONTEXT.md`.

**Out of scope (para specs futuros):**

- Botón "Ver curso" y URL del curso. El contrato no trae `url`; va en otro spec.
- Implementar `GET /courses/galaxy` en `codequest-backend`.
- Descripción, horas y lecciones del curso. El contrato no las trae.
- Reescritura en React Three Fiber (`@react-three/fiber`, `drei`, `@react-spring/three`).
- Sonido ambiente. Se elimina el botón que no funcionaba.
- Progreso o estado "completado" del usuario por curso. Se eliminan `STATUS_CONFIG` y las estadísticas de completados.
- Cambios en `StarMap.tsx`, `useStarMap.ts` y `StarPanel.tsx`. El Dashboard sigue usando `useStarMap` como fondo.
- Manejo de token expirado distinto al interceptor actual de `api.ts`.

## Data model

Contrato de `GET {VITE_API_URL}/courses/galaxy` (con `Authorization: Bearer <token>`, que inyecta `api.ts`):

```json
{
  "galaxies": [
    { "key": "frontend", "name": "Frontend & UI", "color": "#3B82F6",
      "center": { "x": 57.13, "y": 2, "z": 18.54 } }
  ],
  "courses": [
    {
      "id": "07001376-a87f-4b08-b7bd-8bf1f49999b1",
      "slug": "angular-pro",
      "title": "Angular Pro: Lleva tus bases al siguiente nivel",
      "category": "frontend",
      "level": "intermediate",
      "tags": ["angular", "typescript"],
      "isActive": true,
      "galaxies": ["frontend"],
      "galaxyColor": "#3B82F6",
      "positionX": 45.23, "positionY": 2.10, "positionZ": -18.45,
      "prerequisites": ["angular-de-cero-a-experto", "typescript-guia-completa"],
      "related": ["angular-sockets-bun"]
    }
  ]
}
```

Tipos en `src/types/index.ts`:

```ts
export type CourseLevel = Course['level'] // 'beginner' | 'intermediate' | 'advanced'

export interface Galaxy {
  key: string
  name: string
  color: string
  center: { x: number; y: number; z: number }
}

export interface GalaxyCourse {
  id: string            // UUID
  slug: string
  title: string
  category: string
  level: CourseLevel
  tags: string[]
  isActive: boolean
  galaxies: string[]    // keys de Galaxy; [0] es la galaxia principal
  galaxyColor: string
  positionX?: number | null
  positionY?: number | null
  positionZ?: number | null
  prerequisites: string[] // slugs
  related: string[]       // slugs
}

export interface CourseGalaxyResponse {
  galaxies: Galaxy[]
  courses: GalaxyCourse[]
}
```

Retorno de `useCourseGalaxy`:

```ts
interface UseCourseGalaxyResult {
  galaxies: Galaxy[]
  courses: GalaxyCourse[]
  isLoading: boolean
  isDemo: boolean
}
```

API de `useGalaxyScene`:

```ts
useGalaxyScene({ containerRef, canvasRef, tooltipRef, galaxies, courses, selectedId, onHover, onSelect })
  → { resetCamera: () => void; focusCourse: (slug: string) => void }
```

Convenciones:

- **Referencias.** `prerequisites` y `related` son slugs. Se resuelven con un índice `Map<slug, GalaxyCourse>` que se construye sobre todos los cursos recibidos.
- **Colores.** Esfera: `galaxyColor`. Nebulosa y badges: `galaxy.color`. Anillo: `galaxy.color` de `galaxies[1]`.
- **Radio por nivel.** `beginner` 0.3, `intermediate` 0.5, `advanced` 0.7.
- **Posición de respaldo.** Si falta alguna coordenada o es `null`, se usa `galaxy.center` de `galaxies[0]` más un desplazamiento derivado de un hash del `id`, así que es estable entre recargas. Si esa galaxia no existe en `galaxies`, se usa el origen.
- **Nebulosa.** Se coloca en `galaxy.center`. Su escala es proporcional a la distancia máxima de sus cursos al centro, con un mínimo fijo. Usa blending aditivo y opacidad ~0.35.
- **Cursos inactivos.** Si `isActive: false`, la esfera tiene opacidad ~0.35, sin halo ni point light. En el panel aparece el badge "No disponible".
- **Slugs inexistentes.** Si un slug de `prerequisites` o `related` no está en `courses`, no se dibuja la línea y en el panel aparece el slug en gris, no clicable.
- **Etiquetas de nivel.** `beginner` → "Principiante", `intermediate` → "Intermedio", `advanced` → "Avanzado".
- **Galaxia demo.** `galaxy.mock.ts` exporta un `CourseGalaxyResponse` con 3 o 4 galaxias y unos 12 cursos. Incluye al menos:
  - un curso en 2 galaxias;
  - un curso con `isActive: false`;
  - un curso sin coordenadas;
  - un curso con un slug de prerequisito inexistente.

## Implementation plan

1. Ejecutar `npm install three` y `npm install -D @types/three`. Comprobar que `npm run build` pasa.
2. Añadir `CourseLevel`, `Galaxy`, `GalaxyCourse` y `CourseGalaxyResponse` a `src/types/index.ts`.
3. Crear `src/services/galaxy.mock.ts` con la galaxia demo, cumpliendo los casos de la sección "Data model".
4. Añadir `getCourseGalaxy: async (): Promise<CourseGalaxyResponse>` a `src/services/courses.service.ts` (`api.get('/courses/galaxy')`).
5. Crear `src/hooks/useCourseGalaxy.ts`:

   - Lee `useAuthStore((s) => s.token)`.
   - Sin token, o con `VITE_MOCK_MODE === 'true'`, devuelve el mock con `isDemo: true` y no hace la petición.
   - Con token, llama al servicio. Si falla, devuelve el mock con `isDemo: true` y muestra un toast de Sonner.
6. En `src/App.tsx`, cambiar el import de `StarMap3D` por `lazy(() => import('@/components/galaxy/StarMap3D'))` y envolver la ruta `/starmap` en `<Suspense fallback={<LoadingSpinner />}>`. La escena actual sigue funcionando.
7. Crear `src/hooks/useGalaxyScene.ts` con la inicialización:

   - scene, camera y renderer, dentro de try/catch;
   - shader de fondo, ~2500 partículas y estrellas fugaces movidas desde `StarMap3D.tsx`;
   - `OrbitControls` con `enableDamping`, `minDistance` y `maxDistance`;
   - resize y loop de animación;
   - cleanup con `dispose()` de todo.

   Reducir `StarMap3D.tsx` a un shell que usa `useCourseGalaxy` y `useGalaxyScene`. En este paso la escena muestra solo el fondo.
8. En `useGalaxyScene`, añadir el effect de nodos, separado del de inicialización:

   - Esferas con color, radio por nivel, halo, point light y anillo de segunda galaxia.
   - Posición de respaldo y atenuado de los inactivos.
   - Rebuild cuando cambian `courses`, con `dispose()` de geometrías y materiales anteriores.
9. Añadir las nebulosas por galaxia (sprite con textura de gradiente radial en canvas) dentro del mismo effect de nodos.
10. Añadir el hover:

    - Raycast en `pointermove` y crecimiento con lerp.
    - `LineSegments` rojas (`#EF4444`) hacia los prerequisitos y azules (`#3B82F6`) hacia los relacionados. Se crean al entrar y se liberan al salir.
    - Posición del tooltip escrita en el DOM por `tooltipRef` en el loop de animación. Solo el slug en hover pasa al estado de React vía `onHover`.

    Crear `src/components/galaxy/CourseTooltip.tsx`, que muestra título y nivel.
11. Añadir el click o tap:

    - Si el puntero se mueve menos de 6px entre `pointerdown` y `pointerup`, se trata como click y se hace raycast. Se llama a `onSelect` y se anima el zoom con lerp de `controls.target` y de la posición de la cámara.
    - La animación se cancela con el evento `start` de los controles.
    - En pantallas táctiles, el tap también muestra las líneas y el tooltip.

    Exponer `focusCourse(slug)` y `resetCamera()`.
12. Crear `src/components/galaxy/CoursePanel.tsx`: panel lateral, a ancho completo en móvil. Muestra:

    - título;
    - badges de galaxias con `name` y `color`;
    - nivel en español, categoría y tags;
    - badge "No disponible" si el curso está inactivo;
    - listas de prerequisitos y relacionados. Cada entrada existente es clicable: limpia la búsqueda y el filtro y llama a `focusCourse`. Las entradas inexistentes aparecen en gris.

    Conectarlo en `StarMap3D.tsx`.
13. Completar la UI de `StarMap3D.tsx`:

    - Header "Code Quest · Galaxia de cursos".
    - Búsqueda por título, tags y `galaxies[].name`, sin distinguir mayúsculas ni acentos.
    - Filtro de nivel con las etiquetas en español.
    - Leyenda con las galaxias y su color, y la explicación de las líneas roja y azul.
    - Banner demo si `isDemo`: "Estás viendo una galaxia demo — Inicia sesión con Discord", con botón que llama a `useAuthStore().loginWithDiscord`.
    - `LoadingSpinner` mientras `isLoading`.
    - Eliminar `STATUS_CONFIG`, las estadísticas de completados, el botón de sonido y el branding "STARPATH • COSMOS LMS".
14. Añadir el `<Link to="/starmap">Explorar galaxia →</Link>` en el panel "Mapa general" de `DashboardPage`.
15. Actualizar la documentación:

    - `docs/CHANGELOG.md`: entrada `2026-09-22`.
    - `docs/TASKS.md`: tareas completadas.
    - `docs/CONTEXT.md`: ruta `/starmap`, tipos nuevos, endpoint `/courses/galaxy` y la nota de que el backend aún no lo expone.

## Acceptance criteria

- [ ] `package.json` declara `three` en `dependencies` y `@types/three` en `devDependencies`.
- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] `npm run lint` no reporta errores.
- [ ] `npm run build` pasa y genera un chunk separado que contiene `StarMap3D` y Three.js, distinto del chunk principal.
- [ ] Ningún archivo nuevo o modificado usa `any`.
- [ ] La interface `Course` de `src/types/index.ts` no cambia.
- [ ] `StarMap.tsx`, `useStarMap.ts` y `StarPanel.tsx` no tienen cambios en el diff.
- [ ] En `/starmap` sin sesión se ven la galaxia demo y el banner con el botón de login con Discord. No se hace ninguna petición a `/courses/galaxy`.
- [ ] Hay una nebulosa visible por cada galaxia del mock, con su color.
- [ ] El curso del mock que está en 2 galaxias muestra un anillo con el color de la segunda galaxia.
- [ ] Un curso `advanced` se ve más grande que uno `beginner`.
- [ ] El curso inactivo del mock se ve atenuado, y su panel muestra "No disponible".
- [ ] El curso sin coordenadas aparece cerca del centro de su galaxia principal, en la misma posición tras recargar.
- [ ] Al pasar el mouse sobre un curso, la esfera crece, aparecen líneas rojas a sus prerequisitos y azules a sus relacionados, y se muestra el tooltip con título y nivel.
- [ ] Al sacar el mouse, las líneas desaparecen y el tooltip se oculta.
- [ ] Un prerequisito con slug inexistente no dibuja línea y aparece en gris y no clicable en el panel.
- [ ] Click sobre un curso: la cámara hace zoom hacia él y se abre el panel.
- [ ] Arrastrar para rotar no abre el panel.
- [ ] Click en un prerequisito del panel enfoca ese curso y abre su panel.
- [ ] El panel no tiene botón "Ver curso".
- [ ] La rueda del mouse acerca y aleja la cámara dentro de `minDistance` y `maxDistance`.
- [ ] Buscar un tag, como "typescript", deja solo los cursos con ese tag. Buscar el nombre de una galaxia deja solo sus cursos. La escena se actualiza en ambos casos.
- [ ] Cambiar el filtro de nivel actualiza la escena.
- [ ] Mientras hay hover, no se re-renderiza `StarMap3D` en cada frame (verificable con React DevTools Profiler).
- [ ] En un viewport de 390×844, un tap abre el panel a ancho completo, y el pinch hace zoom.
- [ ] Con sesión, la petición `GET /api/v1/courses/galaxy` lleva `Authorization: Bearer …`. Si responde con error, se muestra un toast y la galaxia demo con el banner.
- [ ] `/dashboard` muestra el enlace "Explorar galaxia →" y navega a `/starmap`.
- [ ] `/`, `/login` y `/dashboard` cargan sin errores en consola.
- [ ] `docs/CHANGELOG.md`, `docs/TASKS.md` y `docs/CONTEXT.md` reflejan lo implementado.

## Decisions

- **Sí:** adaptar `StarMap3D.tsx` con Three.js imperativo. Ya tiene la base visual y el imperativo da control directo sobre el `dispose()`.
- **No:** reescribir en React Three Fiber. Supondría tres dependencias nuevas y rehacer lo que ya funciona.
- **Sí:** el contrato `{ galaxies, courses }` lo definió el usuario y es la fuente de verdad, aunque el backend aún no lo expone.
- **Sí:** tipos `GalaxyCourse` y `Galaxy` separados de `Course`. `Course` tiene `pathId`, `order` y `durationMinutes`, que usan los mocks de `paths.service.ts`. Mezclarlos rompería esos mocks o debilitaría el tipado.
- **Sí:** `/starmap` sigue siendo pública, con la galaxia demo y el CTA de Discord cuando no hay sesión.
- **Sí:** sin token no se llama al endpoint. Así se evita que el interceptor de 401 de `api.ts` redirija a `/` al visitante anónimo.
- **Sí:** el color de la nebulosa y de los badges sale de `galaxies[].color`, y el de la esfera de `galaxyColor`. Ambos vienen en el contrato, así que no hace falta paleta de respaldo.
- **Sí:** la nebulosa se coloca en `galaxy.center`, que viene del backend, en lugar de calcular un centroide.
- **Sí:** el tamaño de la esfera depende del nivel. El contrato no trae `lessons`. Se descartaron el número de dependientes y el tamaño fijo.
- **Sí:** los cursos inactivos se ven atenuados y no se ocultan.
- **Sí:** posición de respaldo determinista (centro de la galaxia principal + hash del `id`) en lugar de descartar el curso o exigir coordenadas.
- **Sí:** los slugs inexistentes no dibujan línea y se muestran en gris en el panel. Así no se rompe nada y la inconsistencia de datos queda visible.
- **Sí:** la búsqueda cubre título, tags y nombre de galaxia, sin distinguir mayúsculas ni acentos.
- **Sí:** al hacer click en un prerequisito o relacionado del panel se limpian la búsqueda y el filtro, para que el curso destino siempre esté en la escena.
- **No:** botón "Ver curso". El contrato no trae `url`; lo decidió el usuario y va en otro spec.
- **No:** paleta de respaldo por galaxia. El contrato siempre trae el color.
- **Sí:** `OrbitControls` sustituye la órbita y el pinch hechos a mano. Da damping y gestos táctiles nativos sin mantener ese código.
- **Sí:** lazy load de `/starmap`, para que Three.js no pese en el bundle del resto de la app.
- **Sí:** solo un enlace en `DashboardPage` como punto de entrada. El resto del Dashboard no se toca.

## Risks

| Riesgo                                                                          | Mitigación                                                                                                                     |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| El endpoint`/courses/galaxy` no existe todavía y devuelve 404                | El hook cae a la galaxia demo y muestra un toast. La UI es la misma con datos reales o demo.                                    |
| Un token expirado provoca un 401 y el interceptor de`api.ts` redirige a `/` | Es el comportamiento actual en toda la app. Un manejo distinto queda fuera de este spec.                                        |
| El navegador no soporta WebGL                                                   | La creación del renderer va en try/catch. Si falla, se muestra "Tu navegador no soporta gráficos 3D" en lugar del canvas.     |
| Fugas de memoria en GPU con cada filtro                                         | El effect de nodos hace`dispose()` de geometrías, materiales y texturas antes de cada rebuild y en el cleanup.               |
| El backend cambia el contrato                                                   | Los tipos están centralizados en`src/types/index.ts` y el mock usa el mismo tipo, así que `tsc` detecta las divergencias. |

## What is **not** in this spec

- Botón "Ver curso" y URL del curso.
- Endpoint `/courses/galaxy` en el backend.
- Descripción, horas y lecciones del curso.
- Reescritura en React Three Fiber.
- Sonido ambiente.
- Progreso o estado "completado" por curso.
- Cambios en `StarMap.tsx`, `useStarMap.ts`, `StarPanel.tsx` y el resto del Dashboard.
- Manejo de token expirado.

Cada uno de estos, si se implementa, va en su propio spec.
