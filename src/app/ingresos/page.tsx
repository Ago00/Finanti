import { requireUser } from '@/lib/auth'
import { listIncomesByBudgetMonth } from '@/features/incomes/queries'
import { listIncomeSources } from '@/features/income-sources/queries'
import { getActiveAccountOptions } from '@/features/accounts/queries'
import { IncomesView } from '@/features/incomes/components/incomes-view'
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
  const accounts = await getActiveAccountOptions()

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear  = month === 12 ? year + 1 : year
  const disableNext = year > now.getUTCFullYear() ||
    (year === now.getUTCFullYear() && month > now.getUTCMonth() + 1)

  return (
    <IncomesView
      entries={entries}
      year={year}
      month={month}
      monthLabel={formatMonthLabel(year, month)}
      incomeSources={incomeSources.map(s => ({ id: s.id, name: s.name, color: s.color }))}
      accounts={accounts}
      prevYear={prevYear}
      prevMonth={prevMonth}
      nextYear={nextYear}
      nextMonth={nextMonth}
      disableNext={disableNext}
    />
  )
}
