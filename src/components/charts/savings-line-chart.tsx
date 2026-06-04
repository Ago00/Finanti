'use client'

import { formatShortMonth } from '@/lib/dates'

const BORDER = '#1E2A3A'
const AXIS = '#475569'

type Props = {
  labels: string[] // 'YYYY-MM', oldest first
  values: number[]
  color: string
}

export function SavingsLineChart({ labels, values, color }: Props) {
  const W = 320
  const H = 72
  const padL = 40
  const padR = 4
  const padT = 6
  const padB = 20
  const innerW = W - padL - padR
  const innerH = H - padT - padB

  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min || 1
  const n = labels.length

  const toX = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const toY = (v: number) => padT + innerH - ((v - min) / range) * innerH

  const labelCount = Math.min(5, n)
  const xLabelIdx = new Set<number>()
  for (let i = 0; i < labelCount; i++) {
    xLabelIdx.add(Math.round((i / Math.max(1, labelCount - 1)) * (n - 1)))
  }

  const polyline = values.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible" style={{ height: 'auto' }}>
      {[0, 0.5, 1].map(t => {
        const y = padT + innerH - t * innerH
        return (
          <g key={t}>
            <line x1={padL} y1={y} x2={W - padR} y2={y} stroke={BORDER} strokeWidth={1} />
            <text x={padL - 6} y={y + 3} textAnchor="end" fontSize={9} fill={AXIS}>
              {`${Math.round((min + t * range) / 1000)}k`}
            </text>
          </g>
        )
      })}
      <polyline
        points={polyline}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {labels.map((label, i) =>
        xLabelIdx.has(i) ? (
          <text key={label} x={toX(i)} y={H - 5} textAnchor="middle" fontSize={9} fill={AXIS}>
            {formatShortMonth(label)}
          </text>
        ) : null,
      )}
    </svg>
  )
}
