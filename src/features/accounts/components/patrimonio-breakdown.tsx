'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/formatting'

const CARD = '#141925'
const BORDER = '#1E2A3A'
const MUTED = '#94A3B8'
const FAINT = '#64748B'
const ACCENT = '#6366F1'

type Kpi = { label: string; value: string; color?: string }

type DetailCell = { text: string; color?: string }

type DetailRow = DetailCell[]

type AccountDetail = {
  kpis: Kpi[]
  head: string[]
  rows: DetailRow[]
}

export type BreakdownAccount = {
  id: string
  name: string
  color: string
  currentBalance: number
  hasSnapshot: boolean
  detail: AccountDetail
}

export type BreakdownGroup = {
  key: string
  label: string
  subtotal: number
  accounts: BreakdownAccount[]
}

type Props = {
  groups: BreakdownGroup[]
}

function KpiCell({ kpi }: { kpi: Kpi }) {
  return (
    <div className="space-y-0.5">
      <p className="text-[10px] uppercase tracking-wider" style={{ color: FAINT }}>
        {kpi.label}
      </p>
      <p className="text-sm font-semibold" style={{ color: kpi.color ?? '#fff' }}>
        {kpi.value}
      </p>
    </div>
  )
}

function DetailTable({ head, rows }: { head: string[]; rows: DetailRow[] }) {
  return (
    <div className="rounded-lg border overflow-hidden mt-3" style={{ borderColor: BORDER }}>
      <table className="w-full text-xs">
        <thead>
          <tr style={{ color: FAINT }}>
            {head.map((label, i) => (
              <th
                key={label}
                className={`px-2.5 py-1.5 font-medium uppercase tracking-wider ${i === 0 ? 'text-left' : 'text-right'}`}
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} style={{ borderTop: `1px solid ${BORDER}` }}>
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-2.5 py-1.5 ${ci === 0 ? 'text-left' : 'text-right'}`}
                  style={{ color: cell.color ?? (ci === 0 ? MUTED : '#fff') }}
                >
                  {cell.text}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function PatrimonioBreakdown({ groups }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  return (
    <div className="space-y-5">
      {groups.map(group => (
        <div key={group.key} className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: FAINT }}>
              {group.label}
            </h2>
            <span className="text-[11px]" style={{ color: FAINT }}>
              {formatCurrency(group.subtotal)}
            </span>
          </div>

          <div className="space-y-2">
            {group.accounts.map(account => {
              const isOpen = expanded === account.id
              return (
                <div
                  key={account.id}
                  className="rounded-xl border overflow-hidden transition-colors"
                  style={{ background: CARD, borderColor: isOpen ? ACCENT : BORDER }}
                >
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : account.id)}
                    className="w-full px-4 py-3 flex items-center gap-3 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ background: account.color }} />
                    <span className="flex-1 text-sm font-medium text-white">{account.name}</span>
                    <span className="text-sm font-semibold text-white">
                      {account.hasSnapshot ? formatCurrency(account.currentBalance) : '—'}
                    </span>
                    <span
                      className="text-xs transition-transform"
                      style={{ color: FAINT, transform: isOpen ? 'rotate(90deg)' : 'none' }}
                    >
                      ›
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-4 pb-4 pt-1" style={{ borderTop: `1px solid ${BORDER}` }}>
                      <div className="pt-3">
                        {account.hasSnapshot ? (
                          <>
                            <div className="grid grid-cols-3 gap-3">
                              {account.detail.kpis.map(kpi => (
                                <KpiCell key={kpi.label} kpi={kpi} />
                              ))}
                            </div>
                            {account.detail.rows.length > 0 && (
                              <DetailTable head={account.detail.head} rows={account.detail.rows} />
                            )}
                          </>
                        ) : (
                          <p className="text-xs" style={{ color: FAINT }}>
                            Sin datos todavía. Cierra un mes para ver su evolución.
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
