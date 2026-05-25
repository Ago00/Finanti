import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getRecapPrefill, getExistingSnapshotsForMonth } from '@/features/recap/queries'
import { RecapWizard } from '@/features/recap/components/recap-wizard'
import { formatMonthLabel } from '@/lib/dates'

type SearchParams = Promise<{ year?: string; month?: string }>

export default async function RecapPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const params = await searchParams

  const now = new Date()
  const nowYear = now.getUTCFullYear()
  const nowMonth = now.getUTCMonth() + 1

  const parsedYear = parseInt(params.year ?? '', 10)
  const parsedMonth = parseInt(params.month ?? '', 10)

  const year =
    !isNaN(parsedYear) && parsedYear >= 2020 ? parsedYear : nowYear
  const month =
    !isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12 ? parsedMonth : nowMonth

  const monthDate = new Date(Date.UTC(year, month - 1, 1))

  const [prefill, existingSnapshots] = await Promise.all([
    getRecapPrefill(monthDate),
    getExistingSnapshotsForMonth(monthDate),
  ])

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year

  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  const isCurrent = year === nowYear && month === nowMonth
  const isFuture = year > nowYear || (year === nowYear && month > nowMonth)
  const disableNext = isCurrent || isFuture

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-12 px-6">
      <div className="max-w-lg mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">Recap</h1>
            <p className="text-[#94A3B8] text-sm">{formatMonthLabel(year, month)}</p>
          </div>
          <div className="flex items-center gap-1">
            <Link
              href={`/recap?year=${prevYear}&month=${prevMonth}`}
              className="text-[#64748B] hover:text-white px-2"
            >
              ←
            </Link>
            {disableNext ? (
              <span className="text-[#64748B] px-2 opacity-40 cursor-not-allowed">→</span>
            ) : (
              <Link
                href={`/recap?year=${nextYear}&month=${nextMonth}`}
                className="text-[#64748B] hover:text-white px-2"
              >
                →
              </Link>
            )}
          </div>
        </div>

        <RecapWizard
          prefill={prefill}
          existingSnapshots={existingSnapshots}
          month={{ year, month }}
        />
      </div>
    </div>
  )
}
