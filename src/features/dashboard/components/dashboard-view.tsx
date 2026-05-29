'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import Link from 'next/link'
import type { DashboardSummary, EvolutionPoint } from '@/features/dashboard/domain'
import { ResumenMensualChart } from '@/features/dashboard/components/resumen-mensual-chart'
import { formatCurrency } from '@/lib/formatting'


// ── SVG line chart (no external library needed) ────────────────────────────
function EvolutionChart({ data }: { data: EvolutionPoint[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; point: EvolutionPoint } | null>(
    null,
  )
  if (data.length < 2) return null

  const W = 320
  const H = 120
  const padL = 8
  const padR = 8
  const padT = 8
  const padB = 20

  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const totals = data.map(d => d.total)
  const minVal = Math.min(...totals)
  const maxVal = Math.max(...totals)
  const range = maxVal - minVal || 1

  const toX = (i: number) => padL + (i / (data.length - 1)) * innerW
  const toY = (v: number) => padT + innerH - ((v - minVal) / range) * innerH

  const points = data.map((d, i) => ({ x: toX(i), y: toY(d.total), d }))
  const polyline = points.map(p => `${p.x},${p.y}`).join(' ')

  // Show only first, middle and last x-axis labels to avoid crowding
  const labelIndices = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])

  return (
    <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full overflow-visible"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Line */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#6366F1"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Invisible hit areas for each point */}
        {points.map((p, i) => (
          <rect
            key={i}
            x={i === 0 ? p.x : (points[i - 1].x + p.x) / 2}
            y={padT}
            width={
              i === 0
                ? (points[1].x - p.x) / 2
                : i === points.length - 1
                  ? (p.x - points[i - 1].x) / 2
                  : (points[i + 1].x - points[i - 1].x) / 2
            }
            height={innerH}
            fill="transparent"
            onMouseEnter={() => setTooltip({ x: p.x, y: p.y, point: p.d })}
          />
        ))}

        {/* Active dot */}
        {tooltip && (
          <circle cx={tooltip.x} cy={tooltip.y} r={4} fill="#6366F1" />
        )}

        {/* X-axis labels */}
        {points.map((p, i) =>
          labelIndices.has(i) ? (
            <text
              key={i}
              x={p.x}
              y={H - 4}
              textAnchor="middle"
              fontSize={9}
              fill="#64748B"
            >
              {data[i].month}
            </text>
          ) : null,
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="absolute pointer-events-none z-10 bg-[#141925] border border-[#1E2A3A] rounded-lg px-2 py-1 text-xs"
          style={{
            left: `${(tooltip.x / W) * 100}%`,
            top: `${(tooltip.y / H) * 100}%`,
            transform: 'translate(-50%, -130%)',
          }}
        >
          <p className="text-[#94A3B8]">{tooltip.point.month}</p>
          <p className="text-[#6366F1] font-medium">{formatCurrency(tooltip.point.total)}</p>
        </div>
      )}
    </div>
  )
}

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

// ── Patrimonio chart card with range selector ─────────────────────────────
function PatrimonioChartCard({ allEvolution }: { allEvolution: EvolutionPoint[] }) {
  const [range, setRange] = useState<'3m' | '6m' | '12m' | 'todo'>('12m')

  const filtered = (() => {
    switch (range) {
      case '3m': return allEvolution.slice(-3)
      case '6m': return allEvolution.slice(-6)
      case '12m': return allEvolution.slice(-12)
      case 'todo': return allEvolution
    }
  })()

  if (allEvolution.length < 2) return null

  return (
    <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-[#94A3B8]">Evolución del patrimonio</p>
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
      <EvolutionChart data={filtered} />
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
