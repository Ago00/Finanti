'use client'

// Semantic colors (not entity colors): green = contribution, amber = expense.
const CONTRIBUTION = '#10B981'
const EXPENSE = '#F59E0B'

type Props = {
  labels: string[] // 'YYYY-MM', oldest first
  contribution: number[]
  expense: number[]
}

export function BarPairChart({ labels, contribution, expense }: Props) {
  const W = 320
  const H = 64
  const padT = 6
  const padB = 16
  const innerH = H - padT - padB
  const max = Math.max(...contribution, ...expense) || 1
  const n = labels.length
  const slot = W / n
  const bw = Math.min(8, slot / 3)
  const toH = (v: number) => (v / max) * innerH

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: 'auto' }}>
      {labels.map((label, i) => {
        const cx = i * slot + slot / 2
        return (
          <g key={label}>
            <rect
              x={cx - bw - 1}
              y={padT + innerH - toH(contribution[i])}
              width={bw}
              height={toH(contribution[i])}
              rx={1.5}
              fill={CONTRIBUTION}
            />
            <rect
              x={cx + 1}
              y={padT + innerH - toH(expense[i])}
              width={bw}
              height={toH(expense[i])}
              rx={1.5}
              fill={EXPENSE}
            />
          </g>
        )
      })}
    </svg>
  )
}
