'use client'

import { useState, useRef, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence, useInView, useMotionValue, animate } from 'motion/react'
import { ArrowUpRight, ArrowDownRight, ChevronRight, Wallet, TrendingUp, Info } from 'lucide-react'
import type { DashboardSummary } from '@/features/dashboard/domain'
import type { MonthlyContribution } from '@/features/dashboard/queries'
import { formatCurrency } from '@/lib/formatting'
import { calculateActualSavings } from '@/lib/savings'

// ─── Design tokens (aligned with mockup) ─────────────────────────────────────
const C = {
  bg:         '#07090F',
  card:       '#111827',
  border:     '#1F2937',
  primary:    '#6366F1',
  primaryLit: '#818CF8',
  emerald:    '#10B981',
  rose:       '#F43F5E',
  amber:      '#F59E0B',
  white:      '#F9FAFB',
  muted:      '#6B7280',
  faint:      '#374151',
  text2:      '#9CA3AF',
  glass:      'rgba(17,24,39,0.8)',
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({
  value, decimals = 2, duration = 1.2, color,
}: {
  value: number; decimals?: number; duration?: number; color?: string
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10px' })
  const motionVal = useMotionValue(0)

  useEffect(() => {
    if (!inView) return
    const controls = animate(motionVal, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: v => {
        if (ref.current) {
          ref.current.textContent = new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
          }).format(v)
        }
      },
    })
    return controls.stop
  }, [inView, value, decimals, duration, motionVal])

  return <span ref={ref} style={{ color }}>{formatCurrency(0)}</span>
}

// ─── Area chart: patrimonio evolution (valor + aportado) ──────────────────────
type AreaPoint = { month: string; valor: number; aportado: number }

function PatrimonioAreaChart({ data }: { data: AreaPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const W = 400, H = 120, padL = 45, padR = 16, padT = 12, padB = 24
  const iW = W - padL - padR, iH = H - padT - padB

  if (data.length < 2) return null

  const vals = data.map(d => d.valor)
  const aports = data.map(d => d.aportado)
  const min = Math.min(...aports) * 0.97
  const max = Math.max(...vals) * 1.02
  const range = max - min || 1
  const n = data.length
  const toX = (i: number) => padL + (i / (n - 1)) * iW
  const toY = (v: number) => padT + iH - ((v - min) / range) * iH

  const valPts = data.map((d, i) => ({ x: toX(i), y: toY(d.valor) }))
  const aortPts = data.map((d, i) => ({ x: toX(i), y: toY(d.aportado) }))

  const lineVal = valPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const lineAort = aortPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ')
  const areaVal = `${lineVal}L${toX(n - 1)},${padT + iH}L${toX(0)},${padT + iH}Z`
  const areaAort = `${lineAort}L${toX(n - 1)},${padT + iH}L${toX(0)},${padT + iH}Z`

  const yTicks = [min, min + range * 0.5, max]
  const labelStep = Math.max(1, Math.floor(n / 6))

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        style={{ height: 'auto' }}
        onMouseLeave={() => setHovered(null)}
      >
        <defs>
          <linearGradient id="dvGradVal" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.primary} stopOpacity="0.3" />
            <stop offset="100%" stopColor={C.primary} stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="dvGradAort" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.emerald} stopOpacity="0.15" />
            <stop offset="100%" stopColor={C.emerald} stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <g key={i}>
            <line x1={padL} y1={toY(t)} x2={W - padR} y2={toY(t)} stroke={C.border} strokeWidth={0.5} />
            <text x={padL - 6} y={toY(t) + 3.5} textAnchor="end" fontSize={8} fill={C.muted}>
              {t >= 1000 ? `${(t / 1000).toFixed(0)}k` : t.toFixed(0)}
            </text>
          </g>
        ))}

        <path d={areaAort} fill="url(#dvGradAort)" />
        <path d={areaVal} fill="url(#dvGradVal)" />
        <path d={lineAort} fill="none" stroke={C.emerald} strokeWidth={1.5} strokeLinecap="round" strokeDasharray="4 3" opacity={0.7} />
        <path d={lineVal} fill="none" stroke={C.primary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {data.map((d, i) => {
          const x = toX(i)
          const colLeft = i === 0 ? padL : (toX(i - 1) + x) / 2
          const colRight = i === n - 1 ? W - padR : (x + toX(i + 1)) / 2
          return (
            <rect
              key={i} x={colLeft} y={padT} width={colRight - colLeft} height={iH}
              fill="transparent"
              onMouseEnter={() => setHovered(i)}
            />
          )
        })}

        {hovered !== null && (
          <>
            <line x1={toX(hovered)} y1={padT} x2={toX(hovered)} y2={padT + iH} stroke={C.border} strokeWidth={1} />
            <circle cx={valPts[hovered].x} cy={valPts[hovered].y} r={4} fill={C.primary} stroke={C.bg} strokeWidth={2} />
            <circle cx={aortPts[hovered].x} cy={aortPts[hovered].y} r={3} fill={C.emerald} stroke={C.bg} strokeWidth={2} />
          </>
        )}

        {data.map((d, i) => (
          i % labelStep === 0 || i === n - 1 ? (
            <text key={d.month} x={toX(i)} y={H - 6} textAnchor="middle" fontSize={8} fill={C.muted}>
              {d.month.slice(5)}
            </text>
          ) : null
        ))}
      </svg>

      <AnimatePresence>
        {hovered !== null && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute pointer-events-none rounded-xl px-3 py-2 text-xs space-y-1"
            style={{
              background: C.glass,
              border: `1px solid ${C.border}`,
              backdropFilter: 'blur(12px)',
              top: 8,
              left: `calc(${((toX(hovered) - padL) / (W - padL - padR)) * 100}% + ${padL}px - 60px)`,
              minWidth: 120,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <p style={{ color: C.text2 }} className="font-medium">{data[hovered].month}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: C.primary }} />
              <span style={{ color: C.white }}>{formatCurrency(data[hovered].valor)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: C.emerald }} />
              <span style={{ color: C.text2 }}>Aportado: {formatCurrency(data[hovered].aportado)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Bar chart: P&L (ingresos vs gastos) ─────────────────────────────────────
type PnlPoint = { month: string; income: number; expenses: number }

function PnlBarChart({ data }: { data: PnlPoint[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const W = 360, H = 100, padL = 40, padR = 8, padT = 8, padB = 20
  const iW = W - padL - padR, iH = H - padT - padB

  if (!data || data.length === 0) return null

  const n = data.length
  const maxV = Math.max(...data.map(d => d.income), 1)
  const slot = iW / n
  const bw = Math.min(10, slot / 3.5)

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full overflow-visible"
        style={{ height: 'auto' }}
        onMouseLeave={() => setHovered(null)}
      >
        {[0, 0.5, 1].map(t => (
          <g key={t}>
            <line x1={padL} y1={padT + iH * (1 - t)} x2={W - padR} y2={padT + iH * (1 - t)} stroke={C.border} strokeWidth={0.5} />
            <text x={padL - 4} y={padT + iH * (1 - t) + 3} textAnchor="end" fontSize={8} fill={C.muted}>
              {t === 0 ? '0' : t === 0.5 ? `${(maxV * 0.5 / 1000).toFixed(0)}k` : `${(maxV / 1000).toFixed(0)}k`}
            </text>
          </g>
        ))}

        {data.map((d, i) => {
          const cx = padL + i * slot + slot / 2
          const toH = (v: number) => (v / maxV) * iH
          const base = padT + iH
          const isHov = hovered === i
          return (
            <g key={d.month} onMouseEnter={() => setHovered(i)}>
              <rect
                x={cx - bw - 1} y={base - toH(d.income)} width={bw} height={toH(d.income)}
                rx={2} fill={C.emerald} opacity={hovered === null || isHov ? 0.8 : 0.3}
              />
              <rect
                x={cx + 1} y={base - toH(d.expenses)} width={bw} height={toH(d.expenses)}
                rx={2} fill={C.rose} opacity={hovered === null || isHov ? 0.8 : 0.3}
              />
              <text x={cx} y={H - 5} textAnchor="middle" fontSize={8} fill={C.muted}>{d.month.slice(5)}</text>
              <rect x={cx - slot / 2} y={padT} width={slot} height={iH} fill="transparent" />
            </g>
          )
        })}

        {hovered !== null && (
          <line
            x1={padL + hovered * slot + slot / 2} y1={padT}
            x2={padL + hovered * slot + slot / 2} y2={padT + iH}
            stroke={`${C.primary}40`} strokeWidth={1}
          />
        )}
      </svg>

      <AnimatePresence>
        {hovered !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.12 }}
            className="absolute pointer-events-none rounded-xl px-3 py-2 text-xs space-y-1"
            style={{
              background: C.glass, border: `1px solid ${C.border}`, backdropFilter: 'blur(12px)',
              top: 4, left: `${Math.min(((hovered / (data.length - 1)) * 70), 60)}%`, minWidth: 110,
              boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            }}
          >
            <p style={{ color: C.text2 }} className="font-medium">{data[hovered].month}</p>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: C.emerald }} />
              <span style={{ color: C.white }}>{formatCurrency(data[hovered].income)}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-sm" style={{ background: C.rose }} />
              <span style={{ color: C.text2 }}>{formatCurrency(data[hovered].expenses)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Donut chart: category distribution ──────────────────────────────────────
type DonutSlice = { name: string; color: string; value: number }

function DonutChart({ slices }: { slices: DonutSlice[] }) {
  const [active, setActive] = useState<string | null>(null)
  const total = slices.reduce((s, d) => s + d.value, 0)
  if (total === 0) return null

  const R = 52, r = 30, cx = 64, cy = 64

  const paths = slices.reduce<Array<DonutSlice & { path: string; pct: number; endAngle: number }>>(
    (acc, d) => {
      const prevAngle = acc.length === 0 ? -Math.PI / 2 : (acc[acc.length - 1]?.endAngle ?? -Math.PI / 2)
      const pct = d.value / total
      const a0 = prevAngle
      const a1 = prevAngle + pct * 2 * Math.PI
      const large = pct > 0.5 ? 1 : 0
      const x0 = cx + R * Math.cos(a0), y0 = cy + R * Math.sin(a0)
      const x1 = cx + R * Math.cos(a1), y1 = cy + R * Math.sin(a1)
      const ix0 = cx + r * Math.cos(a0), iy0 = cy + r * Math.sin(a0)
      const ix1 = cx + r * Math.cos(a1), iy1 = cy + r * Math.sin(a1)
      const path = `M${ix0.toFixed(2)},${iy0.toFixed(2)} L${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R},0,${large},1,${x1.toFixed(2)},${y1.toFixed(2)} L${ix1.toFixed(2)},${iy1.toFixed(2)} A${r},${r},0,${large},0,${ix0.toFixed(2)},${iy0.toFixed(2)}Z`
      acc.push({ ...d, path, pct, endAngle: a1 })
      return acc
    },
    [],
  )

  const activeSlice = active ? (slices.find(s => s.name === active) ?? null) : null

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <svg width={128} height={128} viewBox="0 0 128 128">
          {paths.map(s => (
            <motion.path
              key={s.name} d={s.path} fill={s.color}
              opacity={active === null || active === s.name ? 1 : 0.3}
              whileHover={{ scale: 1.05 }}
              style={{ transformOrigin: `${cx}px ${cy}px`, cursor: 'pointer' }}
              onHoverStart={() => setActive(s.name)}
              onHoverEnd={() => setActive(null)}
              transition={{ duration: 0.15 }}
            />
          ))}
          <circle cx={cx} cy={cy} r={r - 2} fill={C.card} />
          <AnimatePresence mode="wait">
            {activeSlice ? (
              <motion.g key={activeSlice.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize={9} fill={C.text2}>{activeSlice.name.split(' ')[0]}</text>
                <text x={cx} y={cy + 8} textAnchor="middle" fontSize={11} fontWeight="700" fill={activeSlice.color}>
                  {formatCurrency(activeSlice.value, 'EUR').replace(',00', '')}
                </text>
              </motion.g>
            ) : (
              <motion.g key="total" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <text x={cx} y={cy - 6} textAnchor="middle" fontSize={8} fill={C.muted}>Total</text>
                <text x={cx} y={cy + 8} textAnchor="middle" fontSize={11} fontWeight="700" fill={C.white}>
                  {formatCurrency(total, 'EUR').replace(',00', '')}
                </text>
              </motion.g>
            )}
          </AnimatePresence>
        </svg>
      </div>
      <div className="flex flex-col gap-2 flex-1">
        {paths.map(s => (
          <div
            key={s.name}
            className="flex items-center gap-2 cursor-pointer"
            onMouseEnter={() => setActive(s.name)}
            onMouseLeave={() => setActive(null)}
          >
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: s.color, opacity: active === null || active === s.name ? 1 : 0.3 }} />
            <span className="text-xs flex-1 truncate" style={{ color: active === s.name ? C.white : C.text2 }}>{s.name}</span>
            <span className="text-xs tabular-nums" style={{ color: active === s.name ? s.color : C.muted }}>
              {Math.round(s.pct * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Accounts table ───────────────────────────────────────────────────────────
type AccountRow = {
  id: string
  name: string
  color: string
  currentBalance: number
  monthlyChange: number | null
}

function CuentasTable({ accounts }: { accounts: AccountRow[] }) {
  return (
    <div className="space-y-1">
      <AnimatePresence mode="popLayout">
        {accounts.map((acc, i) => {
          const pos = (acc.monthlyChange ?? 0) >= 0
          return (
            <motion.div
              key={acc.id}
              layout
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2, delay: i * 0.04 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer"
              whileHover={{ backgroundColor: '#151E2E', paddingLeft: '18px' }}
              style={{ background: 'transparent', transition: 'background 0.15s, padding 0.15s' }}
            >
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: acc.color }} />
              <span className="flex-1 text-sm" style={{ color: C.white }}>{acc.name}</span>
              <div className="text-right">
                <p className="text-sm font-semibold tabular-nums" style={{ color: C.white }}>
                  {formatCurrency(acc.currentBalance)}
                </p>
                {acc.monthlyChange !== null && (
                  <p className="text-xs tabular-nums" style={{ color: pos ? C.emerald : C.rose }}>
                    {pos ? '+' : ''}{formatCurrency(acc.monthlyChange)}
                  </p>
                )}
              </div>
              <ChevronRight size={14} style={{ color: C.faint }} />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

// ─── Card wrapper ─────────────────────────────────────────────────────────────
function Card({
  children, className = '', delay = 0,
}: {
  children: ReactNode; className?: string; delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -1 }}
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: C.card, border: `1px solid ${C.border}`, transition: 'box-shadow 0.2s' }}
    >
      {children}
    </motion.div>
  )
}

function CardHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>{title}</p>
      {action && <div>{action}</div>}
    </div>
  )
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({
  label, value, delta, deltaLabel, color, delay = 0,
}: {
  label: string; value: number; delta?: number | null; deltaLabel?: string; color: string; delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10px' })
  const positive = (delta ?? 0) >= 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2, boxShadow: `0 12px 40px ${color}15` }}
      className="rounded-2xl p-4"
      style={{ background: C.card, border: `1px solid ${C.border}`, transition: 'box-shadow 0.2s' }}
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-medium" style={{ color: C.muted }}>{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${color}18` }}>
          <Wallet size={15} style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold tabular-nums mb-1" style={{ color: C.white, lineHeight: 1.2 }}>
        {inView
          ? <AnimatedNumber value={value} decimals={2} duration={1.2 + delay * 0.3} color={C.white} />
          : '—'}
      </p>
      {delta != null && (
        <div className="flex items-center gap-1">
          {positive
            ? <ArrowUpRight size={12} style={{ color: C.emerald }} />
            : <ArrowDownRight size={12} style={{ color: C.rose }} />}
          <span className="text-xs" style={{ color: positive ? C.emerald : C.rose }}>
            {positive ? '+' : ''}{delta.toFixed(1)}% {deltaLabel}
          </span>
        </div>
      )}
    </motion.div>
  )
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────
function Tooltip({ text, children }: { text: string; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative inline-flex">
      <div onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
        {children}
      </div>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 rounded-xl px-3 py-2.5 text-xs z-50"
            style={{
              background: C.glass,
              border: `1px solid ${C.border}`,
              backdropFilter: 'blur(12px)',
              color: C.text2,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {text}
            <div
              className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent"
              style={{ borderTopColor: C.border }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Mini bar chart for savings history ───────────────────────────────────────
type SavingsHistoryPoint = { mes: string; proyectado: number; ejecutado: number }

function SavingsHistoryChart({ data }: { data: SavingsHistoryPoint[] }) {
  const maxV = Math.max(...data.flatMap(d => [d.proyectado, d.ejecutado])) * 1.1 || 1
  const BAR_H = 72

  return (
    <div className="flex items-end gap-1.5 w-full" style={{ height: BAR_H + 24 }}>
      {data.map((d, i) => {
        const hProj = Math.round((d.proyectado / maxV) * BAR_H)
        const hExec = Math.round((d.ejecutado  / maxV) * BAR_H)
        const isLast = i === data.length - 1
        return (
          <div key={d.mes} className="flex-1 flex flex-col items-center gap-1" style={{ justifyContent: 'flex-end' }}>
            <div className="relative flex items-end gap-0.5 w-full justify-center">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: hProj }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="w-2 rounded-t-sm"
                style={{ background: isLast ? `${C.primary}60` : C.faint, border: isLast ? `1px solid ${C.primary}` : 'none' }}
              />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: hExec }}
                transition={{ duration: 0.6, delay: i * 0.06 + 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="w-2 rounded-t-sm"
                style={{
                  background: isLast
                    ? d.ejecutado >= d.proyectado ? C.emerald : C.amber
                    : d.ejecutado >= d.proyectado ? `${C.emerald}50` : `${C.amber}50`,
                }}
              />
            </div>
            <span className="text-[9px] tabular-nums" style={{ color: isLast ? C.text2 : C.muted }}>
              {d.mes}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ─── Widget Ingresos ──────────────────────────────────────────────────────────
function WidgetIngresos({
  previousMonthIncome,
  currentMonthIncome,
  previousMonthLabel,
  currentMonthLabel,
}: {
  previousMonthIncome: number | null
  currentMonthIncome: number
  previousMonthLabel: string
  currentMonthLabel: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10px' })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -1 }}
      className="rounded-2xl p-5"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
          Ingresos
        </p>
        <div className="flex items-center gap-2">
          <Tooltip text={`${previousMonthLabel} alimenta el cálculo de ahorro de este mes.`}>
            <Info size={13} style={{ color: C.muted, cursor: 'help' }} />
          </Tooltip>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${C.emerald}18` }}>
            <TrendingUp size={15} style={{ color: C.emerald }} />
          </div>
        </div>
      </div>

      {/* Previous month — main reference */}
      <div className="mb-1">
        <div className="flex items-center gap-1.5 mb-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C.emerald }} />
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.emerald }}>
            {previousMonthLabel} — referencia
          </p>
        </div>
        <p className="text-4xl font-bold tabular-nums leading-none" style={{ color: C.white }}>
          {inView
            ? <AnimatedNumber value={previousMonthIncome ?? 0} decimals={2} duration={1.0} color={C.white} />
            : '—'}
        </p>
        {previousMonthIncome === null && (
          <p className="text-xs mt-1.5" style={{ color: C.muted }}>Sin datos del mes anterior</p>
        )}
        {previousMonthIncome !== null && (
          <p className="text-xs mt-1.5" style={{ color: C.muted }}>Alimenta el presupuesto de este mes</p>
        )}
      </div>

      <div className="my-4" style={{ borderTop: `1px solid ${C.border}` }} />

      {/* Current month — secondary */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ background: C.faint }} />
            <p className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>
              {currentMonthLabel} (en curso)
            </p>
          </div>
          <p className="text-xl font-semibold tabular-nums" style={{ color: C.text2 }}>
            {inView
              ? <AnimatedNumber value={currentMonthIncome} decimals={2} duration={1.1} color={C.text2} />
              : '—'}
          </p>
        </div>
        <p className="text-xs text-right" style={{ color: C.muted }}>
          Lo que ha<br />entrado hasta hoy
        </p>
      </div>

      <Link href="/ingresos" className="mt-4 w-full flex items-center justify-center gap-1.5 text-xs py-2" style={{ color: C.muted }}>
        Ver detalle de ingresos
        <ChevronRight size={12} />
      </Link>
    </motion.div>
  )
}

// ─── Widget Ahorro ────────────────────────────────────────────────────────────
function WidgetAhorro({
  plannedSavings,
  actualSavings,
  previousMonthIncome,
  previousMonthLabel,
  monthlyPnl,
}: {
  plannedSavings: number | null
  actualSavings: number | null
  previousMonthIncome: number | null
  previousMonthLabel: string
  monthlyPnl: { month: string; income: number; expenses: number; invGain: number }[]
}) {
  const [showHistorico, setShowHistorico] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10px' })

  // Build savings history from pnl data (last 6 months)
  const savingsHistory: SavingsHistoryPoint[] = monthlyPnl.slice(-6).map((p, i, arr) => {
    const prevIncome = i > 0 ? arr[i - 1].income : null
    const execSavings = prevIncome !== null ? prevIncome - p.expenses - p.invGain : 0
    return {
      mes: p.month.slice(5),
      proyectado: plannedSavings ?? 0,
      ejecutado: Math.max(0, execSavings),
    }
  })

  const diffAhorro = actualSavings !== null && plannedSavings !== null
    ? actualSavings - plannedSavings
    : null
  const positive = (diffAhorro ?? 0) >= 0

  const refIncomeRatio = previousMonthIncome && previousMonthIncome > 0

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -1 }}
      className="rounded-2xl p-5"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div className="flex items-center justify-between mb-5">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
          Ahorro del mes
        </p>
        <div className="flex items-center gap-2">
          <Tooltip text={`Calculado con ingresos de ${previousMonthLabel}. Fórmula: ingresos anterior − gastos − inversiones.`}>
            <button
              className="w-6 h-6 rounded-lg flex items-center justify-center"
              style={{ background: C.faint }}
            >
              <Info size={12} style={{ color: C.text2 }} />
            </button>
          </Tooltip>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${C.primary}18` }}>
            <Wallet size={15} style={{ color: C.primary }} />
          </div>
        </div>
      </div>

      {/* Projected vs actual */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div
          className="rounded-xl px-3 py-3"
          style={{ background: `${C.primary}10`, border: `1px solid ${C.primary}20` }}
        >
          <p className="text-[9px] font-medium uppercase tracking-wider mb-1.5" style={{ color: C.primaryLit }}>
            Presupuesto
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: C.white, lineHeight: 1.2 }}>
            {plannedSavings !== null
              ? (inView ? <AnimatedNumber value={plannedSavings} decimals={2} duration={0.9} color={C.white} /> : '—')
              : <span style={{ color: C.muted }}>—</span>}
          </p>
          {refIncomeRatio && plannedSavings !== null && (
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.primary }} />
              <p className="text-[10px]" style={{ color: C.muted }}>
                {Math.round((plannedSavings / previousMonthIncome!) * 100)}% de ingresos
              </p>
            </div>
          )}
        </div>

        <div
          className="rounded-xl px-3 py-3"
          style={{ background: `${C.emerald}08`, border: `1px solid ${C.emerald}20` }}
        >
          <p className="text-[9px] font-medium uppercase tracking-wider mb-1.5" style={{ color: C.emerald }}>
            Realidad
          </p>
          <p className="text-lg font-bold tabular-nums" style={{ color: C.white, lineHeight: 1.2 }}>
            {actualSavings !== null
              ? (inView ? <AnimatedNumber value={actualSavings} decimals={2} duration={1.0} color={C.white} /> : '—')
              : <span style={{ color: C.muted }}>Sin datos</span>}
          </p>
          {refIncomeRatio && actualSavings !== null && (
            <div className="flex items-center gap-1 mt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.emerald }} />
              <p className="text-[10px]" style={{ color: C.muted }}>
                {Math.round((actualSavings / previousMonthIncome!) * 100)}% de ingresos
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {plannedSavings !== null && actualSavings !== null && (
        <div className="mb-4">
          <div className="flex justify-between text-[10px] mb-1.5" style={{ color: C.muted }}>
            <span>Ejecución del ahorro</span>
            {diffAhorro !== null && (
              <span style={{ color: positive ? C.emerald : C.amber }}>
                {positive ? '+' : ''}{formatCurrency(diffAhorro)}
              </span>
            )}
          </div>
          <div className="relative h-2 rounded-full overflow-hidden" style={{ background: C.faint }}>
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${C.primary}, ${C.emerald})` }}
              initial={{ width: 0 }}
              animate={{
                width: `${Math.min((actualSavings / (plannedSavings || 1)) * 100, 100)}%`,
              }}
              transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      )}

      {/* History toggle */}
      <button
        onClick={() => setShowHistorico(v => !v)}
        className="w-full flex items-center justify-between text-xs py-2 px-0"
        style={{ color: C.muted }}
      >
        <span className="flex items-center gap-1.5">
          <ArrowUpRight size={12} style={{ color: C.primary }} />
          Ver histórico de ahorro
        </span>
        <motion.span animate={{ rotate: showHistorico ? 90 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronRight size={12} />
        </motion.span>
      </button>

      <AnimatePresence>
        {showHistorico && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="pt-4 border-t mt-3" style={{ borderColor: C.border }}>
              <p className="text-[10px] uppercase tracking-wider mb-3" style={{ color: C.muted }}>
                Últimos {savingsHistory.length} meses
              </p>
              {savingsHistory.length >= 2 && (
                <>
                  <SavingsHistoryChart data={savingsHistory} />
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-1.5 rounded-sm" style={{ background: C.faint }} />
                      <span className="text-[10px]" style={{ color: C.muted }}>Presupuesto</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-3 h-1.5 rounded-sm" style={{ background: C.emerald }} />
                      <span className="text-[10px]" style={{ color: C.muted }}>Realidad</span>
                    </div>
                  </div>
                </>
              )}
              {savingsHistory.length < 2 && (
                <p className="text-xs" style={{ color: C.muted }}>No hay histórico suficiente aún.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function DashboardView({
  summary,
  budgetWidget,
  patrimonioChangePct,
  monthlyContributions,
}: {
  summary: DashboardSummary
  budgetWidget: ReactNode
  patrimonioChangePct: number | null
  monthlyContributions: MonthlyContribution[]
}) {
  const isEmpty = summary.totalBalance === 0 && summary.accounts.every(a => a.currentBalance === 0)

  if (isEmpty) {
    return (
      <div className="rounded-2xl p-6 text-center text-sm" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.text2 }}>
        No hay datos aún. Registra tus primeros ingresos y gastos para empezar.
      </div>
    )
  }

  // Build area chart data: evolution totals merged with cumulative contributions per month
  const cumulativeContribByMonth = new Map<string, number>()
  let runningContrib = 0
  for (const c of monthlyContributions) {
    runningContrib += c.contributions
    cumulativeContribByMonth.set(c.month, runningContrib)
  }
  const areaData: AreaPoint[] = summary.allEvolution.map(e => ({
    month: e.month,
    valor: e.total,
    aportado: cumulativeContribByMonth.get(e.month) ?? 0,
  }))

  // PnL bar chart data (last 6 months for readability)
  const pnlData: PnlPoint[] = summary.monthlyPnl.slice(-6).map(p => ({
    month: p.month,
    income: p.income,
    expenses: p.expenses,
  }))

  // Donut slices from category totals of this month (use invGain as proxy — real data is in BudgetWidget)
  // Build from allEvolution distribution using accounts monthlyChange
  const donutSlices: DonutSlice[] = summary.accounts
    .filter(a => a.monthlyChange !== null && a.monthlyChange !== 0)
    .map(a => ({
      name: a.name,
      color: a.color,
      value: Math.abs(a.currentBalance),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 7)

  const accountRows: AccountRow[] = summary.accounts.map(a => ({
    id: a.id,
    name: a.name,
    color: a.color,
    currentBalance: a.currentBalance,
    monthlyChange: a.monthlyChange,
  }))

  return (
    <div style={{ background: C.bg }}>
      {/* Budget pending banner */}
      {!summary.hasCurrentMonthSnapshot && (
        <div className="rounded-xl px-4 py-3 flex items-center justify-between mb-4"
          style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.3)' }}>
          <p className="text-sm" style={{ color: C.amber }}>No hay presupuesto definido para {summary.currentMonthLabel}</p>
          <Link
            href={`/presupuesto?year=${summary.currentYear}&month=${summary.currentMonth}`}
            className="text-xs"
            style={{ color: C.amber }}
          >
            Ir a Presupuesto →
          </Link>
        </div>
      )}

      {/* Bento grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">

        {/* KPI row */}
        <StatCard
          label="Patrimonio total"
          value={summary.totalBalance}
          delta={patrimonioChangePct}
          deltaLabel="este mes"
          color={C.primary}
          delay={0}
        />
        <StatCard
          label="Ingresos del mes"
          value={summary.monthlyIncome}
          color={C.emerald}
          delay={0.05}
        />
        <StatCard
          label="Gastos del mes"
          value={summary.monthlyExpenses}
          color={C.rose}
          delay={0.1}
        />

        {/* Evolution area chart */}
        {areaData.length >= 2 && (
          <Card delay={0.15} className="xl:col-span-2">
            <CardHeader
              title="Evolución del patrimonio"
              action={
                <div className="flex gap-3">
                  {[{ color: C.primary, label: 'Valor', dash: false }, { color: C.emerald, label: 'Aportado', dash: true }].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[10px]" style={{ color: C.muted }}>
                      <span
                        className="w-5 h-0.5 inline-block"
                        style={{ background: l.color, opacity: l.dash ? 0.7 : 1, borderTop: l.dash ? `1px dashed ${l.color}` : undefined }}
                      />
                      {l.label}
                    </span>
                  ))}
                </div>
              }
            />
            <PatrimonioAreaChart data={areaData} />
          </Card>
        )}

        {/* Widget ingresos — dos meses */}
        <WidgetIngresos
          previousMonthIncome={summary.previousMonthIncome}
          currentMonthIncome={summary.monthlyIncome}
          previousMonthLabel={summary.previousMonthLabelShort}
          currentMonthLabel={summary.currentMonthLabelShort}
        />

        {/* Widget ahorro — proyectado vs ejecutado */}
        <WidgetAhorro
          plannedSavings={summary.plannedSavings}
          actualSavings={calculateActualSavings({
            previousMonthIncome: summary.previousMonthIncome,
            currentMonthExpenses: summary.monthlyExpenses,
            currentMonthInvestments: summary.currentMonthInvestments,
          })}
          previousMonthIncome={summary.previousMonthIncome}
          previousMonthLabel={summary.previousMonthLabelShort}
          monthlyPnl={summary.monthlyPnl}
        />

        {/* Accounts table */}
        {accountRows.length > 0 && (
          <Card delay={0.25} className="md:col-span-2 xl:col-span-3">
            <CardHeader
              title="Mis cuentas"
              action={
                <Link href="/patrimonio" className="text-xs" style={{ color: C.primary }}>
                  Ver en Patrimonio →
                </Link>
              }
            />
            <CuentasTable accounts={accountRows} />
          </Card>
        )}

        {/* Donut: distribution */}
        {donutSlices.length > 0 && (
          <Card delay={0.3}>
            <CardHeader title="Distribución de patrimonio" />
            <DonutChart slices={donutSlices} />
          </Card>
        )}

        {/* P&L bar chart */}
        {pnlData.length >= 2 && (
          <Card delay={0.35} className="xl:col-span-2">
            <CardHeader
              title="Ingresos vs Gastos"
              action={
                <div className="flex gap-3">
                  {[{ color: C.emerald, label: 'Ingresos' }, { color: C.rose, label: 'Gastos' }].map(l => (
                    <span key={l.label} className="flex items-center gap-1.5 text-[10px]" style={{ color: C.muted }}>
                      <span className="w-2 h-2 rounded-sm inline-block" style={{ background: l.color }} />{l.label}
                    </span>
                  ))}
                </div>
              }
            />
            <PnlBarChart data={pnlData} />
          </Card>
        )}

        {/* Budget card with expandable comparativa */}
        <div className="xl:col-span-3">
          {budgetWidget}
        </div>

      </div>
    </div>
  )
}
