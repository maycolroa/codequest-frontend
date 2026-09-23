import type { GalaxyCourse } from '@/types'

export type Emphasis = 'highlighted' | 'dimmed' | 'neutral'

// Foco > hover > nada. Devuelve null cuando no hay nada resaltado.
export function resolveActiveGalaxies(
  focusedKey: string | null,
  hovered: GalaxyCourse | null,
): Set<string> | null {
  if (focusedKey) return new Set([focusedKey])
  if (hovered && hovered.galaxies.length > 0) return new Set(hovered.galaxies)
  return null
}

// highlighted si comparte alguna galaxia con el set; dimmed si no; neutral si active es null
export function courseEmphasis(course: GalaxyCourse, active: Set<string> | null): Emphasis {
  if (!active) return 'neutral'
  return course.galaxies.some((key) => active.has(key)) ? 'highlighted' : 'dimmed'
}

// Nebulosa intensificada: la galaxia enfocada o galaxies[0] del curso en hover
export function resolveIntensifiedNebula(
  focusedKey: string | null,
  hovered: GalaxyCourse | null,
): string | null {
  if (focusedKey) return focusedKey
  return hovered?.galaxies[0] ?? null
}
