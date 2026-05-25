'use client'

import { useState } from 'react'
import Link from 'next/link'
import type { DashboardBudgetAnalysis } from '@/features/dashboard/domain'

function fmt(v: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v)
}

function ProgressBar({ actual, planned }: { actual: number; planned: number }) {
  if (planned <= 0) return null
  const pct = Math.min((actual / planned) * 100, 100)
  const over = actual > planned
  return (
    <div className="w-full h-1 bg-[#1E2A3A] rounded-full mt-1 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${over ? 'bg-red-400' : 'bg-[#6366F1]'}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

type Props = {
  analysis: DashboardBudgetAnalysis | null
  referenceIncome: number
  actualExpenses: number
  actualContributions: number
  year: number
  month: number
}

export function BudgetSummaryWidget({ analysis, referenceIncome, actualExpenses, actualContributions, year, month }: Props) {
  const [invExpanded, setInvExpanded] = useState(false)

  if (!analysis) {
    return (
      <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-4">
        <p className="text-sm font-medium text-white mb-1">Desglose de mes</p>
        <p className="text-sm text-[#94A3B8] mb-3">Sin presupuesto para este mes</p>
        <Link href="/presupuesto" className="text-xs text-[#6366F1] hover:text-[#818CF8]">
          Definir presupuesto →
        </Link>
      </div>
    )
  }

  const totalInvPlanned = analysis.inversionLines.reduce((s, l) => s + l.planned, 0)
  const totalInvActual = analysis.inversionLines.length > 0
    ? analysis.inversionLines.reduce((s, l) => s + l.actual, 0)
    : actualContributions
  const totalGastoPlanned = analysis.totalPlanned - totalInvPlanned
  const totalGastoReal = actualExpenses

  const ahorroPlanned = referenceIncome > 0 ? referenceIncome - totalGastoPlanned - totalInvPlanned : null
  const ahorroReal = referenceIncome > 0 ? referenceIncome - totalGastoReal - totalInvActual : null

  return (
    <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-4 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-white">Desglose de mes</p>
        <Link
          href={`/presupuesto?year=${year}&month=${month}`}
          className="text-xs text-[#3D4F63] hover:text-[#64748B]"
        >
          Editar →
        </Link>
      </div>

      {/* Column headers — Real primero, Prev. después */}
      <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 text-xs text-[#64748B] pb-0.5 border-b border-[#1E2A3A]">
        <span />
        <span className="text-right w-16">Real</span>
        <span className="text-right w-16">Prev.</span>
      </div>

      {/* ── Gasto ── */}
      <div className="space-y-1">
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center">
          <span className="text-xs font-semibold text-white">Gasto</span>
          <span className={`text-xs text-right font-semibold w-16 ${totalGastoReal > totalGastoPlanned ? 'text-red-400' : 'text-white'}`}>
            {fmt(totalGastoReal)}
          </span>
          <span className="text-xs text-right text-[#94A3B8] w-16">{fmt(totalGastoPlanned)}</span>
        </div>
        <ProgressBar actual={totalGastoReal} planned={totalGastoPlanned} />
      </div>

      {/* ── Inversión (colapsable) ── */}
      <div className="space-y-1">
        <button
          onClick={() => setInvExpanded(v => !v)}
          className="w-full grid grid-cols-[1fr_auto_auto] gap-x-4 items-center text-left"
        >
          <span className="flex items-center gap-1 text-xs font-semibold text-white">
            Inversión
            <span className="text-[#475569] text-[10px]">{invExpanded ? '▾' : '▸'}</span>
          </span>
          <span className="text-xs text-right text-white w-16">{totalInvActual > 0 ? fmt(totalInvActual) : '—'}</span>
          <span className="text-xs text-right text-[#94A3B8] w-16">{totalInvPlanned > 0 ? fmt(totalInvPlanned) : '—'}</span>
        </button>

        {invExpanded && (
          <div className="space-y-1 pl-2 pt-1">
            {analysis.inversionLines.map((line, i) => (
              <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: line.color }} />
                  <span className="text-xs text-[#94A3B8] truncate">{line.label}</span>
                </span>
                <span className="text-xs text-right text-[#64748B] w-16">{line.actual > 0 ? fmt(line.actual) : '—'}</span>
                <span className="text-xs text-right text-[#64748B] w-16">{fmt(line.planned)}</span>
              </div>
            ))}
            <Link
              href="/inversiones"
              className="text-[11px] text-[#475569] hover:text-[#64748B] block pt-0.5"
            >
              ver detalle →
            </Link>
          </div>
        )}
      </div>

      {/* ── Ahorro ── */}
      {ahorroReal !== null && (
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-4 items-center">
          <span className="text-xs font-semibold text-white">Ahorro</span>
          <span className="text-xs text-right font-semibold text-white w-16">
            {fmt(ahorroReal)}
          </span>
          {ahorroPlanned !== null && (
            <span className="text-xs text-right font-semibold text-[#94A3B8] w-16">
              {fmt(ahorroPlanned)}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
