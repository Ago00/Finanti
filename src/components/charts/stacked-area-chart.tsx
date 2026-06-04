'use client'

// Semantic colors (not entity colors): indigo = contributed, green = value/gain.
const ACCENT = '#6366F1'
const VALUE = '#10B981'

type Props = {
  labels: string[] // 'YYYY-MM', oldest first
  contributed: number[] // cumulative contributions per month
  value: number[] // account value per month
}

export function StackedAreaChart({ labels, contributed, value }: Props) {
  const W = 320
  const H = 64
  const padL = 4
  const padR = 4
  const padT = 6
  const padB = 6
  const innerW = W - padL - padR
  const innerH = H - padT - padB
  const max = Math.max(...value, ...contributed) || 1
  const n = labels.length

  const toX = (i: number) => padL + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW)
  const toY = (v: number) => padT + innerH - (v / max) * innerH

  const contributedArea = `${labels
    .map((_, i) => `${toX(i)},${toY(contributed[i])}`)
    .join(' ')} ${toX(n - 1)},${toY(0)} ${toX(0)},${toY(0)}`

  const gainArea = `${labels.map((_, i) => `${toX(i)},${toY(value[i])}`).join(' ')} ${labels
    .map((_, i) => `${toX(n - 1 - i)},${toY(contributed[n - 1 - i])}`)
    .join(' ')}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'auto' }}>
      <polygon points={gainArea} fill={`${VALUE}33`} />
      <polygon points={contributedArea} fill={`${ACCENT}33`} />
      <polyline
        points={labels.map((_, i) => `${toX(i)},${toY(value[i])}`).join(' ')}
        fill="none"
        stroke={VALUE}
        strokeWidth={1.5}
      />
      <polyline
        points={labels.map((_, i) => `${toX(i)},${toY(contributed[i])}`).join(' ')}
        fill="none"
        stroke={ACCENT}
        strokeWidth={1.5}
        strokeDasharray="3 2"
      />
    </svg>
  )
}
