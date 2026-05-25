export type AccountSummary = {
  id: string
  name: string
  color: string
  currentBalance: number
  previousBalance: number | null
  monthlyChange: number | null
  monthlyChangePct: number | null
}

export type EvolutionPoint = {
  month: string // 'YYYY-MM'
  total: number
}

export type InvestmentEvolutionPoint = { month: string; contributions: number; gain: number }

export type MonthlyPnlPoint = {
  month: string // 'YYYY-MM'
  income: number
  expenses: number
  invGain: number
}

export type DashboardSummary = {
  totalBalance: number
  tai: number
  tdi: number
  latestSnapshotMonth: Date | null
  allEvolution: EvolutionPoint[]
  accounts: AccountSummary[]
  monthlyExpenses: number
  monthlyIncome: number
  hasCurrentMonthSnapshot: boolean
  currentYear: number
  currentMonth: number
  currentMonthLabel: string
  monthlyPnl: MonthlyPnlPoint[]
}

export function computeAccountSummary(
  account: { id: string; name: string; color: string },
  latestClosing: number | null,
  previousClosing: number | null,
): AccountSummary {
  const currentBalance = latestClosing ?? 0

  let monthlyChange: number | null = null
  let monthlyChangePct: number | null = null

  if (latestClosing != null && previousClosing != null) {
    monthlyChange = latestClosing - previousClosing
    if (previousClosing === 0) {
      monthlyChangePct = null
    } else {
      monthlyChangePct = Math.round((monthlyChange / previousClosing) * 100 * 100) / 100
    }
  }

  return {
    id: account.id,
    name: account.name,
    color: account.color,
    currentBalance,
    previousBalance: previousClosing,
    monthlyChange,
    monthlyChangePct,
  }
}

export function computeTotals(snapshots: { openingBalance: number; closingBalance: number }[]): {
  tai: number
  tdi: number
  totalBalance: number
} {
  const tai = snapshots.reduce((acc, s) => acc + s.openingBalance, 0)
  const tdi = snapshots.reduce((acc, s) => acc + s.closingBalance, 0)
  return { tai, tdi, totalBalance: tdi }
}

export function formatEvolutionMonth(date: Date): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`
}

// ─── Dashboard budget summary ─────────────────────────────────────────────────

/** Pure function mirroring the SQL COALESCE in getInvestmentMonthlyData — used for tests. */
export function resolveGain(gainManual: number | null, closing: number, opening: number, contributions: number): number {
  return gainManual ?? (closing - opening - contributions)
}

export type BudgetLineDisplay = {
  label: string
  color: string
  planned: number
  actual: number
  remaining: number
  overBudget: boolean
}

export type DashboardBudgetAnalysis = {
  gastoLines: BudgetLineDisplay[]
  inversionLines: BudgetLineDisplay[]
  totalPlanned: number
  totalActual: number
}

type RawBudgetLine = {
  categoryId: string | null
  assetClassId: string | null
  plannedAmount: number
  actualAmount: number
  categoryName: string | null
  categoryColor: string | null
  assetClassName: string | null
  assetClassColor: string | null
}

export function computeDashboardBudgetSummary(lines: RawBudgetLine[]): DashboardBudgetAnalysis {
  const toDisplay = (l: RawBudgetLine): BudgetLineDisplay => ({
    label: l.categoryId != null ? (l.categoryName ?? 'Sin nombre') : (l.assetClassName ?? 'Sin nombre'),
    color: l.categoryId != null ? (l.categoryColor ?? '#6366F1') : (l.assetClassColor ?? '#10B981'),
    planned: l.plannedAmount,
    actual: l.actualAmount,
    remaining: l.plannedAmount - l.actualAmount,
    overBudget: l.actualAmount > l.plannedAmount,
  })

  const gastoLines = lines.filter(l => l.categoryId != null).map(toDisplay)
  const inversionLines = lines.filter(l => l.assetClassId != null).map(toDisplay)

  const totalPlanned = lines.reduce((sum, l) => sum + l.plannedAmount, 0)
  const totalActual = lines.reduce((sum, l) => sum + l.actualAmount, 0)

  return { gastoLines, inversionLines, totalPlanned, totalActual }
}
