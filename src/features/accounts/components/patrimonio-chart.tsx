'use client'

import { useState } from 'react'

type AccountValue = {
  id: string
  name: string
  color: string
  value: number
}

type MonthData = {
  month: string // 'YYYY-MM'
  accounts: AccountValue[]
}

type Props = { data: MonthData[] }

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`
  return `${value.toFixed(0)}`
}

function formatMonthLabel(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-').map(Number)
  const d = new Date(Date.UTC(year, month - 1, 1))
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    .replace('.', '').replace(' ', " '")
}

export function PatrimonioChart({ data }: Props) {
  const [tooltipMonth, setTooltipMonth] = useState<string | null>(null)
  const [tooltipX, setTooltipX] = useState<number>(0)
  const [tooltipY, setTooltipY] = useState<number>(0)

  if (data.length < 2) return null

  const W = 320
  const H = 180
  const padL = 44  // room for Y-axis labels
  const padR = 8
  const padT = 12
  const padB = 28  // room for X-axis labels

  const innerW = W - padL - padR
  const innerH = H - padT - padB

  // Collect all unique accounts from the last month's data, limited to 6 by value
  const lastMonth = data[data.length - 1]
  let displayAccounts = [...lastMonth.accounts].sort((a, b) => b.value - a.value)
  if (displayAccounts.length > 6) displayAccounts = displayAccounts.slice(0, 6)
  const displayIds = new Set(displayAccounts.map(a => a.id))

  // Collect all values across all months for the displayed accounts to compute range
  const allValues: number[] = []
  for (const monthData of data) {
    for (const acc of monthData.accounts) {
      if (displayIds.has(acc.id)) allValues.push(acc.value)
    }
  }
  const minVal = Math.min(0, ...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  // Nice Y-axis ticks (4 ticks)
  const tickCount = 4
  const rawStep = range / tickCount
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)))
  const niceStep = Math.ceil(rawStep / magnitude) * magnitude
  const yTicks: number[] = []
  for (let i = 0; i <= tickCount; i++) {
    const v = minVal + i * niceStep
    if (v <= maxVal + niceStep) yTicks.push(v)
  }
  const adjustedMax = yTicks[yTicks.length - 1]
  const adjustedRange = adjustedMax - minVal || 1

  const toX = (i: number) => padL + (i / (data.length - 1)) * innerW
  const toY = (v: number) => padT + innerH - ((v - minVal) / adjustedRange) * innerH

  // Build a polyline per account
  const lines = displayAccounts.map(acc => {
    const pts = data.map((monthData, i) => {
      const entry = monthData.accounts.find(a => a.id === acc.id)
      const value = entry?.value ?? 0
      return { x: toX(i), y: toY(value) }
    })
    const polyline = pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
    return { acc, pts, polyline }
  })

  // X-axis: show at most 6 labels evenly spread
  const maxXLabels = Math.min(6, data.length)
  const xLabelIndices = new Set<number>()
  for (let i = 0; i < maxXLabels; i++) {
    xLabelIndices.add(Math.round((i / (maxXLabels - 1)) * (data.length - 1)))
  }

  const tooltipData = tooltipMonth ? data.find(d => d.month === tooltipMonth) : null
  const tooltipAccounts = tooltipData
    ? displayAccounts.map(acc => {
        const entry = tooltipData.accounts.find(a => a.id === acc.id)
        return { ...acc, value: entry?.value ?? 0 }
      })
    : null

  return (
    <div className="space-y-3">
      <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="absolute inset-0 w-full h-full overflow-visible"
          onMouseLeave={() => setTooltipMonth(null)}
        >
          {/* Y-axis grid lines + labels */}
          {yTicks.map(tick => {
            const y = toY(tick)
            if (y < padT - 2 || y > padT + innerH + 2) return null
            return (
              <g key={tick}>
                <line
                  x1={padL}
                  y1={y}
                  x2={W - padR}
                  y2={y}
                  stroke="#1E2A3A"
                  strokeWidth={1}
                />
                <text
                  x={padL - 4}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize={9}
                  fill="#475569"
                >
                  {formatAxisValue(tick)}
                </text>
              </g>
            )
          })}

          {/* Lines per account */}
          {lines.map(({ acc, polyline }) => (
            <polyline
              key={acc.id}
              points={polyline}
              fill="none"
              stroke={acc.color}
              strokeWidth="2"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}

          {/* Invisible hit areas — one per month column */}
          {data.map((monthData, i) => {
            const x = toX(i)
            const colLeft = i === 0 ? padL : (toX(i - 1) + x) / 2
            const colRight = i === data.length - 1 ? W - padR : (x + toX(i + 1)) / 2
            const firstLine = lines[0]
            const anchorY = firstLine ? firstLine.pts[i].y : padT
            return (
              <rect
                key={monthData.month}
                x={colLeft}
                y={padT}
                width={colRight - colLeft}
                height={innerH}
                fill="transparent"
                onMouseEnter={() => {
                  setTooltipMonth(monthData.month)
                  setTooltipX(x)
                  setTooltipY(anchorY)
                }}
              />
            )
          })}

          {/* Active dots for hovered month */}
          {tooltipMonth &&
            lines.map(({ acc, pts }) => {
              const idx = data.findIndex(d => d.month === tooltipMonth)
              if (idx < 0) return null
              return (
                <circle
                  key={acc.id}
                  cx={pts[idx].x}
                  cy={pts[idx].y}
                  r={3}
                  fill={acc.color}
                  stroke="#0B0F1A"
                  strokeWidth={1.5}
                />
              )
            })}

          {/* X-axis labels */}
          {data.map((monthData, i) =>
            xLabelIndices.has(i) ? (
              <text
                key={monthData.month}
                x={toX(i)}
                y={H - 6}
                textAnchor="middle"
                fontSize={9}
                fill="#475569"
              >
                {formatMonthLabel(monthData.month)}
              </text>
            ) : null,
          )}
        </svg>

        {/* Tooltip */}
        {tooltipMonth && tooltipAccounts && (
          <div
            className="absolute pointer-events-none z-10 bg-[#0D1117] border border-[#1E2A3A] rounded-lg px-3 py-2 text-xs space-y-1 shadow-xl"
            style={{
              left: `${(tooltipX / W) * 100}%`,
              top: `${(tooltipY / H) * 100}%`,
              transform: 'translate(-50%, -115%)',
            }}
          >
            <p className="text-[#64748B] font-medium">{formatMonthLabel(tooltipMonth)}</p>
            {tooltipAccounts.map(acc => (
              <div key={acc.id} className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
                <span className="text-[#94A3B8]">{acc.name}:</span>
                <span className="text-white font-semibold">{formatCurrency(acc.value)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
        {displayAccounts.map(acc => (
          <div key={acc.id} className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: acc.color }} />
            <span className="text-xs text-[#94A3B8]">{acc.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
