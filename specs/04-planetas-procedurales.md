# SPEC 04 — Planetas procedurales en /starmap

> **Status:** aprobado
> **Depends on:** SPEC 02, SPEC 03
> **Date:** 2026-09-26
> **Objective:** Convertir las esferas de `/starmap` en planetas con textura procedural por galaxia (canvas 2D), un aura de polvo cósmico giratoria y, en los cursos avanzados, una órbita fina inclinada, sin imágenes externas, reutilizando geometrías y texturas y sin romper el resaltado de SPEC 03.

## Por qué existe este spec

Tras SPEC 03 las esferas tienen un tono más suave, pero siguen siendo bolas lisas de un solo color. Todas las de una galaxia se ven idénticas y solo cambia el tamaño por nivel.

Además, cada curso crea su propia `SphereGeometry` (core y halo) y su propia `RingGeometry`, aunque solo hay tres radios posibles. Si se añaden texturas y más capas sin reutilizar recursos, el coste en GPU crece con cada rebuild de nodos (cada cambio de filtro).

## Scope

**In:**

- **Textura procedural de superficie por galaxia.** Se genera en runtime con canvas 2D, sin archivos externos. La elige `galaxies[0]` del curso:

  | Galaxia          | Patrón      | Descripción                                                  |
  | ---------------- | ------------ | ------------------------------------------------------------- |
  | `ai-ml`        | `circuit`  | Pistas ortogonales tipo circuito con pads y bloques tipo chip |
  | `frontend`     | `ocean`    | Bandas onduladas y gradientes suaves tipo océano             |
  | `backend`      | `rock`     | Ruido fbm de alto contraste con manchas oscuras tipo corteza  |
  | `fundamentals` | `sand`     | Dunas diagonales con grano fino tipo desierto                 |
  | `mobile`       | `metal`    | Superficie lisa con franjas de reflejo brillante              |
  | `devops`       | `volcanic` | Base oscura con grietas brillantes                            |
  | `dotnet-java`  | `crystal`  | Facetas poligonales de brillo plano con bordes claros         |
  | cualquier otra   | `noise`    | Ruido fbm suave (fallback genérico)                          |
- **Texturas en escala de grises.** El color lo pone el material: el `galaxyColor` mezclado un 40 % hacia `STAR_TONE_GRAY`, igual que en SPEC 03. Hay una sola textura por patrón, compartida por todos los planetas y galaxias que la usan.
- **Planetas distintos dentro de una galaxia.** Cada planeta arranca con un giro (`rotation.y`) y una inclinación de eje (`rotation.x`) deterministas por `course.id`, así cada uno muestra una cara distinta de la misma textura.
- **Aura de polvo cósmico** en todos los planetas, activos e inactivos:

  - un `THREE.Sprite` con una textura compartida de polvo (gradiente radial + motas);
  - radio visible de 2.5× el radio del planeta;
  - color de la galaxia (mezclado, como el core), blending aditivo y opacity base `0.2`. En los inactivos, `0.2 × INACTIVE_OPACITY`;
  - gira despacio en sentido contrario al planeta y a otra velocidad.
- **El aura reemplaza al halo actual.** Se elimina la esfera `BackSide` de 1.55× y el aura asume su resaltado (opacity × `EMPHASIS_GLOW`) y su crecimiento en hover.
- **Órbita en los cursos avanzados** (`level === 'advanced'`, activos e inactivos):

  - un `THREE.LineLoop` fino (1px, `LineBasicMaterial`) del color de la galaxia mezclado;
  - semitransparente, con opacity base `0.3` (× `INACTIVE_OPACITY` en inactivos);
  - inclinación y azimut deterministas por `course.id`.
- **Convivencia con el anillo de segunda galaxia.** El anillo de SPEC 02 se mantiene igual en apariencia y comportamiento. La órbita va en un radio distinto, así que un curso avanzado con dos galaxias muestra ambos.
- **Reutilización de recursos:**

  - geometrías de core, anillo secundario y órbita compartidas por nivel, creadas una vez con la escena;
  - texturas de superficie creadas bajo demanda (la primera vez que un curso usa ese patrón) y cacheadas durante la vida de la escena;
  - una sola textura de aura;
  - los materiales siguen siendo por curso, porque el resaltado interpola su opacity y emissive por separado.
- **Compatibilidad con el resaltado de SPEC 03.** El core, el aura, la órbita y el anillo interpolan sus valores con las mismas `Emphasis` y factores. `galaxyHighlight.ts` no cambia.
- **Reduced motion.** Con `prefers-reduced-motion: reduce` el aura no gira. El giro del core sigue como hoy.
- **Módulo nuevo** `src/lib/galaxy/planetVisuals.ts`, y `hashString` se mueve a `src/lib/galaxy/hash.ts` para compartirlo.
- Actualizar `docs/CHANGELOG.md`, `docs/TASKS.md` y `docs/CONTEXT.md`.

**Out of scope (para specs futuros):**

- Texturas coloreadas por galaxia o varias variantes (semillas) por patrón.
- Normal maps, bump maps o `envMap` para reflejos reales en `mobile`.
- Lunas u objetos que recorran la órbita. La órbita es solo una línea y no gira.
- Órbita para cursos que no son avanzados.
- Cambios en el giro del core con reduced motion.
- Cambios en las nebulosas, el fondo, el campo de estrellas, la nave o las líneas de relaciones.
- Cambios en `StarMap3D.tsx`, `galaxy-effect.css`, `DashboardPage.tsx`, `galaxyHighlight.ts`, `relationLines.ts` y `src/types/index.ts`.
- Imágenes o assets nuevos en `public/`.

## Data model

Este spec no cambia `src/types/index.ts` ni el contrato de `GET /courses/galaxy`. La API pública de `useGalaxyScene` (`UseGalaxySceneOptions` y `UseGalaxySceneResult`) no cambia.

`src/lib/galaxy/hash.ts` recibe `hashString` tal cual está hoy en el hook:

```ts
// FNV-1a de 32 bits normalizado a [0, 1]
export function hashString(value: string, seed: number): number
```

`src/lib/galaxy/planetVisuals.ts` contiene código imperativo de Three.js:

```ts
export type PlanetPattern = 'circuit' | 'ocean' | 'rock' | 'sand' | 'metal' | 'volcanic' | 'crystal' | 'noise'

export const GALAXY_PATTERN: Record<string, PlanetPattern> = {
  'ai-ml': 'circuit',
  frontend: 'ocean',
  backend: 'rock',
  fundamentals: 'sand',
  mobile: 'metal',
  devops: 'volcanic',
  'dotnet-java': 'crystal',
}

// 'noise' si la key no está en GALAXY_PATTERN o es undefined
export function patternForGalaxy(key: string | undefined): PlanetPattern

// Acabado del MeshStandardMaterial por patrón
export const PATTERN_SURFACE: Record<PlanetPattern, { roughness: number; metalness: number }> = {
  circuit: { roughness: 0.4, metalness: 0.5 },
  ocean: { roughness: 0.3, metalness: 0.2 },
  rock: { roughness: 0.95, metalness: 0.05 },
  sand: { roughness: 0.85, metalness: 0 },
  metal: { roughness: 0.2, metalness: 0.9 },
  volcanic: { roughness: 0.8, metalness: 0.1 },
  crystal: { roughness: 0.1, metalness: 0.6 },
  noise: { roughness: 0.6, metalness: 0.3 },
}

export interface PlanetAssets {
  surfaceTexture: (pattern: PlanetPattern) => THREE.CanvasTexture // lazy + caché
  auraTexture: THREE.CanvasTexture
  coreGeometry: (level: CourseLevel) => THREE.SphereGeometry       // radio LEVEL_RADIUS[level], 32×32
  ringGeometry: (level: CourseLevel) => THREE.RingGeometry         // 1.9×–2.05× el radio, 64 segmentos
  orbitGeometry: (level: CourseLevel) => THREE.BufferGeometry      // círculo de ORBIT_RADIUS_FACTOR × radio, 128 puntos, plano XZ
  dispose: () => void                                              // libera todas las texturas y geometrías creadas
}

export function createPlanetAssets(): PlanetAssets

// Orientación determinista del planeta y de su órbita
export function planetOrientation(courseId: string): { spin: number; tilt: number }
export function orbitOrientation(courseId: string): { tilt: number; azimuth: number }
```

`LEVEL_RADIUS` se mueve del hook a `planetVisuals.ts` y se exporta, porque las geometrías compartidas dependen de él.

Cambios en `CourseNode` (en `useGalaxyScene.ts`):

```ts
export interface CourseNode {
  course: GalaxyCourse
  group: THREE.Group
  core: THREE.Mesh
  aura: THREE.Sprite              // nuevo: reemplaza a halo
  orbit: THREE.LineLoop | null    // nuevo: solo en cursos avanzados
  ring: THREE.Mesh | null
  light: THREE.PointLight | null
  baseRadius: number
  baseOpacity: number
  baseEmissive: number
  baseAuraOpacity: number         // nuevo: AURA_OPACITY o AURA_OPACITY × INACTIVE_OPACITY
  baseOrbitOpacity: number        // nuevo: ORBIT_OPACITY o ORBIT_OPACITY × INACTIVE_OPACITY
}
// halo se elimina
```

`SceneContext` gana `planetAssets: PlanetAssets`. Se crea en el effect de la escena y se libera en su cleanup, no en el de los nodos.

Convenciones:

- **Textura de superficie.**

  - 512×256 px, proyección equirectangular (u = longitud, v = latitud), para el UV de `SphereGeometry`.
  - Solo escala de grises; se pinta sobre `ImageData` o con primitivas de canvas.
  - Continua en horizontal: el borde izquierdo y el derecho casan sin costura visible. El ruido se muestrea con periodo igual al ancho, y las líneas y polígonos que cruzan el borde se dibujan también desplazados ±512 px.
  - Determinista: un PRNG `mulberry32` con semilla `hashString(pattern, 0)`. La misma textura en cada carga.
  - `colorSpace = THREE.SRGBColorSpace`.
  - Rango de brillo entre ~0.25 y 1 para que el color de la galaxia siga leyéndose; `volcanic` es la excepción, con base ~0.15 y grietas a 1.
- **Material del core.** `MeshStandardMaterial` con:

  - `color` y `emissive` = color mezclado de SPEC 03;
  - `map` y `emissiveMap` = la textura del patrón, para que el patrón también se vea en la parte emisiva;
  - `roughness` y `metalness` de `PATTERN_SURFACE`;
  - `transparent: true`, `opacity: baseOpacity` y `emissiveIntensity: baseEmissive`, como en SPEC 03.
- **Orientación del planeta.**

  - `core.rotation.y = spin = hashString(id, 6) × 2π`.
  - `core.rotation.x = tilt = (hashString(id, 7) − 0.5) × 2 × PLANET_MAX_TILT`, con `PLANET_MAX_TILT = 0.4` rad.
  - El loop sigue sumando `0.01` a `rotation.y`. Con el orden de Euler `XYZ`, el planeta gira sobre su eje inclinado.
- **Aura.**

  - `SpriteMaterial` por curso: `map = auraTexture`, `color` = color mezclado, `transparent`, `depthWrite: false`, `blending: AdditiveBlending`.
  - Escala base: `AURA_RADIUS_FACTOR × 2 × baseRadius`, con `AURA_RADIUS_FACTOR = 2.5` (el sprite mide el diámetro).
  - `AURA_OPACITY = 0.2`.
  - Rotación: `material.rotation -= delta × AURA_ROTATION_SPEED`, con `AURA_ROTATION_SPEED = 0.15` rad/s. El core gira en sentido positivo, así que el aura gira al revés y más lento. Con reduced motion no se actualiza.
  - La textura de aura mide 128×128: gradiente radial blanco de alpha 1 → 0, más ~60 motas de 1–2 px con alpha aleatorio (PRNG con semilla fija). Se desvanece por completo antes del borde, sin corte cuadrado.
  - El aura no participa en el picking. `pickSlug` sigue intersectando solo los cores.
- **Órbita.**

  - `LineLoop` con `orbitGeometry(level)` y un `LineBasicMaterial` por curso: color mezclado, `transparent`, `depthWrite: false` y opacity `baseOrbitOpacity`.
  - `ORBIT_RADIUS_FACTOR = 2.3`: queda fuera del anillo secundario (2.05) y dentro del borde del aura (2.5).
  - `ORBIT_OPACITY = 0.3`.
  - Orientación: `tilt = (hashString(id, 4) − 0.5) × 2 × ORBIT_MAX_TILT` con `ORBIT_MAX_TILT = 0.6` rad (~35°), y `azimuth = hashString(id, 5) × 2π`. Se aplica como `orbit.rotation.set(tilt, azimuth, 0)` sobre el círculo del plano XZ.
  - La órbita no gira.
- **Targets de resaltado.** Se amplía la tabla de SPEC 03, con el mismo `EMPHASIS_LERP = 0.1`:

  | Elemento | Opacity target                                | Escala target                               |
  | -------- | --------------------------------------------- | ------------------------------------------- |
  | core     | igual que SPEC 03                             | igual que SPEC 03                           |
  | aura     | `min(1, baseAuraOpacity × EMPHASIS_GLOW)`  | base ×`HOVER_SCALE` en hover, base si no |
  | órbita  | `min(1, baseOrbitOpacity × EMPHASIS_GLOW)` | sin cambio                                  |
  | anillo   | igual que SPEC 03                             | sin cambio                                  |

  Como el `Sprite` no hereda la escala del core, la escala del aura se interpola por separado hacia su propio target.
- **Point light.** Sin cambios: solo en activos y con el `galaxyColor` original.

## Implementation plan

1. Crear `src/lib/galaxy/hash.ts` con `hashString`, moverlo desde `useGalaxyScene.ts` e importarlo en el hook. La escena se ve igual. `npx tsc --noEmit` pasa.
2. Crear `src/lib/galaxy/planetVisuals.ts` con `PlanetPattern`, `GALAXY_PATTERN`, `patternForGalaxy`, `PATTERN_SURFACE`, `LEVEL_RADIUS`, `planetOrientation` y `orbitOrientation`, y `createPlanetAssets` con las geometrías compartidas y `dispose`. De momento `surfaceTexture` devuelve para todos los patrones la textura `noise`, y el aura un gradiente radial simple. Todavía no se usa. `npx tsc --noEmit` pasa.
3. En `useGalaxyScene.ts`:

   - Crear `planetAssets` en el effect de la escena, guardarlo en `SceneContext` y liberarlo en el cleanup.
   - En el effect de nodos, usar `coreGeometry(level)` y `ringGeometry(level)` en lugar de crear geometrías por curso. Estas ya no entran en el array `geometries` que se libera en el rebuild.

   La escena se ve igual. Prueba manual: cambiar el filtro de nivel 20 veces no aumenta `renderer.info.memory.geometries`.
4. Aplicar al core la textura (`map` + `emissiveMap`), `PATTERN_SURFACE` y `planetOrientation`. Con solo el patrón `noise`, todos los planetas se ven con textura y cada uno con una cara distinta.
5. Sustituir el halo por el aura:

   - Crear el sprite por curso, activo o inactivo, con `baseAuraOpacity`.
   - Quitar `halo` de `CourseNode` y del loop.
   - En el loop, interpolar la opacity y la escala del aura según la tabla, y girarla salvo con reduced motion.

   Prueba manual: hover sobre una estrella resalta las auras de su galaxia y atenúa las demás.
6. Añadir la órbita a los cursos avanzados, con `orbitGeometry(level)`, `orbitOrientation` y `baseOrbitOpacity`, y su lerp de opacity en el loop. Prueba manual: solo los avanzados tienen órbita, y un avanzado con dos galaxias muestra órbita y anillo secundario sin que se solapen.
7. Implementar en `planetVisuals.ts` los siete patrones de la tabla y la textura final del aura (gradiente + motas). Prueba manual: cada galaxia del mock se distingue por su superficie, y no hay costura vertical visible al girar un planeta.
8. Actualizar la documentación:

   - `docs/CHANGELOG.md`: entrada `2026-09-26` con secciones Añadido y Cambiado (el halo se sustituye por el aura).
   - `docs/TASKS.md`: tareas completadas.
   - `docs/CONTEXT.md`: módulo `planetVisuals.ts`, patrones por galaxia y recursos compartidos.

## Acceptance criteria

- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] `npm run lint` no reporta errores.
- [ ] `npm run build` pasa, y Three.js y `src/lib/galaxy/*` siguen en el chunk lazy de `StarMap3D`, no en el chunk principal.
- [ ] Ningún archivo nuevo o modificado usa `any`.
- [ ] `package.json` no tiene dependencias nuevas y `public/` no tiene archivos nuevos.
- [ ] `planetVisuals.ts` no usa `TextureLoader`, `ImageLoader`, `fetch` ni URLs de imagen.
- [ ] `StarMap3D.tsx`, `galaxy-effect.css`, `DashboardPage.tsx`, `galaxyHighlight.ts`, `relationLines.ts` y `src/types/index.ts` no tienen cambios en el diff.
- [ ] `useGalaxyScene.ts` ya no contiene `hashString`, `LEVEL_RADIUS` ni `halo`.
- [ ] Con el mock, las galaxias `ai-ml`, `frontend`, `backend`, `fundamentals`, `mobile`, `devops` y `dotnet-java` muestran cada una su patrón de la tabla, y se distinguen entre sí a la distancia de `FOCUS_DISTANCE`.
- [ ] Un curso cuya `galaxies[0]` no está en `GALAXY_PATTERN` usa el patrón `noise` y no lanza errores.
- [ ] El color de cada planeta sigue siendo identificable por galaxia (el color mezclado de SPEC 03 tiñe la textura).
- [ ] Dos planetas de la misma galaxia muestran caras distintas de la textura, y un mismo planeta muestra la misma orientación inicial tras recargar.
- [ ] Al girar un planeta no se ve una costura vertical en la textura.
- [ ] Todos los planetas, activos e inactivos, tienen aura; ningún planeta tiene el halo esférico anterior.
- [ ] El aura se ve de ~2.5× el radio del planeta, sin bordes cuadrados, y gira en sentido contrario al planeta.
- [ ] Solo los cursos con `level === 'advanced'` tienen órbita. Dos avanzados distintos tienen inclinaciones distintas, y la de cada uno es igual tras recargar.
- [ ] Un curso avanzado con dos galaxias muestra la órbita y el anillo secundario a radios distintos.
- [ ] Hover sobre una estrella de "frontend": el aura y la órbita de los cursos de otras galaxias bajan de opacity con transición suave, y las de "frontend" mantienen o suben su brillo.
- [ ] Con foco en una galaxia, las auras y órbitas de las demás quedan atenuadas; al quitar el foco vuelven a su valor base.
- [ ] Hover sobre un planeta hace crecer su aura con transición.
- [ ] El click y el hover sobre una estrella siguen funcionando igual; el aura no captura el puntero, y un click en el aura fuera del core cuenta como click en espacio vacío o en nebulosa.
- [ ] Con `prefers-reduced-motion: reduce` emulado en DevTools el aura no gira.
- [ ] Con la escena cargada, `renderer.info.memory.textures` incluye como máximo 8 texturas de superficie y 1 de aura, independientemente del número de cursos.
- [ ] Cambiar el filtro de nivel 20 veces no aumenta `renderer.info.memory.geometries` ni `renderer.info.memory.textures` respecto al valor tras la primera carga.
- [ ] `/`, `/login`, `/dashboard` y `/starmap` cargan sin errores en consola.
- [ ] `docs/CHANGELOG.md`, `docs/TASKS.md` y `docs/CONTEXT.md` reflejan lo implementado.

## Decisions

- **Sí:** texturas en escala de grises teñidas por el material. Una textura por patrón sirve para cualquier color y respeta la mezcla `STAR_TONE` de SPEC 03.
- **No:** texturas ya coloreadas por galaxia. Serían una textura por (patrón, color) y romperían la mezcla de tono.
- **Sí:** el patrón lo decide `galaxies[0]`, que ya es la galaxia principal en el contrato. La segunda galaxia sigue indicándose con el anillo.
- **Sí:** fallback `noise` para keys desconocidas. Las keys llegan del backend y pueden crecer; un planeta nunca queda liso ni rompe la escena.
- **No:** elegir uno de los 7 patrones por hash de la key. Asignaría a una galaxia nueva la identidad visual de otra.
- **Sí:** variedad por orientación inicial determinista (giro + inclinación por `course.id`). Cero texturas extra.
- **No:** varias variantes por patrón ni una textura por curso. Más memoria de GPU, y contradice la restricción de reutilizar texturas.
- **Sí:** `emissiveMap` igual a `map`. Sin él, el emissive plano taparía el patrón en las caras en sombra.
- **Sí:** el aura reemplaza al halo esférico. Evita dos capas aditivas superpuestas y una draw call por planeta.
- **Sí:** aura también en inactivos, con opacity reducida por `INACTIVE_OPACITY`. Todos los planetas comparten el mismo lenguaje visual.
- **Sí:** el tamaño "2.5× el radio" se interpreta como radio visible del aura; el sprite mide `5 × baseRadius` de lado.
- **Sí:** la órbita y el anillo de segunda galaxia conviven a radios distintos (2.3× y 1.9–2.05×). Cada uno comunica algo distinto: nivel avanzado y pertenencia a dos galaxias.
- **No:** que la órbita reemplace al anillo o unificar ambos. Se perdería la señal de segunda galaxia en los avanzados.
- **Sí:** órbita con `LineLoop` + `LineBasicMaterial` de 1px. Es "línea fina" sin coste extra; el grosor en píxeles de `Line2` no aporta aquí.
- **Sí:** la órbita no gira; un círculo girando sobre su normal no se percibe.
- **Sí:** geometrías compartidas por nivel y texturas cacheadas en `PlanetAssets`, que vive con la escena y no con el rebuild de nodos. Los filtros ya no recrean recursos de GPU.
- **Sí:** los materiales siguen siendo por curso. El resaltado interpola opacity y emissive de cada planeta por separado.
- **Sí:** texturas generadas bajo demanda. Solo se paga el coste de canvas de los patrones que aparecen.
- **Sí:** PRNG `mulberry32` con semilla fija. Las texturas son idénticas en cada carga.
- **Sí:** el código nuevo va en `src/lib/galaxy/planetVisuals.ts`, siguiendo la convención de SPEC 03. `hashString` se mueve a `hash.ts` para compartirlo sin dependencias circulares con el hook.
- **Sí:** con reduced motion solo se detiene el giro del aura, que es el movimiento nuevo. El giro del core queda fuera de este spec.
- **No:** normal maps, bump maps ni `envMap`. El reflejo metálico de `mobile` sale de la textura (franjas brillantes) y de `metalness`; lo demás queda para otro spec.

## Risks

| Riesgo                                                                                           | Mitigación                                                                                                                                                              |
| ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Generar texturas con`ImageData` bloquea el hilo principal al abrir `/starmap`                | Texturas de 512×256 generadas bajo demanda y cacheadas; son como mucho 8. Si alguna supera ~30 ms, bajar esa a 256×128.                                                |
| Con`metalness` alta y sin `envMap`, el patrón `metal` se ve oscuro                        | El`emissiveMap` aporta el brillo base, y la textura lleva franjas claras. Ajustar `PATTERN_SURFACE.metal` si hace falta.                                             |
| El aura aditiva se ordena mal con cores transparentes y aparecen parpadeos                       | `depthWrite: false` en el aura, como el halo anterior. Si hay artefactos, `renderOrder` del aura por debajo del core.                                                |
| Costura vertical en la textura al girar                                                          | Ruido con periodo igual al ancho y primitivas duplicadas en ±512 px; hay un criterio de aceptación explícito.                                                         |
| Liberar una geometría o textura compartida en el rebuild de nodos rompe los planetas siguientes | Los recursos compartidos no entran en los arrays`geometries`/`materials` del effect de nodos; solo `planetAssets.dispose()` en el cleanup de la escena los libera. |
| Muchas auras aditivas superpuestas en galaxias densas saturan el brillo                          | Opacity base de 0.2 y textura que se desvanece antes del borde. Se revisa con el mock en la galaxia más densa.                                                          |
| El aura, al ser mucho más grande que el core, parece clicable pero no lo es                     | Es intencionado: el picking sigue en el core, como en SPEC 02. Se documenta en`CONTEXT.md`.                                                                            |

## What is **not** in this spec

- Texturas coloreadas o varias variantes por patrón.
- Normal maps, bump maps o `envMap`.
- Lunas u objetos sobre la órbita.
- Órbita para niveles distintos de avanzado.
- Cambios en el giro del core con reduced motion.
- Cambios en nebulosas, fondo, campo de estrellas, nave o líneas de relaciones.
- Cambios en `StarMap3D.tsx`, `galaxy-effect.css`, `DashboardPage.tsx`, `galaxyHighlight.ts`, `relationLines.ts` y `src/types/index.ts`.

Cada uno de estos, si se implementa, va en su propio spec.
