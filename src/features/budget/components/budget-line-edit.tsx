'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateBudgetLine } from '@/features/budget/actions'

type Props = {
  month: string // ISO datetime
  categoryId: string | null
  assetClassId: string | null
  currentPlanned: number
  label: string
}

export function BudgetLineEdit({ month, categoryId, assetClassId, currentPlanned, label }: Props) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(String(currentPlanned))
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSave() {
    const n = parseFloat(value)
    if (isNaN(n) || n <= 0) return
    startTransition(async () => {
      await updateBudgetLine({ month, categoryId, assetClassId, plannedAmount: n })
      setEditing(false)
      router.refresh()
    })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSave()
    if (e.key === 'Escape') { setEditing(false); setValue(String(currentPlanned)) }
  }

  const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number"
          step="0.01"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          autoFocus
          className="w-24 bg-[#0B0F1A] border border-[#6366F1] rounded px-2 py-0.5 text-white text-xs text-right focus:outline-none"
          disabled={isPending}
          aria-label={`Editar presupuesto de ${label}`}
        />
        <span className="text-[#64748B] text-xs">€</span>
      </div>
    )
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="text-xs text-[#94A3B8] hover:text-white hover:underline"
      title="Click para editar"
    >
      {fmt.format(currentPlanned)}
    </button>
  )
}
