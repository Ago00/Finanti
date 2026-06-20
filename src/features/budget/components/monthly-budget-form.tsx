'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { Lock, Plus, X } from 'lucide-react'
import { setMonthlyBudget } from '@/features/budget/actions'
import { formatCurrency } from '@/lib/formatting'
import type { AssetClassRow } from '@/features/asset-classes/queries'

// ─── Types ────────────────────────────────────────────────────────────────────

type InvestmentLineState = {
  // Temporary client-side key (not a DB id — form state only)
  key: string
  assetClassId: string
  amount: string
}

type Props = {
  month: string // ISO datetime of the first day of the month (e.g. 2026-06-01T00:00:00.000Z)
  monthLabel: string // Human-readable label e.g. "junio 2026"
  // Ingresos del mes anterior: read-only, shown for reference
  previousMonthIncome: number
  // Current saved values (may be null if no plan exists yet for this month)
  savedPlannedExpenses: number | null
  savedInvestmentLines: { assetClassId: string; amount: number }[]
  allAssetClasses: AssetClassRow[]
  onSaved?: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateKey(): string {
  return Math.random().toString(36).slice(2)
}

// ─── Component ───────────────────────────────────────────────────────────────

export function MonthlyBudgetForm({
  month,
  monthLabel,
  previousMonthIncome,
  savedPlannedExpenses,
  savedInvestmentLines,
  allAssetClasses,
  onSaved,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const [plannedExpenses, setPlannedExpenses] = useState(
    savedPlannedExpenses != null ? String(savedPlannedExpenses) : '',
  )
  const [investmentLines, setInvestmentLines] = useState<InvestmentLineState[]>(
    savedInvestmentLines.map(l => ({
      key: generateKey(),
      assetClassId: l.assetClassId,
      amount: String(l.amount),
    })),
  )

  // ─── Derived savings ────────────────────────────────────────────────────────

  const parsedExpenses = parseFloat(plannedExpenses)
  const totalInvestments = investmentLines.reduce((sum, l) => {
    const n = parseFloat(l.amount)
    return sum + (isNaN(n) ? 0 : n)
  }, 0)
  const estimatedSavings =
    !isNaN(parsedExpenses)
      ? previousMonthIncome - parsedExpenses - totalInvestments
      : null

  // ─── Investment line handlers ────────────────────────────────────────────────

  function addInvestmentLine() {
    setInvestmentLines(prev => [
      ...prev,
      { key: generateKey(), assetClassId: '', amount: '' },
    ])
  }

  function removeInvestmentLine(key: string) {
    setInvestmentLines(prev => prev.filter(l => l.key !== key))
  }

  function updateInvestmentLine(key: string, field: 'assetClassId' | 'amount', value: string) {
    setInvestmentLines(prev =>
      prev.map(l => l.key === key ? { ...l, [field]: value } : l),
    )
  }

  // ─── Submit ──────────────────────────────────────────────────────────────────

  function handleSave() {
    const expenses = parseFloat(plannedExpenses)
    if (isNaN(expenses) || expenses < 0) {
      setError('El gasto previsto debe ser un número positivo o cero')
      return
    }

    for (const line of investmentLines) {
      if (!line.assetClassId) {
        setError('Selecciona un tipo de inversión para cada fila')
        return
      }
      const n = parseFloat(line.amount)
      if (isNaN(n) || n <= 0) {
        setError('El importe de cada inversión debe ser mayor que cero')
        return
      }
    }

    const assetClassIds = investmentLines.map(l => l.assetClassId)
    const hasDuplicates = assetClassIds.length !== new Set(assetClassIds).size
    if (hasDuplicates) {
      setError('No puedes tener dos filas con el mismo tipo de inversión')
      return
    }

    setError(null)
    setSaved(false)

    startTransition(async () => {
      try {
        await setMonthlyBudget({
          month,
          plannedExpenses: expenses,
          investmentLines: investmentLines.map(l => ({
            assetClassId: l.assetClassId,
            amount: parseFloat(l.amount),
          })),
        })
        setSaved(true)
        router.refresh()
        onSaved?.()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar el presupuesto')
      }
    })
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="bg-[#141925] border border-[#1E2A3A] rounded-2xl px-5 pt-5 pb-6 space-y-5">
      <h2 className="text-base font-semibold text-white">
        Presupuesto — {monthLabel}
      </h2>

      {/* Previous month income — read-only */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#94A3B8]">Ingresos (mes anterior)</span>
          <Lock size={12} className="text-[#475569]" />
        </div>
        <span className="text-sm font-medium text-emerald-400">
          {formatCurrency(previousMonthIncome)}
        </span>
      </div>

      {/* Planned expenses */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-[#94A3B8] block">
          Gasto previsto
        </label>
        <div className="relative">
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="0,00"
            value={plannedExpenses}
            onChange={e => { setPlannedExpenses(e.target.value); setSaved(false) }}
            className="w-full px-4 py-3 pr-10 rounded-xl text-sm bg-[#0B0F1A] border border-[#1E2A3A] text-white outline-none focus:border-[#6366F1] transition-colors"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#64748B]">€</span>
        </div>
      </div>

      {/* Investment lines */}
      <div className="space-y-2">
        <span className="text-xs font-medium text-[#94A3B8] block">Inversiones</span>

        <AnimatePresence initial={false}>
          {investmentLines.map(line => (
            <motion.div
              key={line.key}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className="flex items-center gap-2 pt-0.5">
                {/* Asset class selector */}
                <select
                  value={line.assetClassId}
                  onChange={e => { updateInvestmentLine(line.key, 'assetClassId', e.target.value); setSaved(false) }}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm bg-[#0B0F1A] border border-[#1E2A3A] text-white outline-none focus:border-[#6366F1] transition-colors"
                >
                  <option value="">Selecciona tipo…</option>
                  {allAssetClasses.map(ac => (
                    <option key={ac.id} value={ac.id}>{ac.name}</option>
                  ))}
                </select>

                {/* Amount */}
                <div className="relative w-28 flex-shrink-0">
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0,00"
                    value={line.amount}
                    onChange={e => { updateInvestmentLine(line.key, 'amount', e.target.value); setSaved(false) }}
                    className="w-full px-3 py-2.5 pr-7 rounded-xl text-sm bg-[#0B0F1A] border border-[#1E2A3A] text-white outline-none focus:border-[#6366F1] transition-colors"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#64748B]">€</span>
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => { removeInvestmentLine(line.key); setSaved(false) }}
                  className="w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-xl bg-[#1E2A3A] hover:bg-[#263347] transition-colors"
                  aria-label="Quitar inversión"
                >
                  <X size={13} className="text-[#94A3B8]" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <button
          type="button"
          onClick={addInvestmentLine}
          className="flex items-center gap-1.5 text-sm text-[#6366F1] hover:text-[#818CF8] transition-colors py-0.5"
        >
          <Plus size={14} />
          Añadir inversión
        </button>
      </div>

      {/* Estimated savings */}
      <div className="flex items-center justify-between pt-1 border-t border-[#1E2A3A]">
        <span className="text-sm text-[#94A3B8]">Ahorro estimado</span>
        {estimatedSavings !== null ? (
          <span
            className="text-sm font-semibold tabular-nums"
            style={{ color: estimatedSavings >= 0 ? '#34D399' : '#F87171' }}
          >
            {formatCurrency(estimatedSavings)}
          </span>
        ) : (
          <span className="text-sm text-[#475569]">—</span>
        )}
      </div>

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      {/* Save button */}
      <button
        type="button"
        onClick={handleSave}
        disabled={isPending}
        className="w-full py-3 rounded-xl font-semibold text-sm text-white disabled:opacity-60 transition-colors"
        style={{ background: saved ? '#34D399' : '#6366F1' }}
      >
        {isPending ? 'Guardando…' : saved ? 'Guardado' : 'Guardar presupuesto'}
      </button>
    </div>
  )
}
