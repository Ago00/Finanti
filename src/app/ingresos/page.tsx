import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { listIncomesByBudgetMonth } from '@/features/incomes/queries'
import { IncomesList } from '@/features/incomes/components/incomes-list'
import { listIncomeSources } from '@/features/income-sources/queries'
import { formatMonthLabel } from '@/lib/dates'

type SearchParams = Promise<{ year?: string; month?: string }>

export default async function IngresosPage({ searchParams }: { searchParams: SearchParams }) {
  await requireUser()

  const params = await searchParams
  const now = new Date()
  const year = parseInt(params.year ?? '') || now.getUTCFullYear()
  const month = parseInt(params.month ?? '') || (now.getUTCMonth() + 1)

  // Sequential execution to avoid PgBouncer transaction-mode connection exhaustion
  const entries = await listIncomesByBudgetMonth(year, month)
  const incomeSources = await listIncomeSources()

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear  = month === 12 ? year + 1 : year
  const disableNext = year > now.getUTCFullYear() ||
    (year === now.getUTCFullYear() && month > now.getUTCMonth() + 1)

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-8 px-4 pb-24">
      <div className="max-w-lg mx-auto space-y-5">
        <Link href="/dashboard" className="flex items-center gap-1 text-sm text-[#64748B] hover:text-[#94A3B8]">
          ← Volver
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-white">Ingresos</h1>
            <p className="text-[#94A3B8] text-sm mt-0.5">{formatMonthLabel(year, month)}</p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/ingresos?year=${prevYear}&month=${prevMonth}`}
              className="text-[#64748B] hover:text-white px-2"
            >
              ←
            </Link>
            {disableNext
              ? <span className="text-[#64748B] px-2 opacity-40 cursor-not-allowed">→</span>
              : <Link
                  href={`/ingresos?year=${nextYear}&month=${nextMonth}`}
                  className="text-[#64748B] hover:text-white px-2"
                >
                  →
                </Link>
            }
          </div>
        </div>
        <IncomesList entries={entries} year={year} month={month} incomeSources={incomeSources} />
      </div>
    </div>
  )
}
