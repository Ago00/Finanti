import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import {
  listTransactionsByMonthFiltered,
  listCategories,
  listGroups,
} from '@/features/transactions/queries'
import { sumTransactions } from '@/features/transactions/domain'
import { TransactionList } from '@/features/transactions/components/transaction-list'
import { TransactionFilters } from '@/features/transactions/components/transaction-filters'
import { MonthFilterSchema } from '@/features/transactions/schemas'
import { formatMonthLabel } from '@/lib/dates'
import { formatCurrency } from '@/lib/formatting'

type SearchParams = Promise<{
  year?: string
  month?: string
  categoryId?: string
  groupId?: string
  prescindible?: string
}>

export default async function GastosDetallePage({ searchParams }: { searchParams: SearchParams }) {
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

  const categoryId = params.categoryId
  const groupId = params.groupId
  const prescindible = params.prescindible === 'true' ? true : undefined

  // Sequential execution to avoid PgBouncer transaction-mode connection exhaustion
  const txns = await listTransactionsByMonthFiltered(year, month, {
    categoryId,
    groupId,
    prescindible,
  })
  const categories = await listCategories()
  const groups = await listGroups()

  const total = sumTransactions(txns)

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-8 px-4 pb-24">
      <div className="max-w-lg mx-auto space-y-4">

        <div className="flex items-center gap-3">
          <Link
            href={`/gastos?year=${year}&month=${month}`}
            className="text-sm text-[#6366F1] hover:text-[#818CF8]"
          >
            ← Gastos
          </Link>
          <h1 className="text-xl font-semibold text-white">
            Detalle · {formatMonthLabel(year, month)}
          </h1>
        </div>

        <TransactionFilters
          categories={categories}
          groups={groups}
          year={year}
          month={month}
          currentCategoryId={categoryId}
          currentGroupId={groupId}
          currentPrescindible={prescindible === true}
        />

        <div className="rounded-xl bg-[#141925] border border-[#1E2A3A] px-5 py-4 flex justify-between items-center">
          <span className="text-[#64748B] text-sm">Total</span>
          <span className="text-xl font-bold text-red-400">
            {formatCurrency(-Math.abs(total))}
          </span>
        </div>

        <div className="rounded-xl bg-[#141925] border border-[#1E2A3A] p-4">
          <TransactionList transactions={txns} categories={categories} groups={groups} />
        </div>

      </div>
    </div>
  )
}
