import { requireUser } from '@/lib/auth'
import {
  getDashboardRaw,
  getDashboardBudgetLines,
  getMonthlyPnlData,
  getMonthlyContributions,
  getPreviousMonthIncome,
  getCurrentMonthInvestmentsTotal,
  getLivePatrimonyData,
} from '@/features/dashboard/queries'
import {
  computeAccountSummary,
  formatEvolutionMonth,
  computeDashboardBudgetSummary,
  computeLivePatrimony,
} from '@/features/dashboard/domain'
import type { DashboardSummary, EvolutionPoint, AccountSummary } from '@/features/dashboard/domain'
import { DashboardView } from '@/features/dashboard/components/dashboard-view'
import { BudgetSummaryWidget } from '@/features/dashboard/components/budget-summary-widget'
import { formatMonthLabel } from '@/lib/dates'
import { getMonthlyBudgetMeta } from '@/features/budget/queries'

export default async function DashboardPage() {
  await requireUser()

  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() + 1
  const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1))
  const currentMonthEnd = new Date(Date.UTC(currentYear, currentMonth, 1))
  const prevMonthYear = currentMonth === 1 ? currentYear - 1 : currentYear
  const prevMonthNum = currentMonth === 1 ? 12 : currentMonth - 1

  // Sequential execution to avoid PgBouncer transaction-mode connection exhaustion
  const raw = await getDashboardRaw()
  const livePatrimonyData = await getLivePatrimonyData()
  const budgetLines = await getDashboardBudgetLines(currentMonthStart, currentMonthEnd)
  const monthlyPnl = await getMonthlyPnlData()
  const monthlyContributions = await getMonthlyContributions()
  const previousMonthIncome = await getPreviousMonthIncome()
  const currentMonthInvestments = await getCurrentMonthInvestmentsTotal()
  const budgetMeta = await getMonthlyBudgetMeta(currentMonthStart)

  // plannedSavings is derived: prev month income - planned expenses - Σ planned investment lines.
  // Only set when the user has saved a budget plan (plannedExpenses exists in meta).
  const plannedSavings: number | null = (() => {
    if (budgetMeta?.plannedExpenses == null || previousMonthIncome == null) return null
    const plannedInvestments = budgetLines
      .filter(l => l.assetClassId != null)
      .reduce((s, l) => s + l.plannedAmount, 0)
    return previousMonthIncome - budgetMeta.plannedExpenses - plannedInvestments
  })()

  // Group last 2 snapshots per account
  const snapshotsByAccount = new Map<string, typeof raw.recentSnapshots>()
  for (const s of raw.recentSnapshots) {
    const list = snapshotsByAccount.get(s.accountId) ?? []
    list.push(s)
    snapshotsByAccount.set(s.accountId, list)
  }

  // Find the most recent month that has snapshots
  const allMonths = raw.recentSnapshots.map(s => s.month.getTime())
  const latestMonth = allMonths.length > 0 ? new Date(Math.max(...allMonths)) : null

  // Live patrimony total via unified formula (liquid snapshot + adjustments + investment snapshot)
  const { liveTotal: totalBalance } = computeLivePatrimony(livePatrimonyData)
  // TAI and TDI derived from latest snapshots (historical, no live adjustment)
  const latestSnaps = latestMonth
    ? raw.recentSnapshots.filter(s => s.month.getTime() === latestMonth.getTime())
    : []
  const tai = latestSnaps.reduce((acc, s) => acc + s.openingBalance, 0)
  const tdi = latestSnaps.reduce((acc, s) => acc + s.closingBalance, 0)

  // Build per-account summaries using snapshot closingBalance directly (no per-account live adjustment)
  const accounts: AccountSummary[] = raw.activeAccounts.map(acc => {
    const snaps = (snapshotsByAccount.get(acc.id) ?? []).sort(
      (a, b) => b.month.getTime() - a.month.getTime(),
    )
    const latestSnap = snaps[0]
    const prevSnap = snaps[1]
    return computeAccountSummary(acc, latestSnap?.closingBalance ?? null, prevSnap?.closingBalance ?? null)
  })

  // Historical evolution points — snapshot totals without live adjustment (they are historical facts)
  const allEvolution: EvolutionPoint[] = raw.monthlyTotals
    .map(m => ({
      month: formatEvolutionMonth(m.month),
      total: m.total,
    }))

  // Current month snapshot check
  const hasCurrentMonthSnapshot = latestMonth !== null
    && latestMonth.getUTCFullYear() === currentYear
    && latestMonth.getUTCMonth() + 1 === currentMonth

  const currentMonthLabel = formatMonthLabel(currentYear, currentMonth)

  // Short labels for widgets
  const currentMonthLabelShort = new Date(Date.UTC(currentYear, currentMonth - 1, 1))
    .toLocaleDateString('es-ES', { month: 'long', timeZone: 'UTC' })
    .replace(/^\w/, c => c.toUpperCase())
  const previousMonthLabelShort = new Date(Date.UTC(prevMonthYear, prevMonthNum - 1, 1))
    .toLocaleDateString('es-ES', { month: 'long', timeZone: 'UTC' })
    .replace(/^\w/, c => c.toUpperCase())

  // % change in total patrimony vs the previous month
  const sortedEvolution = [...allEvolution].sort((a, b) => a.month.localeCompare(b.month))
  const patrimonioChangePct: number | null = (() => {
    if (sortedEvolution.length < 2) return null
    const prev = sortedEvolution[sortedEvolution.length - 2].total
    const curr = sortedEvolution[sortedEvolution.length - 1].total
    if (prev === 0) return null
    return Math.round(((curr - prev) / prev) * 10000) / 100
  })()

  // Budget analysis
  const budgetAnalysis = budgetLines.length > 0
    ? computeDashboardBudgetSummary(budgetLines)
    : null

  // Reference income for ahorro calculation = most recent month with income > 0
  const referenceIncome = [...monthlyPnl].reverse().find(p => p.income > 0)?.income ?? 0

  const summary: DashboardSummary = {
    totalBalance,
    tai,
    tdi,
    latestSnapshotMonth: latestMonth,
    allEvolution,
    accounts,
    monthlyExpenses: raw.currentMonthExpenses,
    monthlyIncome: raw.currentMonthIncome,
    hasCurrentMonthSnapshot,
    currentYear,
    currentMonth,
    currentMonthLabel,
    currentMonthLabelShort,
    previousMonthLabelShort,
    monthlyPnl,
    previousMonthIncome,
    currentMonthInvestments,
    plannedSavings,
  }

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-8 px-4 sm:px-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-5">
        <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
        <DashboardView
          summary={summary}
          patrimonioChangePct={patrimonioChangePct}
          monthlyContributions={monthlyContributions}
          budgetWidget={
            <BudgetSummaryWidget
              analysis={budgetAnalysis}
              referenceIncome={referenceIncome}
              actualExpenses={raw.currentMonthExpenses}
              actualContributions={raw.currentMonthContributions}
              year={currentYear}
              month={currentMonth}
            />
          }
        />
      </div>
    </div>
  )
}
