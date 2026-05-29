'use client'

import { useState } from 'react'
import type { InvestmentEvolutionPoint } from '@/features/dashboard/domain'
import { formatCurrency } from '@/lib/formatting'

type Props = { data: InvestmentEvolutionPoint[] }

export function InvestmentChart({ data }: Props) {
  const [tooltipIdx, setTooltipIdx] = useState<number | null>(null)

  if (data.length < 2) return null

  const W = 320
  const H = 120
  const padL = 8
  const padR = 8
  const padT = 8
  const padB = 20

  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const totals = data.map(d => d.contributions + Math.max(0, d.gain))
  const negativeGains = data.map(d => Math.min(0, d.gain))
  const allValues = [...totals, ...negativeGains, 0]
  const maxVal = Math.max(...allValues)
  const minVal = Math.min(...allValues)
  const range = maxVal - minVal || 1

  const barW = innerW / data.length
  const barPad = barW * 0.15
  const effectiveBarW = barW - barPad * 2

  const toY = (v: number) => padT + innerH - ((v - minVal) / range) * innerH
  const zeroY = toY(0)

  const labelIndices = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1])

  return (
    <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="absolute inset-0 w-full h-full overflow-visible"
        onMouseLeave={() => setTooltipIdx(null)}
      >
        {data.map((d, i) => {
          const x = padL + i * barW + barPad
          const contribHeight = (d.contributions / range) * innerH
          const contribY = zeroY - contribHeight

          const gainAbove = Math.max(0, d.gain)
          const gainBelow = Math.min(0, d.gain)

          const gainAboveHeight = (gainAbove / range) * innerH
          const gainAboveY = contribY - gainAboveHeight

          const gainBelowHeight = (Math.abs(gainBelow) / range) * innerH
          const gainBelowY = zeroY

          return (
            <g key={i}>
              {/* Contributions bar */}
              {d.contributions > 0 && (
                <rect
                  x={x}
                  y={contribY}
                  width={effectiveBarW}
                  height={contribHeight}
                  fill="#10B981"
                  rx={1}
                />
              )}
              {/* Positive gain bar (stacked on top) */}
              {gainAbove > 0 && (
                <rect
                  x={x}
                  y={gainAboveY}
                  width={effectiveBarW}
                  height={gainAboveHeight}
                  fill="#6366F1"
                  rx={1}
                />
              )}
              {/* Negative gain bar (below zero) */}
              {gainBelow < 0 && (
                <rect
                  x={x}
                  y={gainBelowY}
                  width={effectiveBarW}
                  height={gainBelowHeight}
                  fill="#EF4444"
                  rx={1}
                />
              )}
              {/* Invisible hit area */}
              <rect
                x={x}
                y={padT}
                width={effectiveBarW}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => setTooltipIdx(i)}
              />
            </g>
          )
        })}

        {/* Zero line */}
        <line
          x1={padL}
          y1={zeroY}
          x2={W - padR}
          y2={zeroY}
          stroke="#1E2A3A"
          strokeWidth={1}
        />

        {/* X-axis labels */}
        {data.map((d, i) => {
          if (!labelIndices.has(i)) return null
          const x = padL + i * barW + barW / 2
          return (
            <text key={i} x={x} y={H - 4} textAnchor="middle" fontSize={9} fill="#64748B">
              {d.month}
            </text>
          )
        })}
      </svg>

      {/* Tooltip */}
      {tooltipIdx !== null && (() => {
        const d = data[tooltipIdx]
        const x = padL + tooltipIdx * barW + barW / 2
        const totalHeight = d.contributions + Math.max(0, d.gain)
        const tipY = toY(totalHeight)
        return (
          <div
            className="absolute pointer-events-none z-10 bg-[#141925] border border-[#1E2A3A] rounded-lg px-2 py-1 text-xs"
            style={{
              left: `${(x / W) * 100}%`,
              top: `${(tipY / H) * 100}%`,
              transform: 'translate(-50%, -130%)',
            }}
          >
            <p className="text-[#94A3B8] mb-0.5">{d.month}</p>
            <p className="text-emerald-400">Aportaciones: {formatCurrency(d.contributions)}</p>
            <p className={d.gain >= 0 ? 'text-[#6366F1]' : 'text-red-400'}>
              Ganancia: {formatCurrency(d.gain)}
            </p>
          </div>
        )
      })()}
    </div>
  )
}
