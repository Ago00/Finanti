'use client'

import { useState } from 'react'
import type { CategoryTotal, MonthlyExpenseTotal } from '@/features/transactions/queries'
import { formatCurrency } from '@/lib/formatting'

const BAR_COLORS = [
  '#6366F1',
  '#10B981',
  '#F59E0B',
  '#EF4444',
  '#8B5CF6',
  '#06B6D4',
  '#EC4899',
  '#F97316',
]


// ── Barras horizontales por categoría ─────────────────────────────────────────
function CategoryBars({ totals }: { totals: CategoryTotal[] }) {
  if (totals.length === 0) return null

  const grandTotal = totals.reduce((sum, t) => sum + t.total, 0)
  if (grandTotal === 0) return null

  return (
    <div className="space-y-2">
      {totals.map((t, i) => {
        const pct = grandTotal > 0 ? (t.total / grandTotal) * 100 : 0
        const color = BAR_COLORS[i % BAR_COLORS.length]
        const name = t.categoryName ?? 'Sin categoría'

        return (
          <div key={t.categoryId ?? '__null__'} className="space-y-1">
            <div className="flex justify-between items-baseline text-xs">
              <span className="text-[#94A3B8] truncate max-w-[60%]">{name}</span>
              <span className="text-[#CBD5E1] ml-2 flex-shrink-0">
                {formatCurrency(t.total)}{' '}
                <span className="text-[#64748B]">({pct.toFixed(0)}%)</span>
              </span>
            </div>
            <div className="h-2 w-full bg-[#1E2A3A] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${pct}%`, backgroundColor: color }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Barras verticales de evolución mensual ────────────────────────────────────
function MonthlyBars({ totals }: { totals: MonthlyExpenseTotal[] }) {
  const [tooltip, setTooltip] = useState<{
    x: number
    y: number
    entry: MonthlyExpenseTotal
  } | null>(null)

  if (totals.length < 2) return null

  const W = 320
  const H = 120
  const padL = 8
  const padR = 8
  const padT = 8
  const padB = 20

  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const maxVal = Math.max(...totals.map(t => t.total), 1)

  const barW = innerW / totals.length
  const gap = barW * 0.25

  const now = new Date()
  const currentMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const labelIndices = new Set([0, Math.floor((totals.length - 1) / 2), totals.length - 1])

  return (
    <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full"
        overflow="visible"
        onMouseLeave={() => setTooltip(null)}
      >
        {totals.map((t, i) => {
          const barHeight = (t.total / maxVal) * innerH
          const x = padL + i * barW + gap / 2
          const w = barW - gap
          const y = padT + innerH - barHeight
          const isCurrentMonth = t.month === currentMonth
          const cx = x + w / 2

          const v = t.total

          return (
            <g key={t.month}>
              <rect
                x={x}
                y={y}
                width={w}
                height={barHeight}
                rx={2}
                fill={isCurrentMonth ? '#6366F1' : '#1E2A3A'}
              />
              {barHeight > 12 && (
                <text
                  x={cx}
                  y={y - 3}
                  textAnchor="middle"
                  fontSize={8}
                  fill="#94A3B8"
                >
                  {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v))}
                </text>
              )}
              {/* Invisible wider hit area */}
              <rect
                x={padL + i * barW}
                y={padT}
                width={barW}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setTooltip({ x: cx, y, entry: t })}
              />
              {labelIndices.has(i) && (
                <text
                  x={cx}
                  y={H - 4}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#64748B"
                >
                  {t.month.slice(0, 7)}
                </text>
              )}
            </g>
          )
        })}

        {/* Active bar top dot */}
        {tooltip && (
          <circle
            cx={tooltip.x}
            cy={tooltip.y}
            r={3}
            fill="#6366F1"
          />
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
          <p className="text-[#94A3B8]">{tooltip.entry.month}</p>
          <p className="text-[#6366F1] font-medium">{formatCurrency(tooltip.entry.total)}</p>
        </div>
      )}
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
type Props = {
  categoryTotals: CategoryTotal[]
  monthlyTotals: MonthlyExpenseTotal[]
  currentMonthTotal: number
  budgetTotal: number
}

export function SpendingCharts({ categoryTotals, monthlyTotals, currentMonthTotal, budgetTotal }: Props) {
  const hasCategoryData = categoryTotals.length > 0 && currentMonthTotal > 0
  const hasMonthlyData = monthlyTotals.length >= 2
  const pct = budgetTotal > 0 ? Math.round((currentMonthTotal / budgetTotal) * 100) : 0

  if (!hasCategoryData && !hasMonthlyData && budgetTotal <= 0) return null

  return (
    <div className="space-y-4">
      {budgetTotal > 0 && (
        <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-[#94A3B8]">Presupuesto del mes</p>
            <p className="text-xs text-[#94A3B8]">{formatCurrency(currentMonthTotal)} / {formatCurrency(budgetTotal)}</p>
          </div>
          <div className="h-3 bg-[#1E2A3A] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${pct > 100 ? 'bg-red-500' : 'bg-[#6366F1]'}`}
              style={{ width: `${Math.min(pct, 100)}%` }}
            />
          </div>
          <p className="text-xs text-right mt-1 text-[#64748B]">{pct}% consumido</p>
        </div>
      )}

      {hasCategoryData && (
        <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-4 space-y-3">
          <p className="text-xs text-[#94A3B8]">Gastos por categoría</p>
          <CategoryBars totals={categoryTotals} />
        </div>
      )}

      {hasMonthlyData && (
        <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-4 space-y-3">
          <p className="text-xs text-[#94A3B8]">Evolución de gastos</p>
          <MonthlyBars totals={monthlyTotals} />
        </div>
      )}
    </div>
  )
}
