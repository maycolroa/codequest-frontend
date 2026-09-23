import * as THREE from 'three'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import type { CourseNode } from '@/hooks/useGalaxyScene'

export interface RelationLines {
  group: THREE.Group // posicionado en el centro del curso origen
  setIntensity: (value: number) => void // 1 = hover, SELECTED_LINE_INTENSITY = seleccionado
  setResolution: (width: number, height: number) => void // LineMaterial necesita la resolución
  update: (delta: number, elapsed: number) => void // crecimiento, pulso, partículas, dash
  dispose: () => void
}

export interface CreateRelationLinesOptions {
  origin: CourseNode
  nodes: Map<string, CourseNode>
  pulseTexture: THREE.Texture
  resolution: THREE.Vector2
  reducedMotion: boolean
}

export const SELECTED_LINE_INTENSITY = 0.45
const PREREQUISITE_LINE_COLOR = '#EF4444'
const RELATED_LINE_COLOR = '#3B82F6'
const DASH_SIZE = 1.2
const GAP_SIZE = 0.8
const DASH_SPEED = 1.5
const LINE_GROW_MS = 350
const PULSE_MS = 600
const PULSE_START_SCALE = 2
const PULSE_END_SCALE = 6
const PULSE_START_OPACITY = 0.8
const PARTICLES_PER_PREREQUISITE = 6
const PARTICLE_SPEED = 0.35 // recorridos por segundo
const PARTICLE_SIZE = 0.6

// Grosor en píxeles de pantalla: prerequisitos más gruesos que relacionados, y el primero de cada lista el más grueso
const prerequisiteWidth = (index: number): number => Math.max(1.5, 3.5 - 0.75 * index)
const relatedWidth = (index: number): number => Math.max(1, 2 - 0.4 * index)

const easeOutCubic = (t: number): number => 1 - (1 - t) ** 3

export function createRelationLines({ origin, nodes, pulseTexture, resolution, reducedMotion }: CreateRelationLinesOptions): RelationLines | null {
  const group = new THREE.Group()
  group.position.copy(origin.group.position)
  // Las líneas crecen escalando este subgrupo anclado en el origen; el pulso queda fuera para no heredar la escala
  const lines = new THREE.Group()
  group.add(lines)
  const geometries: LineGeometry[] = []
  const materials: LineMaterial[] = []
  const dashedMaterials: LineMaterial[] = []
  // Extremos (locales) de las líneas de prerequisitos: por ellas viajan las partículas
  const prerequisiteEnds: THREE.Vector3[] = []

  const addLines = (slugs: string[], color: string, width: (index: number) => number, dashed: boolean, ends?: THREE.Vector3[]): void => {
    slugs.forEach((slug, index) => {
      // Los slugs que no están en la escena no dibujan línea
      const target = nodes.get(slug)
      if (!target) return
      // Puntos locales al group: el origen es (0, 0, 0)
      const end = target.group.position.clone().sub(origin.group.position)
      ends?.push(end)
      const geometry = new LineGeometry()
      geometry.setPositions([0, 0, 0, end.x, end.y, end.z])
      const material = new LineMaterial({
        color,
        linewidth: width(index),
        resolution,
        dashed,
        dashSize: DASH_SIZE,
        gapSize: GAP_SIZE,
        transparent: true,
        depthWrite: false,
      })
      const line = new Line2(geometry, material)
      if (dashed) {
        line.computeLineDistances()
        dashedMaterials.push(material)
      }
      lines.add(line)
      geometries.push(geometry)
      materials.push(material)
    })
  }
  addLines(origin.course.prerequisites, PREREQUISITE_LINE_COLOR, prerequisiteWidth, false, prerequisiteEnds)
  addLines(origin.course.related, RELATED_LINE_COLOR, relatedWidth, true)

  if (materials.length === 0) return null

  // Pulso de origen: se expande y se desvanece una sola vez
  const pulseMaterial = new THREE.SpriteMaterial({
    map: pulseTexture,
    color: new THREE.Color(origin.course.galaxyColor),
    transparent: true,
    opacity: PULSE_START_OPACITY,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  })
  const pulse = new THREE.Sprite(pulseMaterial)
  pulse.scale.setScalar(origin.baseRadius * PULSE_START_SCALE)
  group.add(pulse)

  // Partículas del origen hacia cada prerequisito: un solo Points con el buffer preasignado.
  // Con reduced motion no se crean.
  let particles: { points: THREE.Points; geometry: THREE.BufferGeometry; material: THREE.PointsMaterial; positions: Float32Array } | null = null
  if (!reducedMotion && prerequisiteEnds.length > 0) {
    const positions = new Float32Array(prerequisiteEnds.length * PARTICLES_PER_PREREQUISITE * 3)
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    const material = new THREE.PointsMaterial({
      color: PREREQUISITE_LINE_COLOR,
      size: PARTICLE_SIZE,
      map: pulseTexture,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    const points = new THREE.Points(geometry, material)
    // Se mueven cada frame: el bounding sphere inicial (todo en el origen) no sirve para el culling
    points.frustumCulled = false
    lines.add(points)
    particles = { points, geometry, material, positions }
  }

  const updateParticles = (elapsed: number): void => {
    if (!particles) return
    const { positions, geometry } = particles
    let offset = 0
    for (const end of prerequisiteEnds) {
      for (let i = 0; i < PARTICLES_PER_PREREQUISITE; i++) {
        const t = (elapsed * PARTICLE_SPEED + i / PARTICLES_PER_PREREQUISITE) % 1
        positions[offset] = end.x * t
        positions[offset + 1] = end.y * t
        positions[offset + 2] = end.z * t
        offset += 3
      }
    }
    geometry.attributes.position.needsUpdate = true
  }

  // Con reduced motion todo arranca en su estado final: líneas completas y sin pulso
  let ageMs = 0
  lines.scale.setScalar(reducedMotion ? 1 : 0)
  pulse.visible = !reducedMotion

  const update = (delta: number, elapsed: number): void => {
    if (reducedMotion) return
    updateParticles(elapsed)
    ageMs += delta * 1000
    if (lines.scale.x < 1) lines.scale.setScalar(easeOutCubic(Math.min(ageMs / LINE_GROW_MS, 1)))
    for (const material of dashedMaterials) material.dashOffset -= delta * DASH_SPEED
    if (pulse.visible) {
      const t = ageMs / PULSE_MS
      if (t >= 1) {
        pulse.visible = false
      } else {
        pulse.scale.setScalar(origin.baseRadius * THREE.MathUtils.lerp(PULSE_START_SCALE, PULSE_END_SCALE, t))
        pulseMaterial.opacity = PULSE_START_OPACITY * (1 - t)
      }
    }
  }

  return {
    group,
    setIntensity: (value) => {
      materials.forEach((material) => { material.opacity = value })
      if (particles) particles.material.opacity = value
    },
    setResolution: (width, height) => {
      materials.forEach((material) => { material.resolution.set(width, height) })
    },
    update,
    dispose: () => {
      group.removeFromParent()
      geometries.forEach((geometry) => geometry.dispose())
      materials.forEach((material) => material.dispose())
      // La textura del pulso es compartida: la libera quien la creó
      pulseMaterial.dispose()
      particles?.geometry.dispose()
      particles?.material.dispose()
    },
  }
}
