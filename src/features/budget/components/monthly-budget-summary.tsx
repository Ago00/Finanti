'use client'

import { useState } from 'react'
import { Pencil, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/formatting'
import { MonthlyBudgetForm } from './monthly-budget-form'
import type { AssetClassRow } from '@/features/asset-classes/queries'

// ─── Types ────────────────────────────────────────────────────────────────────

type InvestmentLineSummary = {
  assetClassId: string
  assetClassName: string
  amount: number
}

type Props = {
  month: string
  monthLabel: string
  previousMonthIncome: number
  plannedExpenses: number
  investmentLines: InvestmentLineSummary[]
  allAssetClasses: AssetClassRow[]
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MonthlyBudgetSummary({
  month,
  monthLabel,
  previousMonthIncome,
  plannedExpenses,
  investmentLines,
  allAssetClasses,
}: Props) {
  const [isEditing, setIsEditing] = useState(false)

  const totalInvestments = investmentLines.reduce((sum, l) => sum + l.amount, 0)
  const estimatedSavings = previousMonthIncome - plannedExpenses - totalInvestments

  if (isEditing) {
    return (
      <div className="space-y-3">
        <MonthlyBudgetForm
          month={month}
          monthLabel={monthLabel}
          previousMonthIncome={previousMonthIncome}
          savedPlannedExpenses={plannedExpenses}
          savedInvestmentLines={investmentLines.map(l => ({
            assetClassId: l.assetClassId,
            amount: l.amount,
          }))}
          allAssetClasses={allAssetClasses}
          onSaved={() => setIsEditing(false)}
        />
        <button
          type="button"
          onClick={() => setIsEditing(false)}
          className="w-full py-2.5 rounded-xl text-sm text-[#94A3B8] hover:text-white border border-[#1E2A3A] hover:border-[#2D3A4D] transition-colors"
        >
          Cancelar edición
        </button>
      </div>
    )
  }

  return (
    <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-white">Presupuesto — {monthLabel}</h2>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#94A3B8] transition-colors px-2 py-1 rounded-lg hover:bg-[#1E2A3A]"
        >
          <Pencil size={12} />
          Editar
        </button>
      </div>

      {/* Previous month income */}
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
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#94A3B8]">Gasto previsto</span>
        <span className="text-sm font-medium text-white">
          {formatCurrency(plannedExpenses)}
        </span>
      </div>

      {/* Investment lines */}
      {investmentLines.length > 0 && (
        <div className="space-y-1.5">
          <span className="text-xs text-[#64748B] uppercase tracking-wide">Inversiones planificadas</span>
          {investmentLines.map(line => (
            <div key={line.assetClassId} className="flex items-center justify-between">
              <span className="text-sm text-[#94A3B8]">{line.assetClassName}</span>
              <span className="text-sm font-medium text-white">{formatCurrency(line.amount)}</span>
            </div>
          ))}
        </div>
      )}

      {/* Estimated savings */}
      <div className="flex items-center justify-between pt-3 border-t border-[#1E2A3A]">
        <span className="text-sm font-medium text-white">Ahorro estimado</span>
        <span
          className="text-sm font-semibold tabular-nums"
          style={{ color: estimatedSavings >= 0 ? '#34D399' : '#F87171' }}
        >
          {formatCurrency(estimatedSavings)}
        </span>
      </div>
    </div>
  )
}
