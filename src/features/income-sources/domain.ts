export function validateIncomeSourceName(name: string): void {
  if (!name || name.trim().length === 0) {
    throw new Error('El nombre no puede estar vacío')
  }
}

export function normalizeColor(color: string): string {
  return color.toUpperCase()
}

export function computeNextSortOrder(items: { sortOrder: number }[]): number {
  if (items.length === 0) return 0
  return Math.max(...items.map(i => i.sortOrder)) + 10
}

export function sortByOrderAndName<T extends { sortOrder: number; name: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
    return a.name.localeCompare(b.name)
  })
}
