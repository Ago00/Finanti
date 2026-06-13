'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence, useInView } from 'motion/react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'
import type { CategoryTotal, MonthlyExpenseTotal } from '@/features/transactions/queries'
import { formatCurrency } from '@/lib/formatting'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:         '#07090F',
  card:       '#111827',
  cardHover:  '#151E2E',
  glass:      'rgba(17,24,39,0.85)',
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
}

const BAR_H = 160

// ─── Evolución mensual (barras clicables) ─────────────────────────────────────
function EvolucionBars({
  monthlyTotals, activeIdx, onSelect, budgetTotal,
}: {
  monthlyTotals: MonthlyExpenseTotal[]
  activeIdx: number
  onSelect: (i: number) => void
  budgetTotal: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true })
  const maxVal = Math.max(...monthlyTotals.map(t => t.total), budgetTotal) * 1.1 || 1
  const pptoY = budgetTotal > 0 ? Math.round((budgetTotal / maxVal) * BAR_H) : null

  return (
    <div ref={ref} className="w-full select-none">
      <div className="relative w-full" style={{ height: BAR_H }}>
        {[0.25, 0.5, 0.75, 1].map(t => (
          <div
            key={t}
            className="absolute left-0 right-0 pointer-events-none flex items-end pb-0.5"
            style={{ bottom: `${t * 100}%`, borderTop: `1px solid ${C.border}` }}
          >
            <span className="text-[8px] tabular-nums leading-none" style={{ color: C.muted }}>
              {Math.round(t * maxVal).toLocaleString('es-ES')} €
            </span>
          </div>
        ))}

        {pptoY !== null && (
          <div
            className="absolute left-0 right-0 z-10 pointer-events-none flex items-center justify-end"
            style={{ bottom: pptoY, borderTop: `1px dashed ${C.amber}66` }}
          >
            <span className="text-[9px] font-medium pr-1" style={{ color: C.amber, background: C.card }}>Ppto</span>
          </div>
        )}

        <div className="absolute inset-0 flex gap-1">
          {monthlyTotals.map((t, i) => {
            const barH = Math.round((t.total / maxVal) * BAR_H)
            const isActive = activeIdx === i
            const over = budgetTotal > 0 && t.total > budgetTotal
            const color = over ? C.rose : C.primary
            return (
              <div
                key={t.month}
                onClick={() => onSelect(i)}
                className="relative flex-1 flex flex-col cursor-pointer"
                style={{ justifyContent: 'flex-end', alignItems: 'center' }}
              >
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="absolute text-[9px] font-bold tabular-nums"
                      style={{ bottom: barH + 3, color: over ? C.rose : C.primaryLit }}
                    >
                      {formatCurrency(t.total)}
                    </motion.span>
                  )}
                </AnimatePresence>
                <motion.div
                  style={{
                    width: '55%',
                    borderRadius: '3px 3px 0 0',
                    background: isActive ? color : `${color}55`,
                    flexShrink: 0,
                  }}
                  initial={{ height: 0 }}
                  animate={inView ? { height: barH } : { height: 0 }}
                  transition={{ duration: 0.5, delay: i * 0.07, ease: [0.16, 1, 0.3, 1] }}
                />
              </div>
            )
          })}
        </div>
      </div>

      <div style={{ height: 1, background: C.border }} />

      <div className="flex gap-1 mt-1.5">
        {monthlyTotals.map((t, i) => (
          <button key={t.month} onClick={() => onSelect(i)} className="flex-1 text-center">
            <span className="text-[10px] font-medium" style={{ color: activeIdx === i ? C.white : C.muted }}>
              {t.month.slice(5)}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Panel de categorías con toggle comparativa ───────────────────────────────
function CategoryPanel({
  totals, prevMonthTotals, threeMonthAvgTotals, activeFilter, onFilterChange,
}: {
  totals: CategoryTotal[]
  prevMonthTotals: CategoryTotal[]
  threeMonthAvgTotals: CategoryTotal[]
  activeFilter: string | null
  onFilterChange: (id: string | null) => void
}) {
  const [comparativa, setComparativa] = useState<'ant' | 'media'>('ant')
  const grandTotal = totals.reduce((s, t) => s + t.total, 0)
  if (grandTotal === 0) return null

  const refMap = new Map<string | null, number>()
  const refTotals = comparativa === 'ant' ? prevMonthTotals : threeMonthAvgTotals
  for (const t of refTotals) {
    refMap.set(t.categoryId, t.total)
  }

  const sorted = [...totals].sort((a, b) => b.total - a.total)

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>Por categoría</p>
        <div className="flex rounded-lg overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
          {(['ant', 'media'] as const).map(opt => (
            <button
              key={opt}
              onClick={() => setComparativa(opt)}
              className="px-2.5 py-1 text-[10px] font-medium transition-colors"
              style={{
                background: comparativa === opt ? C.primary : 'transparent',
                color: comparativa === opt ? C.white : C.muted,
              }}
            >
              {opt === 'ant' ? 'vs ant.' : 'media 3m'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {sorted.map((t, i) => {
          const pct = (t.total / grandTotal) * 100
          const isActive = activeFilter === (t.categoryId ?? '__null__')
          const ref = refMap.get(t.categoryId) ?? 0
          const delta = ref > 0 ? t.total - ref : 0
          const deltaPct = ref > 0 ? Math.round((delta / ref) * 100) : null
          const better = delta <= 0

          // Assign a consistent color by index
          const COLORS = ['#F59E0B', '#8B5CF6', '#F97316', '#3B82F6', '#10B981', '#EC4899', '#EF4444', '#06B6D4']
          const color = COLORS[i % COLORS.length]

          return (
            <motion.div
              key={t.categoryId ?? '__null__'}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.05 }}
              whileHover={{ x: 2 }}
              onClick={() => onFilterChange(isActive ? null : (t.categoryId ?? '__null__'))}
              className="cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: color }} />
                  <span className="text-xs truncate" style={{ color: isActive ? C.white : C.text2 }}>
                    {t.categoryName ?? 'Sin categoría'}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs tabular-nums font-medium" style={{ color: isActive ? C.white : C.text2 }}>
                    {formatCurrency(t.total)}
                  </span>
                  {deltaPct !== null && (
                    <span
                      className="text-[10px] tabular-nums font-medium px-1.5 py-0.5 rounded-md"
                      style={{
                        background: better ? `${C.emerald}15` : `${C.rose}15`,
                        color: better ? C.emerald : C.rose,
                      }}
                    >
                      {delta === 0 ? '=' : `${better ? '' : '+'}${deltaPct}%`}
                    </span>
                  )}
                </div>
              </div>
              <div className="relative rounded-full h-1.5 overflow-visible" style={{ background: C.faint }}>
                <motion.div
                  className="h-full rounded-full absolute top-0 left-0"
                  style={{ background: color, opacity: activeFilter && !isActive ? 0.25 : 0.9 }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, delay: 0.3 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
                />
                {ref > 0 && (
                  <div
                    className="absolute top-1/2 -translate-y-1/2 w-0.5 h-3 rounded-full"
                    style={{ left: `${(ref / grandTotal) * 100}%`, background: C.muted, opacity: 0.5 }}
                  />
                )}
              </div>
              <AnimatePresence>
                {isActive && ref > 0 && (
                  <motion.p
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-[10px] mt-1"
                    style={{ color: C.muted }}
                  >
                    {comparativa === 'ant' ? 'Mes anterior' : 'Media 3m'}: {formatCurrency(ref)}
                    {' · '}{better ? 'Bajaste' : 'Subiste'} {formatCurrency(Math.abs(delta))}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label, value, sub, color, delta, deltaLabel, delay = 0,
}: {
  label: string
  value: string | number
  sub: string
  color: string
  delta?: number | null
  deltaLabel?: string
  delay?: number
}) {
  const displayValue = typeof value === 'number' ? formatCurrency(value) : String(value)
  const isPositiveDelta = (delta ?? 0) < 0 // lower spending = better

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -2 }}
      className="rounded-2xl p-4"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <p className="text-xs font-medium mb-2" style={{ color: C.muted }}>{label}</p>
      <p className="text-2xl font-bold tabular-nums mb-0.5" style={{ color }}>
        {displayValue}
      </p>
      <div className="flex items-center gap-2">
        <span className="text-xs" style={{ color: C.muted }}>{sub}</span>
        {delta != null && (
          <span className="text-xs flex items-center gap-0.5" style={{ color: isPositiveDelta ? C.emerald : C.rose }}>
            {isPositiveDelta ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
            {formatCurrency(Math.abs(delta))} {deltaLabel}
          </span>
        )}
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
type Props = {
  categoryTotals: CategoryTotal[]
  monthlyTotals: MonthlyExpenseTotal[]
  currentMonthTotal: number
  budgetTotal: number
  prevMonthCategoryTotals: CategoryTotal[]
  threeMonthAvgCategoryTotals: CategoryTotal[]
  year: number
  month: number
}

export function SpendingCharts({
  categoryTotals,
  monthlyTotals,
  currentMonthTotal,
  budgetTotal,
  prevMonthCategoryTotals,
  threeMonthAvgCategoryTotals,
}: Props) {
  const last6 = monthlyTotals.slice(-6)
  // Default to last bar (current month) in the evolucion chart
  const defaultActiveIdx = last6.length > 0 ? last6.length - 1 : 0
  const [activeMonthIdx, setActiveMonthIdx] = useState(defaultActiveIdx)
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  const hasCategoryData = categoryTotals.length > 0 && currentMonthTotal > 0
  const hasMonthlyData = last6.length >= 2
  const pct = budgetTotal > 0 ? Math.round((currentMonthTotal / budgetTotal) * 100) : 0

  if (!hasCategoryData && !hasMonthlyData && budgetTotal <= 0) return null

  // The largest category by spend
  const topCategory = [...categoryTotals].sort((a, b) => b.total - a.total)[0]

  // Build transaction-like rows from category totals filtered by selection
  // (actual transaction list is rendered by TransactionDetailToggle in the page)
  // This component shows the visual analytics; the transaction list is handled separately

  return (
    <div className="space-y-4">

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          label="Total gastado"
          value={currentMonthTotal}
          sub={budgetTotal > 0 ? `de ${formatCurrency(budgetTotal)}` : 'este mes'}
          color={currentMonthTotal > budgetTotal && budgetTotal > 0 ? C.rose : C.white}
          delay={0}
        />
        {topCategory && (
          <KpiCard
            label="Mayor gasto"
            value={topCategory.total}
            sub={topCategory.categoryName ?? 'Sin categoría'}
            color={C.amber}
            delay={0.06}
          />
        )}
        <KpiCard
          label="Categorías"
          value={String(categoryTotals.length)}
          sub="con gastos este mes"
          color={C.primary}
          delay={0.12}
        />
      </div>

      {/* Evolución mensual */}
      {hasMonthlyData && (
        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="rounded-2xl p-5"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
              Evolución {last6.length} meses
            </p>
            <div className="flex items-center gap-3">
              {budgetTotal > 0 && (
                <span className="flex items-center gap-1.5 text-[10px]" style={{ color: C.muted }}>
                  <span className="inline-block w-8 h-px" style={{ borderTop: `1px dashed ${C.amber}` }} />
                  Presupuesto
                </span>
              )}
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color: last6[activeMonthIdx] && budgetTotal > 0 && last6[activeMonthIdx].total > budgetTotal ? C.rose : C.primary }}
              >
                {last6[activeMonthIdx] ? formatCurrency(last6[activeMonthIdx].total) : ''}
              </span>
            </div>
          </div>
          <div style={{ marginLeft: -4, marginRight: -4 }}>
            <EvolucionBars
              monthlyTotals={last6}
              activeIdx={activeMonthIdx}
              onSelect={setActiveMonthIdx}
              budgetTotal={budgetTotal}
            />
          </div>
        </motion.div>
      )}

      {/* Categories + transactions grid */}
      {hasCategoryData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Category panel */}
          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
            className="rounded-2xl p-5 md:col-span-2"
            style={{ background: C.card, border: `1px solid ${C.border}` }}
          >
            <CategoryPanel
              totals={categoryTotals}
              prevMonthTotals={prevMonthCategoryTotals}
              threeMonthAvgTotals={threeMonthAvgCategoryTotals}
              activeFilter={categoryFilter}
              onFilterChange={setCategoryFilter}
            />
          </motion.div>

          {/* Budget progress (if budget exists) */}
          {budgetTotal > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="rounded-2xl p-5 md:col-span-1 flex flex-col"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
            >
              <div className="flex flex-col h-full">
                <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: C.muted }}>
                  Presupuesto del mes
                </p>
                <div className="flex-1 flex items-stretch gap-5 min-h-0">
                  {/* Vertical bar */}
                  <div className="flex flex-col items-center gap-1.5">
                    <span className="text-[9px] tabular-nums shrink-0" style={{ color: C.muted }}>
                      {formatCurrency(budgetTotal)}
                    </span>
                    <div className="relative w-5 flex-1 rounded-full overflow-hidden" style={{ background: C.faint }}>
                      <motion.div
                        className="absolute bottom-0 left-0 right-0 rounded-full"
                        style={{ background: pct > 100 ? C.rose : `linear-gradient(0deg, ${C.primary}, ${C.primaryLit})` }}
                        initial={{ height: 0 }}
                        animate={{ height: `${Math.min(pct, 100)}%` }}
                        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <span className="text-[9px] tabular-nums shrink-0" style={{ color: C.muted }}>0 €</span>
                  </div>
                  {/* Stats */}
                  <div className="flex flex-col justify-center gap-4">
                    <div>
                      <p className="text-2xl font-bold tabular-nums" style={{ color: pct > 100 ? C.rose : C.primary }}>
                        {pct}%
                      </p>
                      <p className="text-[10px]" style={{ color: C.muted }}>consumido</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold tabular-nums" style={{ color: C.white }}>
                        {formatCurrency(currentMonthTotal)}
                      </p>
                      <p className="text-[10px]" style={{ color: C.muted }}>gastado</p>
                    </div>
                    <div>
                      <p className="text-sm tabular-nums font-medium" style={{ color: budgetTotal - currentMonthTotal >= 0 ? C.emerald : C.rose }}>
                        {formatCurrency(Math.abs(budgetTotal - currentMonthTotal))}
                      </p>
                      <p className="text-[10px]" style={{ color: C.muted }}>
                        {budgetTotal - currentMonthTotal >= 0 ? 'disponible' : 'excedido'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
