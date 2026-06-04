'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import type { DashboardSummary, EvolutionPoint } from '@/features/dashboard/domain'
import { ResumenMensualChart } from '@/features/dashboard/components/resumen-mensual-chart'
import { EvolutionChart, type EvolutionSeries } from '@/components/charts/evolution-chart'
import { formatCurrency } from '@/lib/formatting'


// ── Resumen mensual card with range selector ──────────────────────────────
function ResumenMensualCard({ data }: { data: import('@/features/dashboard/domain').MonthlyPnlPoint[] }) {
  const [range, setRange] = useState<'3m' | '6m' | '12m' | 'todo'>('12m')
  const filtered = range === 'todo' ? data
    : range === '12m' ? data.slice(-12)
    : range === '6m' ? data.slice(-6)
    : data.slice(-3)

  return (
    <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#94A3B8]">Resumen mensual</p>
        <div className="flex gap-2">
          {(['3m', '6m', '12m', 'todo'] as const).map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`text-xs px-2 py-0.5 rounded ${range === r ? 'bg-[#6366F1] text-white' : 'text-[#64748B] hover:text-white'}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>
      <ResumenMensualChart data={filtered} />
    </div>
  )
}

// ── Patrimonio chart card (shared EvolutionChart, single total series) ──────
function PatrimonioChartCard({ allEvolution }: { allEvolution: EvolutionPoint[] }) {
  if (allEvolution.length < 2) return null

  const series: EvolutionSeries[] = [
    {
      id: 'total',
      name: 'Patrimonio total',
      color: '#6366F1',
      values: allEvolution.map(point => point.total),
    },
  ]

  return (
    <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-4">
      <EvolutionChart
        series={series}
        labels={allEvolution.map(point => point.month)}
        title="Evolución del patrimonio"
        showLegend={false}
      />
    </div>
  )
}

export function DashboardView({
  summary,
  year,
  month,
  budgetWidget,
}: {
  summary: DashboardSummary
  year: number
  month: number
  budgetWidget: ReactNode
}) {
  const isEmpty =
    summary.totalBalance === 0 && summary.accounts.every(a => a.currentBalance === 0)

  if (isEmpty) {
    return (
      <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-6 text-center text-[#94A3B8] text-sm">
        No hay datos aún. Ve a Recap para cerrar tu primer mes.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* ── Banner recap pendiente ── */}
      {!summary.hasCurrentMonthSnapshot && (
        <div className="bg-amber-950/40 border border-amber-700/50 rounded-xl px-4 py-3 flex items-center justify-between">
          <p className="text-amber-300 text-sm">No has cerrado {summary.currentMonthLabel} aún</p>
          <Link
            href={`/recap?year=${summary.currentYear}&month=${summary.currentMonth}`}
            className="text-amber-400 text-xs hover:text-amber-300"
          >
            Ir al Recap →
          </Link>
        </div>
      )}

      {/* ── Tarjeta principal: Patrimonio total ── */}
      <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-5">
        <p className="text-sm text-[#94A3B8] mb-1">Patrimonio total</p>
        {summary.latestSnapshotMonth === null ? (
          <p className="text-sm text-[#94A3B8]">
            Sin datos aún. Cierra tu primer mes desde Recap.
          </p>
        ) : (
          <>
            <p className="text-3xl font-bold text-white mb-2">
              {formatCurrency(summary.totalBalance)}
            </p>
            <p className="text-sm text-[#94A3B8]">
              TAI: {formatCurrency(summary.tai)}&nbsp;&nbsp;TDI: {formatCurrency(summary.tdi)}
            </p>
          </>
        )}
      </div>

      {/* ── Gráfico de evolución con selector de rango ── */}
      <PatrimonioChartCard allEvolution={summary.allEvolution} />

      {/* ── Resumen mensual ── */}
      {summary.monthlyPnl.length >= 2 && (
        <ResumenMensualCard data={summary.monthlyPnl} />
      )}

      {/* ── Presupuesto del mes ── */}
      {budgetWidget}

    </div>
  )
}
