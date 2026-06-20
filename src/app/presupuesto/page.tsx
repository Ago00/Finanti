import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import {
  getInvestmentExecutions,
  getMonthlyBudgetMeta,
  getIncomeForPreviousMonth,
  getPlannedInvestmentLines,
} from '@/features/budget/queries'
import type { InvestmentLine } from '@/features/budget/domain'
import { InvestmentPanel } from '@/features/budget/components/investment-panel'
import { MonthlyBudgetForm } from '@/features/budget/components/monthly-budget-form'
import { MonthlyBudgetSummary } from '@/features/budget/components/monthly-budget-summary'
import { formatMonthLabel } from '@/lib/dates'
import { listAssetClasses } from '@/features/asset-classes/queries'

type SearchParams = Promise<{ year?: string; month?: string }>

export default async function PresupuestoPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser()

  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? '') || now.getUTCFullYear()
  const month = parseInt(params.month ?? '') || (now.getUTCMonth() + 1)

  const monthDate = new Date(Date.UTC(year, month - 1, 1))

  // Sequential execution to avoid PgBouncer transaction-mode connection exhaustion
  const executions = await getInvestmentExecutions(monthDate)
  const allAssetClasses = await listAssetClasses()
  const budgetMeta = await getMonthlyBudgetMeta(monthDate)
  const previousMonthIncome = await getIncomeForPreviousMonth(monthDate)
  const savedInvestmentLines = await getPlannedInvestmentLines(monthDate)

  const hasBudget = budgetMeta?.plannedExpenses != null

  // Build investment lines for the InvestmentPanel
  const confirmedBudgetIds = new Set(executions.filter(e => e.budgetId).map(e => e.budgetId!))

  const investmentLines: InvestmentLine[] = savedInvestmentLines.map(l => {
    const execution = executions.find(e => e.budgetId === l.budgetId)
    return {
      id: l.budgetId,
      assetClassId: l.assetClassId,
      assetClassName: l.assetClassName,
      plannedAmount: l.plannedAmount,
      isConfirmed: confirmedBudgetIds.has(l.budgetId),
      executedAt: execution?.executedAt ?? null,
      budgetId: l.budgetId,
    }
  })

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear  = month === 12 ? year + 1 : year
  const isFutureOrCurrent =
    year > now.getUTCFullYear() ||
    (year === now.getUTCFullYear() && month > now.getUTCMonth() + 1)

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-8 px-4 sm:px-6 pb-24">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-white">Presupuesto</h1>
          <div className="flex items-center gap-1">
            <Link
              href={`/presupuesto?year=${prevYear}&month=${prevMonth}`}
              className="text-[#64748B] hover:text-white px-2"
            >
              ←
            </Link>
            {isFutureOrCurrent ? (
              <span className="text-[#64748B] px-2 opacity-40 cursor-not-allowed">→</span>
            ) : (
              <Link
                href={`/presupuesto?year=${nextYear}&month=${nextMonth}`}
                className="text-[#64748B] hover:text-white px-2"
              >
                →
              </Link>
            )}
          </div>
        </div>
        <p className="text-[#94A3B8] text-sm -mt-4">{formatMonthLabel(year, month)}</p>

        {hasBudget ? (
          <>
            <MonthlyBudgetSummary
              month={monthDate.toISOString()}
              monthLabel={formatMonthLabel(year, month)}
              previousMonthIncome={previousMonthIncome}
              plannedExpenses={budgetMeta!.plannedExpenses!}
              investmentLines={savedInvestmentLines.map(l => ({
                assetClassId: l.assetClassId,
                assetClassName: l.assetClassName,
                amount: l.plannedAmount,
              }))}
              allAssetClasses={allAssetClasses}
            />

            <div className="space-y-3">
              <h2 className="text-[#94A3B8] text-xs uppercase tracking-wide">Panel de inversiones</h2>
              <InvestmentPanel investmentLines={investmentLines} month={monthDate} assetClasses={allAssetClasses} />
            </div>
          </>
        ) : (
          <MonthlyBudgetForm
            month={monthDate.toISOString()}
            monthLabel={formatMonthLabel(year, month)}
            previousMonthIncome={previousMonthIncome}
            savedPlannedExpenses={null}
            savedInvestmentLines={[]}
            allAssetClasses={allAssetClasses}
          />
        )}
      </div>
    </div>
  )
}
