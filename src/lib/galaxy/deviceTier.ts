export interface SurfaceSize {
  width: number
  height: number
}

export const SURFACE_SIZE_HIGH: SurfaceSize = { width: 512, height: 256 }
export const SURFACE_SIZE_LOW: SurfaceSize = { width: 256, height: 128 }
const LOW_END_MEMORY_GB = 4
const LOW_END_CORES = 4

// Una API ausente o con un valor que no es un número positivo no cuenta como gama baja
function positiveNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : null
}

// deviceMemory no está en lib.dom: se lee como unknown y se valida con typeof
export function isLowEndDevice(nav: Navigator): boolean {
  const memory = positiveNumber((nav as Navigator & { deviceMemory?: unknown }).deviceMemory)
  const cores = positiveNumber(nav.hardwareConcurrency)
  return (memory !== null && memory <= LOW_END_MEMORY_GB) || (cores !== null && cores <= LOW_END_CORES)
}

export function surfaceSize(nav: Navigator = window.navigator): SurfaceSize {
  return isLowEndDevice(nav) ? SURFACE_SIZE_LOW : SURFACE_SIZE_HIGH
}
