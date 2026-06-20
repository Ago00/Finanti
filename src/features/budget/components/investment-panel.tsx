'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
  CheckCircle2,
  Circle,
  Plus,
  TrendingUp,
  BarChart3,
  Coins,
  X,
  Check,
  AlertCircle,
} from 'lucide-react'
import type { InvestmentLine } from '@/features/budget/domain'
import { confirmInvestment, addUnplannedInvestment } from '@/features/budget/actions'
import { formatCurrency } from '@/lib/formatting'

// ─── Design tokens ────────────────────────────────────────────────────────────
const C = {
  bg:      '#07090F',
  card:    '#111827',
  border:  '#1F2937',
  primary: '#6366F1',
  emerald: '#34D399',
  rose:    '#F43F5E',
  amber:   '#F59E0B',
  white:   '#F9FAFB',
  muted:   '#6B7280',
  faint:   '#374151',
  text2:   '#9CA3AF',
}

function renderInvestmentIcon(name: string | null, size: number, color: string) {
  if (!name) return <Coins size={size} style={{ color }} />
  const lower = name.toLowerCase()
  if (lower.includes('índice') || lower.includes('indexado') || lower.includes('etf') || lower.includes('s&p')) {
    return <BarChart3 size={size} style={{ color }} />
  }
  if (lower.includes('pensión') || lower.includes('pension')) {
    return <TrendingUp size={size} style={{ color }} />
  }
  return <Coins size={size} style={{ color }} />
}

// ─── Confirmed row ────────────────────────────────────────────────────────────
function ConfirmedRow({ line }: { line: InvestmentLine }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex items-center gap-3 px-4 py-3.5 rounded-xl"
      style={{ background: `${C.emerald}08`, border: `1px solid ${C.emerald}25` }}
    >
      <CheckCircle2 size={18} style={{ color: C.emerald, flexShrink: 0 }} />
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${C.emerald}15` }}
      >
        {renderInvestmentIcon(line.assetClassName, 16, C.emerald)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium" style={{ color: C.white }}>
          {line.assetClassName ?? 'Inversión'}
        </p>
        <p className="text-xs" style={{ color: C.emerald }}>
          {formatCurrency(line.plannedAmount)} ejecutado
        </p>
      </div>
      <span
        className="text-xs px-2 py-0.5 rounded-full font-medium"
        style={{ background: `${C.emerald}20`, color: C.emerald }}
      >
        Confirmado
      </span>
    </motion.div>
  )
}

// ─── Pending row ─────────────────────────────────────────────────────────────
function PendingRow({
  line,
  onConfirm,
}: {
  line: InvestmentLine
  onConfirm: (line: InvestmentLine, amount: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [valor, setValor] = useState(String(line.plannedAmount))
  const [confirming, setConfirming] = useState(false)

  function handleConfirm() {
    setConfirming(true)
    const parsed = parseFloat(valor)
    const amount = !isNaN(parsed) && parsed > 0 ? parsed : line.plannedAmount
    onConfirm(line, amount)
  }

  return (
    <motion.div layout className="rounded-xl overflow-hidden" style={{ border: `1px solid ${C.border}` }}>
      <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: C.card }}>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: `${C.primary}18` }}
        >
          {renderInvestmentIcon(line.assetClassName, 16, C.primary)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: C.white }}>
            {line.assetClassName ?? 'Inversión'}
          </p>
          {editing ? (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="relative">
                <input
                  type="number"
                  value={valor}
                  onChange={e => setValor(e.target.value)}
                  className="w-24 px-2 py-1 rounded-lg text-xs outline-none"
                  style={{
                    background: C.bg,
                    border: `1px solid ${C.primary}60`,
                    color: C.white,
                  }}
                  autoFocus
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px]" style={{ color: C.muted }}>
                  €
                </span>
              </div>
              <span className="text-[10px]" style={{ color: C.muted }}>
                planif: {formatCurrency(line.plannedAmount)}
              </span>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="text-xs mt-0.5 underline underline-offset-2 decoration-dashed"
              style={{ color: C.muted }}
            >
              {formatCurrency(line.plannedAmount)} planif. — editar importe
            </button>
          )}
        </div>

        <motion.button
          onClick={handleConfirm}
          disabled={confirming}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold flex-shrink-0"
          style={{
            background: confirming ? C.emerald : `${C.primary}20`,
            color:      confirming ? C.white   : C.primary,
            border:     `1px solid ${confirming ? C.emerald : C.primary}40`,
          }}
          animate={{ scale: confirming ? [1, 0.95, 1] : 1 }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence mode="wait">
            {confirming ? (
              <motion.span key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                <Check size={12} /> OK
              </motion.span>
            ) : (
              <motion.span key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1">
                <Circle size={12} /> Confirmar
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="h-0.5 mx-4 mb-1 rounded-full" style={{ background: C.faint }}>
        <div className="h-full rounded-full w-0" style={{ background: C.primary }} />
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────
export function InvestmentPanel({
  investmentLines,
  month,
  assetClasses,
}: {
  investmentLines: InvestmentLine[]
  month: Date
  assetClasses: { id: string; name: string }[]
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [lines, setLines] = useState<InvestmentLine[]>(investmentLines)
  const [showUnplanned, setShowUnplanned] = useState(false)
  const [unplannedDesc, setUnplannedDesc] = useState('')
  const [unplannedAmount, setUnplannedAmount] = useState('')
  const [unplannedAssetClassId, setUnplannedAssetClassId] = useState('')
  const [savingUnplanned, setSavingUnplanned] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmedLines = lines.filter(l => l.isConfirmed)
  const pendingLines = lines.filter(l => !l.isConfirmed)
  const totalPlanned = lines.reduce((s, l) => s + l.plannedAmount, 0)
  const totalConfirmed = confirmedLines.reduce((s, l) => s + l.plannedAmount, 0)
  const allConfirmed = lines.length > 0 && confirmedLines.length === lines.length
  const progressPct = totalPlanned > 0
    ? Math.min(Math.round((totalConfirmed / totalPlanned) * 100), 100)
    : 0

  function handleConfirm(line: InvestmentLine, amount: number) {
    setError(null)
    startTransition(async () => {
      try {
        await confirmInvestment({
          budgetId: line.id,
          amount,
          month: month.toISOString(),
          assetClassId: line.assetClassId,
        })
        setLines(prev =>
          prev.map(l => l.id === line.id ? { ...l, isConfirmed: true, plannedAmount: amount, executedAt: new Date() } : l)
        )
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al confirmar')
      }
    })
  }

  function handleSaveUnplanned() {
    const amount = parseFloat(unplannedAmount)
    if (isNaN(amount) || amount <= 0) {
      setError('El importe debe ser positivo')
      return
    }
    if (!unplannedDesc.trim()) {
      setError('Describe la inversión')
      return
    }
    setError(null)
    setSavingUnplanned(true)
    startTransition(async () => {
      try {
        await addUnplannedInvestment({
          month: month.toISOString(),
          assetClassId: unplannedAssetClassId || null,
          amount,
          description: unplannedDesc,
        })
        setShowUnplanned(false)
        setUnplannedDesc('')
        setUnplannedAmount('')
        setUnplannedAssetClassId('')
        setSavingUnplanned(false)
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
        setSavingUnplanned(false)
      }
    })
  }

  if (lines.length === 0) {
    return (
      <div
        className="rounded-xl py-8 text-center"
        style={{ border: `1px dashed ${C.border}` }}
      >
        <p className="text-sm" style={{ color: C.muted }}>
          No hay inversiones planificadas para este mes
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Summary card */}
      <div className="rounded-2xl p-5" style={{ background: C.card, border: `1px solid ${C.border}` }}>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
            Resumen del mes
          </p>
          {allConfirmed && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1"
              style={{ background: `${C.emerald}20`, color: C.emerald }}
            >
              <CheckCircle2 size={11} />
              Todo confirmado
            </motion.span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs mb-1" style={{ color: C.muted }}>Planificado</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: C.white }}>
              {formatCurrency(totalPlanned)}
            </p>
          </div>
          <div>
            <p className="text-xs mb-1" style={{ color: C.muted }}>Ejecutado</p>
            <p className="text-xl font-bold tabular-nums" style={{ color: C.emerald }}>
              {formatCurrency(totalConfirmed)}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1.5" style={{ color: C.muted }}>
            <span>{confirmedLines.length} de {lines.length} confirmadas</span>
            <span>{progressPct}%</span>
          </div>
          <div className="h-1.5 rounded-full w-full" style={{ background: C.faint }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: `linear-gradient(90deg, ${C.primary}, ${C.emerald})` }}
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        </div>
      </div>

      {/* Pending lines */}
      {pendingLines.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
            Planificadas este mes
          </p>
          <AnimatePresence mode="popLayout">
            {pendingLines.map((line, i) => (
              <motion.div
                key={line.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
              >
                <PendingRow line={line} onConfirm={handleConfirm} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Confirmed lines */}
      {confirmedLines.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {confirmedLines.map(line => (
              <ConfirmedRow key={line.id} line={line} />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Imbalance warning */}
      {confirmedLines.length > 0 && totalConfirmed !== totalPlanned && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start gap-2.5 px-4 py-3 rounded-xl"
          style={{ background: `${C.amber}10`, border: `1px solid ${C.amber}30` }}
        >
          <AlertCircle size={14} style={{ color: C.amber, flexShrink: 0, marginTop: 1 }} />
          <p className="text-xs" style={{ color: C.amber }}>
            El importe ejecutado difiere del planificado en {formatCurrency(Math.abs(totalConfirmed - totalPlanned))}.
          </p>
        </motion.div>
      )}

      {/* Unplanned investments */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
            No planificadas
          </p>
          <button
            onClick={() => setShowUnplanned(v => !v)}
            disabled={isPending}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl"
            style={{
              background: showUnplanned ? `${C.primary}20` : C.faint,
              color: showUnplanned ? C.primary : C.text2,
              border: showUnplanned ? `1px solid ${C.primary}40` : '1px solid transparent',
            }}
          >
            {showUnplanned ? <X size={12} /> : <Plus size={12} />}
            {showUnplanned ? 'Cancelar' : 'Añadir'}
          </button>
        </div>

        <AnimatePresence>
          {showUnplanned && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div
                className="rounded-2xl p-5 space-y-4"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                <p className="text-sm font-medium" style={{ color: C.white }}>
                  Registrar inversión ejecutada
                </p>
                <p className="text-xs" style={{ color: C.muted }}>
                  Esta inversión no estaba en el presupuesto. Se registrará directamente como ejecutada.
                </p>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: C.text2 }}>
                    Tipo de inversión
                  </label>
                  <select
                    value={unplannedAssetClassId}
                    onChange={e => setUnplannedAssetClassId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: unplannedAssetClassId ? C.white : C.muted }}
                  >
                    <option value="">Selecciona tipo… (opcional)</option>
                    {assetClasses.map(ac => (
                      <option key={ac.id} value={ac.id}>{ac.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: C.text2 }}>
                    Descripción
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Compra de acciones IBEX"
                    value={unplannedDesc}
                    onChange={e => setUnplannedDesc(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.white }}
                  />
                </div>

                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: C.text2 }}>
                    Importe ejecutado
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0,00"
                      value={unplannedAmount}
                      onChange={e => setUnplannedAmount(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
                      style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.white }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: C.muted }}>
                      €
                    </span>
                  </div>
                </div>

                {error && (
                  <p className="text-xs" style={{ color: C.rose }}>{error}</p>
                )}

                <motion.button
                  onClick={handleSaveUnplanned}
                  disabled={isPending || savingUnplanned}
                  className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{
                    background: savingUnplanned ? C.emerald : C.primary,
                    color: C.white,
                  }}
                  animate={{ scale: savingUnplanned ? [1, 0.97, 1] : 1 }}
                >
                  <AnimatePresence mode="wait">
                    {savingUnplanned ? (
                      <motion.span key="ok" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                        <Check size={15} /> Guardado
                      </motion.span>
                    ) : (
                      <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        Registrar inversión
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!showUnplanned && (
          <p className="text-xs text-center py-3" style={{ color: C.muted }}>
            Usa este apartado para inversiones fuera del presupuesto habitual
          </p>
        )}
      </div>
    </div>
  )
}
