import * as THREE from 'three'
import type { CourseLevel } from '@/types'
import { hashString } from '@/lib/galaxy/hash'

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

// Multiplicador del emissive base por galaxia: ai-ml luminoso, mobile frío y brillante, devops cálido, fundamentals dorado suave
export const GALAXY_EMISSIVE: Record<string, number> = {
  'ai-ml': 1.4,
  mobile: 1.3,
  devops: 1.2,
  fundamentals: 0.9,
}

// Opacity base de la atmósfera por galaxia (0.24–0.36)
export const GALAXY_ATMOSPHERE: Record<string, number> = {
  'ai-ml': 0.36,
  mobile: 0.34,
  devops: 0.32,
  fundamentals: 0.24,
}

export const LEVEL_RADIUS: Record<CourseLevel, number> = { beginner: 0.3, intermediate: 0.5, advanced: 0.7 }

const LEVELS = Object.keys(LEVEL_RADIUS) as CourseLevel[]

// Textura de superficie equirectangular: u = longitud, v = latitud
const SURFACE_WIDTH = 512
const SURFACE_HEIGHT = 256
const AURA_TEXTURE_SIZE = 128
const ATMOSPHERE_TEXTURE_SIZE = 128
const DEFAULT_GALAXY_EMISSIVE = 1
const DEFAULT_ATMOSPHERE_OPACITY = 0.3
const CORE_SEGMENTS = 32
// Anillo de segunda galaxia (SPEC 02)
const RING_INNER_FACTOR = 1.9
const RING_OUTER_FACTOR = 2.05
const RING_SEGMENTS = 64
// Órbita de los avanzados: fuera del anillo (2.05) y dentro del borde del aura (2.5)
const ORBIT_RADIUS_FACTOR = 2.3
const ORBIT_POINTS = 128
// Anillo decorativo: más fino que el de segunda galaxia y dentro de la atmósfera (2.0)
const DECOR_RING_INNER_FACTOR = 1.55
const DECOR_RING_OUTER_FACTOR = 1.6
const PLANET_MAX_TILT = 0.4
// Contraste de la superficie por curso: 1 ± SURFACE_CONTRAST_RANGE, alrededor de un pivote lineal (~0.54 sRGB)
const SURFACE_CONTRAST_RANGE = 0.15
// Rotación máxima del hue del aura por curso, en grados
const AURA_HUE_RANGE = 30
const SURFACE_CONTRAST_PIVOT = 0.25
const SURFACE_CONTRAST_PROGRAM_KEY = 'planet-surface-contrast'
const ORBIT_MAX_TILT = 0.6

export interface PlanetAssets {
  surfaceTexture: (pattern: PlanetPattern) => THREE.CanvasTexture // lazy + caché
  auraTexture: THREE.CanvasTexture
  atmosphereTexture: THREE.CanvasTexture
  coreGeometry: (level: CourseLevel) => THREE.SphereGeometry
  ringGeometry: (level: CourseLevel) => THREE.RingGeometry
  orbitGeometry: (level: CourseLevel) => THREE.BufferGeometry
  decorRingGeometry: (level: CourseLevel) => THREE.RingGeometry
  dispose: () => void // libera todas las texturas y geometrías creadas
}

// 'noise' si la key no está en GALAXY_PATTERN o es undefined
export function patternForGalaxy(key: string | undefined): PlanetPattern {
  if (key === undefined) return 'noise'
  return Object.hasOwn(GALAXY_PATTERN, key) ? GALAXY_PATTERN[key] : 'noise'
}

// 1 si la key no está en GALAXY_EMISSIVE o es undefined
export function emissiveForGalaxy(key: string | undefined): number {
  if (key === undefined) return DEFAULT_GALAXY_EMISSIVE
  return Object.hasOwn(GALAXY_EMISSIVE, key) ? GALAXY_EMISSIVE[key] : DEFAULT_GALAXY_EMISSIVE
}

// 0.30 si la key no está en GALAXY_ATMOSPHERE o es undefined
export function atmosphereOpacityForGalaxy(key: string | undefined): number {
  if (key === undefined) return DEFAULT_ATMOSPHERE_OPACITY
  return Object.hasOwn(GALAXY_ATMOSPHERE, key) ? GALAXY_ATMOSPHERE[key] : DEFAULT_ATMOSPHERE_OPACITY
}

export function planetOrientation(courseId: string): { spin: number; tilt: number } {
  return {
    spin: hashString(courseId, 6) * Math.PI * 2,
    tilt: (hashString(courseId, 7) - 0.5) * 2 * PLANET_MAX_TILT,
  }
}

export function orbitOrientation(courseId: string): { tilt: number; azimuth: number } {
  return {
    tilt: (hashString(courseId, 4) - 0.5) * 2 * ORBIT_MAX_TILT,
    azimuth: hashString(courseId, 5) * Math.PI * 2,
  }
}

// Rota el hue de baseColor ±AURA_HUE_RANGE grados según el curso (semilla 8). Devuelve un color nuevo.
export function auraColor(baseColor: THREE.Color, courseId: string): THREE.Color {
  const hueShift = (hashString(courseId, 8) - 0.5) * 2 * AURA_HUE_RANGE
  return baseColor.clone().offsetHSL(hueShift / 360, 0, 0)
}

// Variación por curso sin texturas extra: espejo (semilla 9) y contraste (semilla 10)
export function surfaceVariant(courseId: string): { mirrored: boolean; contrast: number } {
  return {
    mirrored: hashString(courseId, 9) < 0.5,
    contrast: 1 + (hashString(courseId, 10) - 0.5) * 2 * SURFACE_CONTRAST_RANGE,
  }
}

// Clon espejado en horizontal. Three.js reutiliza la WebGLTexture del original porque comparten
// source y parámetros (offset y repeat no cuentan). El llamador lo libera.
export function mirrorSurfaceTexture(texture: THREE.CanvasTexture): THREE.CanvasTexture {
  const mirrored = texture.clone()
  mirrored.repeat.x = -1
  mirrored.offset.x = 1
  return mirrored
}

// Aplica el contraste al texel de map y emissiveMap. La clave de programa fija hace que todos los
// cores compartan un único shader; solo cambia el uniform por material.
export function applySurfaceContrast(material: THREE.MeshStandardMaterial, contrast: number): void {
  const contrastLine = (texel: string) =>
    `${texel}.rgb = clamp( ( ${texel}.rgb - ${SURFACE_CONTRAST_PIVOT.toFixed(2)} ) * uSurfaceContrast + ${SURFACE_CONTRAST_PIVOT.toFixed(2)}, 0.0, 1.0 );`
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSurfaceContrast = { value: contrast }
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uSurfaceContrast;')
      .replace(
        '#include <map_fragment>',
        THREE.ShaderChunk.map_fragment.replace(
          'diffuseColor *= sampledDiffuseColor;',
          `${contrastLine('sampledDiffuseColor')}\n\tdiffuseColor *= sampledDiffuseColor;`,
        ),
      )
      .replace(
        '#include <emissivemap_fragment>',
        THREE.ShaderChunk.emissivemap_fragment.replace(
          'totalEmissiveRadiance *= emissiveColor.rgb;',
          `${contrastLine('emissiveColor')}\n\ttotalEmissiveRadiance *= emissiveColor.rgb;`,
        ),
      )
  }
  material.customProgramCacheKey = () => SURFACE_CONTRAST_PROGRAM_KEY
}

// Semillas propias (11 y 12) para que no coincida con la órbita
export function decorRingOrientation(courseId: string): { tilt: number; azimuth: number } {
  return {
    tilt: (hashString(courseId, 11) - 0.5) * 2 * ORBIT_MAX_TILT,
    azimuth: hashString(courseId, 12) * Math.PI * 2,
  }
}

// PRNG determinista de 32 bits
function mulberry32(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Value noise con periodo horizontal = 1 en u, para que la textura case en el borde izquierdo/derecho
function createPeriodicNoise(rand: () => number, cellsX: number, cellsY: number): (u: number, v: number) => number {
  const lattice = new Float32Array(cellsX * (cellsY + 1))
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand()
  const at = (ix: number, iy: number) => lattice[iy * cellsX + (((ix % cellsX) + cellsX) % cellsX)]
  const smooth = (t: number) => t * t * (3 - 2 * t)
  return (u, v) => {
    const x = u * cellsX
    const y = v * cellsY
    const x0 = Math.floor(x)
    const y0 = Math.min(Math.floor(y), cellsY - 1)
    const tx = smooth(x - x0)
    const ty = smooth(y - y0)
    const top = at(x0, y0) + (at(x0 + 1, y0) - at(x0, y0)) * tx
    const bottom = at(x0, y0 + 1) + (at(x0 + 1, y0 + 1) - at(x0, y0 + 1)) * tx
    return top + (bottom - top) * ty
  }
}

// fbm normalizado a [0, 1]; cada octava duplica la frecuencia y conserva el periodo horizontal
function createFbm(rand: () => number, cellsX: number, cellsY: number, octaves: number): (u: number, v: number) => number {
  const layers: Array<(u: number, v: number) => number> = []
  for (let o = 0; o < octaves; o++) layers.push(createPeriodicNoise(rand, cellsX << o, cellsY << o))
  const weights = layers.map((_, o) => 0.5 ** o)
  const norm = weights.reduce((total, weight) => total + weight, 0)
  return (u, v) => {
    let sum = 0
    for (let o = 0; o < octaves; o++) sum += layers[o](u, v) * weights[o]
    return sum / norm
  }
}

type SurfacePainter = (ctx: CanvasRenderingContext2D, rand: () => number) => void

// Escribe un campo de brillo [0, 1] en escala de grises sobre todo el canvas
function fillGray(ctx: CanvasRenderingContext2D, brightness: (u: number, v: number) => number): void {
  const image = ctx.createImageData(SURFACE_WIDTH, SURFACE_HEIGHT)
  const { data } = image
  for (let y = 0; y < SURFACE_HEIGHT; y++) {
    const v = y / SURFACE_HEIGHT
    for (let x = 0; x < SURFACE_WIDTH; x++) {
      const value = Math.round(THREE.MathUtils.clamp(brightness(x / SURFACE_WIDTH, v), 0, 1) * 255)
      const i = (y * SURFACE_WIDTH + x) * 4
      data[i] = value
      data[i + 1] = value
      data[i + 2] = value
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
}

const TAU = Math.PI * 2
const CIRCUIT_GRID = 16
const CRYSTAL_SEEDS = 48
const AURA_MOTES = 60

const smoothstep = (x: number, min: number, max: number) => THREE.MathUtils.smoothstep(x, min, max)

function gray(value: number): string {
  const channel = Math.round(THREE.MathUtils.clamp(value, 0, 1) * 255)
  return `rgb(${channel},${channel},${channel})`
}

// Dibuja una primitiva también desplazada ±ancho para que lo que cruza el borde case al envolver la esfera
function drawWrapped(draw: (offsetX: number) => void): void {
  for (const offsetX of [-SURFACE_WIDTH, 0, SURFACE_WIDTH]) draw(offsetX)
}

// Ruido fbm suave: fallback genérico
const paintNoise: SurfacePainter = (ctx, rand) => {
  const fbm = createFbm(rand, 8, 4, 5)
  fillGray(ctx, (u, v) => 0.25 + 0.75 * fbm(u, v))
}

// Pistas ortogonales con pads y bloques tipo chip sobre una base oscura
const paintCircuit: SurfacePainter = (ctx, rand) => {
  const base = createFbm(rand, 16, 8, 3)
  fillGray(ctx, (u, v) => 0.28 + 0.1 * base(u, v))

  const cols = SURFACE_WIDTH / CIRCUIT_GRID
  const rows = SURFACE_HEIGHT / CIRCUIT_GRID
  const cell = (n: number) => n * CIRCUIT_GRID
  const randInt = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1))

  ctx.lineCap = 'square'
  for (let t = 0; t < 70; t++) {
    const points: Array<[number, number]> = [[randInt(0, cols - 1), randInt(1, rows - 2)]]
    let horizontal = rand() < 0.5
    const segments = randInt(3, 6)
    for (let i = 0; i < segments; i++) {
      const [x, y] = points[points.length - 1]
      const length = randInt(1, 5) * (rand() < 0.5 ? -1 : 1)
      points.push(horizontal ? [x + length, y] : [x, THREE.MathUtils.clamp(y + length, 1, rows - 2)])
      horizontal = !horizontal
    }
    const [startX, startY] = points[0]
    const [endX, endY] = points[points.length - 1]
    drawWrapped((dx) => {
      ctx.strokeStyle = gray(0.85)
      ctx.lineWidth = 2
      ctx.beginPath()
      points.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(cell(x) + dx, cell(y)) : ctx.lineTo(cell(x) + dx, cell(y))))
      ctx.stroke()
      ctx.fillStyle = gray(1)
      for (const [x, y] of [[startX, startY], [endX, endY]]) {
        ctx.beginPath()
        ctx.arc(cell(x) + dx, cell(y), 3, 0, TAU)
        ctx.fill()
      }
    })
  }

  for (let c = 0; c < 10; c++) {
    const w = cell(randInt(3, 5))
    const h = cell(randInt(2, 3))
    const x = cell(randInt(0, cols - 1))
    const y = cell(randInt(2, rows - 5))
    drawWrapped((dx) => {
      ctx.fillStyle = gray(0.55)
      ctx.fillRect(x + dx, y, w, h)
      ctx.strokeStyle = gray(0.95)
      ctx.lineWidth = 1.5
      ctx.strokeRect(x + dx, y, w, h)
      // Patas del chip en los lados largos
      ctx.strokeStyle = gray(0.8)
      ctx.lineWidth = 1
      ctx.beginPath()
      for (let px = x + 4; px < x + w - 2; px += 6) {
        ctx.moveTo(px + dx, y)
        ctx.lineTo(px + dx, y - 4)
        ctx.moveTo(px + dx, y + h)
        ctx.lineTo(px + dx, y + h + 4)
      }
      ctx.stroke()
    })
  }
}

// Bandas onduladas con gradiente suave hacia el ecuador
const paintOcean: SurfacePainter = (ctx, rand) => {
  const warp = createFbm(rand, 4, 2, 4)
  const detail = createFbm(rand, 16, 8, 3)
  fillGray(ctx, (u, v) => {
    const band = 0.5 + 0.5 * Math.sin(TAU * v * 7 + warp(u, v) * 5 + Math.sin(TAU * u * 2) * 0.8)
    const equator = 1 - Math.abs(2 * v - 1)
    return 0.3 + 0.45 * band + 0.15 * detail(u, v) + 0.1 * equator
  })
}

// fbm de alto contraste con manchas oscuras
const paintRock: SurfacePainter = (ctx, rand) => {
  const fbm = createFbm(rand, 8, 4, 6)
  const spots = createFbm(rand, 5, 3, 4)
  fillGray(ctx, (u, v) => {
    const contrast = smoothstep(fbm(u, v), 0.3, 0.7)
    const spot = smoothstep(spots(u, v), 0.58, 0.68)
    return 0.25 + 0.75 * contrast * (1 - 0.7 * spot)
  })
}

// Dunas diagonales asimétricas con grano fino; el coeficiente entero de u mantiene el periodo horizontal
const paintSand: SurfacePainter = (ctx, rand) => {
  const warp = createFbm(rand, 4, 2, 4)
  fillGray(ctx, (u, v) => {
    const w = warp(u, v)
    const phase = 6 * u + 4 * v + w * 0.6
    const d = phase - Math.floor(phase)
    const dune = d < 0.7 ? d / 0.7 : (1 - d) / 0.3
    return 0.4 + 0.35 * dune + 0.12 * w + (rand() - 0.5) * 0.12
  })
}

// Superficie lisa cepillada con franjas de reflejo brillante
const paintMetal: SurfacePainter = (ctx, rand) => {
  const base = createFbm(rand, 4, 2, 3)
  const brushed = createPeriodicNoise(rand, 2, 128)
  const stripes = Array.from({ length: 5 }, () => ({
    center: 0.15 + rand() * 0.7,
    width: 0.01 + rand() * 0.04,
    strength: 0.3 + rand() * 0.3,
    phase: rand() * TAU,
  }))
  fillGray(ctx, (u, v) => {
    let value = 0.4 + 0.1 * base(u, v) + 0.05 * brushed(u, v)
    for (const { center, width, strength, phase } of stripes) {
      const offset = (v - center + 0.01 * Math.sin(TAU * u * 3 + phase)) / width
      value += strength * Math.exp(-offset * offset)
    }
    return value
  })
}

// Base oscura con grietas brillantes en las curvas de nivel del ruido
const paintVolcanic: SurfacePainter = (ctx, rand) => {
  const base = createFbm(rand, 6, 3, 5)
  const cracks = createFbm(rand, 5, 3, 5)
  fillGray(ctx, (u, v) => {
    const ridge = 1 - Math.abs(2 * cracks(u, v) - 1)
    const glow = smoothstep(ridge, 0.75, 0.95) * 0.25
    const crack = smoothstep(ridge, 0.9, 0.98)
    return 0.15 + 0.08 * base(u, v) + glow + crack * 0.85
  })
}

// Facetas de Voronoi con brillo plano y bordes claros; la distancia en x envuelve para casar el borde
const paintCrystal: SurfacePainter = (ctx, rand) => {
  const seeds = Array.from({ length: CRYSTAL_SEEDS }, () => ({
    x: rand() * SURFACE_WIDTH,
    y: rand() * SURFACE_HEIGHT,
    shade: 0.35 + rand() * 0.55,
  }))
  fillGray(ctx, (u, v) => {
    const x = u * SURFACE_WIDTH
    const y = v * SURFACE_HEIGHT
    let nearest = Infinity
    let second = Infinity
    let shade = 0
    for (const seed of seeds) {
      const rawDx = Math.abs(x - seed.x)
      const dx = Math.min(rawDx, SURFACE_WIDTH - rawDx)
      const dy = y - seed.y
      // Distancias al cuadrado en el bucle; la raíz solo al final
      const distance = dx * dx + dy * dy
      if (distance < nearest) {
        second = nearest
        nearest = distance
        shade = seed.shade
      } else if (distance < second) {
        second = distance
      }
    }
    const edge = 1 - smoothstep(Math.sqrt(second) - Math.sqrt(nearest), 1, 3)
    return THREE.MathUtils.lerp(shade, 0.97, edge)
  })
}

const PATTERN_PAINTERS: Record<PlanetPattern, SurfacePainter> = {
  circuit: paintCircuit,
  ocean: paintOcean,
  rock: paintRock,
  sand: paintSand,
  metal: paintMetal,
  volcanic: paintVolcanic,
  crystal: paintCrystal,
  noise: paintNoise,
}

function makeSurfaceTexture(pattern: PlanetPattern): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = SURFACE_WIDTH
  canvas.height = SURFACE_HEIGHT
  const ctx = canvas.getContext('2d')
  if (ctx) PATTERN_PAINTERS[pattern](ctx, mulberry32(hashString(pattern, 0) * 0xffffffff))
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  return texture
}

function makeAuraTexture(): THREE.CanvasTexture {
  const size = AURA_TEXTURE_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    // Se desvanece antes del borde para que el sprite no muestre un corte cuadrado
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2 - 1)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.4, 'rgba(255,255,255,0.45)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
    // Motas de polvo; su alpha cae con la distancia para que tampoco lleguen al borde
    const rand = mulberry32(hashString('aura', 0) * 0xffffffff)
    for (let i = 0; i < AURA_MOTES; i++) {
      const angle = rand() * TAU
      const distance = Math.sqrt(rand()) * size * 0.42
      const alpha = rand() * (1 - distance / (size * 0.45))
      const moteSize = rand() < 0.5 ? 1 : 2
      ctx.fillStyle = `rgba(255,255,255,${alpha.toFixed(3)})`
      ctx.fillRect(size / 2 + Math.cos(angle) * distance, size / 2 + Math.sin(angle) * distance, moteSize, moteSize)
    }
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

// Máximo en el limbo del planeta (1 / ATMOSPHERE_RADIUS_FACTOR = 0.5 del radio del sprite) y desvanecido antes del borde
function makeAtmosphereTexture(): THREE.CanvasTexture {
  const size = ATMOSPHERE_TEXTURE_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2 - 1)
    grad.addColorStop(0, 'rgba(255,255,255,0.6)')
    grad.addColorStop(0.5, 'rgba(255,255,255,1)')
    grad.addColorStop(0.8, 'rgba(255,255,255,0.25)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function makeOrbitGeometry(radius: number): THREE.BufferGeometry {
  const positions = new Float32Array(ORBIT_POINTS * 3)
  for (let i = 0; i < ORBIT_POINTS; i++) {
    const angle = (i / ORBIT_POINTS) * Math.PI * 2
    positions[i * 3] = Math.cos(angle) * radius
    positions[i * 3 + 2] = Math.sin(angle) * radius
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  return geometry
}

function byLevel<T>(build: (radius: number) => T): Record<CourseLevel, T> {
  const result = {} as Record<CourseLevel, T>
  for (const level of LEVELS) result[level] = build(LEVEL_RADIUS[level])
  return result
}

// Recursos compartidos por todos los planetas; viven con la escena, no con el rebuild de nodos
export function createPlanetAssets(): PlanetAssets {
  const surfaces = new Map<PlanetPattern, THREE.CanvasTexture>()
  const auraTexture = makeAuraTexture()
  const atmosphereTexture = makeAtmosphereTexture()
  const cores = byLevel((r) => new THREE.SphereGeometry(r, CORE_SEGMENTS, CORE_SEGMENTS))
  const rings = byLevel((r) => new THREE.RingGeometry(r * RING_INNER_FACTOR, r * RING_OUTER_FACTOR, RING_SEGMENTS))
  const orbits = byLevel((r) => makeOrbitGeometry(r * ORBIT_RADIUS_FACTOR))
  const decorRings = byLevel((r) => new THREE.RingGeometry(r * DECOR_RING_INNER_FACTOR, r * DECOR_RING_OUTER_FACTOR, RING_SEGMENTS))

  return {
    surfaceTexture: (pattern) => {
      let texture = surfaces.get(pattern)
      if (!texture) {
        texture = makeSurfaceTexture(pattern)
        surfaces.set(pattern, texture)
      }
      return texture
    },
    auraTexture,
    atmosphereTexture,
    coreGeometry: (level) => cores[level],
    ringGeometry: (level) => rings[level],
    orbitGeometry: (level) => orbits[level],
    decorRingGeometry: (level) => decorRings[level],
    dispose: () => {
      surfaces.forEach((texture) => texture.dispose())
      surfaces.clear()
      auraTexture.dispose()
      atmosphereTexture.dispose()
      for (const level of LEVELS) {
        cores[level].dispose()
        rings[level].dispose()
        orbits[level].dispose()
        decorRings[level].dispose()
      }
    },
  }
}
