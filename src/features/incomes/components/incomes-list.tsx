'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { sumIncomes, groupIncomesBySource } from '@/features/incomes/domain'
import type { IncomeRow } from '@/features/incomes/queries'
import { updateIncome, archiveIncome } from '@/features/incomes/actions'

const fmt = new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' })

function formatCurrency(n: number): string {
  return fmt.format(n)
}

type IncomeSource = { id: string; name: string }

type Props = {
  entries: IncomeRow[]
  year: number
  month: number
  incomeSources: IncomeSource[]
}

type IncomeRowProps = {
  entry: IncomeRow
  incomeSources: IncomeSource[]
}

function IncomeEntryRow({ entry, incomeSources }: IncomeRowProps) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [amount, setAmount] = useState(String(entry.amount))
  const [receivedAt, setReceivedAt] = useState(entry.receivedAt.toISOString().slice(0, 10))
  const [incomeSourceId, setIncomeSourceId] = useState(entry.incomeSourceId ?? '')
  const [description, setDescription] = useState(entry.description ?? '')

  function handleEdit() {
    setAmount(String(entry.amount))
    setReceivedAt(entry.receivedAt.toISOString().slice(0, 10))
    setIncomeSourceId(entry.incomeSourceId ?? '')
    setDescription(entry.description ?? '')
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
        await updateIncome({
          id: entry.id,
          amount: parsedAmount,
          receivedAt: new Date(receivedAt + 'T12:00:00.000Z').toISOString(),
          incomeSourceId: incomeSourceId || null,
          description: description || null,
        })
        setEditing(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  function handleArchive() {
    if (!window.confirm('¿Archivar este ingreso?')) return
    setError(null)
    startTransition(async () => {
      try {
        await archiveIncome(entry.id)
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
            <label className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1 block">Fecha cobro</label>
            <input
              type="date"
              value={receivedAt}
              onChange={(e) => setReceivedAt(e.target.value)}
              className="bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1] w-full"
              disabled={isPending}
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1 block">Fuente</label>
          <select
            value={incomeSourceId}
            onChange={(e) => setIncomeSourceId(e.target.value)}
            className="bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1] w-full"
            disabled={isPending}
          >
            <option value="">Sin fuente</option>
            {incomeSources.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
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
          <span className="text-xs text-[#94A3B8]">
            {format(entry.receivedAt, 'dd/MM', { locale: es })}
          </span>
          {entry.description && (
            <span className="text-xs text-[#64748B]">{entry.description}</span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-4">
          <span className="text-sm text-emerald-400">{formatCurrency(entry.amount)}</span>
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

export function IncomesList({ entries, incomeSources }: Props) {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl bg-[#141925] border border-[#1E2A3A] px-5 py-8 text-center">
        <p className="text-[#64748B] text-sm">
          No hay ingresos registrados para este mes. Ciérralos desde Recap.
        </p>
      </div>
    )
  }

  const total = sumIncomes(entries)
  const groups = groupIncomesBySource(entries)

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="rounded-xl bg-[#141925] border border-[#1E2A3A] px-5 py-4 flex justify-between items-center">
        <span className="text-[#64748B] text-sm">Total ingresos</span>
        <span className="text-xl font-bold text-emerald-400">{formatCurrency(total)}</span>
      </div>

      {/* Groups by source */}
      {groups.map((group) => (
        <div
          key={group.sourceName}
          className="rounded-xl bg-[#141925] border border-[#1E2A3A] overflow-hidden"
        >
          {/* Group header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-[#1E2A3A]">
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: group.sourceColor }}
              />
              <span className="text-sm font-medium text-white">{group.sourceName}</span>
            </div>
            <span className="text-sm font-semibold text-emerald-400">
              {formatCurrency(group.total)}
            </span>
          </div>

          {/* Entries */}
          <div className="px-5">
            {group.entries.map((entry) => (
              <IncomeEntryRow key={entry.id} entry={entry} incomeSources={incomeSources} />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
