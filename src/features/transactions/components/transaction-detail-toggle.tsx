'use client'

import Link from 'next/link'

type Props = { count: number; year: number; month: number }

export function TransactionDetailToggle({ count, year, month }: Props) {
  return (
    <Link
      href={`/gastos/detalle?year=${year}&month=${month}`}
      className="w-full flex items-center justify-center gap-2 bg-[#141925] border border-[#1E2A3A] rounded-xl px-4 py-3 text-sm text-[#94A3B8] hover:text-white hover:border-[#6366F1] transition-colors"
    >
      Ver detalle de gastos ({count})
    </Link>
  )
}
