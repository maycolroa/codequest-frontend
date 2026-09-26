# SPEC 04 — Planetas procedurales en /starmap

> **Status:** aprobado
> **Depends on:** SPEC 02, SPEC 03
> **Date:** 2026-09-26 (ampliado el mismo día: atmósfera, emissive por galaxia, brillo de hover/selección, tono del aura por curso, anillo decorativo, variación de superficie por curso y variación de color del core por curso)
> **Objective:** Convertir las esferas de `/starmap` en planetas con textura procedural por galaxia (canvas 2D), un aura de polvo cósmico giratoria, una atmósfera brillante del color puro de su galaxia y, en los cursos avanzados, una órbita fina inclinada; diferenciar las galaxias con un emissive base propio y hacer que el planeta en hover o seleccionado brille más. Todo sin imágenes externas, reutilizando geometrías y texturas y sin romper el resaltado de SPEC 03.

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
- **Atmósfera por galaxia** en todos los planetas, activos e inactivos (ampliación):

  - un segundo `THREE.Sprite`, más pequeño que el aura, con una textura compartida `atmosphereTexture`;
  - radio visible de 2.0× el radio del planeta;
  - color **puro** de la galaxia (`galaxyColor` sin mezclar hacia `STAR_TONE_GRAY`), blending aditivo;
  - opacity base por galaxia entre 0.24 y 0.36 (`GALAXY_ATMOSPHERE`, fallback 0.30). En los inactivos, × `INACTIVE_OPACITY`;
  - sube a 0.65 (× `INACTIVE_OPACITY` en inactivos) cuando el planeta está en hover o seleccionado, salvo que su galaxia esté `dimmed`;
  - no gira ni cambia de escala.
- **Emissive base por galaxia** (ampliación). Un multiplicador `GALAXY_EMISSIVE` por key sobre `ACTIVE_EMISSIVE`/`INACTIVE_EMISSIVE`: `ai-ml` más luminoso, `mobile` frío y brillante, `devops` cálido y `fundamentals` dorado suave. Las demás galaxias y las desconocidas usan 1.
- **Brillo de hover/selección** (ampliación). El planeta en hover o seleccionado lleva su emissive a `baseEmissive × 1.6` en lugar de `× EMPHASIS_EMISSIVE[emphasis]`. El resto de planetas de la galaxia resaltada siguen en `highlighted` (× 1.4). Si el planeta está `dimmed`, gana siempre `dimmed`, tanto en emissive como en atmósfera.
- **Tono del aura por curso** (ampliación 2). El color del aura rota el hue del color mezclado de la galaxia entre −30° y +30°, de forma determinista por `course.id`. En una misma galaxia unos planetas tienen el aura más hacia un vecino del tono y otros hacia el otro (en `backend`, verde: azul-verdoso, cian-verdoso o amarillo-verdoso). Solo cambia el aura; el core, la atmósfera, la órbita y el anillo no varían por curso.
- **Anillo decorativo** en todos los planetas, activos e inactivos (ampliación 3):

  - radio de 1.55× a 1.6× el del planeta: más delgado que el anillo de segunda galaxia (1.9–2.05×);
  - color mezclado de la galaxia llevado un 50 % hacia blanco, opacity base `0.2` (× `INACTIVE_OPACITY` en inactivos);
  - inclinación y azimut deterministas por `course.id`, con semillas distintas a las de la órbita;
  - se atenúa y resalta con `EMPHASIS_GLOW`; no gira.
- **Variación de superficie por curso sin texturas extra** (ampliación 3):

  - **espejo:** la mitad de los planetas usa un clon de la textura con `repeat.x = −1`, que muestra los accidentes de la superficie invertidos. Los clones comparten la textura de GPU con el original;
  - **contraste:** cada planeta aplica al `map` y al `emissiveMap` un contraste entre 0.85 y 1.15, con un uniform por material inyectado con `onBeforeCompile`.
- **Variación de color del core por curso** (ampliación 4). El color mezclado del core varía ±0.15 en saturación y ±0.10 en luminosidad, de forma determinista por `course.id`, sin cambiar el hue. En una galaxia hay planetas más oscuros, más claros, más vivos o más apagados, todos con el tono de la galaxia. Solo el core; el aura, la atmósfera, la órbita y los anillos no heredan esta variación.
- **Convivencia con el anillo de segunda galaxia.** El anillo de SPEC 02 se mantiene igual en apariencia y comportamiento. La órbita va en un radio distinto, así que un curso avanzado con dos galaxias muestra ambos.
- **Reutilización de recursos:**

  - geometrías de core, anillo secundario y órbita compartidas por nivel, creadas una vez con la escena;
  - texturas de superficie creadas bajo demanda (la primera vez que un curso usa ese patrón) y cacheadas durante la vida de la escena;
  - una sola textura de aura y una sola textura de atmósfera;
  - los materiales siguen siendo por curso, porque el resaltado interpola su opacity y emissive por separado.
- **Compatibilidad con el resaltado de SPEC 03.** El core, el aura, la atmósfera, la órbita y el anillo interpolan sus valores con las mismas `Emphasis` y factores. `galaxyHighlight.ts` no cambia.
- **Reduced motion.** Con `prefers-reduced-motion: reduce` el aura no gira. El giro del core sigue como hoy.
- **Módulo nuevo** `src/lib/galaxy/planetVisuals.ts`, y `hashString` se mueve a `src/lib/galaxy/hash.ts` para compartirlo.
- Actualizar `docs/CHANGELOG.md`, `docs/TASKS.md` y `docs/CONTEXT.md`.

**Out of scope (para specs futuros):**

- Texturas coloreadas por galaxia o varias variantes (semillas) por patrón. La variedad por curso sale del giro, el espejo y el contraste (ampliación 3).
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

// Multiplicador del emissive base por galaxia (ampliación); 1 si la key no está o es undefined
export const GALAXY_EMISSIVE: Record<string, number> = {
  'ai-ml': 1.4,
  mobile: 1.3,
  devops: 1.2,
  fundamentals: 0.9,
}
export function emissiveForGalaxy(key: string | undefined): number

// Opacity base de la atmósfera por galaxia (ampliación); 0.30 si la key no está o es undefined
export const GALAXY_ATMOSPHERE: Record<string, number> = {
  'ai-ml': 0.36,
  mobile: 0.34,
  devops: 0.32,
  fundamentals: 0.24,
}
export function atmosphereOpacityForGalaxy(key: string | undefined): number

// Variación de superficie por curso (ampliación 3)
export function surfaceVariant(courseId: string): { mirrored: boolean; contrast: number }
// Clon espejado de una textura de superficie; comparte la textura de GPU. El llamador lo libera.
export function mirrorSurfaceTexture(texture: THREE.CanvasTexture): THREE.CanvasTexture
// Inyecta el contraste en map y emissiveMap de un MeshStandardMaterial con un único programa compartido
export function applySurfaceContrast(material: THREE.MeshStandardMaterial, contrast: number): void
// Orientación del anillo decorativo (ampliación 3)
export function decorRingOrientation(courseId: string): { tilt: number; azimuth: number }

// Color del aura por curso (ampliación 2): rota el hue de baseColor ±AURA_HUE_RANGE grados.
// Devuelve un color nuevo y no modifica baseColor.
export function auraColor(baseColor: THREE.Color, courseId: string): THREE.Color

export interface PlanetAssets {
  surfaceTexture: (pattern: PlanetPattern) => THREE.CanvasTexture // lazy + caché
  auraTexture: THREE.CanvasTexture
  atmosphereTexture: THREE.CanvasTexture                           // ampliación
  coreGeometry: (level: CourseLevel) => THREE.SphereGeometry       // radio LEVEL_RADIUS[level], 32×32
  ringGeometry: (level: CourseLevel) => THREE.RingGeometry         // 1.9×–2.05× el radio, 64 segmentos
  orbitGeometry: (level: CourseLevel) => THREE.BufferGeometry      // círculo de ORBIT_RADIUS_FACTOR × radio, 128 puntos, plano XZ
  decorRingGeometry: (level: CourseLevel) => THREE.RingGeometry    // ampliación 3: 1.55×–1.6× el radio, 64 segmentos
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
  atmosphere: THREE.Sprite        // nuevo (ampliación): color puro de la galaxia
  orbit: THREE.LineLoop | null    // nuevo: solo en cursos avanzados
  decorRing: THREE.Mesh           // nuevo (ampliación 3): anillo decorativo en todos los planetas
  ring: THREE.Mesh | null
  light: THREE.PointLight | null
  baseRadius: number
  baseOpacity: number
  baseEmissive: number            // ahora × emissiveForGalaxy(galaxies[0])
  baseAuraOpacity: number         // nuevo: AURA_OPACITY o AURA_OPACITY × INACTIVE_OPACITY
  baseOrbitOpacity: number        // nuevo: ORBIT_OPACITY o ORBIT_OPACITY × INACTIVE_OPACITY
  baseAtmosphereOpacity: number   // nuevo (ampliación): GALAXY_ATMOSPHERE o × INACTIVE_OPACITY
  baseDecorRingOpacity: number    // nuevo (ampliación 3): DECOR_RING_OPACITY o × INACTIVE_OPACITY
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

  - `SpriteMaterial` por curso: `map = auraTexture`, `color = auraColor(colorMezclado, course.id)`, `transparent`, `depthWrite: false`, `blending: AdditiveBlending`.
  - Tono por curso (ampliación 2): `hueShift = (hashString(id, 8) − 0.5) × 2 × AURA_HUE_RANGE`, con `AURA_HUE_RANGE = 30` grados, aplicado con `color.clone().offsetHSL(hueShift / 360, 0, 0)`. La semilla 8 no la usa ningún otro valor (1–3 posición, 4–5 órbita, 6–7 planeta). Saturación y luminosidad no cambian.
  - Escala base: `AURA_RADIUS_FACTOR × 2 × baseRadius`, con `AURA_RADIUS_FACTOR = 2.5` (el sprite mide el diámetro).
  - `AURA_OPACITY = 0.2`.
  - Rotación: `material.rotation -= delta × AURA_ROTATION_SPEED`, con `AURA_ROTATION_SPEED = 0.15` rad/s. El core gira en sentido positivo, así que el aura gira al revés y más lento. Con reduced motion no se actualiza.
  - La textura de aura mide 128×128: gradiente radial blanco de alpha 1 → 0, más ~60 motas de 1–2 px con alpha aleatorio (PRNG con semilla fija). Se desvanece por completo antes del borde, sin corte cuadrado.
  - El aura no participa en el picking. `pickSlug` sigue intersectando solo los cores.
- **Atmósfera** (ampliación).

  - `SpriteMaterial` por curso: `map = atmosphereTexture`, `color = new THREE.Color(galaxyColor)` sin mezclar, `transparent`, `depthWrite: false`, `blending: AdditiveBlending`.
  - Escala fija: `ATMOSPHERE_RADIUS_FACTOR × 2 × baseRadius`, con `ATMOSPHERE_RADIUS_FACTOR = 2.0`.
  - `baseAtmosphereOpacity = atmosphereOpacityForGalaxy(galaxies[0])`, × `INACTIVE_OPACITY` en inactivos.
  - `ATMOSPHERE_SPOTLIGHT_OPACITY = 0.65`: target en hover o selección.
  - La textura mide 128×128: gradiente radial blanco sin motas, con alpha ~0.6 en el centro, máximo 1 hacia el limbo del planeta (1 / `ATMOSPHERE_RADIUS_FACTOR` = 0.5 del radio) y 0 antes del borde. Sin corte cuadrado.
  - No gira, no escala en hover y no participa en el picking.
- **Anillo decorativo** (ampliación 3).

  - `Mesh` con `decorRingGeometry(level)` y un `MeshBasicMaterial` por curso: `color = colorMezclado.clone().lerp(blanco, DECOR_RING_WHITE_MIX)` con `DECOR_RING_WHITE_MIX = 0.5`, `side: DoubleSide`, `transparent`, `depthWrite: false`, `blending: AdditiveBlending` (como el anillo de SPEC 02).
  - `DECOR_RING_OPACITY = 0.2`.
  - Orientación: `tilt = (hashString(id, 11) − 0.5) × 2 × ORBIT_MAX_TILT` y `azimuth = hashString(id, 12) × 2π`. El `RingGeometry` está en el plano XY, así que se aplica `rotation.order = 'YXZ'` y `rotation.set(π/2 + tilt, azimuth, 0)`.
  - Las semillas 11 y 12 no coinciden con las de la órbita (4 y 5), así que las inclinaciones son independientes.
- **Variación de superficie por curso** (ampliación 3).

  - `mirrored = hashString(id, 9) < 0.5`. Si es espejo, el core usa `mirrorSurfaceTexture(surface)`: `clone()` con `repeat.x = −1` y `offset.x = 1`. Three.js comparte la `WebGLTexture` entre texturas con la misma `source` y los mismos parámetros, y `offset`/`repeat` no cuentan, así que no hay más memoria de GPU ni más entradas en `renderer.info.memory.textures`. Los clones son del rebuild de nodos y se liberan en su cleanup; la textura original sigue cacheada en `PlanetAssets`.
  - `contrast = 1 + (hashString(id, 10) − 0.5) × 2 × SURFACE_CONTRAST_RANGE`, con `SURFACE_CONTRAST_RANGE = 0.15`.
  - `applySurfaceContrast` usa `onBeforeCompile` para declarar `uniform float uSurfaceContrast` y aplicar `clamp((texel.rgb − 0.25) × uSurfaceContrast + 0.25, 0, 1)` al texel de `map` y de `emissiveMap`, ya en espacio lineal. El pivote 0.25 lineal ≈ 0.54 sRGB, cerca de la mediana de las texturas. `customProgramCacheKey` devuelve una clave fija, así que todos los planetas comparten un programa y solo cambia el uniform.
- **Variación de color del core** (ampliación 4).

  - `coreColor = colorMezclado.clone().offsetHSL(0, satVariation, lightVariation)`, con `satVariation = (hashString(id, 13) − 0.5) × 2 × CORE_SATURATION_RANGE` (`0.15`) y `lightVariation = (hashString(id, 14) − 0.5) × 2 × CORE_LIGHTNESS_RANGE` (`0.10`).
  - `coreColor` se usa en `color` y `emissive` del core. Es un clon: el color mezclado que usan las demás capas no cambia.
  - Semillas 13 y 14, libres (1–3 posición, 4–5 órbita, 6–7 planeta, 8 aura, 9–10 superficie, 11–12 anillo decorativo).
- **Emissive por galaxia y brillo de hover/selección** (ampliación).

  - `baseEmissive = (isActive ? ACTIVE_EMISSIVE : INACTIVE_EMISSIVE) × emissiveForGalaxy(galaxies[0])`.
  - `SPOTLIGHT_EMISSIVE = 1.6`. Un planeta está "en foco" si está en hover o es el seleccionado (`selectedIdRef`).
  - `EMPHASIS_EMISSIVE` y `EMPHASIS_GLOW` no cambian.
- **Órbita.**

  - `LineLoop` con `orbitGeometry(level)` y un `LineBasicMaterial` por curso: color mezclado, `transparent`, `depthWrite: false` y opacity `baseOrbitOpacity`.
  - `ORBIT_RADIUS_FACTOR = 2.3`: queda fuera del anillo secundario (2.05) y dentro del borde del aura (2.5).
  - `ORBIT_OPACITY = 0.3`.
  - Orientación: `tilt = (hashString(id, 4) − 0.5) × 2 × ORBIT_MAX_TILT` con `ORBIT_MAX_TILT = 0.6` rad (~35°), y `azimuth = hashString(id, 5) × 2π`. Se aplica como `orbit.rotation.set(tilt, azimuth, 0)` con `orbit.rotation.order = 'YXZ'` sobre el círculo del plano XZ: primero se inclina y después el azimut orienta esa inclinación (con `XYZ` el azimut giraría el círculo sobre su normal y no tendría efecto).
  - La órbita no gira.
- **Targets de resaltado.** Se amplía la tabla de SPEC 03, con el mismo `EMPHASIS_LERP = 0.1`:

  | Elemento | Opacity target                                | Escala target                               |
  | -------- | --------------------------------------------- | ------------------------------------------- |
  | core     | igual que SPEC 03                             | igual que SPEC 03                           |
  | atmósfera | `dimmed`: `baseAtmosphereOpacity × EMPHASIS_GLOW.dimmed`; en foco: `ATMOSPHERE_SPOTLIGHT_OPACITY` (× `INACTIVE_OPACITY` en inactivos); resto: `min(1, baseAtmosphereOpacity × EMPHASIS_GLOW)` | sin cambio |
  | aura     | `min(1, baseAuraOpacity × EMPHASIS_GLOW)`  | base ×`HOVER_SCALE` en hover, base si no |
  | órbita  | `min(1, baseOrbitOpacity × EMPHASIS_GLOW)` | sin cambio                                  |
  | anillo decorativo | `min(1, baseDecorRingOpacity × EMPHASIS_GLOW)` | sin cambio                     |
  | anillo   | igual que SPEC 03                             | sin cambio                                  |

  Como el `Sprite` no hereda la escala del core, la escala del aura se interpola por separado hacia su propio target.

  Emissive target del core (ampliación): `baseEmissive × EMPHASIS_EMISSIVE.dimmed` si está `dimmed`; `baseEmissive × SPOTLIGHT_EMISSIVE` si está en foco; `baseEmissive × EMPHASIS_EMISSIVE[emphasis]` en el resto. `dimmed` gana siempre.
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
9. (Ampliación) Añadir a `planetVisuals.ts` `GALAXY_EMISSIVE`, `emissiveForGalaxy`, `GALAXY_ATMOSPHERE`, `atmosphereOpacityForGalaxy` y `atmosphereTexture` en `PlanetAssets` (liberada en `dispose`). Crear el sprite de atmósfera por curso con `baseAtmosphereOpacity` e interpolar su opacity en el loop según la tabla. Prueba manual: cada planeta tiene un halo de color puro de su galaxia, más pequeño que el aura; en hover sube y al salir vuelve.
10. (Ampliación) Aplicar `emissiveForGalaxy` a `baseEmissive` y el target de emissive con `SPOTLIGHT_EMISSIVE` en hover/selección y prioridad de `dimmed`. Prueba manual: `ai-ml` se ve más luminoso que `fundamentals`; el planeta seleccionado brilla más que el resto de su galaxia; con foco en otra galaxia, el seleccionado queda atenuado.
11. (Ampliaciones 1–4) Actualizar `docs/CHANGELOG.md`, `docs/TASKS.md` y `docs/CONTEXT.md` con la atmósfera, el emissive por galaxia, el brillo de hover/selección, el tono del aura por curso, el anillo decorativo, el espejo y el contraste de la superficie y la variación de color del core. Se implementa al final, después de los Pasos 12–15.
12. (Ampliación 2) Añadir `auraColor` a `planetVisuals.ts` y usarlo en el `SpriteMaterial` del aura. La documentación va en el Paso 11. Prueba manual: en `backend` las auras de distintos planetas tienen tonos verdes distintos (más azulados o amarillentos) y cada planeta conserva su tono tras recargar.
13. (Ampliación 3, se implementa antes del Paso 10) Añadir el anillo decorativo: `decorRingGeometry` en `PlanetAssets`, `decorRingOrientation`, el mesh por curso con `baseDecorRingOpacity` y su lerp de opacity en el loop. Prueba manual: todos los planetas tienen un anillo fino y claro a 1.6×, con inclinación distinta a la órbita en los avanzados, y un avanzado con dos galaxias muestra los tres (decorativo, secundario y órbita) sin solaparse.
14. (Ampliación 3, se implementa antes del Paso 10) Añadir `surfaceVariant`, `mirrorSurfaceTexture` y `applySurfaceContrast`, y aplicarlos al core. Prueba manual: dentro de una galaxia hay planetas con la superficie espejada y con más o menos contraste; `renderer.info.memory.textures` no aumenta respecto al Paso 9.
15. (Ampliación 4) Aplicar al core `coreColor` con la variación de saturación y luminosidad por curso. Prueba manual: en `backend` los planetas varían entre verdes más oscuros, más claros y más o menos saturados, sin salirse del verde, y cada uno conserva su color tras recargar.

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
- [ ] Con la escena cargada, `renderer.info.memory.textures` incluye como máximo 8 texturas de superficie, 1 de aura y 1 de atmósfera, independientemente del número de cursos.
- [ ] Todos los planetas tienen atmósfera del color puro de su galaxia, de ~2.0× el radio, más pequeña que el aura y sin bordes cuadrados; en los inactivos es más tenue.
- [ ] La opacity base de la atmósfera sigue `GALAXY_ATMOSPHERE` (0.24–0.36) y una galaxia desconocida usa 0.30 sin errores.
- [ ] Hover o selección de un planeta sube su atmósfera a 0.65 (× `INACTIVE_OPACITY` si es inactivo) y su emissive a `baseEmissive × 1.6`, con transición; al salir vuelven a su valor.
- [ ] Con foco en otra galaxia, un planeta seleccionado o en hover de una galaxia atenuada queda atenuado (gana `dimmed`).
- [ ] `ai-ml`, `mobile` y `devops` se ven más luminosos que antes de la ampliación y `fundamentals` algo más apagado; una galaxia desconocida usa multiplicador 1 sin errores.
- [ ] El aura y la atmósfera superpuestas no saturan a blanco los planetas en la galaxia más densa del mock.
- [ ] Dentro de una galaxia, las auras de distintos planetas muestran tonos distintos, todos reconocibles como el color de esa galaxia (±30° de hue), y cada planeta conserva su tono tras recargar.
- [ ] La atmósfera, la órbita y los anillos no varían de color por curso. El aura solo varía en hue (ampliación 2) y el core solo en saturación y luminosidad (ampliación 4).
- [ ] Dentro de una galaxia, los cores varían en saturación (±0.15) y luminosidad (±0.10) sin cambiar de hue, y cada planeta conserva su color tras recargar.
- [ ] Todos los planetas, activos e inactivos, tienen un anillo decorativo fino a ~1.6× el radio, más claro que su color y más tenue en los inactivos; su inclinación es determinista por curso y, en los avanzados, distinta de la de la órbita.
- [ ] El anillo decorativo se atenúa y resalta con el resto de capas al hacer hover o foco sobre otra galaxia.
- [ ] Dentro de una galaxia, unos planetas muestran la superficie espejada y otros no, y el contraste varía entre planetas (0.85–1.15); cada planeta conserva su variante tras recargar.
- [ ] El espejo y el contraste no añaden texturas: `renderer.info.memory.textures` sigue en como máximo 8 de superficie, 1 de aura y 1 de atmósfera, y todos los cores comparten un solo programa de shader.
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
- **No:** varias variantes por patrón ni una textura por curso. Más memoria de GPU, y contradice la restricción de reutilizar texturas. Medido en la ampliación 3: 6 variantes serían 48 texturas, ~2.2 s de generación y ~34 MB de GPU.
- **Sí (ampliación 3):** variedad por curso con espejo (clon que comparte la textura de GPU) y contraste por uniform. Cero texturas y cero programas extra.
- **No (ampliación 3):** `texture.offset.x` por curso. En una esfera equivale a girarla sobre su eje, y el giro inicial por curso ya lo cubre.
- **Sí (ampliación 4):** variación de saturación y luminosidad del core por curso sobre un clon del color mezclado, con semillas propias (13 y 14). Reutilizar las 11 y 12 ataría el color a la inclinación del anillo decorativo.
- **Sí (ampliación 3):** anillo decorativo en todos los planetas, a 1.55–1.6×, dentro de la atmósfera (2.0×) y del anillo de segunda galaxia (1.9×).
- **Sí:** `emissiveMap` igual a `map`. Sin él, el emissive plano taparía el patrón en las caras en sombra.
- **Sí:** el aura reemplaza al halo esférico. Evita una malla esférica `BackSide` por planeta.
- **Sí (ampliación):** atmósfera como segunda capa aditiva sobre el aura, pese a la decisión original de evitar dos capas superpuestas. Se acepta una draw call más por planeta a cambio de diferenciar las galaxias; la opacity (0.24–0.36) se eligió más alta tras la primera prueba visual para que la atmósfera se vea brillante y fluorescente, a costa de más riesgo de saturación.
- **Sí (ampliación):** la atmósfera usa el color puro de la galaxia, como excepción explícita a la mezcla `STAR_TONE` de SPEC 03. Es la capa que da identidad de color; el core, el aura y la órbita siguen mezclados.
- **Sí (ampliación):** `GALAXY_EMISSIVE` como multiplicador sobre `ACTIVE_EMISSIVE`/`INACTIVE_EMISSIVE`, para que los inactivos mantengan su proporción. "Cálido" o "frío" se expresan solo con intensidad, no desplazando el color.
- **Sí (ampliación):** `SPOTLIGHT_EMISSIVE` (× 1.6) solo en el planeta en hover o seleccionado; el resto de la galaxia resaltada sigue en `highlighted` (× 1.4). `dimmed` gana siempre.
- **No (ampliación):** cambiar `EMPHASIS_EMISSIVE.highlighted` a 1.6 o modificar `galaxyHighlight.ts`.
- **Sí (ampliación 2):** variar el tono del aura rotando el hue ±30° sobre el color mezclado. Diferencia planetas de una misma galaxia sin que dejen de leerse como de esa galaxia.
- **No (ampliación 2):** mezclar con el color complementario (180°). Alejaría el aura del tono de su galaxia y podría confundirla con otra.
- **No (ampliación 2):** variar el tono sobre el color puro. El aura competiría con la atmósfera, que es la capa de color puro.
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
| Aura y atmósfera aditivas superpuestas saturan a blanco los planetas (ampliación)                | Opacity de atmósfera 0.24–0.36 y emissive de `ai-ml` × 1.4 como máximo. Si satura, bajar `GALAXY_ATMOSPHERE` o `AURA_OPACITY` antes que cambiar el blending.         |
| `onBeforeCompile` depende de los nombres internos de los chunks de three (`map_fragment`, `emissivemap_fragment`) (ampliación 3) | Se reemplaza el chunk completo desde `THREE.ShaderChunk` cambiando solo la línea que multiplica el texel. Si un update de three cambia el chunk, el contraste deja de aplicarse, pero el planeta sigue viéndose. |
| Al liberar todos los clones espejados en un rebuild, three borra la `WebGLTexture` compartida y la vuelve a subir en el siguiente (ampliación 3) | Solo afecta a la subida, no a la generación del canvas. Los planetas no espejados usan la textura original, que sigue viva, así que en la práctica la `WebGLTexture` no llega a borrarse. |
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
