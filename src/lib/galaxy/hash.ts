// FNV-1a de 32 bits normalizado a [0, 1]: hash estable para valores deterministas por id
export function hashString(value: string, seed: number): number {
  let hash = 0x811c9dc5 ^ seed
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0) / 0xffffffff
}
