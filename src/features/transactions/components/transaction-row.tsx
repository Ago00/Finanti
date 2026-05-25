'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { TransactionWithRefs } from '@/features/transactions/queries'
import { updateTransaction, archiveTransaction } from '@/features/transactions/actions'

type Props = {
  tx: TransactionWithRefs
  categories: { id: string; name: string }[]
  groups: { id: string; name: string }[]
}

function localDateTimeString(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

function formatAmount(amount: number): string {
  return fmt.format(-Math.abs(amount))
}

export function TransactionRow({ tx, categories, groups }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState(String(tx.amount))
  const [paidAt, setPaidAt] = useState(localDateTimeString(tx.paidAt))
  const [categoryId, setCategoryId] = useState(tx.categoryId ?? '')
  const [groupId, setGroupId] = useState(tx.groupId ?? '')
  const [description, setDescription] = useState(tx.description ?? '')
  const [prescindible, setPrescindible] = useState(tx.prescindible)

  function handleEdit() {
    setAmount(String(tx.amount))
    setPaidAt(localDateTimeString(tx.paidAt))
    setCategoryId(tx.categoryId ?? '')
    setGroupId(tx.groupId ?? '')
    setDescription(tx.description ?? '')
    setPrescindible(tx.prescindible)
    setError(null)
    setEditing(true)
  }

  function handleCancel() {
    setEditing(false)
    setError(null)
  }

  function handleSave() {
    const parsedAmount = parseFloat(amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('El importe debe ser un número positivo')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await updateTransaction({
          id: tx.id,
          amount: parsedAmount,
          paidAt: new Date(paidAt).toISOString(),
          categoryId: categoryId || null,
          groupId: groupId || null,
          description: description || null,
          prescindible,
        })
        setEditing(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  function handleArchive() {
    if (!window.confirm('¿Archivar este gasto?')) return
    setError(null)
    startTransition(async () => {
      try {
        await archiveTransaction(tx.id)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al archivar')
      }
    })
  }

  if (editing) {
    return (
      <div className="py-3 border-b border-[#1E2A3A] last:border-0 space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1 block">Importe</label>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1] w-full"
              disabled={isPending}
            />
          </div>
          <div>
            <label className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1 block">Fecha</label>
            <input
              type="datetime-local"
              value={paidAt}
              onChange={(e) => setPaidAt(e.target.value)}
              className="bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1] w-full"
              disabled={isPending}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1 block">Categoría</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1] w-full"
              disabled={isPending}
            >
              <option value="">Sin categoría</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1 block">Grupo</label>
            <select
              value={groupId}
              onChange={(e) => setGroupId(e.target.value)}
              className="bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1] w-full"
              disabled={isPending}
            >
              <option value="">Sin grupo</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1 block">Descripción</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1] w-full"
            disabled={isPending}
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id={`prescindible-${tx.id}`}
            type="checkbox"
            checked={prescindible}
            onChange={(e) => setPrescindible(e.target.checked)}
            disabled={isPending}
            className="accent-[#6366F1]"
          />
          <label htmlFor={`prescindible-${tx.id}`} className="text-sm text-[#94A3B8]">Prescindible</label>
        </div>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="px-3 py-1.5 rounded-lg bg-[#6366F1] text-white text-xs hover:bg-[#818CF8] disabled:opacity-40"
          >
            Guardar
          </button>
          <button
            onClick={handleCancel}
            disabled={isPending}
            className="text-[#64748B] hover:text-[#94A3B8] text-xs"
          >
            Cancelar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-2.5 border-b border-[#1E2A3A] last:border-0">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            {tx.categoryName ? (
              <span className="text-sm text-white">{tx.categoryName}</span>
            ) : (
              <span className="text-sm text-[#64748B]">Sin categoría</span>
            )}
            {tx.prescindible && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#64748B] shrink-0" />
            )}
          </div>
          {tx.description && (
            <span className="text-xs text-[#64748B]">{tx.description}</span>
          )}
          {tx.groupName && (
            <span className="bg-[#1E2A3A] text-[#94A3B8] text-[10px] px-1.5 py-0.5 rounded w-fit">
              {tx.groupName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0 ml-4">
          <span className="text-sm text-red-400">{formatAmount(tx.amount)}</span>
          <button
            onClick={handleEdit}
            disabled={isPending}
            className="text-[#64748B] hover:text-[#94A3B8] text-xs ml-1"
          >
            Editar
          </button>
          <button
            onClick={handleArchive}
            disabled={isPending}
            className="text-[#64748B] hover:text-red-400 text-base ml-1"
          >
            ×
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
    </div>
  )
}
