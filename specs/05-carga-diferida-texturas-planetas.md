# SPEC 05 — Carga diferida de las texturas de planetas en /starmap

> **Status:** aprobado
> **Depends on:** SPEC 02, SPEC 03, SPEC 04
> **Date:** 2026-09-26
> **Objective:** Quitar la generación de las texturas de superficie de la tarea de montaje de `/starmap`: arrancar con un placeholder de 1×1 y pintar cada textura en tiempo idle, por chunks de ~40 ms y por orden de cercanía a la cámara, a 256×128 en dispositivos de gama baja y a 512×256 en los demás.

## Por qué existe este spec

SPEC 04 genera las texturas de superficie de forma síncrona dentro del efecto de nodos de `useGalaxyScene.ts`. Mientras se pintan, el navegador no muestra ningún frame de la escena.

Medición del estado actual (2026-09-26, build de producción, primera visita a `/starmap` con la galaxia demo, 3 corridas por nivel, throttling de CPU de Chrome DevTools):

| CPU | Long task de montaje | Relleno de texturas (`createImageData` → `putImageData`) | Espera de enlace de shaders |
| --- | -------------------- | ------------------------------------------------------------- | --------------------------- |
| ×1 | ~315 ms              | ~255 ms (81 %)                                                | ~10 ms                      |
| ×4 | ~1130 ms             | ~985 ms (87 %)                                                | ~10 ms                      |
| ×6 | ~1690 ms             | ~1475 ms (87 %)                                               | ~15 ms                      |

Coste por patrón a ×1 (aislado, media de 3): `circuit` ~20 ms, `ocean` ~44 ms, `rock` ~55 ms, `sand` ~24 ms, `metal` ~63 ms, `volcanic` ~65 ms, `crystal` ~27 ms, `noise` ~25 ms.

Conclusiones:

- El cuello de botella es la CPU del relleno píxel a píxel de `fillGray`, no la red ni la GPU.
- La compilación de shaders es despreciable.
- `planetVisuals.ts` minificado ocupa ~8 KB (3,4 KB gzip). Es el 1,3 % del chunk `StarMap3D` (627 KB / 162 KB gzip, casi todo Three.js). Separarlo no mejora la carga (ver Decisions).
- En dev el coste se duplica porque `StrictMode` monta el efecto de escena dos veces. Las cifras de este spec se miden siempre sobre el build de producción.

Además, Three.js 0.186 reserva la memoria de una textura en WebGL2 (`texStorage2D`) solo la primera vez que sube su `Source`. Por eso el placeholder de 1×1 no puede repintarse a 512×256 sobre el mismo `Source`: hay que asignar un `Source` nuevo.

## Scope

**In:**

- **Placeholder de 1×1 por patrón.** `surfaceTexture(pattern)` devuelve al instante una `THREE.CanvasTexture` definitiva como objeto, cuyo `Source` inicial es un canvas de 1×1 gris medio (`rgb(128,128,128)`, valor 0,5).
  - Todos los patrones pendientes comparten un único `Source` placeholder.
  - La textura conserva `colorSpace = SRGBColorSpace` y `wrapS = RepeatWrapping` desde el principio.
  - El color de la galaxia la tiñe igual que a la final: el planeta se ve liso con su color hasta que llega la textura.
- **Generación en tiempo idle por chunks.** Las texturas pendientes se pintan de una en una en callbacks idle.
  - Cada callback trabaja como máximo `SURFACE_CHUNK_BUDGET_MS` (40 ms). Con `requestIdleCallback`, el presupuesto es `min(40, deadline.timeRemaining())`, salvo si `deadline.didTimeout`: entonces es 40 ms.
  - Cada callback avanza al menos un paso, aunque el presupuesto sea 0, para garantizar el progreso.
  - Un paso es una fila de `fillGray` o una primitiva vectorial (una pista o un chip de `circuit`).
  - `requestIdleCallback` se pide con `timeout: IDLE_TIMEOUT_MS` (500 ms) para que el loop de render no deje sin idle a la cola.
- **Fallback sin `requestIdleCallback`** (Safari). Si `window.requestIdleCallback` no existe, se usa `setTimeout(callback, FALLBACK_DELAY_MS)` (1 ms) con un deadline sintético de 40 ms desde que empieza el callback, y `didTimeout: false`.
- **Cambio sin recompilar shaders.** Al terminar un patrón se crea un `THREE.Source` con el canvas final y se asigna a la textura original y a su clon espejado, con `needsUpdate = true` en ambas.
  - El material, sus defines y `customProgramCacheKey` no cambian, así que no se enlaza ningún programa nuevo.
  - El cambio es instantáneo, sin fundido.
  - Three.js libera la textura GL del placeholder cuando ya no la usa ninguna textura.
- **Clon espejado compartido por patrón.** `PlanetAssets` crea y cachea un único clon espejado por patrón (`mirroredSurfaceTexture`), para poder cambiarle el `Source` junto con el original. `useGalaxyScene.ts` deja de crear clones por curso y deja de liberarlos en el rebuild.
- **Resolución adaptativa.** `src/lib/galaxy/deviceTier.ts` decide la resolución una vez por `createPlanetAssets`:
  - gama baja si `navigator.deviceMemory <= 4` **o** `navigator.hardwareConcurrency <= 4`;
  - una API que no existe o no es un número positivo no cuenta como gama baja;
  - sin ninguna de las dos APIs, se usa 512×256;
  - gama baja → 256×128, resto → 512×256.
- **Painters independientes de la resolución.** Los painters reciben el tamaño y escalan sus constantes en píxeles por `scale = width / 512`: `CIRCUIT_GRID`, anchos de línea, radio de los pads, separación de las patas de los chips y los umbrales en píxeles del borde de `crystal`. A 256×128 el patrón tiene la misma composición a mitad de resolución.
- **Misma imagen a 512×256.** Pintar por chunks no cambia el resultado: a 512×256 cada patrón produce exactamente los mismos píxeles que hoy (huellas en Acceptance criteria). El orden de las llamadas a `rand()` se conserva.
- **Prioridad por distancia a la cámara.** En cada rebuild de nodos, `useGalaxyScene.ts` calcula, por patrón, la distancia mínima de `camera.position` a sus planetas y llama a `planetAssets.prioritizeSurfaces` con los patrones ordenados de menor a mayor.
  - En el primer rebuild la cámara ya está restaurada desde `sessionStorage` (`codequest:galaxy-camera-state`), o en `CAMERA_HOME` si no hay estado guardado o no es válido.
  - En los rebuilds siguientes (por ejemplo, al filtrar) se reordenan los patrones pendientes con la cámara de ese momento.
  - El patrón que se está pintando no se interrumpe.
- **Cancelación.** `planetAssets.dispose()` cancela el callback idle o el timeout pendiente, vacía la cola y libera las texturas, sus clones y el placeholder. Tras desmontar `/starmap` (o el doble montaje de `StrictMode`) no se ejecuta ningún paso más.
- **Documentación.** `docs/CHANGELOG.md`, `docs/TASKS.md` y `docs/CONTEXT.md` recogen la carga diferida, la resolución adaptativa y la prioridad por cámara.

**Out of scope (para specs futuros):**

- Separar `planetVisuals.ts` en su propio chunk lazy (descartado con medición, ver Decisions).
- Generar texturas en un Web Worker u `OffscreenCanvas`.
- Cachear las texturas generadas entre visitas (IndexedDB, Cache API).
- Fundido del placeholder a la textura final.
- Diferir las texturas de aura, atmósfera, nebulosa o del campo de estrellas (juntas cuestan <2 ms a ×1).
- Reducir el tamaño del chunk de Three.js (tree-shaking, `manualChunks`).
- Cambiar el número de segmentos de las geometrías o el pixel ratio del renderer según la gama.

## Data model

Este spec no cambia `src/types/index.ts`, el contrato de `GET /courses/galaxy` ni la API pública de `useGalaxyScene`.

`src/lib/galaxy/deviceTier.ts` (nuevo):

```ts
export interface SurfaceSize {
  width: number
  height: number
}

export const SURFACE_SIZE_HIGH: SurfaceSize = { width: 512, height: 256 }
export const SURFACE_SIZE_LOW: SurfaceSize = { width: 256, height: 128 }
const LOW_END_MEMORY_GB = 4
const LOW_END_CORES = 4

// deviceMemory no está en lib.dom: se lee como unknown y se valida con typeof
export function isLowEndDevice(nav: Navigator): boolean
export function surfaceSize(nav?: Navigator): SurfaceSize // por defecto, window.navigator
```

`src/lib/galaxy/idleScheduler.ts` (nuevo):

```ts
export interface IdleBudget {
  timeRemaining: () => number
  didTimeout: boolean
}

export const IDLE_TIMEOUT_MS = 500
export const FALLBACK_DELAY_MS = 1
export const FALLBACK_BUDGET_MS = 40

// requestIdleCallback con timeout, o setTimeout con deadline sintético. Devuelve la función de cancelación.
export function scheduleIdle(task: (budget: IdleBudget) => void): () => void
```

`src/lib/galaxy/planetVisuals.ts` (cambios):

```ts
const SURFACE_CHUNK_BUDGET_MS = 40
const PLACEHOLDER_GRAY = 0.5
const SURFACE_REFERENCE_WIDTH = 512 // escala de las constantes en píxeles

// Cada yield es un punto donde la cola puede ceder el hilo
type SurfacePainter = (ctx: CanvasRenderingContext2D, rand: () => number, size: SurfaceSize) => Generator<void, void, void>

export interface PlanetAssets {
  surfaceTexture: (pattern: PlanetPattern) => THREE.CanvasTexture // placeholder 1×1 hasta que termina su generación
  mirroredSurfaceTexture: (pattern: PlanetPattern) => THREE.CanvasTexture // clon espejado compartido, cambia de Source con el original
  prioritizeSurfaces: (patterns: PlanetPattern[]) => void // los pendientes listados pasan delante, en ese orden
  auraTexture: THREE.CanvasTexture
  atmosphereTexture: THREE.CanvasTexture
  coreGeometry: (level: CourseLevel) => THREE.SphereGeometry
  ringGeometry: (level: CourseLevel) => THREE.RingGeometry
  orbitGeometry: (level: CourseLevel) => THREE.BufferGeometry
  decorRingGeometry: (level: CourseLevel) => THREE.RingGeometry
  dispose: () => void // además cancela la generación pendiente
}
```

Estado interno de la cola dentro de `createPlanetAssets` (no se exporta):

```ts
interface SurfaceJob {
  pattern: PlanetPattern
  canvas: HTMLCanvasElement // a la resolución de surfaceSize()
  steps: Generator<void, void, void>
}
// pending: PlanetPattern[]; current: SurfaceJob | null; cancelScheduled: (() => void) | null
```

Conventions:

- `SURFACE_WIDTH` y `SURFACE_HEIGHT` dejan de ser constantes globales: el tamaño llega a los painters como `SurfaceSize`.
- `fillGray` crea el `ImageData` una vez, hace `yield` tras cada fila y llama a `putImageData` al terminar.
- La semilla de cada patrón sigue siendo `hashString(pattern, 0)`.

## Implementation plan

1. Crear `src/lib/galaxy/deviceTier.ts` con `isLowEndDevice` y `surfaceSize`, sin usarlo todavía. Prueba manual en consola: con un objeto con `hardwareConcurrency: 4` devuelve gama baja; con `{ hardwareConcurrency: 8 }` y sin `deviceMemory`, no.
2. Crear `src/lib/galaxy/idleScheduler.ts` con `scheduleIdle` y su cancelación, sin usarlo todavía. Prueba manual: con `requestIdleCallback` borrado de `window`, la tarea se ejecuta con `timeRemaining()` ≤ 40.
3. Convertir los painters y `fillGray` en generadores que reciben `SurfaceSize`, y escalar sus constantes en píxeles. `makeSurfaceTexture` sigue siendo síncrona: agota el generador a `SURFACE_SIZE_HIGH`. Prueba manual: las huellas de los 8 patrones coinciden con la tabla de Acceptance criteria.
4. Usar `surfaceSize()` en `createPlanetAssets` (aún síncrono). Prueba manual: con `hardwareConcurrency` sobrescrito a 4 antes de cargar, los canvas de superficie miden 256×128 y los patrones se reconocen.
5. Añadir `mirroredSurfaceTexture` a `PlanetAssets`, cacheado por patrón y liberado en `dispose`. En `useGalaxyScene.ts`, usarlo en lugar de `mirrorSurfaceTexture` y eliminar `surfaceClones`. Prueba manual: los planetas espejados siguen espejados y `renderer.info.memory.textures` no cambia.
6. Añadir el placeholder de 1×1 compartido, la cola (`pending`, `current`) y la generación por chunks con `scheduleIdle`. Al terminar cada patrón, asignar un `Source` nuevo al original y a su clon con `needsUpdate`. `dispose` cancela la cola. Prueba manual: la escena aparece con planetas lisos y las texturas llegan en menos de un segundo a ×1, sin errores en consola en dev.
7. Añadir `prioritizeSurfaces` y llamarlo al final del rebuild de nodos de `useGalaxyScene.ts`, con los patrones ordenados por su distancia mínima a `camera.position`. Prueba manual: tras volar a una galaxia y recargar, su textura es la primera en aparecer.
8. Actualizar `docs/CHANGELOG.md`, `docs/TASKS.md` y `docs/CONTEXT.md`.

## Acceptance criteria

Protocolo de medición: build de producción servido como estático, Chrome con CPU throttling ×4 en DevTools, primera visita a `/starmap` con la galaxia demo. Las long tasks se leen con un `PerformanceObserver` de tipo `longtask`.

- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] `npm run lint` no reporta errores.
- [ ] `npm run build` pasa y no genera chunks nuevos: Three.js y `src/lib/galaxy/*` siguen en el chunk lazy de `StarMap3D`.
- [ ] Ningún archivo nuevo o modificado usa `any`.
- [ ] `package.json` no tiene dependencias nuevas y `public/` no tiene archivos nuevos.
- [ ] `StarMap3D.tsx`, `galaxy-effect.css`, `DashboardPage.tsx`, `galaxyHighlight.ts`, `relationLines.ts` y `src/types/index.ts` no tienen cambios en el diff.
- [ ] A ×4, la long task de montaje de `/starmap` dura menos de 300 ms (hoy ~1130 ms).
- [ ] A ×4, después del montaje ninguna long task supera 100 ms mientras se generan las texturas.
- [ ] A ×4, todas las texturas de superficie del mock terminan en menos de 5 s desde el montaje, sin interacción del usuario.
- [ ] Mientras hay texturas pendientes, los planetas se ven lisos con el color de su galaxia (placeholder gris 0,5), sin negro, blanco ni errores de WebGL en consola.
- [ ] El número de llamadas a `linkProgram` tras terminar todas las texturas es igual al que había tras el primer frame.
- [ ] Con `window.requestIdleCallback` borrado antes de cargar (simulando Safari), todas las texturas terminan y a ×4 ninguna long task posterior al montaje supera 100 ms.
- [ ] A 512×256, la huella FNV-1a de 32 bits de los bytes de `getImageData` de cada patrón coincide con la del código de SPEC 04 (medida en Chrome de escritorio sobre esta máquina):
  | Patrón      | Huella       |
  | ------------ | ------------ |
  | `circuit`  | `7bdbd0c9` |
  | `ocean`    | `42a5b75f` |
  | `rock`     | `71be8c88` |
  | `sand`     | `02acb842` |
  | `metal`    | `e14c94c0` |
  | `volcanic` | `88a650aa` |
  | `crystal`  | `081cd459` |
  | `noise`    | `1beb55a9` |
- [ ] Con `navigator.hardwareConcurrency` sobrescrito a 4 antes de cargar, los canvas de superficie miden 256×128.
- [ ] Con `navigator.deviceMemory` sobrescrito a 2 y `hardwareConcurrency` a 16, los canvas de superficie miden 256×128.
- [ ] Con `deviceMemory` y `hardwareConcurrency` sobrescritos a `undefined`, los canvas de superficie miden 512×256.
- [ ] Con `deviceMemory` 8 y `hardwareConcurrency` 8, los canvas de superficie miden 512×256.
- [ ] A 256×128 cada galaxia del mock sigue mostrando su patrón de la tabla de SPEC 04, sin costura vertical.
- [ ] Sin cámara guardada, la primera textura que termina es la del patrón del planeta más cercano a `CAMERA_HOME`.
- [ ] Tras volar a una galaxia y recargar (cámara restaurada desde `sessionStorage`), la primera textura que termina es la del patrón de esa galaxia.
- [ ] Cambiar el filtro de nivel mientras hay texturas pendientes no lanza errores, y todas terminan.
- [ ] Salir de `/starmap` mientras hay texturas pendientes no produce errores ni pasos de generación posteriores.
- [ ] En dev (`StrictMode`) la escena carga sin errores ni warnings de texturas en consola.
- [ ] Los planetas espejados siguen espejados después de recibir su textura final.
- [ ] El resaltado de SPEC 03 funciona igual durante y después de la carga: hover en una estrella, foco en una galaxia por nebulosa o leyenda, y selección.
- [ ] Con la escena cargada, `renderer.info.memory.textures` incluye como máximo 8 texturas de superficie, 1 de aura y 1 de atmósfera, sin el placeholder.
- [ ] Cambiar el filtro de nivel 20 veces no aumenta `renderer.info.memory.textures` ni `renderer.info.memory.geometries` respecto al valor tras la primera carga completa.
- [ ] Los criterios de aceptación de SPEC 04 siguen cumpliéndose.

## Decisions

- **Sí:** medir antes de especificar. El 81–87 % de la tarea de montaje es el relleno de texturas, así que el spec ataca eso y no la red.
- **No:** chunk lazy para `planetVisuals.ts`. Ahorraría ~3,4 KB gzip (1,3 % del chunk) y añadiría una petición antes de poder crear los planetas. El chunk de `StarMap3D` ya es lazy.
- **Sí:** placeholder de 1×1 y `Source` nuevo al terminar. El objeto `Texture` y el material no cambian, así que no se recompila nada. Además, esquiva la reserva única de `texStorage2D` de WebGL2.
- **No:** placeholder a tamaño final repintado sobre el mismo `Source`. Es más simple, pero reserva la memoria completa desde el principio y no es 1×1.
- **Sí:** gris 0,5 en el placeholder. Está cerca del brillo medio de las texturas reales (0,4–0,6) y el cambio se nota poco.
- **Sí:** cambio instantáneo. Un fundido exigiría un uniform nuevo en `applySurfaceContrast` y estado por material en el loop.
- **Sí:** clon espejado compartido por patrón dentro de `PlanetAssets`. Hace falta para cambiar el `Source` de todos los usuarios de un patrón, y elimina los clones por curso.
- **Sí:** gama baja con `deviceMemory <= 4` o `hardwareConcurrency <= 4`. Una API ausente no cuenta y, sin ninguna, se usa 512×256.
- **No:** asumir gama baja cuando faltan las dos APIs. Penalizaría la calidad en Safari de escritorio sin evidencia de que sea lento.
- **Sí:** generadores con `yield` por fila o por primitiva. Mantienen el estado entre chunks sin reescribir los painters como máquinas de estados, y conservan el orden de `rand()`.
- **Sí:** `timeout` de 500 ms en `requestIdleCallback`. El loop de render corre en cada frame, y sin timeout un dispositivo lento podría no dar nunca un periodo idle.
- **Sí:** `setTimeout` de 1 ms como fallback. Entre tareas el navegador puede pintar un frame, y 40 ms de trabajo por tarea quedan por debajo del umbral de 100 ms.
- **Sí:** prioridad por patrón, no por planeta. Las texturas son compartidas por patrón (máximo 8), así que el orden útil es el de la distancia mínima de cada patrón a la cámara.
- **Sí:** reordenar en cada rebuild con la cámara actual. Cuesta poco y sigue a la cámara si el usuario filtra durante la carga.
- **No:** interrumpir el patrón en curso al reordenar. Se perdería el trabajo hecho.
- **Sí:** dos módulos nuevos (`idleScheduler.ts` y `deviceTier.ts`). La detección del dispositivo y la planificación no dependen de Three.js y no engordan `planetVisuals.ts`.
- **No:** Web Worker u `OffscreenCanvas`. Aislaría mejor el trabajo, pero es otro spec y exige serializar los painters.

## Risks

| Riesgo                                                                                              | Mitigación                                                                                                                                  |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| En un dispositivo lento, el loop de render deja pocos periodos idle y las texturas tardan en llegar | `timeout` de 500 ms: con `didTimeout` se hace un chunk completo de 40 ms. Criterio de 5 s a ×4 para detectarlo.                         |
| Un chunk de 40 ms más un frame de render superan 50 ms y generan long tasks pequeñas              | El criterio es 100 ms, no 50. Si se supera, bajar`SURFACE_CHUNK_BUDGET_MS`.                                                                |
| Cambiar`texture.source` no libera la textura GL del placeholder, o no se sube la nueva            | Criterio de`renderer.info.memory.textures` tras la carga. Si falla, llamar a `texture.dispose()` antes de asignar el `Source` nuevo.   |
| Escalar las constantes en píxeles altera los píxeles a 512×256                                   | `scale = 1` a 512 y huellas de la tabla. El paso 3 se valida antes de seguir.                                                              |
| Las huellas dependen del rasterizado de canvas del navegador (líneas y arcos de`circuit`)        | Se comparan en el mismo navegador y en la misma máquina que midió la tabla. Si cambia el entorno, se recalculan con el código de SPEC 04. |
| `deviceMemory` y `hardwareConcurrency` se pueden falsear o redondear                            | Solo deciden la resolución. En el peor caso la calidad es menor o la carga algo más lenta, sin errores.                                    |
| El doble montaje de`StrictMode` deja pasos idle en marcha sobre assets liberados                  | `dispose` cancela el callback y vacía la cola. Criterio específico en dev.                                                               |

## What is **not** in this spec

- Chunk lazy para `planetVisuals.ts`.
- Web Worker u `OffscreenCanvas` para las texturas.
- Caché persistente de texturas entre visitas.
- Fundido del placeholder a la textura final.
- Carga diferida de aura, atmósfera, nebulosa o campo de estrellas.
- Optimización del tamaño del chunk de Three.js.
- Cambios de geometría o pixel ratio según la gama del dispositivo.
- Cambios en `StarMap3D.tsx`, `galaxy-effect.css`, `DashboardPage.tsx`, `galaxyHighlight.ts`, `relationLines.ts` y `src/types/index.ts`.

Cada uno de esos, si llega, va en su propio spec.
