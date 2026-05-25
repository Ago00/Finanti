'use client'

import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type Props = {
  year: number
  month: number
}

export function MonthPicker({ year, month }: Props) {
  const router = useRouter()

  const now = new Date()
  const isAtCurrentMonth = year === now.getUTCFullYear() && month === now.getUTCMonth() + 1

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear = month === 1 ? year - 1 : year
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year

  function navigate(y: number, m: number) {
    router.push(`/gastos?year=${y}&month=${m}`)
  }

  const label = format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: es })
  const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1)

  return (
    <div className="flex items-center justify-between gap-4">
      <button
        onClick={() => navigate(prevYear, prevMonth)}
        className="px-2 py-1 text-[#64748B] hover:text-white transition-colors"
        aria-label="Mes anterior"
      >
        <ChevronLeft size={20} />
      </button>

      <span className="text-white font-medium capitalize">{capitalizedLabel}</span>

      <button
        onClick={() => navigate(nextYear, nextMonth)}
        disabled={isAtCurrentMonth}
        className="px-2 py-1 text-[#64748B] hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        aria-label="Mes siguiente"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  )
}
