'use client'

import { useState } from 'react'
import { formatCurrency } from '@/lib/formatting'
import { SavingsLineChart } from '@/components/charts/savings-line-chart'
import { StackedAreaChart } from '@/components/charts/stacked-area-chart'
import { BarPairChart } from '@/components/charts/bar-pair-chart'

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

// Numeric chart data per account kind. The breakdown picks the matching
// mini-chart from the discriminant. `months` are 'YYYY-MM' oldest first and
// every numeric array shares its length.
export type AccountChartData =
  | { kind: 'savings'; months: string[]; values: number[] }
  | { kind: 'investment'; months: string[]; contributedCumulative: number[]; value: number[] }
  | { kind: 'in-kind'; months: string[]; contribution: number[]; expense: number[] }
  | { kind: 'none' }

export type BreakdownAccount = {
  id: string
  name: string
  color: string
  currentBalance: number
  hasSnapshot: boolean
  detail: AccountDetail
  chart: AccountChartData
}

export type BreakdownGroup = {
  key: string
  label: string
  subtotal: number
  accounts: BreakdownAccount[]
}

type Props = {
  groups: BreakdownGroup[]
  prevTotalPatrimony: number
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
          {rows.map(row => {
            const rowKey = row[0]?.text ?? ''
            return (
              <tr key={rowKey} style={{ borderTop: `1px solid ${BORDER}` }}>
                {row.map((cell, ci) => (
                  <td
                    key={head[ci] ?? ci}
                    className={`px-2.5 py-1.5 ${ci === 0 ? 'text-left' : 'text-right'}`}
                    style={{ color: cell.color ?? (ci === 0 ? MUTED : '#fff') }}
                  >
                    {cell.text}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5 text-[10px]" style={{ color: MUTED }}>
      <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: color }} />
      {label}
    </span>
  )
}

function AccountMiniChart({ chart, color }: { chart: AccountChartData; color: string }) {
  if (chart.kind === 'none') return null
  if (chart.months.length < 2) return null

  if (chart.kind === 'savings') {
    return (
      <div className="mt-3">
        <SavingsLineChart labels={chart.months} values={chart.values} color={color} />
      </div>
    )
  }

  if (chart.kind === 'investment') {
    return (
      <div className="mt-3">
        <StackedAreaChart
          labels={chart.months}
          contributed={chart.contributedCumulative}
          value={chart.value}
        />
        <div className="flex gap-4 mt-1.5">
          <LegendItem color="#10B981" label="Valor" />
          <LegendItem color="#6366F1" label="Aportado" />
        </div>
      </div>
    )
  }

  return (
    <div className="mt-3">
      <BarPairChart labels={chart.months} contribution={chart.contribution} expense={chart.expense} />
      <div className="flex gap-4 mt-1">
        <LegendItem color="#10B981" label="Aportación" />
        <LegendItem color="#F59E0B" label="Gasto" />
      </div>
    </div>
  )
}

export function PatrimonioBreakdown({ groups, prevTotalPatrimony }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)

  const totalNow = groups.reduce((s, g) => s + g.subtotal, 0)
  const deltaTotal = prevTotalPatrimony > 0 ? totalNow - prevTotalPatrimony : null
  const deltaTotalPct = prevTotalPatrimony > 0 ? ((totalNow - prevTotalPatrimony) / prevTotalPatrimony) * 100 : null

  return (
    <div className="space-y-5">
      {/* Variation vs previous month */}
      {deltaTotal !== null && deltaTotalPct !== null && (
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px]" style={{ color: FAINT }}>Variación mensual:</span>
          <span
            className="text-[11px] font-semibold"
            style={{ color: deltaTotal >= 0 ? '#34D399' : '#F87171' }}
          >
            {deltaTotal >= 0 ? '+' : ''}{formatCurrency(deltaTotal)}
            {' '}({deltaTotal >= 0 ? '+' : ''}{deltaTotalPct.toFixed(2)}%)
          </span>
        </div>
      )}

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
                            <AccountMiniChart chart={account.chart} color={account.color} />
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
