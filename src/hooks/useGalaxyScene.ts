import { useCallback, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import type { CourseLevel, Galaxy, GalaxyCourse } from '@/types'
import { courseEmphasis, resolveActiveGalaxies, resolveIntensifiedNebula } from '@/lib/galaxy/galaxyHighlight'
import type { Emphasis } from '@/lib/galaxy/galaxyHighlight'
import { createRelationLines, SELECTED_LINE_INTENSITY } from '@/lib/galaxy/relationLines'
import type { RelationLines } from '@/lib/galaxy/relationLines'

export interface UseGalaxySceneOptions {
  containerRef: React.RefObject<HTMLDivElement | null>
  canvasRef: React.RefObject<HTMLCanvasElement | null>
  tooltipRef: React.RefObject<HTMLDivElement | null>
  galaxies: Galaxy[]
  courses: GalaxyCourse[]
  selectedId: string | null // slug del curso seleccionado
  onHover: (slug: string | null) => void
  onSelect: (slug: string) => void
  focusedGalaxyKey: string | null
  onFocusGalaxy: (key: string | null) => void // click en nebulosa (key) o en espacio vacío (null)
}

export interface UseGalaxySceneResult {
  isSupported: boolean
  resetCamera: () => void
  focusCourse: (slug: string) => void
}

interface CameraFlight {
  target: THREE.Vector3
  position: THREE.Vector3
}

interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  setHovered: (slug: string | null) => void
  refreshEmphasis: () => void
  refreshSelectedLines: () => void
  clearSelectedLines: () => void
}

export interface CourseNode {
  course: GalaxyCourse
  group: THREE.Group
  core: THREE.Mesh
  halo: THREE.Mesh | null
  ring: THREE.Mesh | null
  light: THREE.PointLight | null
  baseRadius: number
  baseOpacity: number // 1 o INACTIVE_OPACITY
  baseEmissive: number // ACTIVE_EMISSIVE o INACTIVE_EMISSIVE
}

interface NebulaNode {
  galaxy: Galaxy
  sprite: THREE.Sprite
  material: THREE.SpriteMaterial
  baseSize: number
}

// Escala del mundo: los cursos del contrato llegan hasta ~±70 unidades del origen.
const WORLD_SCALE = 3
const CAMERA_HOME = new THREE.Vector3(0, 45, 130)
const STAR_COUNT = 2500
const SHOOTING_STAR_COUNT = 4
const LEVEL_RADIUS: Record<CourseLevel, number> = { beginner: 1.15, intermediate: 1.55, advanced: 2.0 }
const INACTIVE_OPACITY = 0.35
const ACTIVE_EMISSIVE = 0.5
const INACTIVE_EMISSIVE = 0.3
const PLANET_COLORS = ['#35d07f', '#ef5350', '#ff9f43', '#4d9fff', '#a66cff', '#22d3c5', '#f4d35e', '#f472b6']
// Distancia al centro de la galaxia para cursos sin coordenadas
const FALLBACK_MIN_DISTANCE = 4
const FALLBACK_MAX_DISTANCE = 12
const NEBULA_OPACITY = 0.35
const NEBULA_MIN_SIZE = 30
// Diámetro de la nebulosa respecto a la distancia máxima de sus cursos al centro
const NEBULA_SIZE_FACTOR = 2.8
const HOVER_SCALE = 1.35
const TOOLTIP_OFFSET_PX = 14
const SELECTED_SCALE = 1.2
// Movimiento máximo entre pointerdown y pointerup para contar como click o tap
const CLICK_TOLERANCE_PX = 6
const FOCUS_DISTANCE = 14
const FLIGHT_LERP = 0.08
const HALO_OPACITY = 0.35
const RING_OPACITY = 0.8
const LIGHT_INTENSITY = 2.5
const LIGHT_HOVER_INTENSITY = 6
// Resaltado de galaxia: interpolación por frame hacia los valores de cada Emphasis
const EMPHASIS_LERP = 0.1
const DIMMED_OPACITY = 0.2
const EMPHASIS_EMISSIVE: Record<Emphasis, number> = { neutral: 1, highlighted: 1.4, dimmed: 0.3 }
// Halo, anillo y point light
const EMPHASIS_GLOW: Record<Emphasis, number> = { neutral: 1, highlighted: 1.3, dimmed: 0.2 }
const NEBULA_INTENSIFIED_OPACITY = 0.6
const NEBULA_INTENSIFIED_SCALE = 1.25
const NEBULA_DIMMED_OPACITY = 0.12
// Radio clicable de la nebulosa respecto a su tamaño: el brillo visible es mucho menor que el sprite
const NEBULA_HIT_FACTOR = 0.3
const GALAXY_FOCUS_MIN_DISTANCE = 30
const GALAXY_FOCUS_FACTOR = 1.1
const GALAXY_SPREAD = 2.2

const nebulaVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.9999, 1.0);
  }
`

const nebulaFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform vec3 uColorC;
  uniform vec3 uColorD;
  varying vec2 vUv;

  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
  }

  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec2 uv = vUv * 2.0 - 1.0;
    float dist = length(uv);

    float n = fbm(uv * 1.6 + vec2(uTime * 0.03, uTime * 0.02));
    float swirl = sin(dist * 3.5 - uTime * 0.08 + n * 2.5);

    float mask = smoothstep(1.3, 0.15, dist);
    vec3 mixedNebula = mix(uColorA, uColorB, n + swirl * 0.25);
    vec3 finalColor = mix(uColorC, mixedNebula, mask * (n * 0.8 + 0.25));

    // Luz volumétrica cálida en la esquina superior izquierda
    float warm = pow(clamp((1.0 - vUv.x) * vUv.y, 0.0, 1.0), 1.5) * 1.6;
    finalColor += uColorD * warm * (0.6 + 0.4 * n);

    // Parcialmente transparente para que se vea la aurora detrás
    float alpha = clamp(0.45 + mask * (n * 0.8 + 0.25), 0.0, 1.0);
    gl_FragColor = vec4(finalColor, alpha);
  }
`

const auroraVertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.99995, 1.0);
  }
`

const auroraFragmentShader = `
  uniform float uTime;
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  varying vec2 vUv;

  void main() {
    float wave = sin(vUv.x * 4.0 + uTime * 0.3) * 0.5 + sin(vUv.y * 3.0 - uTime * 0.2) * 0.5;
    float t = 0.5 + 0.5 * sin(uTime * 0.25 + wave);
    vec3 col = mix(uColorA, uColorB, t);
    float band = smoothstep(0.0, 0.5, vUv.y) * smoothstep(1.0, 0.4, vUv.y);
    float alpha = (0.35 + 0.25 * sin(uTime * 0.4 + vUv.x * 5.0)) * band;
    gl_FragColor = vec4(col, alpha);
  }
`

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'))
  } catch {
    return false
  }
}

// FNV-1a de 32 bits: hash estable del id para la posición de respaldo
function hashString(value: string, seed: number): number {
  let hash = 0x811c9dc5 ^ seed
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0) / 0xffffffff
}

function makePlanetTexture(color: THREE.Color, seed: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 64
  const context = canvas.getContext('2d')
  if (!context) return new THREE.CanvasTexture(canvas)
  const base = color.getStyle()
  const dark = color.clone().offsetHSL(0, -0.12, -0.2).getStyle()
  const light = color.clone().offsetHSL(0, -0.05, 0.2).getStyle()
  context.fillStyle = base
  context.fillRect(0, 0, canvas.width, canvas.height)
  const pattern = seed % 4
  if (pattern === 0) {
    for (let y = 0; y < canvas.height; y += 9 + (seed % 4)) {
      context.fillStyle = y % 14 < 7 ? light : dark
      context.globalAlpha = 1
      context.fillRect(0, y, canvas.width, 6 + (seed % 4))
    }
  } else if (pattern === 1) {
    context.globalAlpha = 1
    for (let index = 0; index < 14; index += 1) {
      context.fillStyle = index % 2 ? light : dark
      context.beginPath()
      context.ellipse((seed * 17 + index * 31) % 128, (seed * 11 + index * 19) % 64, 11 + (index % 4) * 4, 5 + (index % 3) * 3, index, 0, Math.PI * 2)
      context.fill()
    }
  } else if (pattern === 2) {
    context.globalAlpha = 1
    for (let index = 0; index < 9; index += 1) {
      context.fillStyle = index % 2 ? light : dark
      context.beginPath()
      context.arc((seed * 23 + index * 37) % 128, (seed * 7 + index * 13) % 64, 7 + (index % 4) * 3, 0, Math.PI * 2)
      context.fill()
    }
  } else {
    context.globalAlpha = 0.95
    for (let index = 0; index < 80; index += 1) {
      context.fillStyle = index % 3 ? light : dark
      context.fillRect((seed * 13 + index * 29) % 128, (seed * 5 + index * 17) % 64, 3 + (index % 4), 2 + (index % 3))
    }
  }
  context.globalAlpha = 1
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

function resolveGalaxyCenter(galaxy: Galaxy): THREE.Vector3 {
  return new THREE.Vector3(galaxy.center.x * GALAXY_SPREAD, galaxy.center.y * GALAXY_SPREAD, galaxy.center.z * GALAXY_SPREAD)
}

function resolvePosition(course: GalaxyCourse, galaxyByKey: Map<string, Galaxy>): THREE.Vector3 {
  const { positionX: x, positionY: y, positionZ: z } = course
  const galaxy = galaxyByKey.get(course.galaxies[0])
  const center = galaxy?.center ?? { x: 0, y: 0, z: 0 }
  const worldCenter = galaxy ? resolveGalaxyCenter(galaxy) : new THREE.Vector3()
  if (x != null && y != null && z != null) {
    const spread = 1.8
    return new THREE.Vector3(
      worldCenter.x + (x - center.x) * spread,
      worldCenter.y + (y - center.y) * spread,
      worldCenter.z + (z - center.z) * spread,
    )
  }
  const theta = hashString(course.id, 1) * Math.PI * 2
  const phi = Math.acos(hashString(course.id, 2) * 2 - 1)
  const distance = FALLBACK_MIN_DISTANCE + hashString(course.id, 3) * (FALLBACK_MAX_DISTANCE - FALLBACK_MIN_DISTANCE)
  return worldCenter.clone().add(new THREE.Vector3().setFromSphericalCoords(distance, phi, theta))
}

function makeNebulaTexture(): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(255,255,255,0.9)')
    grad.addColorStop(0.3, 'rgba(255,255,255,0.45)')
    grad.addColorStop(0.65, 'rgba(255,255,255,0.12)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, size, size)
  }
  return new THREE.CanvasTexture(canvas)
}

function makeCircleTexture(): THREE.CanvasTexture {
  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (ctx) {
    const grad = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
    grad.addColorStop(0, 'rgba(255,255,255,1)')
    grad.addColorStop(0.25, 'rgba(255,255,255,0.8)')
    grad.addColorStop(0.6, 'rgba(255,255,255,0.2)')
    grad.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = grad
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.fill()
  }
  return new THREE.CanvasTexture(canvas)
}

export function useGalaxyScene({ containerRef, canvasRef, tooltipRef, galaxies, courses, selectedId, onHover, onSelect, focusedGalaxyKey, onFocusGalaxy }: UseGalaxySceneOptions): UseGalaxySceneResult {
  const [isSupported] = useState(detectWebGL)
  const contextRef = useRef<SceneContext | null>(null)
  const nodesRef = useRef<Map<string, CourseNode>>(new Map())
  const shipRef = useRef<THREE.Object3D | null>(null)
  const nebulaeRef = useRef<Map<string, NebulaNode>>(new Map()) // por galaxyKey
  const flightRef = useRef<CameraFlight | null>(null)
  // Curso a enfocar en cuanto exista su nodo (p. ej. tras limpiar filtros)
  const pendingFocusRef = useRef<string | null>(null)
  const selectedIdRef = useRef(selectedId)
  const onHoverRef = useRef(onHover)
  const onSelectRef = useRef(onSelect)
  const focusedGalaxyKeyRef = useRef(focusedGalaxyKey)
  const onFocusGalaxyRef = useRef(onFocusGalaxy)
  useEffect(() => {
    selectedIdRef.current = selectedId
    contextRef.current?.refreshSelectedLines()
  }, [selectedId])
  useEffect(() => { onHoverRef.current = onHover }, [onHover])
  useEffect(() => { onSelectRef.current = onSelect }, [onSelect])
  useEffect(() => { onFocusGalaxyRef.current = onFocusGalaxy }, [onFocusGalaxy])

  // prefers-reduced-motion: se quita el movimiento, no la información visual
  const reducedMotionRef = useRef(false)
  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionRef.current = query.matches
    const onChange = (event: MediaQueryListEvent): void => { reducedMotionRef.current = event.matches }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [])

  // Con reduced motion la cámara salta a la posición final en lugar de animarse
  const startFlight = useCallback((flight: CameraFlight): void => {
    const context = contextRef.current
    if (!context || !reducedMotionRef.current) {
      flightRef.current = flight
      return
    }
    flightRef.current = null
    context.controls.target.copy(flight.target)
    context.camera.position.copy(flight.position)
    context.controls.update()
  }, [])

  const flyToNode = useCallback((node: CourseNode): void => {
    const context = contextRef.current
    if (!context) return
    const { camera, controls } = context
    const target = node.group.position.clone()
    // Se conserva el ángulo de vista actual y se acerca la cámara
    const direction = camera.position.clone().sub(controls.target).normalize()
    startFlight({ target, position: target.clone().addScaledVector(direction, FOCUS_DISTANCE) })
  }, [startFlight])

  const flyToGalaxy = useCallback((key: string): void => {
    const context = contextRef.current
    const nebula = nebulaeRef.current.get(key)
    if (!context || !nebula) return
    const { camera, controls } = context
    const target = resolveGalaxyCenter(nebula.galaxy)
    const direction = camera.position.clone().sub(controls.target).normalize()
    const distance = Math.max(GALAXY_FOCUS_MIN_DISTANCE, nebula.baseSize * GALAXY_FOCUS_FACTOR)
    startFlight({ target, position: target.clone().addScaledVector(direction, distance) })
  }, [startFlight])

  useEffect(() => {
    focusedGalaxyKeyRef.current = focusedGalaxyKey
    contextRef.current?.refreshEmphasis()
    if (focusedGalaxyKey) flyToGalaxy(focusedGalaxyKey)
  }, [focusedGalaxyKey, flyToGalaxy])

  const focusCourse = useCallback((slug: string): void => {
    const node = nodesRef.current.get(slug)
    if (!node) {
      pendingFocusRef.current = slug
      return
    }
    pendingFocusRef.current = null
    flyToNode(node)
  }, [flyToNode])

  const resetCamera = useCallback((): void => {
    pendingFocusRef.current = null
    flightRef.current = { target: new THREE.Vector3(0, 0, 0), position: CAMERA_HOME.clone() }
  }, [])

  useEffect(() => {
    const container = containerRef.current
    const canvas = canvasRef.current
    if (!isSupported || !container || !canvas) return

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', alpha: false })
    } catch (error) {
      console.error('No se pudo crear el renderer WebGL', error)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(container.clientWidth, container.clientHeight, false)

    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#000005')

    const camera = new THREE.PerspectiveCamera(50, container.clientWidth / Math.max(container.clientHeight, 1), 0.1, 2000)
    camera.position.copy(CAMERA_HOME)

    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.08
    controls.minDistance = 5
    controls.maxDistance = 260
    controls.target.set(0, 0, 0)
    controls.update()

    // Luces para los materiales estándar de las esferas
    scene.add(new THREE.AmbientLight(0x1e1b4b, 0.45))
    const dirLight = new THREE.DirectionalLight(0xe0f2fe, 0.8)
    dirLight.position.set(15, 25, 20)
    scene.add(dirLight)
    const purpleLight = new THREE.DirectionalLight(0x7c3aed, 0.4)
    purpleLight.position.set(-20, 10, -10)
    scene.add(purpleLight)

    // Aurora (detrás) y nebulosa: quads a pantalla completa
    const backgroundGeo = new THREE.PlaneGeometry(2, 2)
    const auroraMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color('#4C1D95') },
        uColorB: { value: new THREE.Color('#7C3AED') },
      },
      vertexShader: auroraVertexShader,
      fragmentShader: auroraFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
    })
    const auroraMesh = new THREE.Mesh(backgroundGeo, auroraMat)
    auroraMesh.renderOrder = -2
    auroraMesh.frustumCulled = false
    scene.add(auroraMesh)

    const nebulaMat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: new THREE.Color('#3b0764') },
        uColorB: { value: new THREE.Color('#7C3AED') },
        uColorC: { value: new THREE.Color('#1e1b4b') },
        uColorD: { value: new THREE.Color('#92400e') },
      },
      vertexShader: nebulaVertexShader,
      fragmentShader: nebulaFragmentShader,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    })
    const nebulaMesh = new THREE.Mesh(backgroundGeo, nebulaMat)
    nebulaMesh.renderOrder = -1
    nebulaMesh.frustumCulled = false
    scene.add(nebulaMesh)

    // Campo de partículas
    const circleTexture = makeCircleTexture()
    const starPositions = new Float32Array(STAR_COUNT * 3)
    const starColors = new Float32Array(STAR_COUNT * 3)
    const palette = ['#60A5FA', '#A855F7', '#34D399', '#FBBF24', '#FFFFFF'].map((hex) => new THREE.Color(hex))
    for (let i = 0; i < STAR_COUNT; i++) {
      const radius = (25 + Math.random() * 55) * WORLD_SCALE
      const theta = THREE.MathUtils.randFloat(0, Math.PI * 2)
      const phi = THREE.MathUtils.randFloat(0, Math.PI)
      starPositions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      starPositions[i * 3 + 2] = radius * Math.cos(phi)
      const color = palette[Math.floor(Math.random() * palette.length)]
      starColors[i * 3] = color.r
      starColors[i * 3 + 1] = color.g
      starColors[i * 3 + 2] = color.b
    }
    const starGeo = new THREE.BufferGeometry()
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
    const starMat = new THREE.PointsMaterial({
      size: 0.7 * WORLD_SCALE,
      map: circleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 0.95,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const starField = new THREE.Points(starGeo, starMat)
    scene.add(starField)

    // Estrellas fugaces
    const shootingStars = Array.from({ length: SHOOTING_STAR_COUNT }, () => {
      const geometry = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()])
      const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, blending: THREE.AdditiveBlending })
      const line = new THREE.Line(geometry, material)
      line.visible = false
      scene.add(line)
      return {
        line,
        geometry,
        material,
        speed: 20 + Math.random() * 15,
        progress: 1.2,
        start: new THREE.Vector3(),
        dir: new THREE.Vector3(),
        length: (6 + Math.random() * 4) * WORLD_SCALE,
      }
    })
    const head = new THREE.Vector3()
    const tail = new THREE.Vector3()

    // Hover: solo el slug pasa a React; escala, líneas y tooltip se actualizan aquí
    let hoveredSlug: string | null = null
    // Galaxias resaltadas: se recalculan solo cuando cambian el hover o el foco, no en cada frame
    let activeGalaxies: Set<string> | null = null
    let intensifiedNebula: string | null = null
    const refreshEmphasis = (): void => {
      const hoveredCourse = hoveredSlug ? nodesRef.current.get(hoveredSlug)?.course ?? null : null
      activeGalaxies = resolveActiveGalaxies(focusedGalaxyKeyRef.current, hoveredCourse)
      intensifiedNebula = resolveIntensifiedNebula(focusedGalaxyKeyRef.current, hoveredCourse)
    }
    refreshEmphasis()
    // LineMaterial dibuja el grosor en píxeles: necesita el tamaño del canvas
    const lineResolution = new THREE.Vector2(container.clientWidth, container.clientHeight)
    // Dos slots: líneas del curso en hover y líneas persistentes del curso seleccionado
    let hoverLines: RelationLines | null = null
    let selectedLines: RelationLines | null = null
    let selectedLinesSlug: string | null = null
    const makeLines = (node: CourseNode): RelationLines | null => {
      const lines = createRelationLines({ origin: node, nodes: nodesRef.current, pulseTexture: circleTexture, resolution: lineResolution, reducedMotion: reducedMotionRef.current })
      if (lines) scene.add(lines.group)
      return lines
    }
    const clearHoverLines = (): void => {
      hoverLines?.dispose()
      hoverLines = null
    }
    const clearSelectedLines = (): void => {
      selectedLines?.dispose()
      selectedLines = null
      selectedLinesSlug = null
    }
    // Se llama al cambiar la selección y tras el rebuild de nodos
    const refreshSelectedLines = (): void => {
      const slug = selectedIdRef.current
      if (slug === selectedLinesSlug) return
      // Si el nuevo seleccionado está en hover, sus líneas pasan al slot de seleccionado sin recrearse
      const reused = slug && slug === hoveredSlug ? hoverLines : null
      if (reused) hoverLines = null
      // Si el anterior seleccionado sigue en hover, sus líneas pasan al slot de hover
      if (selectedLines && selectedLinesSlug === hoveredSlug && !hoverLines) {
        hoverLines = selectedLines
        hoverLines.setIntensity(1)
      } else {
        selectedLines?.dispose()
      }
      selectedLinesSlug = slug
      const node = slug ? nodesRef.current.get(slug) : undefined
      selectedLines = reused ?? (node ? makeLines(node) : null)
      selectedLines?.setIntensity(slug === hoveredSlug ? 1 : SELECTED_LINE_INTENSITY)
    }
    const setHovered = (slug: string | null): void => {
      if (slug === hoveredSlug) return
      hoveredSlug = slug
      refreshEmphasis()
      clearHoverLines()
      const node = slug ? nodesRef.current.get(slug) : undefined
      // Si el curso en hover es el seleccionado se dibuja un solo juego de líneas, con brillo completo
      const isSelected = Boolean(node) && slug === selectedLinesSlug
      if (node && !isSelected) hoverLines = makeLines(node)
      selectedLines?.setIntensity(isSelected ? 1 : SELECTED_LINE_INTENSITY)
      canvas.style.cursor = node ? 'pointer' : ''
      onHoverRef.current(node ? slug : null)
    }

    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const setRay = (event: PointerEvent): void => {
      const rect = canvas.getBoundingClientRect()
      pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
      raycaster.setFromCamera(pointer, camera)
    }
    const pickSlug = (): string | null => {
      const cores = Array.from(nodesRef.current.values(), (node) => node.core)
      const hit = raycaster.intersectObjects(cores, false)[0]
      return hit ? (hit.object.userData.slug as string) : null
    }
    // Distancia del rayo al centro, no el raycast del Sprite (su cuadrado se solapa entre galaxias)
    const pickNebula = (): string | null => {
      let pickedKey: string | null = null
      let pickedDistance = Infinity
      nebulaeRef.current.forEach(({ galaxy, sprite, baseSize }) => {
        if (raycaster.ray.distanceToPoint(sprite.position) >= baseSize * NEBULA_HIT_FACTOR) return
        // Si varias cumplen, gana la de centro más cercano a la cámara
        const distance = camera.position.distanceTo(sprite.position)
        if (distance < pickedDistance) {
          pickedDistance = distance
          pickedKey = galaxy.key
        }
      })
      return pickedKey
    }
    const onPointerMove = (event: PointerEvent): void => {
      // Mientras se arrastra para rotar no se cambia el hover
      if (event.buttons !== 0) return
      setRay(event)
      const slug = pickSlug()
      setHovered(slug)
      // La estrella tiene prioridad; sin estrella, una nebulosa clicable también muestra pointer
      if (!slug) canvas.style.cursor = pickNebula() ? 'pointer' : ''
    }
    const onPointerLeave = (): void => setHovered(null)

    // Click o tap: se distingue de arrastrar por el desplazamiento del puntero
    const pointerDown = new THREE.Vector2()
    const onPointerDown = (event: PointerEvent): void => {
      if (event.button === 0) pointerDown.set(event.clientX, event.clientY)
    }
    const onPointerUp = (event: PointerEvent): void => {
      if (event.button !== 0) return
      if (pointerDown.distanceTo(new THREE.Vector2(event.clientX, event.clientY)) >= CLICK_TOLERANCE_PX) return
      setRay(event)
      const slug = pickSlug()
      // En táctil no hay hover: el tap muestra líneas y tooltip
      if (event.pointerType !== 'mouse') setHovered(slug)
      const node = slug ? nodesRef.current.get(slug) : undefined
      if (!slug || !node) {
        // Sin estrella: nebulosa enfoca su galaxia, espacio vacío quita el foco
        onFocusGalaxyRef.current(pickNebula())
        return
      }
      onSelectRef.current(slug)
      flyToNode(node)
    }
    // Cualquier gesto del usuario cancela la animación de zoom
    const onControlsStart = (): void => { flightRef.current = null }

    canvas.addEventListener('pointermove', onPointerMove)
    canvas.addEventListener('pointerleave', onPointerLeave)
    canvas.addEventListener('pointerdown', onPointerDown)
    canvas.addEventListener('pointerup', onPointerUp)
    controls.addEventListener('start', onControlsStart)

    const tooltipPosition = new THREE.Vector3()
    const updateTooltip = (): void => {
      const tooltip = tooltipRef.current
      if (!tooltip) return
      const node = hoveredSlug ? nodesRef.current.get(hoveredSlug) : undefined
      if (!node) {
        tooltip.style.visibility = 'hidden'
        return
      }
      tooltipPosition.copy(node.group.position).project(camera)
      // Detrás de la cámara no se muestra
      if (tooltipPosition.z > 1) {
        tooltip.style.visibility = 'hidden'
        return
      }
      const x = (tooltipPosition.x * 0.5 + 0.5) * canvas.clientWidth
      const y = (-tooltipPosition.y * 0.5 + 0.5) * canvas.clientHeight
      tooltip.style.transform = `translate(${x}px, ${y}px) translate(-50%, calc(-100% - ${TOOLTIP_OFFSET_PX}px))`
      tooltip.style.visibility = 'visible'
    }

    contextRef.current = { scene, camera, renderer, controls, setHovered, refreshEmphasis, refreshSelectedLines, clearSelectedLines }

    const resize = (): void => {
      const width = container.clientWidth
      const height = container.clientHeight
      if (width === 0 || height === 0) return
      camera.aspect = width / height
      camera.updateProjectionMatrix()
      renderer.setSize(width, height, false)
      lineResolution.set(width, height)
      hoverLines?.setResolution(width, height)
      selectedLines?.setResolution(width, height)
    }
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(container)

    const targetScale = new THREE.Vector3()
    const clock = new THREE.Clock()
    let animationFrameId = 0
    const animate = (): void => {
      animationFrameId = requestAnimationFrame(animate)
      const delta = clock.getDelta()
      const elapsed = clock.getElapsedTime()

      nebulaMat.uniforms.uTime.value = elapsed
      auroraMat.uniforms.uTime.value = elapsed
      starField.rotation.y = elapsed * 0.015
      starField.rotation.x = elapsed * 0.007

      shootingStars.forEach((star) => {
        star.progress += delta * star.speed * 0.04
        if (star.progress > 1.2 && Math.random() < 0.06) {
          star.progress = 0
          star.speed = 22 + Math.random() * 15
          const side = Math.random() > 0.5 ? 1 : -1
          star.start.set(side * (25 + Math.random() * 20), 15 + Math.random() * 20, Math.random() * 20 - 20).multiplyScalar(WORLD_SCALE)
          star.dir.set(-side * (0.8 + Math.random() * 0.4), -(0.6 + Math.random() * 0.4), (Math.random() - 0.5) * 0.3).normalize()
        }
        if (star.progress < 1) {
          star.line.visible = true
          head.copy(star.start).addScaledVector(star.dir, star.progress * 45 * WORLD_SCALE)
          tail.copy(head).addScaledVector(star.dir, -star.length)
          const positions = star.geometry.attributes.position as THREE.BufferAttribute
          positions.setXYZ(0, tail.x, tail.y, tail.z)
          positions.setXYZ(1, head.x, head.y, head.z)
          positions.needsUpdate = true
          star.material.opacity = Math.sin(star.progress * Math.PI)
        } else {
          star.line.visible = false
        }
      })

      nodesRef.current.forEach(({ course, core, halo, ring, light, baseOpacity, baseEmissive }) => {
        const isHovered = course.slug === hoveredSlug
        const emphasis = courseEmphasis(course, activeGalaxies)
        const glow = EMPHASIS_GLOW[emphasis]
        const scale = isHovered ? HOVER_SCALE : course.slug === selectedIdRef.current ? SELECTED_SCALE : 1
        core.scale.lerp(targetScale.setScalar(scale), 0.12)
        core.rotation.y += 0.01
        const coreMat = core.material as THREE.MeshStandardMaterial
        const coreOpacity = emphasis === 'dimmed' ? Math.min(DIMMED_OPACITY, baseOpacity) : baseOpacity
        coreMat.opacity = THREE.MathUtils.lerp(coreMat.opacity, coreOpacity, EMPHASIS_LERP)
        coreMat.emissiveIntensity = THREE.MathUtils.lerp(coreMat.emissiveIntensity, baseEmissive * EMPHASIS_EMISSIVE[emphasis], EMPHASIS_LERP)
        if (halo) {
          const haloScale = isHovered ? HOVER_SCALE * 1.4 : 1
          halo.scale.lerp(targetScale.setScalar(haloScale), 0.1)
          halo.rotation.z -= 0.006
          const haloMat = halo.material as THREE.MeshBasicMaterial
          haloMat.opacity = THREE.MathUtils.lerp(haloMat.opacity, Math.min(1, HALO_OPACITY * glow), EMPHASIS_LERP)
        }
        if (ring) {
          ring.rotation.z += 0.004
          const ringMat = ring.material as THREE.MeshBasicMaterial
          const ringOpacity = course.isActive ? RING_OPACITY : INACTIVE_OPACITY
          ringMat.opacity = THREE.MathUtils.lerp(ringMat.opacity, Math.min(1, ringOpacity * glow), EMPHASIS_LERP)
        }
        if (light) {
          const intensity = (isHovered ? LIGHT_HOVER_INTENSITY : LIGHT_INTENSITY) * glow
          light.intensity = THREE.MathUtils.lerp(light.intensity, intensity, EMPHASIS_LERP)
        }
      })

      nebulaeRef.current.forEach(({ galaxy, sprite, material, baseSize }) => {
        const isIntensified = galaxy.key === intensifiedNebula
        const opacity = isIntensified ? NEBULA_INTENSIFIED_OPACITY : activeGalaxies ? NEBULA_DIMMED_OPACITY : NEBULA_OPACITY
        const size = isIntensified ? baseSize * NEBULA_INTENSIFIED_SCALE : baseSize
        material.opacity = THREE.MathUtils.lerp(material.opacity, opacity, EMPHASIS_LERP)
        sprite.scale.lerp(targetScale.set(size, size, 1), EMPHASIS_LERP)
      })

      hoverLines?.update(delta, elapsed)
      selectedLines?.update(delta, elapsed)

      const ship = shipRef.current
      const selectedNode = selectedIdRef.current ? nodesRef.current.get(selectedIdRef.current) : undefined
      if (ship && selectedNode) {
        const target = selectedNode.group.position.clone()
        target.y += 4.2
        ship.position.lerp(target, 0.07)
        ship.rotation.y += 0.012
        ship.rotation.z = Math.sin(elapsed * 1.8) * 0.045
        ship.position.y += Math.sin(elapsed * 2.2) * 0.018
      }

      const flight = flightRef.current
      if (flight) {
        controls.target.lerp(flight.target, FLIGHT_LERP)
        camera.position.lerp(flight.position, FLIGHT_LERP)
        if (controls.target.distanceTo(flight.target) < 0.05 && camera.position.distanceTo(flight.position) < 0.05) flightRef.current = null
      }

      controls.update()
      renderer.render(scene, camera)
      updateTooltip()
    }
    animate()

    return () => {
      cancelAnimationFrame(animationFrameId)
      resizeObserver.disconnect()
      canvas.removeEventListener('pointermove', onPointerMove)
      canvas.removeEventListener('pointerleave', onPointerLeave)
      canvas.removeEventListener('pointerdown', onPointerDown)
      canvas.removeEventListener('pointerup', onPointerUp)
      controls.removeEventListener('start', onControlsStart)
      flightRef.current = null
      clearHoverLines()
      clearSelectedLines()
      contextRef.current = null
      controls.dispose()
      backgroundGeo.dispose()
      auroraMat.dispose()
      nebulaMat.dispose()
      starGeo.dispose()
      starMat.dispose()
      circleTexture.dispose()
      shootingStars.forEach(({ geometry, material }) => { geometry.dispose(); material.dispose() })
      renderer.dispose()
    }
  }, [canvasRef, containerRef, flyToNode, isSupported, tooltipRef])

  // Nodos de cursos: se reconstruyen cuando cambian los cursos (p. ej. al filtrar)
  useEffect(() => {
    const context = contextRef.current
    if (!context) return
    const galaxyByKey = new Map(galaxies.map((galaxy) => [galaxy.key, galaxy]))
    const nodesGroup = new THREE.Group()
    const geometries: THREE.BufferGeometry[] = []
    const materials: THREE.Material[] = []
    const textures: THREE.Texture[] = []
    const nodes = new Map<string, CourseNode>()
    // Distancia máxima de los cursos de cada galaxia principal a su centro
    const galaxyExtent = new Map<string, number>()

    courses.forEach((course, courseIndex) => {
      const baseRadius = LEVEL_RADIUS[course.level]
      const color = new THREE.Color(PLANET_COLORS[courseIndex % PLANET_COLORS.length])
      const planetTexture = makePlanetTexture(color, courseIndex + 1)
      textures.push(planetTexture)
      const nodeGroup = new THREE.Group()
      nodeGroup.position.copy(resolvePosition(course, galaxyByKey))
      const primaryGalaxy = galaxyByKey.get(course.galaxies[0])
      if (primaryGalaxy) {
        const distance = nodeGroup.position.distanceTo(resolveGalaxyCenter(primaryGalaxy))
        galaxyExtent.set(primaryGalaxy.key, Math.max(galaxyExtent.get(primaryGalaxy.key) ?? 0, distance))
      }

      const baseOpacity = course.isActive ? 1 : INACTIVE_OPACITY
      const baseEmissive = course.isActive ? ACTIVE_EMISSIVE : INACTIVE_EMISSIVE
      const coreGeo = new THREE.SphereGeometry(baseRadius, 32, 32)
      // Siempre transparente para poder interpolar la opacidad al resaltar
      const coreMat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color('#ffffff'),
        map: planetTexture,
        bumpMap: planetTexture,
        bumpScale: 0.68,
        emissive: color.clone().multiplyScalar(0.34),
        emissiveIntensity: baseEmissive,
        roughness: 0.38 + hashString(course.id, 6) * 0.3,
        metalness: 0.04 + hashString(course.id, 7) * 0.12,
        clearcoat: 0.28 + hashString(course.id, 8) * 0.38,
        clearcoatRoughness: 0.16 + hashString(course.id, 9) * 0.3,
        transparent: true,
        opacity: baseOpacity,
      })
      const core = new THREE.Mesh(coreGeo, coreMat)
      core.userData = { slug: course.slug }
      nodeGroup.add(core)
      geometries.push(coreGeo)
      materials.push(coreMat)

      let halo: THREE.Mesh | null = null
      let light: THREE.PointLight | null = null
      if (course.isActive) {
        const haloGeo = new THREE.SphereGeometry(baseRadius * 1.55, 24, 24)
        const haloMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: HALO_OPACITY, blending: THREE.AdditiveBlending, side: THREE.BackSide, depthWrite: false })
        halo = new THREE.Mesh(haloGeo, haloMat)
        nodeGroup.add(halo)
        geometries.push(haloGeo)
        materials.push(haloMat)

        light = new THREE.PointLight(course.galaxyColor, LIGHT_INTENSITY, 8, 2)
        nodeGroup.add(light)
      }

      // Anillo con el color de la segunda galaxia
      let ring: THREE.Mesh | null = null
      {
        const ringGeo = new THREE.RingGeometry(baseRadius * 1.9, baseRadius * 2.05, 64)
        const ringMat = new THREE.MeshBasicMaterial({
          color: color.clone().offsetHSL(0.08 + hashString(course.id, 10) * 0.12, 0.02, 0.04),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: course.isActive ? RING_OPACITY * 0.72 : INACTIVE_OPACITY,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        })
        ring = new THREE.Mesh(ringGeo, ringMat)
        ring.rotation.x = Math.PI / 2.3
        nodeGroup.add(ring)
        geometries.push(ringGeo)
        materials.push(ringMat)
      }

      nodesGroup.add(nodeGroup)
      nodes.set(course.slug, { course, group: nodeGroup, core, halo, ring, light, baseRadius, baseOpacity, baseEmissive })
    })

    // Una nebulosa por galaxia, en su centro y con su color
    const nebulaTexture = makeNebulaTexture()
    const nebulae = new Map<string, NebulaNode>()
    galaxies.forEach((galaxy) => {
      const nebulaMat = new THREE.SpriteMaterial({
        map: nebulaTexture,
        color: new THREE.Color(galaxy.color),
        transparent: true,
        opacity: NEBULA_OPACITY,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
      const nebula = new THREE.Sprite(nebulaMat)
      nebula.position.copy(resolveGalaxyCenter(galaxy))
      const size = Math.max(NEBULA_MIN_SIZE, (galaxyExtent.get(galaxy.key) ?? 0) * NEBULA_SIZE_FACTOR)
      nebula.scale.set(size, size, 1)
      nodesGroup.add(nebula)
      materials.push(nebulaMat)
      nebulae.set(galaxy.key, { galaxy, sprite: nebula, material: nebulaMat, baseSize: size })
    })

    context.scene.add(nodesGroup)
    let shipCancelled = false
    new THREE.TextureLoader().load('/assets/devi-laptop.png', (texture) => {
      if (shipCancelled) {
        texture.dispose()
        return
      }
      texture.colorSpace = THREE.SRGBColorSpace
      const devi = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false }))
      devi.scale.set(2.4, 2.4, 1)
      devi.position.y += 4.2
      const deviLight = new THREE.PointLight(0xa855f7, 2.8, 12)
      deviLight.position.set(0, -1.4, 0)
      devi.add(deviLight)
      devi.renderOrder = 20
      shipRef.current = devi
      context.scene.add(devi)
    })
    nodesRef.current = nodes
    nebulaeRef.current = nebulae
    context.refreshSelectedLines()
    const pendingNode = pendingFocusRef.current ? nodes.get(pendingFocusRef.current) : undefined
    if (pendingNode) {
      pendingFocusRef.current = null
      flyToNode(pendingNode)
    }

    return () => {
      shipCancelled = true
      if (shipRef.current) {
        context.scene.remove(shipRef.current)
        shipRef.current = null
      }
      // El curso en hover puede desaparecer con el rebuild: se limpian sus líneas
      context.setHovered(null)
      context.clearSelectedLines()
      context.scene.remove(nodesGroup)
      nodesRef.current = new Map()
      nebulaeRef.current = new Map()
      nodes.forEach(({ light }) => light?.dispose())
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      textures.forEach((texture) => texture.dispose())
      nebulaTexture.dispose()
    }
  }, [courses, flyToNode, galaxies])

  return { isSupported, resetCamera, focusCourse }
}
