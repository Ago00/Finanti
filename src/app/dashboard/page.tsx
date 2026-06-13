import { requireUser } from '@/lib/auth'
import { getDashboardRaw, getDashboardBudgetLines, getMonthlyPnlData, getMonthlyContributions } from '@/features/dashboard/queries'
import {
  computeAccountSummary,
  computeTotals,
  formatEvolutionMonth,
  computeDashboardBudgetSummary,
} from '@/features/dashboard/domain'
import type { DashboardSummary, EvolutionPoint, AccountSummary } from '@/features/dashboard/domain'
import { DashboardView } from '@/features/dashboard/components/dashboard-view'
import { BudgetSummaryWidget } from '@/features/dashboard/components/budget-summary-widget'
import { formatMonthLabel } from '@/lib/dates'

export default async function DashboardPage() {
  await requireUser()

  const now = new Date()
  const currentYear = now.getUTCFullYear()
  const currentMonth = now.getUTCMonth() + 1
  const currentMonthStart = new Date(Date.UTC(currentYear, currentMonth - 1, 1))
  const currentMonthEnd = new Date(Date.UTC(currentYear, currentMonth, 1))

  // Sequential execution to avoid PgBouncer transaction-mode connection exhaustion
  const raw = await getDashboardRaw()
  const budgetLines = await getDashboardBudgetLines(currentMonthStart, currentMonthEnd)
  const monthlyPnl = await getMonthlyPnlData()
  const monthlyContributions = await getMonthlyContributions()

  // Group last 2 snapshots per account
  const snapshotsByAccount = new Map<string, typeof raw.recentSnapshots>()
  for (const s of raw.recentSnapshots) {
    const list = snapshotsByAccount.get(s.accountId) ?? []
    list.push(s)
    snapshotsByAccount.set(s.accountId, list)
  }

  // Income adjustments: accountId:monthMs → total
  const incomeAdjMap = new Map<string, number>()
  for (const adj of raw.incomeAdjustments) {
    const key = `${adj.accountId}:${adj.month.getTime()}`
    incomeAdjMap.set(key, (incomeAdjMap.get(key) ?? 0) + adj.total)
  }
  const incomeAdj = (accountId: string, month: Date) =>
    incomeAdjMap.get(`${accountId}:${month.getTime()}`) ?? 0

  // Find the most recent month that has snapshots
  const allMonths = raw.recentSnapshots.map(s => s.month.getTime())
  const latestMonth = allMonths.length > 0 ? new Date(Math.max(...allMonths)) : null

  // TAI / TDI / totalBalance from the latest month's snapshots (+ income adjustments)
  const latestSnaps = latestMonth
    ? raw.recentSnapshots
        .filter(s => s.month.getTime() === latestMonth.getTime())
        .map(s => ({ ...s, closingBalance: s.closingBalance + incomeAdj(s.accountId, s.month) }))
    : []
  const { tai, tdi, totalBalance } = computeTotals(latestSnaps)

  // Build per-account summaries (effective closing = snapshot + income adjustment)
  const accounts: AccountSummary[] = raw.activeAccounts.map(acc => {
    const snaps = (snapshotsByAccount.get(acc.id) ?? []).sort(
      (a, b) => b.month.getTime() - a.month.getTime(),
    )
    const latestSnap = snaps[0]
    const prevSnap = snaps[1]
    const effectiveClosing = latestSnap
      ? latestSnap.closingBalance + incomeAdj(acc.id, latestSnap.month)
      : null
    return computeAccountSummary(acc, effectiveClosing, prevSnap?.closingBalance ?? null)
  })

  // Income adjustments summed by month for evolution chart
  const incomeAdjByMonth = new Map<number, number>()
  for (const adj of raw.incomeAdjustments) {
    const key = adj.month.getTime()
    incomeAdjByMonth.set(key, (incomeAdjByMonth.get(key) ?? 0) + adj.total)
  }

  // All evolution points with income adjustments applied
  const allEvolution: EvolutionPoint[] = raw.monthlyTotals
    .map(m => ({
      month: formatEvolutionMonth(m.month),
      total: m.total + (incomeAdjByMonth.get(m.month.getTime()) ?? 0),
    }))

  // Current month snapshot check
  const hasCurrentMonthSnapshot = latestMonth !== null
    && latestMonth.getUTCFullYear() === currentYear
    && latestMonth.getUTCMonth() + 1 === currentMonth

  const currentMonthLabel = formatMonthLabel(currentYear, currentMonth)

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
    monthlyPnl,
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
