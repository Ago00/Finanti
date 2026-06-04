'use client'

import { useMemo, useState } from 'react'
import { formatCurrency } from '@/lib/formatting'
import { formatShortMonth } from '@/lib/dates'

const BORDER = '#1E2A3A'
const AXIS = '#475569'
const ACCENT = '#6366F1'
const MUTED = '#94A3B8'
const FAINT = '#64748B'

export type EvolutionSeries = {
  id: string
  name: string
  color: string
  values: number[]
}

type Range = 3 | 12 | 'all'

type Props = {
  series: EvolutionSeries[]
  labels: string[] // 'YYYY-MM', oldest first, same length as every series.values
  title?: string
  showLegend?: boolean
}

const RANGES: Range[] = [3, 12, 'all']

// Y-axis labels use a compact convention ('3k' / '500'), not formatCurrency: the
// axis is a spacing reference, not a monetary value the user reads precisely.
function formatAxisValue(value: number): string {
  if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(0)}k`
  return `${value.toFixed(0)}`
}

export function EvolutionChart({
  series,
  labels,
  title = 'Evolución por cuenta',
  showLegend = true,
}: Props) {
  const [range, setRange] = useState<Range>(12)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const visibleCount = range === 'all' ? labels.length : Math.min(range, labels.length)

  const visibleLabels = useMemo(
    () => labels.slice(labels.length - visibleCount),
    [labels, visibleCount],
  )
  const visibleSeries = useMemo(
    () => series.map(s => ({ ...s, values: s.values.slice(s.values.length - visibleCount) })),
    [series, visibleCount],
  )

  const W = 320
  const H = 180
  const padL = 44
  const padR = 8
  const padT = 12
  const padB = 28
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const allValues = visibleSeries.flatMap(s => s.values)
  const minVal = Math.min(0, ...allValues)
  const maxVal = Math.max(0, ...allValues)
  const range_ = maxVal - minVal || 1

  const tickCount = 4
  const rawStep = range_ / tickCount
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep || 1)))
  const niceStep = Math.ceil(rawStep / magnitude) * magnitude || 1
  const yTicks: number[] = []
  for (let i = 0; i <= tickCount; i++) {
    const v = minVal + i * niceStep
    if (v <= maxVal + niceStep) yTicks.push(v)
  }
  const adjustedMax = yTicks[yTicks.length - 1]
  const adjustedRange = adjustedMax - minVal || 1

  const n = visibleLabels.length
  const toX = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const toY = (v: number) => padT + innerH - ((v - minVal) / adjustedRange) * innerH

  const lines = visibleSeries.map(s => ({
    series: s,
    points: s.values.map((v, i) => ({ x: toX(i), y: toY(v) })),
    polyline: s.values.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' '),
  }))

  const maxXLabels = Math.min(6, n)
  const xLabelIndices = new Set<number>()
  for (let i = 0; i < maxXLabels; i++) {
    xLabelIndices.add(Math.round((i / Math.max(1, maxXLabels - 1)) * (n - 1)))
  }

  const tooltipX = hoverIndex !== null ? toX(hoverIndex) : 0
  const tooltipY =
    hoverIndex !== null && lines.length > 0 ? lines[0].points[hoverIndex].y : padT

  const canDraw = n >= 2 && series.length > 0

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs" style={{ color: MUTED }}>
          {title}
        </p>
        <div className="flex rounded-lg overflow-hidden border" style={{ borderColor: BORDER }}>
          {RANGES.map(r => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className="px-2.5 py-1 text-[11px] transition-colors"
              style={{
                background: range === r ? ACCENT : 'transparent',
                color: range === r ? '#fff' : FAINT,
              }}
            >
              {r === 'all' ? 'Todo' : `${r}m`}
            </button>
          ))}
        </div>
      </div>

      {canDraw ? (
        <div className="relative w-full" style={{ paddingBottom: `${(H / W) * 100}%` }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="absolute inset-0 w-full h-full overflow-visible"
            onMouseLeave={() => setHoverIndex(null)}
          >
            {yTicks.map(tick => {
              const y = toY(tick)
              if (y < padT - 2 || y > padT + innerH + 2) return null
              return (
                <g key={tick}>
                  <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={BORDER} strokeWidth={1} />
                  <text x={padL - 4} y={y + 3.5} textAnchor="end" fontSize={9} fill={AXIS}>
                    {formatAxisValue(tick)}
                  </text>
                </g>
              )
            })}

            {lines.map(({ series: s, polyline }) => (
              <polyline
                key={s.id}
                points={polyline}
                fill="none"
                stroke={s.color}
                strokeWidth={1.3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            ))}

            {visibleLabels.map((label, i) => {
              const x = toX(i)
              const colLeft = i === 0 ? padL : (toX(i - 1) + x) / 2
              const colRight = i === n - 1 ? W - padR : (x + toX(i + 1)) / 2
              return (
                <rect
                  key={label}
                  x={colLeft}
                  y={padT}
                  width={Math.max(0, colRight - colLeft)}
                  height={innerH}
                  fill="transparent"
                  onMouseEnter={() => setHoverIndex(i)}
                />
              )
            })}

            {hoverIndex !== null &&
              lines.map(({ series: s, points }) => (
                <circle
                  key={s.id}
                  cx={points[hoverIndex].x}
                  cy={points[hoverIndex].y}
                  r={3}
                  fill={s.color}
                  stroke="#0B0F1A"
                  strokeWidth={1.5}
                />
              ))}

            {visibleLabels.map((label, i) =>
              xLabelIndices.has(i) ? (
                <text key={label} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={9} fill={AXIS}>
                  {formatShortMonth(label)}
                </text>
              ) : null,
            )}
          </svg>

          {hoverIndex !== null && (
            <div
              className="absolute pointer-events-none z-10 bg-[#0D1117] border border-[#1E2A3A] rounded-lg px-3 py-2 text-xs space-y-1 shadow-xl"
              style={{
                left: `${(tooltipX / W) * 100}%`,
                top: `${(tooltipY / H) * 100}%`,
                transform: 'translate(-50%, -115%)',
              }}
            >
              <p className="text-[#64748B] font-medium">{formatShortMonth(visibleLabels[hoverIndex])}</p>
              {visibleSeries.map(s => (
                <div key={s.id} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                  <span className="text-[#94A3B8]">{s.name}:</span>
                  <span className="text-white font-semibold">{formatCurrency(s.values[hoverIndex])}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-lg border border-[#1E2A3A] p-6 text-center">
          <p className="text-[#64748B] text-xs">
            La evolución se dibuja al tener al menos dos meses cerrados.
          </p>
        </div>
      )}

      {showLegend && canDraw && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
          {series.map(s => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
              <span className="text-[11px]" style={{ color: MUTED }}>
                {s.name}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
