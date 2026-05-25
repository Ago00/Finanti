import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getMonthlyBudgetData } from '@/features/budget/queries'
import { computeBudgetAnalysis } from '@/features/budget/domain'
import { BudgetView } from '@/features/budget/components/budget-view'
import { formatMonthLabel } from '@/lib/dates'

type SearchParams = Promise<{ year?: string; month?: string }>

export default async function PresupuestoPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? '') || now.getUTCFullYear()
  const month = parseInt(params.month ?? '') || (now.getUTCMonth() + 1)

  const monthDate = new Date(Date.UTC(year, month - 1, 1))
  const raw = await getMonthlyBudgetData(monthDate)

  const analysis = computeBudgetAnalysis({
    month: monthDate,
    totalIncome: raw.totalIncome,
    lines: raw.lines.map(l => ({
      label: l.categoryName ?? l.assetClassName ?? 'Sin nombre',
      color: l.categoryColor ?? l.assetClassColor ?? '#6366F1',
      type: l.type,
      planned: l.plannedAmount,
      actual: l.actualAmount,
      categoryId: l.categoryId,
      assetClassId: l.assetClassId,
      month: l.month,
    })),
  })

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear  = month === 12 ? year + 1 : year
  const isFutureOrCurrent =
    year > now.getUTCFullYear() ||
    (year === now.getUTCFullYear() && month > now.getUTCMonth() + 1)

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-8 px-4">
      <div className="max-w-lg mx-auto space-y-6">
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

        <BudgetView analysis={analysis} />
      </div>
    </div>
  )
}
