# SPEC 03 — Resaltado de galaxia y relaciones animadas en /starmap

> **Status:** aprobado
> **Depends on:** SPEC 02
> **Date:** 2026-09-23
> **Objective:** Resaltar en `/starmap` la galaxia activa (por hover, click en nebulosa o leyenda) atenuando las demás, y reemplazar las líneas de relaciones por líneas con grosor, flujo de partículas, dash animado y pulso de origen, sin re-renders de React por frame.

## Por qué existe este spec

SPEC 02 dejó la galaxia funcionando, pero con estas limitaciones:

- **Relaciones difíciles de leer.** Las líneas son `LineSegments` con `LineBasicMaterial`. WebGL ignora `linewidth`, así que siempre miden 1px. No indican dirección y desaparecen al sacar el mouse, aunque el panel siga abierto.
- **Nebulosas decorativas.** No se pueden clicar.
- **Leyenda solo informativa.** No filtra nada.

Con muchos cursos no se distingue qué pertenece a cada galaxia.

El contrato de `GET /courses/galaxy` no trae un peso por relación. La "importancia" que define el grosor se deriva en el cliente (ver "Data model").

## Scope

**In:**

- **Estado de foco.** `focusedGalaxyKey: string | null` vive en `StarMap3D.tsx`. Lo escriben:
  - el click en una nebulosa;
  - el click en la leyenda, que funciona como toggle;
  - el click en espacio vacío (a `null`);
  - la tecla `Esc` (a `null`);
  - el botón "Vista general" (a `null`).
- **Resaltado por hover.** Al pasar el mouse sobre una estrella se resaltan todas las galaxias de su `galaxies[]`, se atenúan las demás y se intensifica la nebulosa de `galaxies[0]`. Todo se calcula en el loop de animación con lerp, sin estado de React.
- **Resaltado por foco.** Con una galaxia enfocada se resaltan los cursos que la tienen en su `galaxies[]`, se atenúan los demás y se intensifica su nebulosa. El foco tiene prioridad sobre el hover. El hover sigue mostrando tooltip, líneas y crecimiento, pero no cambia qué galaxia está resaltada.
- **Zoom a galaxia.** Enfocar una galaxia anima la cámara hacia `galaxy.center`, con una distancia proporcional al tamaño de su nebulosa. Pasa lo mismo desde la nebulosa y desde la leyenda.
- **Picking de nebulosas.** Tiene prioridad la estrella. Si no hay estrella, se busca la nebulosa cuyo centro está más cerca del rayo dentro de su radio visible. El cursor pasa a `pointer` sobre una nebulosa clicable.
- **Líneas de relaciones con `Line2` + `LineMaterial`** (de `three/addons/lines/`):
  - Prerequisitos: rojas (`#EF4444`), sólidas, con partículas (`THREE.Points` + `BufferGeometry`) que viajan del curso origen al prerequisito.
  - Relacionados: azules (`#3B82F6`), con dash que se desplaza animando `dashOffset`.
  - Grosor en píxeles según el tipo y la posición del slug en la lista.
  - Al aparecer, las líneas crecen desde el centro de la esfera origen y se emite un pulso: un sprite que se expande y se desvanece una vez.
- **Líneas persistentes del curso seleccionado.** Con el panel abierto, sus líneas quedan visibles con brillo reducido. Con hover sobre cualquier estrella, sus líneas se muestran con brillo completo. Si la estrella en hover es la seleccionada, se dibuja un solo juego de líneas, con brillo completo.
- **Leyenda interactiva.** Cada galaxia es un `<button>` con `aria-pressed`. Con foco activo, las galaxias no enfocadas se ven atenuadas en la leyenda.
- **Soporte de `prefers-reduced-motion: reduce`:**
  - sin partículas en movimiento;
  - dash estático;
  - sin pulso;
  - las líneas aparecen completas;
  - el zoom es instantáneo;
  - el resaltado y las líneas se siguen mostrando.
- **Módulos nuevos** en `src/lib/galaxy/`, para no seguir engordando `useGalaxyScene.ts`.
- **Tono de las esferas más suave.** Hoy se ven saturadas, como objetos neón, y deben parecer estrellas lejanas:
  - `baseEmissive` de los cursos activos baja de 1.4 a 0.6. Los inactivos siguen en 0.3;
  - el color del core, que se usa como `color` y como `emissive`, se mezcla un 40 % hacia gris oscuro (`STAR_TONE_GRAY = #262626`, `STAR_TONE_MIX = 0.4`);
  - el color del halo y el del anillo reciben la misma mezcla;
  - el color sigue siendo identificable por galaxia. Las nebulosas no cambian.
- Actualizar `docs/CHANGELOG.md`, `docs/TASKS.md` y `docs/CONTEXT.md`.

**Out of scope (para specs futuros):**

- Leyenda visible en móvil. Sigue con `hidden md:block`, y en móvil el foco se activa con un tap en la nebulosa.
- Campo de peso o importancia en el contrato del backend.
- Resaltar la nebulosa al pasar el mouse por encima. Solo se cambia el cursor.
- Líneas entre cursos que no son el hovered ni el seleccionado, como mostrar todo el grafo a la vez.
- Persistir el foco en la URL o en `localStorage`.
- Cambios en `CoursePanel.tsx`, `CourseLinks.tsx` y `CourseTooltip.tsx`.
- Reescritura en React Three Fiber.

## Data model

Este spec no cambia `src/types/index.ts` ni el contrato de `GET /courses/galaxy`. Los estados nuevos son de UI y de escena.

Estado de React en `StarMap3D.tsx`:

```ts
const [focusedGalaxyKey, setFocusedGalaxyKey] = useState<string | null>(null)
```

Cambios en la API de `useGalaxyScene` (se añaden los campos marcados):

```ts
export interface UseGalaxySceneOptions {
  // ...campos actuales de SPEC 02
  focusedGalaxyKey: string | null                  // nuevo
  onFocusGalaxy: (key: string | null) => void      // nuevo: click en nebulosa (key) o en espacio vacío (null)
}
// Retorno sin cambios: { isSupported, resetCamera, focusCourse }
```

El hook lee `focusedGalaxyKey` por ref en el loop. Además, un effect con `[focusedGalaxyKey]` dispara el vuelo de cámara cuando pasa a un valor no nulo.

`src/lib/galaxy/galaxyHighlight.ts` contiene funciones puras, sin Three.js:

```ts
export type Emphasis = 'highlighted' | 'dimmed' | 'neutral'

// Foco > hover > nada. Devuelve null cuando no hay nada resaltado.
export function resolveActiveGalaxies(focusedKey: string | null, hovered: GalaxyCourse | null): Set<string> | null

// highlighted si comparte alguna galaxia con el set; dimmed si no; neutral si active es null
export function courseEmphasis(course: GalaxyCourse, active: Set<string> | null): Emphasis

// Nebulosa intensificada: la galaxia enfocada o galaxies[0] del curso en hover
export function resolveIntensifiedNebula(focusedKey: string | null, hovered: GalaxyCourse | null): string | null
```

`src/lib/galaxy/relationLines.ts` contiene código imperativo de Three.js:

```ts
export interface RelationLines {
  group: THREE.Group                     // posicionado en el centro del curso origen
  setIntensity: (value: number) => void  // 1 = hover, SELECTED_LINE_INTENSITY = seleccionado
  setResolution: (width: number, height: number) => void // LineMaterial necesita la resolución
  update: (delta: number, elapsed: number) => void       // crecimiento, pulso, partículas, dash
  dispose: () => void
}

export function createRelationLines(options: {
  origin: CourseNode
  nodes: Map<string, CourseNode>
  pulseTexture: THREE.Texture
  resolution: THREE.Vector2
  reducedMotion: boolean
}): RelationLines | null // null si no hay ningún slug resoluble
```

`CourseNode` se exporta desde `useGalaxyScene.ts` y se amplía:

```ts
interface CourseNode {
  // ...campos actuales
  baseOpacity: number   // 1 o INACTIVE_OPACITY
  baseEmissive: number  // 0.6 o 0.3
}

interface NebulaNode {
  galaxy: Galaxy
  sprite: THREE.Sprite
  material: THREE.SpriteMaterial
  baseSize: number
}
// nebulaeRef: Map<galaxyKey, NebulaNode>
```

Convenciones:

- **Pertenencia a galaxia.** Un curso pertenece a una galaxia si su key está en `course.galaxies`, en cualquier posición.
- **Targets de estrella.** Cada frame se hace lerp hacia estos valores con `EMPHASIS_LERP = 0.1`:

  | Emphasis        | opacity del core                               | emissiveIntensity       | halo, anillo y point light |
  | --------------- | ---------------------------------------------- | ----------------------- | -------------------------- |
  | `neutral`     | `baseOpacity`                                | `baseEmissive`        | valores actuales           |
  | `highlighted` | `baseOpacity`                                | `baseEmissive × 1.4` | ×1.3                      |
  | `dimmed`      | `min(0.2, baseOpacity)` (`DIMMED_OPACITY`) | `baseEmissive × 0.3` | ×0.2                      |

  `baseEmissive` es `0.6` en los cursos activos y `0.3` en los inactivos. Para los activos da un emissive de 0.6 en `neutral`, 0.84 en `highlighted` y 0.18 en `dimmed`.

  Los materiales del core pasan a `transparent: true` siempre, para poder interpolar la opacidad.
- **Tono de las esferas.** El color base de cada estrella es `galaxyColor.lerp(STAR_TONE_GRAY, STAR_TONE_MIX)`, con `STAR_TONE_GRAY = #262626` y `STAR_TONE_MIX = 0.4`:
  - el core usa ese color como `color` y como `emissive`;
  - el halo usa el mismo color;
  - el anillo aplica la misma mezcla al color de su segunda galaxia.

  La point light, las líneas, el pulso, la leyenda y las nebulosas conservan el `galaxyColor` original.
- **Targets de nebulosa.**

  - Intensificada: opacity `0.6`, escala `baseSize × 1.25`.
  - Atenuada, cuando hay un set activo y no es la intensificada: opacity `0.12`, escala `baseSize`.
  - Neutral: `NEBULA_OPACITY` (0.35), escala `baseSize`.
- **Grosor de línea**, en píxeles de pantalla:

  - Prerequisitos: `max(1.5, 3.5 − 0.75 × índice)`.
  - Relacionados: `max(1, 2 − 0.4 × índice)`.

  `índice` es la posición del slug en `prerequisites` o `related`.
- **Intensidad de línea.**

  - Hover: opacity `1`.
  - Seleccionado sin hover: `SELECTED_LINE_INTENSITY = 0.45`.
  - Se aplica a `LineMaterial.opacity` y a la opacity de las partículas.
- **Partículas.**

  - `PARTICLES_PER_PREREQUISITE = 6`, en un solo `THREE.Points` por `RelationLines`, con un `Float32Array` de `count × 3`.
  - La posición de cada partícula es `lerp(0, target − origin, (elapsed × PARTICLE_SPEED + i / N) % 1)`, en coordenadas locales del `group`.
  - `PARTICLE_SPEED = 0.35` recorridos por segundo.
  - Blending aditivo, textura circular y color rojo.
- **Dash.** `dashSize = 1.2`, `gapSize = 0.8` y `dashOffset -= delta × 1.5`. Requiere `line.computeLineDistances()`.
- **Crecimiento y pulso.**

  - El `group` se escala de 0 a 1 en `LINE_GROW_MS = 350` con ease-out. Con esto no hace falta reescribir buffers.
  - El pulso es un `THREE.Sprite` con `galaxyColor` en el centro del origen. Escala de `baseRadius × 2` a `baseRadius × 6` y opacity de 0.8 a 0 en `PULSE_MS = 600`. Se reproduce una sola vez y después queda invisible.
- **Picking de nebulosa.**

  - Distancia del rayo al centro menor que `baseSize × NEBULA_HIT_FACTOR`, con `NEBULA_HIT_FACTOR = 0.3`.
  - Si varias cumplen, gana la de centro más cercano a la cámara.
- **Zoom a galaxia.**

  - `target = galaxy.center`.
  - `position = center + dirección de vista actual × max(GALAXY_FOCUS_MIN_DISTANCE, baseSize × GALAXY_FOCUS_FACTOR)`, con `GALAXY_FOCUS_MIN_DISTANCE = 30` y `GALAXY_FOCUS_FACTOR = 1.1`.
  - Reutiliza `flightRef` y `FLIGHT_LERP`.
- **Reduced motion.** Se lee con `matchMedia('(prefers-reduced-motion: reduce)')` en el hook, con listener de `change` guardado en un ref.

## Implementation plan

1. Crear `src/lib/galaxy/galaxyHighlight.ts` con `Emphasis`, `resolveActiveGalaxies`, `courseEmphasis` y `resolveIntensifiedNebula`. Todavía no se usa. Comprobar que `npx tsc --noEmit` pasa.
2. En `useGalaxyScene.ts`:

   - Exportar `CourseNode` y añadirle `baseOpacity` y `baseEmissive`.
   - Poner `transparent: true` en el material del core.
   - Guardar las nebulosas en `nebulaeRef: Map<string, NebulaNode>` dentro del effect de nodos, y vaciarlo en el cleanup.

   La escena se ve igual que antes.
3. En el loop de animación del hook, sustituir el lerp de escala por uno que también interpole opacity y emissive del core, halo, anillo y light, según `courseEmphasis`. También se interpolan opacity y escala de cada nebulosa.

   El set activo se recalcula solo cuando cambian el hover o el foco, en una variable del closure, no en cada frame. En este paso solo el hover lo alimenta.

   Prueba manual: hover sobre una estrella resalta su galaxia y atenúa el resto, con transición suave.
4. Añadir `focusedGalaxyKey` y `onFocusGalaxy` a `UseGalaxySceneOptions`:

   - El hook lee el foco por ref, y `resolveActiveGalaxies` da prioridad al foco.
   - En `StarMap3D.tsx`, añadir el estado `focusedGalaxyKey` y pasarlo al hook.
   - Si `galaxies` deja de contener la key enfocada, se resetea a `null`.
5. Añadir el picking de nebulosas en `pointerup` y en `pointermove`:

   - `pointerup` sobre una nebulosa (sin estrella) llama a `onFocusGalaxy(key)`.
   - `pointerup` sin estrella ni nebulosa llama a `onFocusGalaxy(null)`.
   - `pointermove` sobre una nebulosa cambia el cursor a `pointer`.

   Añadir `flyToGalaxy(key)` y un effect sobre `[focusedGalaxyKey]` que lo llama cuando la key no es nula.

   Prueba manual: click en una nebulosa hace zoom y atenúa las demás galaxias. Click en el vacío quita el foco.
6. En `StarMap3D.tsx`:

   - Convertir los `<li>` de la leyenda en `<button aria-pressed>`, que hacen toggle de `focusedGalaxyKey`.
   - Atenuar (`opacity-50`) las galaxias no enfocadas.
   - Añadir un listener de `keydown` para `Esc`, que pone el foco a `null` y cierra el panel.
   - Hacer que `handleResetCamera` también limpie el foco.
   - Hacer que `handleNavigate` también limpie el foco, para que el curso destino nunca quede atenuado.
7. Detectar reduced motion en el hook (`reducedMotionRef` + listener). Si está activo, `flyToNode` y `flyToGalaxy` copian la posición final sin animación.
8. Crear `src/lib/galaxy/relationLines.ts` con `createRelationLines`, que en esta fase solo tiene las líneas:

   - `Line2` + `LineGeometry` + `LineMaterial`, una por slug resoluble.
   - Grosor según la convención.
   - Rojo sólido para los prerequisitos y azul con `dashed: true` para los relacionados.
   - Puntos locales al `group`.
   - `setResolution`, `setIntensity` y `dispose`.

   En el hook, reemplazar `makeLinks` y `LineSegments` por `createRelationLines` para el hover. También hay que actualizar la resolución en `resize`.

   Prueba manual: las líneas tienen grosor distinto y los relacionados se ven punteados.
9. Añadir a `RelationLines.update` las animaciones:

   - crecimiento del `group` de 0 a 1;
   - desplazamiento de `dashOffset`;
   - sprite de pulso.

   Con `reducedMotion` todo arranca en su estado final. Llamar a `update` desde el loop del hook.
10. Añadir las partículas de prerequisitos a `RelationLines`. Van en un solo `THREE.Points` con `BufferGeometry` y `Float32Array` preasignado. Cada frame se escriben posiciones y se pone `needsUpdate = true`, sin crear objetos por frame. No se crean si `reducedMotion` está activo.
11. Añadir las líneas persistentes del curso seleccionado, con dos slots en el hook: `hoverLines` y `selectedLines`.

    - `selectedLines` se crea con `SELECTED_LINE_INTENSITY` cuando cambia `selectedId`, y se recrea tras el rebuild de nodos si el curso sigue existiendo.
    - Si el curso en hover es el seleccionado, no se crea `hoverLines` y `selectedLines` sube a intensidad 1 mientras dura el hover.
    - Ambos slots se liberan con `dispose()` en el cleanup y en cada rebuild.
12. Suavizar el tono de las esferas en el effect de nodos de `useGalaxyScene.ts`:

    - `baseEmissive` pasa a 0.6 en los cursos activos;
    - core, halo y anillo usan el color mezclado un 40 % hacia `STAR_TONE_GRAY`;
    - las nebulosas no se tocan.

    Prueba manual: las esferas se ven más tenues, pero cada una se sigue distinguiendo por el color de su galaxia.
13. Actualizar la documentación:

    - `docs/CHANGELOG.md`: entrada `2026-09-23` con secciones Añadido y Cambiado.
    - `docs/TASKS.md`: tareas completadas.
    - `docs/CONTEXT.md`: foco de galaxia, módulos `src/lib/galaxy/` y reduced motion.

## Acceptance criteria

- [ ] `npx tsc --noEmit` no reporta errores.
- [ ] `npm run lint` no reporta errores.
- [ ] `npm run build` pasa, y Three.js y `src/lib/galaxy/*` siguen en el chunk lazy de `StarMap3D`, no en el chunk principal.
- [ ] Ningún archivo nuevo o modificado usa `any`.
- [ ] `package.json` no tiene dependencias nuevas.
- [ ] `src/types/index.ts`, `CoursePanel.tsx`, `CourseLinks.tsx` y `CourseTooltip.tsx` no tienen cambios en el diff.
- [ ] `galaxyHighlight.ts` no importa `three` ni `react`.
- [ ] Hover sobre una estrella de "frontend": todas las estrellas con `frontend` en `galaxies[]` mantienen o suben su brillo, y las demás bajan a opacity ≤ 0.2. La transición dura más de 1 frame, sin salto instantáneo.
- [ ] Hover sobre el curso del mock que está en 2 galaxias resalta las estrellas de ambas galaxias. Solo se intensifica la nebulosa de `galaxies[0]`, que se ve más brillante y más grande que las demás.
- [ ] Al sacar el mouse, sin foco activo, todas las estrellas y nebulosas vuelven a su opacidad original con transición suave.
- [ ] Click en una nebulosa, sin estrella debajo: la cámara vuela hacia el centro de esa galaxia, y solo sus cursos quedan resaltados.
- [ ] Click sobre una estrella que está dentro de una nebulosa selecciona la estrella, no la galaxia.
- [ ] Click en la leyenda sobre una galaxia produce el mismo zoom y el mismo resaltado que el click en su nebulosa. El botón queda con `aria-pressed="true"` y las demás galaxias se ven atenuadas en la leyenda.
- [ ] Un segundo click en la misma galaxia de la leyenda quita el foco.
- [ ] Con foco activo, cada una de estas acciones quita el foco:
  - [ ] `Esc`;
  - [ ] el botón "Vista general";
  - [ ] un click en espacio vacío (no un arrastre).
- [ ] Arrastrar para rotar no cambia el foco.
- [ ] Con foco en "backend", hover sobre una estrella de "frontend" muestra tooltip y líneas, pero "frontend" sigue atenuada.
- [ ] Con búsqueda activa y foco en una galaxia, los cursos filtrados siguen fuera de la escena y el foco solo atenúa los visibles.
- [ ] Click en un prerequisito del panel limpia búsqueda, nivel y foco, y enfoca el curso.
- [ ] Las líneas de prerequisitos son rojas y tienen partículas que se mueven del curso en hover hacia el prerequisito.
- [ ] Las líneas de relacionados son azules, punteadas, y el dash se desplaza.
- [ ] En el curso del mock con 3 prerequisitos, la línea del primero se ve más gruesa que la del tercero. Cualquier prerequisito se ve más grueso que cualquier relacionado.
- [ ] Al entrar en hover, las líneas crecen desde el centro de la esfera y se ve un pulso expandiéndose una vez.
- [ ] Con un curso seleccionado (panel abierto) y el mouse fuera, sus líneas siguen visibles con menos brillo. Al hacer hover sobre él, suben a brillo completo.
- [ ] Al cerrar el panel desaparecen las líneas persistentes.
- [ ] Un prerequisito con slug inexistente sigue sin dibujar línea.
- [ ] Con `prefers-reduced-motion: reduce` emulado en DevTools:
  - no hay partículas;
  - el dash no se mueve;
  - no hay pulso;
  - el zoom a curso y a galaxia es instantáneo;
  - el resaltado y las líneas se siguen viendo.
- [ ] Mientras hay hover, React DevTools Profiler no registra renders de `StarMap3D` en cada frame. Solo hay commits al cambiar el curso en hover, el foco o la selección.
- [ ] Hover y deshover repetidos 50 veces no aumentan `renderer.info.memory.geometries` ni `renderer.info.memory.textures` respecto al valor inicial.
- [ ] Cambiar el filtro de nivel con foco y selección activos no deja líneas huérfanas en la escena.
- [ ] En un viewport de 390×844, un tap en una nebulosa enfoca la galaxia y la leyenda sigue oculta.
- [ ] `/`, `/login`, `/dashboard` y `/starmap` cargan sin errores en consola.
- [ ] Las esferas de los cursos activos usan un `emissiveIntensity` base de 0.6, y su color, el del halo y el del anillo están mezclados un 40 % hacia `#262626`. Se distinguen por galaxia y no se ven como neón. Las nebulosas se ven igual que antes.
- [ ] `docs/CHANGELOG.md`, `docs/TASKS.md` y `docs/CONTEXT.md` reflejan lo implementado.

## Decisions

- **Sí:** un solo spec para las cuatro partes. Comparten el estado de foco y el mismo loop de animación. El plan las separa en pasos independientes.
- **Sí:** `Line2` + `LineMaterial` de `three/addons`. Dan grosor en píxeles y dash nativo con `dashOffset` animable, y no añaden dependencias.
- **No:** `TubeGeometry`. Su grosor está en unidades del mundo, así que cambia con el zoom, tiene más vértices y el dash exige un shader propio.
- **No:** un `ShaderMaterial` propio para las líneas. Da más control, pero es más código que mantener sin una ganancia visible.
- **No:** `LineBasicMaterial.linewidth`. WebGL lo ignora y siempre dibuja 1px.
- **Sí:** la importancia se calcula por tipo y orden. Los prerequisitos son más gruesos que los relacionados, y dentro de cada lista el primer slug es el más grueso. Es determinista y no toca el contrato.
- **No:** grosor por número de dependientes. Requiere un índice inverso y cambia al filtrar.
- **No:** un campo `weight` en el contrato. Exige cambios en el backend, que todavía no expone el endpoint.
- **Sí:** las partículas van en un solo `THREE.Points` por juego de líneas, con `Float32Array` preasignado. Se hace una draw call y no se crean objetos por frame.
- **No:** un `Mesh` por partícula. Serían N draw calls y más presión en el GC.
- **Sí:** el crecimiento de las líneas se hace escalando el `group` anclado en el origen. No hay que reescribir buffers, y el grosor en píxeles de `Line2` no cambia con la escala.
- **Sí:** las partículas viajan del curso en hover al prerequisito, que es la dirección literal que pidió el usuario ("de origen a destino").
- **No:** invertir el sentido para que el flujo vaya del prerequisito al curso. Sería más fiel a la semántica, pero contradice lo pedido. Se puede revisar en otro spec.
- **Sí:** el foco manda sobre el hover. El hover sigue funcionando, pero no cambia qué galaxia está resaltada, así que el filtro elegido no parpadea al mover el mouse.
- **No:** que el hover mande temporalmente, ni bloquear el hover en galaxias atenuadas.
- **Sí:** la pertenencia cuenta en cualquier posición de `galaxies[]`. La nebulosa intensificada en hover es solo la de `galaxies[0]`.
- **No:** usar solo la galaxia principal. El curso compartido quedaría atenuado al enfocar su galaxia secundaria, aunque el anillo lo muestra como parte de ella.
- **Sí:** la leyenda y la nebulosa escriben el mismo `focusedGalaxyKey` y hacen el mismo zoom. Hay un solo camino de código.
- **Sí:** se sale del foco con la leyenda (toggle), `Esc`, "Vista general" o un click en espacio vacío.
- **Sí:** `focusedGalaxyKey` es estado de React, porque solo cambia con clicks. El hover sigue en variables del closure del loop, como en SPEC 02.
- **Sí:** el picking de nebulosas usa la distancia del rayo al centro con un radio (`0.3 × baseSize`), no el raycast del `Sprite`. El raycast del sprite usa su cuadrado completo, que es mucho más grande que el brillo visible y se solapa entre galaxias.
- **Sí:** la estrella tiene prioridad sobre la nebulosa en el picking.
- **Sí:** las líneas del curso seleccionado persisten con brillo reducido. Encaja con el panel, que lista prerequisitos y relacionados.
- **Sí:** la búsqueda y el nivel se combinan con el foco. Los filtros quitan cursos y el foco atenúa los que quedan.
- **No:** limpiar los filtros al enfocar una galaxia.
- **Sí:** `handleNavigate` también limpia el foco. Extiende la decisión de SPEC 02 de que el curso destino siempre sea visible.
- **Sí:** se respeta `prefers-reduced-motion`. Se quita solo el movimiento; la información visual se mantiene.
- **Sí:** el código nuevo va en `src/lib/galaxy/`: `galaxyHighlight.ts` (puro) y `relationLines.ts` (imperativo). `useGalaxyScene.ts` ya tiene 716 líneas.
- **No:** meter todo en el hook, ni sub-hooks en `src/hooks/galaxy/`. Los sub-hooks compartirían la escena por refs sin aportar nada a la reactividad.
- **No:** leyenda en móvil. Queda para otro spec; en móvil se enfoca con un tap en la nebulosa.
- **Sí:** los materiales del core pasan a `transparent: true` siempre, para poder interpolar la opacidad.
- **Sí:** se suaviza el tono de las esferas (`baseEmissive` 0.6 y color mezclado un 40 % hacia gris oscuro, también en el halo y el anillo). Se añadió al spec antes de cerrarlo, a petición del usuario, porque se veían saturadas y con aspecto de neón. Los factores de resaltado se aplican sobre la nueva base.
- **No:** tocar las nebulosas, la point light ni el color de las líneas, que siguen usando el `galaxyColor` original.

## Risks

| Riesgo                                                                                                           | Mitigación                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Las esferas transparentes se ordenan mal entre sí y aparecen parpadeos o esferas atenuadas por delante de otras | Mantener`depthWrite: true` en el core. Si hay artefactos, subir `renderOrder` de los cores resaltados.                                                   |
| `LineMaterial` sin `resolution` actualizada dibuja líneas deformadas tras un resize                         | `setResolution` se llama en el `ResizeObserver` para `hoverLines` y `selectedLines`, y al crearlas.                                                  |
| Fugas de GPU al crear y destruir líneas en cada hover                                                           | `RelationLines.dispose()` libera geometrías y materiales de las líneas, las partículas y el pulso. El criterio de `renderer.info.memory` lo verifica. |
| Un pick de nebulosa accidental al intentar clicar una estrella pequeña                                          | La estrella siempre tiene prioridad y el radio de la nebulosa es solo el 30% de su tamaño.                                                                  |
| Un click en espacio vacío quita el foco sin querer                                                              | Solo cuenta un click con menos de`CLICK_TOLERANCE_PX` de desplazamiento. Arrastrar no afecta.                                                              |
| La galaxia enfocada desaparece al cambiar los datos (p. ej. al pasar de demo a real)                             | `StarMap3D` deriva en render `activeFocusKey`, que es `null` si la key no está en `galaxies`. Se evita un `setState` dentro de un effect, que la regla `react-hooks/set-state-in-effect` prohíbe. |
| Coste por frame de lerps de materiales con muchos cursos                                                         | Son O(n) asignaciones numéricas sin allocations. El set activo solo se recalcula cuando cambian el hover o el foco.                                         |

## What is **not** in this spec

- Leyenda visible en móvil.
- Campo de peso o importancia en el contrato del backend.
- Resaltado de la nebulosa por hover (solo cambia el cursor).
- Mostrar todas las relaciones del grafo a la vez.
- Persistir el foco en la URL o en `localStorage`.
- Cambios en `CoursePanel.tsx`, `CourseLinks.tsx`, `CourseTooltip.tsx` y `src/types/index.ts`.
- Reescritura en React Three Fiber.

Cada uno de estos, si se implementa, va en su propio spec.
