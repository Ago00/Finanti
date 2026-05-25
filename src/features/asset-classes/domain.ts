export function validateAssetClassName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error('El nombre no puede estar vacío')
  }
}

export function normalizeColor(color: string): string {
  return color.toUpperCase()
}

export function sortAlphabetically<T extends { name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => a.name.localeCompare(b.name))
}
