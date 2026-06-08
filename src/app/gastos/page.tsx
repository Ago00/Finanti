import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { listTransactionsByMonth, listCategories, listGroups, listCategoryTotals, listCategoryTotalsByMonths, listMonthlyExpenseTotals, getBudgetTotalForMonth } from '@/features/transactions/queries'
import type { CategoryTotal } from '@/features/transactions/queries'
import { sumTransactions } from '@/features/transactions/domain'
import { MonthPicker } from '@/features/transactions/components/month-picker'
import { QuickAddForm } from '@/features/transactions/components/quick-add-form'
import { TransactionDetailToggle } from '@/features/transactions/components/transaction-detail-toggle'
import { SpendingCharts } from '@/features/transactions/components/spending-charts'
import { MonthFilterSchema } from '@/features/transactions/schemas'
import { formatCurrency } from '@/lib/formatting'

type SearchParams = Promise<{ year?: string; month?: string }>

export default async function GastosPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser()

  const params = await searchParams
  const now = new Date()
  const parsed = MonthFilterSchema.safeParse({
    year: params.year ? parseInt(params.year) : now.getUTCFullYear(),
    month: params.month ? parseInt(params.month) : now.getUTCMonth() + 1,
  })
  const { year, month } = parsed.success
    ? parsed.data
    : { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 }

  // Sequential execution to avoid PgBouncer transaction-mode connection exhaustion
  const txns = await listTransactionsByMonth(year, month)
  const categories = await listCategories()
  const groups = await listGroups()
  const categoryTotals = await listCategoryTotals(year, month)
  const monthlyTotals = await listMonthlyExpenseTotals()
  const budgetTotal = await getBudgetTotalForMonth(year, month)

  // Fetch the prior 3 months for comparatives
  const prevMonths: { year: number; month: number }[] = []
  for (let i = 1; i <= 3; i++) {
    const d = new Date(Date.UTC(year, month - 1 - i, 1))
    prevMonths.push({ year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 })
  }
  const prevMonthsByMonths = await listCategoryTotalsByMonths(prevMonths)
  const toKey = (y: number, m: number) => `${y}-${String(m).padStart(2, '0')}`
  const prevMonthTotals = prevMonthsByMonths[toKey(prevMonths[0].year, prevMonths[0].month)] ?? []
  const m2Totals = prevMonthsByMonths[toKey(prevMonths[1].year, prevMonths[1].month)] ?? []
  const m3Totals = prevMonthsByMonths[toKey(prevMonths[2].year, prevMonths[2].month)] ?? []

  // Build 3-month average per category by merging all three months
  const threeMonthAvgMap = new Map<string, { name: string | null; sum: number; count: number }>()
  for (const t of [...prevMonthTotals, ...m2Totals, ...m3Totals]) {
    const key = t.categoryId ?? '__null__'
    const existing = threeMonthAvgMap.get(key)
    if (existing) {
      existing.sum += t.total
      existing.count += 1
    } else {
      threeMonthAvgMap.set(key, { name: t.categoryName, sum: t.total, count: 1 })
    }
  }
  const threeMonthAvgCategoryTotals: CategoryTotal[] = Array.from(threeMonthAvgMap.entries()).map(
    ([key, v]) => ({
      categoryId: key === '__null__' ? null : key,
      categoryName: v.name,
      total: v.sum / v.count,
    }),
  )

  const total = sumTransactions(txns)

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-8 px-4">
      <div className="max-w-lg mx-auto space-y-5">

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Gastos</h1>
          <Link
            href={`/presupuesto?year=${year}&month=${month}`}
            className="text-xs text-[#6366F1] hover:text-[#818CF8]"
          >
            Ver presupuesto →
          </Link>
        </div>

        <MonthPicker year={year} month={month} />

        <div className="rounded-xl bg-[#141925] border border-[#1E2A3A] px-5 py-4 flex justify-between items-center">
          <span className="text-[#64748B] text-sm">Total del mes</span>
          <span className="text-xl font-bold text-red-400">
            {formatCurrency(-Math.abs(total))}
          </span>
        </div>

        <SpendingCharts
          categoryTotals={categoryTotals}
          monthlyTotals={monthlyTotals}
          currentMonthTotal={total}
          budgetTotal={budgetTotal}
          prevMonthCategoryTotals={prevMonthTotals}
          threeMonthAvgCategoryTotals={threeMonthAvgCategoryTotals}
          year={year}
          month={month}
        />

        <QuickAddForm categories={categories} groups={groups} />

        <TransactionDetailToggle count={txns.length} year={year} month={month} />

      </div>
    </div>
  )
}
