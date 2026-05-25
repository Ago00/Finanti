'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

type Props = {
  categories: { id: string; name: string }[]
  groups: { id: string; name: string }[]
  year: number
  month: number
  currentCategoryId: string | undefined
  currentGroupId: string | undefined
  currentPrescindible: boolean
}

export function TransactionFilters({
  categories,
  groups,
  year,
  month,
  currentCategoryId,
  currentGroupId,
  currentPrescindible,
}: Props) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams({ year: String(year), month: String(month) })
    if (currentCategoryId && key !== 'categoryId') params.set('categoryId', currentCategoryId)
    if (currentGroupId && key !== 'groupId') params.set('groupId', currentGroupId)
    if (currentPrescindible && key !== 'prescindible') params.set('prescindible', 'true')
    if (value) params.set(key, value)
    startTransition(() => router.push(`/gastos/detalle?${params.toString()}`))
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <select
        value={currentCategoryId ?? ''}
        onChange={e => updateFilter('categoryId', e.target.value)}
        className="bg-[#141925] border border-[#1E2A3A] rounded-lg px-3 py-1.5 text-[#94A3B8] text-xs"
      >
        <option value="">Todas las categorías</option>
        {categories.map(c => (
          <option key={c.id} value={c.id}>{c.name}</option>
        ))}
      </select>
      <select
        value={currentGroupId ?? ''}
        onChange={e => updateFilter('groupId', e.target.value)}
        className="bg-[#141925] border border-[#1E2A3A] rounded-lg px-3 py-1.5 text-[#94A3B8] text-xs"
      >
        <option value="">Todos los grupos</option>
        {groups.map(g => (
          <option key={g.id} value={g.id}>{g.name}</option>
        ))}
      </select>
      <button
        onClick={() => updateFilter('prescindible', currentPrescindible ? '' : 'true')}
        className={`px-3 py-1.5 rounded-lg text-xs border ${
          currentPrescindible
            ? 'bg-[#6366F1] border-[#6366F1] text-white'
            : 'bg-[#141925] border-[#1E2A3A] text-[#94A3B8]'
        }`}
      >
        Solo prescindibles
      </button>
    </div>
  )
}
