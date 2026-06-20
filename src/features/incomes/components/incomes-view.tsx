'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  TrendingUp,
  Check,
  ChevronDown,
  Wallet,
} from 'lucide-react'
import type { IncomeRow } from '@/features/incomes/queries'
import { createIncome, archiveIncome } from '@/features/incomes/actions'
import { sumIncomes } from '@/features/incomes/domain'
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

export type AccountOption = {
  id: string
  name: string
}

export type IncomeSourceOption = {
  id: string
  name: string
  color: string
}

// ─── Account selector ─────────────────────────────────────────────────────────
function AccountSelector({
  value,
  onChange,
  accounts,
}: {
  value: string
  onChange: (id: string) => void
  accounts: AccountOption[]
}) {
  const [open, setOpen] = useState(false)
  const selected = accounts.find(a => a.id === value) ?? accounts[0]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full px-4 py-3 rounded-xl text-sm outline-none flex items-center justify-between gap-2"
        style={{
          background: C.bg,
          border: `1px solid ${open ? C.primary : C.border}`,
          color: C.white,
        }}
      >
        <span className="flex items-center gap-2.5">
          <Wallet size={14} style={{ color: C.text2, flexShrink: 0 }} />
          <span>{selected?.name ?? 'Sin cuenta'}</span>
        </span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={14} style={{ color: C.muted }} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 z-50 mt-1 rounded-xl overflow-hidden"
            style={{
              background: C.card,
              border: `1px solid ${C.border}`,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            <button
              type="button"
              onClick={() => { onChange(''); setOpen(false) }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left"
              style={{
                background: value === '' ? `${C.primary}15` : 'transparent',
                color: value === '' ? C.white : C.text2,
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              Sin cuenta
              {value === '' && <Check size={13} style={{ color: C.primary, flexShrink: 0, marginLeft: 'auto' }} />}
            </button>
            {accounts.map(account => {
              const isSelected = account.id === value
              return (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => { onChange(account.id); setOpen(false) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-left"
                  style={{
                    background: isSelected ? `${C.primary}15` : 'transparent',
                    color: isSelected ? C.white : C.text2,
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <Wallet size={14} style={{ color: isSelected ? C.primary : C.muted, flexShrink: 0 }} />
                  <span className="flex-1">{account.name}</span>
                  {isSelected && (
                    <Check size={13} style={{ color: C.primary, flexShrink: 0 }} />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Income entry row ─────────────────────────────────────────────────────────
function IncomeEntryRow({
  entry,
  onArchive,
}: {
  entry: IncomeRow
  onArchive: (id: string) => void
}) {
  const dateStr = entry.receivedAt.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex items-center gap-4 px-4 py-3.5 rounded-xl"
      style={{ background: C.card, border: `1px solid ${C.border}` }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${C.emerald}15` }}
      >
        <TrendingUp size={16} style={{ color: C.emerald }} />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: C.white }}>
          {entry.sourceName}
        </p>
        <div className="flex items-center gap-1.5 mt-0.5">
          <p className="text-xs" style={{ color: C.muted }}>{dateStr}</p>
          {entry.description && (
            <>
              <span style={{ color: C.faint }}>·</span>
              <p className="text-xs truncate" style={{ color: C.muted }}>{entry.description}</p>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        <p className="text-sm font-semibold tabular-nums" style={{ color: C.emerald }}>
          +{formatCurrency(entry.amount)}
        </p>
        <button
          onClick={() => {
            if (window.confirm('¿Archivar este ingreso?')) {
              onArchive(entry.id)
            }
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: C.faint }}
        >
          <X size={12} style={{ color: C.text2 }} />
        </button>
      </div>
    </motion.div>
  )
}

// ─── Main view ────────────────────────────────────────────────────────────────
export function IncomesView({
  entries,
  year,
  month,
  monthLabel,
  incomeSources,
  accounts,
  prevYear,
  prevMonth,
  nextYear,
  nextMonth,
  disableNext,
}: {
  entries: IncomeRow[]
  year: number
  month: number
  monthLabel: string
  incomeSources: IncomeSourceOption[]
  accounts: AccountOption[]
  prevYear: number
  prevMonth: number
  nextYear: number
  nextMonth: number
  disableNext: boolean
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [fuente, setFuente] = useState('')
  const [incomeSourceId, setIncomeSourceId] = useState('')
  const [importe, setImporte] = useState('')
  const [fecha, setFecha] = useState(() => {
    return new Date(Date.UTC(year, month - 1, 28)).toISOString().slice(0, 10)
  })
  const [toAccountId, setToAccountId] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = sumIncomes(entries)

  function handleSubmit() {
    const amount = parseFloat(importe)
    if (isNaN(amount) || amount <= 0) {
      setError('El importe debe ser positivo')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await createIncome({
          amount,
          receivedAt: new Date(fecha + 'T12:00:00.000Z').toISOString(),
          incomeSourceId: incomeSourceId || null,
          toAccountId: toAccountId || null,
          description: fuente || null,
        })
        setSubmitted(true)
        setTimeout(() => {
          setSubmitted(false)
          setShowForm(false)
          setFuente('')
          setImporte('')
          setIncomeSourceId('')
          setToAccountId('')
          router.refresh()
        }, 1200)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  function handleArchive(id: string) {
    startTransition(async () => {
      try {
        await archiveIncome(id)
        router.refresh()
      } catch {
        // silently fail — user sees stale data until next refresh
      }
    })
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: C.bg }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-4">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-bold" style={{ color: C.white }}>Ingresos</h1>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium"
            style={{ background: `${C.primary}20`, color: C.primary, border: `1px solid ${C.primary}40` }}
          >
            <Plus size={14} />
            Añadir
          </button>
        </div>
        <p className="text-sm" style={{ color: C.muted }}>Cobros registrados cada mes</p>
      </div>

      {/* Month navigation */}
      <div className="px-4 mb-5">
        <div
          className="flex items-center justify-between rounded-xl px-4 py-3"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <a
            href={`/ingresos?year=${prevYear}&month=${prevMonth}`}
            className="p-1 rounded-lg"
            style={{ color: C.text2 }}
          >
            <ChevronLeft size={18} />
          </a>
          <div className="text-center">
            <p className="text-sm font-semibold" style={{ color: C.white }}>{monthLabel}</p>
            <p className="text-xs" style={{ color: C.emerald }}>{formatCurrency(total)}</p>
          </div>
          {disableNext ? (
            <span className="p-1 rounded-lg opacity-30" style={{ color: C.text2 }}>
              <ChevronRight size={18} />
            </span>
          ) : (
            <a
              href={`/ingresos?year=${nextYear}&month=${nextMonth}`}
              className="p-1 rounded-lg"
              style={{ color: C.text2 }}
            >
              <ChevronRight size={18} />
            </a>
          )}
        </div>
      </div>

      {/* Monthly summary */}
      <div className="px-4 mb-5">
        <motion.div
          key={`${year}-${month}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-5"
          style={{ background: C.card, border: `1px solid ${C.border}` }}
        >
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.muted }}>
              Total cobrado
            </p>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: `${C.emerald}15`, color: C.emerald }}
            >
              {entries.length} {entries.length === 1 ? 'ingreso' : 'ingresos'}
            </span>
          </div>
          <p className="text-4xl font-bold tabular-nums" style={{ color: C.white }}>
            {formatCurrency(total)}
          </p>
        </motion.div>
      </div>

      {/* Entries list */}
      <div className="px-4 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: C.muted }}>
          Detalle
        </p>
        <AnimatePresence mode="popLayout">
          {entries.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl py-8 text-center"
              style={{ border: `1px dashed ${C.border}` }}
            >
              <p className="text-sm" style={{ color: C.muted }}>
                No hay ingresos registrados para este mes
              </p>
            </motion.div>
          )}
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <IncomeEntryRow entry={entry} onArchive={handleArchive} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Add income bottom sheet */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              className="fixed inset-0 z-40"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowForm(false)}
            />

            <motion.div
              className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl px-5 pt-5 pb-10"
              style={{ background: C.card, border: `1px solid ${C.border}` }}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mx-auto w-10 h-1 rounded-full mb-6" style={{ background: C.faint }} />

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-base font-bold" style={{ color: C.white }}>Nuevo ingreso</h2>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: C.faint }}
                >
                  <X size={14} style={{ color: C.text2 }} />
                </button>
              </div>

              <div className="space-y-4">
                {/* Fuente de ingreso */}
                {incomeSources.length > 0 && (
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: C.text2 }}>
                      Fuente
                    </label>
                    <select
                      value={incomeSourceId}
                      onChange={e => setIncomeSourceId(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{
                        background: C.bg,
                        border: `1px solid ${C.border}`,
                        color: incomeSourceId ? C.white : C.muted,
                      }}
                    >
                      <option value="">Sin fuente</option>
                      {incomeSources.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Descripción libre */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: C.text2 }}>
                    Descripción (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Nómina — Empresa S.L."
                    value={fuente}
                    onChange={e => setFuente(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.white }}
                  />
                </div>

                {/* Importe */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: C.text2 }}>
                    Importe
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0,00"
                      value={importe}
                      onChange={e => setImporte(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none pr-10"
                      style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.white }}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm" style={{ color: C.muted }}>
                      €
                    </span>
                  </div>
                </div>

                {/* Cuenta destino */}
                {accounts.length > 0 && (
                  <div>
                    <label className="text-xs font-medium mb-1.5 block" style={{ color: C.text2 }}>
                      Cuenta destino
                    </label>
                    <AccountSelector value={toAccountId} onChange={setToAccountId} accounts={accounts} />
                  </div>
                )}

                {/* Fecha de cobro */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: C.text2 }}>
                    Fecha de cobro
                  </label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      color: C.white,
                      colorScheme: 'dark',
                    }}
                  />
                </div>

                {error && <p className="text-xs" style={{ color: C.rose }}>{error}</p>}

                <motion.button
                  onClick={handleSubmit}
                  disabled={isPending || submitted}
                  className="w-full py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
                  style={{
                    background: submitted ? C.emerald : C.primary,
                    color: C.white,
                  }}
                  animate={{ scale: submitted ? [1, 0.97, 1] : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <AnimatePresence mode="wait">
                    {submitted ? (
                      <motion.span
                        key="ok"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center gap-2"
                      >
                        <Check size={16} />
                        Guardado
                      </motion.span>
                    ) : (
                      <motion.span key="save" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                        Guardar ingreso
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
