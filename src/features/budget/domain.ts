// ─── Types ────────────────────────────────────────────────────────────────────

export type BudgetLineInput = {
  label: string
  color: string
  type: 'gasto' | 'inversion'
  planned: number
  actual: number
  // Passthrough fields for inline editing — not used in calculations
  categoryId?: string | null
  assetClassId?: string | null
  month?: string // ISO datetime string
}

export type BudgetLine = BudgetLineInput & {
  restante: number
  progress: number
  overBudget: boolean
}

export type BudgetAnalysis = {
  month: Date
  totalIncome: number
  sinAsignar: number
  gastoLines: BudgetLine[]
  inversionLines: BudgetLine[]
  totalPlanned: number
  totalActual: number
  totalRestante: number
}

// ─── Pure functions ───────────────────────────────────────────────────────────

export function computeBudgetLine(input: BudgetLineInput): BudgetLine {
  const restante = input.planned - input.actual
  const progress =
    input.planned > 0 ? Math.min(100, Math.round((input.actual / input.planned) * 100)) : 0
  const overBudget = input.actual > input.planned

  return { ...input, restante, progress, overBudget }
}

export function computeBudgetAnalysis(params: {
  month: Date
  totalIncome: number
  lines: BudgetLineInput[]
}): BudgetAnalysis {
  const { month, totalIncome, lines } = params

  const allLines = lines.map(computeBudgetLine)

  const gastoLines = allLines
    .filter(l => l.type === 'gasto')
    .sort((a, b) => b.planned - a.planned)

  const inversionLines = allLines
    .filter(l => l.type === 'inversion')
    .sort((a, b) => b.planned - a.planned)

  const totalPlanned = lines.reduce((sum, l) => sum + l.planned, 0)
  const totalActual = lines.reduce((sum, l) => sum + l.actual, 0)
  const totalRestante = totalPlanned - totalActual
  const sinAsignar = totalIncome - totalPlanned

  return {
    month,
    totalIncome,
    sinAsignar,
    gastoLines,
    inversionLines,
    totalPlanned,
    totalActual,
    totalRestante,
  }
}
