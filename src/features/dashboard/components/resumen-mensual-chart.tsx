'use client'

import { useState } from 'react'
import type { MonthlyPnlPoint } from '@/features/dashboard/domain'
import { formatCurrency, formatDelta } from '@/lib/formatting'

type Props = { data: MonthlyPnlPoint[] }

function fmtAxis(v: number) {
  if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(0)}k`
  return `${v.toFixed(0)}`
}

function fmtMonth(yyyyMM: string) {
  const [y, m] = yyyyMM.split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, 1))
    .toLocaleDateString('es-ES', { month: 'short', timeZone: 'UTC' })
    .replace('.', '')
}

export function ResumenMensualChart({ data }: Props) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null)

  if (data.length < 2) return null

  const W = 320
  const H = 180
  const padL = 38
  const padR = 8
  const padT = 12
  const padB = 24
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  // Y range — include income (positive), -expenses (negative), invGain, and net
  const allVals = data.flatMap(d => [
    d.income,
    -d.expenses,
    d.invGain,
    d.income - d.expenses + d.invGain,
    0,
  ])
  const rawMax = Math.max(...allVals)
  const rawMin = Math.min(...allVals)
  const rawRange = rawMax - rawMin || 1

  // Nice step
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawRange / 3)))
  const step = Math.ceil((rawRange / 3) / magnitude) * magnitude
  const niceMax = Math.ceil(rawMax / step) * step
  const niceMin = Math.floor(rawMin / step) * step
  const range = niceMax - niceMin || 1

  const toY = (v: number) => padT + innerH - ((v - niceMin) / range) * innerH
  const zeroY = toY(0)

  // Y ticks
  const ticks: number[] = []
  for (let v = niceMin; v <= niceMax + step * 0.01; v += step) ticks.push(Math.round(v))

  // Bar geometry — 3 bars per group
  const groupW = innerW / data.length
  const barW = Math.max(2, Math.min(9, groupW * 0.21))
  const barGap = Math.max(0.5, barW * 0.12)
  const totalBarsW = 3 * barW + 2 * barGap
  const gPad = (groupW - totalBarsW) / 2

  const gx = (i: number) => padL + i * groupW

  // X-axis labels (max 7)
  const maxLabels = Math.min(7, data.length)
  const labelSet = new Set<number>()
  for (let i = 0; i < maxLabels; i++) {
    labelSet.add(Math.round((i / (maxLabels - 1)) * (data.length - 1)))
  }

  // Net result points
  const netPts = data.map((d, i) => ({
    x: gx(i) + groupW / 2,
    y: toY(d.income - d.expenses + d.invGain),
    net: d.income - d.expenses + d.invGain,
  }))
  const netLine = netPts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')

  return (
    <div className="space-y-2">
      <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full overflow-visible"
          onMouseLeave={() => setHoverIdx(null)}
        >
          {/* Y grid + labels */}
          {ticks.map(tick => {
            const y = toY(tick)
            if (y < padT - 4 || y > padT + innerH + 4) return null
            return (
              <g key={tick}>
                <line
                  x1={padL} y1={y} x2={W - padR} y2={y}
                  stroke={tick === 0 ? '#334155' : '#1E2A3A'}
                  strokeWidth={tick === 0 ? 1.5 : 1}
                />
                <text x={padL - 4} y={y + 3.5} textAnchor="end" fontSize={9} fill="#475569">
                  {fmtAxis(tick)}
                </text>
              </g>
            )
          })}

          {/* Bars */}
          {data.map((d, i) => {
            const bx = gx(i) + gPad
            const x0 = bx                        // income
            const x1 = bx + barW + barGap         // expenses
            const x2 = bx + 2 * (barW + barGap)  // invGain
            const dim = hoverIdx !== null && hoverIdx !== i

            const incH = Math.abs(zeroY - toY(d.income))
            const expH = Math.abs(zeroY - toY(-d.expenses))
            const invH = Math.abs(zeroY - toY(d.invGain))

            return (
              <g key={d.month} opacity={dim ? 0.35 : 1}>
                {d.income > 0 && (
                  <rect x={x0} y={zeroY - incH} width={barW} height={incH} fill="#10B981" rx={1} />
                )}
                {d.expenses > 0 && (
                  <rect x={x1} y={zeroY} width={barW} height={expH} fill="#EF4444" rx={1} />
                )}
                {d.invGain > 0 && (
                  <rect x={x2} y={zeroY - invH} width={barW} height={invH} fill="#6366F1" rx={1} />
                )}
                {d.invGain < 0 && (
                  <rect x={x2} y={zeroY} width={barW} height={invH} fill="#6366F1" rx={1} />
                )}
                {/* hit area */}
                <rect
                  x={gx(i)} y={padT} width={groupW} height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIdx(i)}
                />
              </g>
            )
          })}

          {/* Net result line (dashed) */}
          <polyline
            points={netLine}
            fill="none"
            stroke="#CBD5E1"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeDasharray="3 2"
            opacity={0.7}
          />

          {/* Net result dots */}
          {netPts.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={hoverIdx === i ? 4 : 2.5}
              fill={p.net >= 0 ? '#F1F5F9' : '#F97316'}
              stroke="#0B0F1A"
              strokeWidth={1}
            />
          ))}

          {/* X labels */}
          {data.map((d, i) =>
            labelSet.has(i) ? (
              <text
                key={d.month}
                x={gx(i) + groupW / 2}
                y={H - 6}
                textAnchor="middle"
                fontSize={9}
                fill="#475569"
              >
                {fmtMonth(d.month)}
              </text>
            ) : null
          )}
        </svg>

        {/* Tooltip */}
        {hoverIdx !== null && (() => {
          const d = data[hoverIdx]
          const p = netPts[hoverIdx]
          const net = d.income - d.expenses + d.invGain
          return (
            <div
              className="absolute pointer-events-none z-10 bg-[#0D1117] border border-[#1E2A3A] rounded-lg px-3 py-2 text-xs space-y-1 shadow-xl min-w-[160px]"
              style={{
                left: `${(p.x / W) * 100}%`,
                top: `${(p.y / H) * 100}%`,
                transform: 'translate(-50%, -120%)',
              }}
            >
              <p className="text-[#64748B] font-medium mb-1">{d.month}</p>
              <div className="flex justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#94A3B8]">
                  <span className="w-2 h-2 rounded-sm bg-emerald-500 shrink-0" />Ingresos
                </span>
                <span className="text-white font-medium">{formatCurrency(d.income)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#94A3B8]">
                  <span className="w-2 h-2 rounded-sm bg-red-400 shrink-0" />Gastos
                </span>
                <span className="text-white font-medium">{formatCurrency(d.expenses)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="flex items-center gap-1.5 text-[#94A3B8]">
                  <span className="w-2 h-2 rounded-sm bg-[#6366F1] shrink-0" />Inv.
                </span>
                <span className="font-medium text-[#6366F1]">
                  {formatDelta(d.invGain)}
                </span>
              </div>
              <div className="border-t border-[#1E2A3A] pt-1 flex justify-between gap-4">
                <span className="text-[#94A3B8]">Resultado</span>
                <span className={`font-semibold ${net >= 0 ? 'text-white' : 'text-orange-400'}`}>
                  {formatDelta(net)}
                </span>
              </div>
            </div>
          )
        })()}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#94A3B8]">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-emerald-500" />Ingresos</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-red-400" />Gastos</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-sm bg-[#6366F1]" />Inv.</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-[#F1F5F9]" />Resultado</span>
      </div>
    </div>
  )
}
