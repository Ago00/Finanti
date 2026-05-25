export type IncomeEntry = {
  id: string
  amount: number
  receivedAt: Date
  budgetMonth: Date
  incomeSourceId: string | null
  sourceName: string
  sourceColor: string
  description: string | null
}

export type IncomesBySource = {
  sourceId: string | null
  sourceName: string
  sourceColor: string
  total: number
  entries: IncomeEntry[]
}

export function sumIncomes(entries: { amount: number }[]): number {
  return entries.reduce((sum, e) => sum + e.amount, 0)
}

export function groupIncomesBySource(entries: IncomeEntry[]): IncomesBySource[] {
  const map = new Map<string, IncomesBySource>()

  for (const entry of entries) {
    const key = entry.sourceName
    const existing = map.get(key)
    if (existing) {
      existing.total += entry.amount
      existing.entries.push(entry)
    } else {
      map.set(key, {
        sourceId: null,
        sourceName: entry.sourceName,
        sourceColor: entry.sourceColor,
        total: entry.amount,
        entries: [entry],
      })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}
