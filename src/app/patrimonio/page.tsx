import {
  listAccounts,
  listAllSnapshotsByMonth,
  listAccountMonthlyHistory,
  listExpensesByAccountMonth,
} from '@/features/accounts/queries'
import {
  classifyAccountType,
  calculateTotalPatrimony,
  calculateSavingsMetrics,
  calculateInvestmentMetrics,
  calculateInKindMetrics,
  type AccountKind,
  type MonthlyPoint,
} from '@/features/accounts/domain'
import {
  PatrimonioBreakdown,
  type BreakdownAccount,
  type BreakdownGroup,
} from '@/features/accounts/components/patrimonio-breakdown'
import { PatrimonioChart } from '@/features/accounts/components/patrimonio-chart'
import { formatShortMonth, formatMonthLabel } from '@/lib/dates'
import { formatCurrency, formatDelta, formatPercentDelta } from '@/lib/formatting'
import { CalendarCheck } from 'lucide-react'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'

const POSITIVE = '#34D399'
const NEGATIVE = '#F87171'
const WARNING = '#FBBF24'

const DETAIL_MONTHS = 6

const GROUP_ORDER: { kind: AccountKind; label: string }[] = [
  { kind: 'savings', label: 'Cuentas de ahorro' },
  { kind: 'in-kind', label: 'Cuentas en especie' },
  { kind: 'investment', label: 'Inversiones' },
  { kind: 'unclassified', label: 'Sin clasificar' },
]

function deltaColor(value: number): string {
  return value >= 0 ? POSITIVE : NEGATIVE
}

function buildSavingsDetail(points: MonthlyPoint[]) {
  const metrics = calculateSavingsMetrics(points)
  const recent = points.slice(-DETAIL_MONTHS).reverse()
  return {
    kpis: [
      { label: 'Saldo', value: formatCurrency(metrics.balance) },
      { label: 'Variación mes', value: formatDelta(metrics.monthChange), color: deltaColor(metrics.monthChange) },
      { label: 'Variación 12m', value: formatDelta(metrics.rangeChange), color: deltaColor(metrics.rangeChange) },
    ],
    head: ['Mes', 'Saldo', 'Variación'],
    rows: recent.map(point => {
      const index = points.indexOf(point)
      const prior = index > 0 ? points[index - 1] : null
      const change = prior ? point.closingBalance - prior.closingBalance : 0
      return [
        { text: formatShortMonth(point.month) },
        { text: formatCurrency(point.closingBalance) },
        { text: formatDelta(change), color: deltaColor(change) },
      ]
    }),
  }
}

function buildInvestmentDetail(points: MonthlyPoint[]) {
  const metrics = calculateInvestmentMetrics(points)
  const recent = points.slice(-DETAIL_MONTHS).reverse()
  return {
    kpis: [
      { label: 'Valor', value: formatCurrency(metrics.value) },
      { label: 'Aportado', value: formatCurrency(metrics.contributed) },
      {
        label: 'Ganancia',
        value: `${formatDelta(metrics.gain)} (${formatPercentDelta(metrics.gainPercentage)})`,
        color: deltaColor(metrics.gain),
      },
    ],
    head: ['Mes', 'Valor', 'Aport.', 'Ganancia'],
    rows: recent.map(point => {
      const index = points.indexOf(point)
      const contributedToDate = points.slice(0, index + 1).reduce((sum, p) => sum + p.contributions, 0)
      const gain = point.closingBalance - contributedToDate
      return [
        { text: formatShortMonth(point.month) },
        { text: formatCurrency(point.closingBalance) },
        { text: formatCurrency(point.contributions) },
        { text: formatDelta(gain), color: deltaColor(gain) },
      ]
    }),
  }
}

function buildInKindDetail(points: MonthlyPoint[]) {
  const metrics = calculateInKindMetrics(points)
  const recent = points.slice(-DETAIL_MONTHS).reverse()
  return {
    kpis: [
      { label: 'Saldo', value: formatCurrency(metrics.balance) },
      { label: 'Aportación mes', value: formatCurrency(metrics.monthContribution), color: POSITIVE },
      { label: 'Gasto mes', value: formatCurrency(metrics.monthExpense), color: WARNING },
    ],
    head: ['Mes', 'Aport.', 'Gasto', 'Saldo'],
    rows: recent.map(point => [
      { text: formatShortMonth(point.month) },
      { text: formatCurrency(point.contributions), color: POSITIVE },
      { text: formatCurrency(point.expense), color: WARNING },
      { text: formatCurrency(point.closingBalance) },
    ]),
  }
}

function buildDetail(kind: AccountKind, points: MonthlyPoint[]): BreakdownAccount['detail'] {
  if (kind === 'investment') return buildInvestmentDetail(points)
  if (kind === 'in-kind') return buildInKindDetail(points)
  return buildSavingsDetail(points)
}

export default async function PatrimonioPage() {
  await requireUser()

  // Sequential execution to avoid PgBouncer transaction-mode connection exhaustion.
  const accounts = await listAccounts()
  const history = await listAccountMonthlyHistory()
  const expenses = await listExpensesByAccountMonth()
  const rawSnapshots = await listAllSnapshotsByMonth()

  const now = new Date()
  const recapYear = now.getUTCFullYear()
  const recapMonth = now.getUTCMonth() + 1

  const totalPatrimony = calculateTotalPatrimony(
    accounts.map(acc => acc.latestSnapshot?.closingBalance ?? 0),
  )

  const expenseByAccountMonth = new Map<string, number>()
  for (const row of expenses) {
    expenseByAccountMonth.set(`${row.accountId}|${row.month}`, row.expense)
  }

  const historyByAccount = new Map<string, MonthlyPoint[]>()
  for (const row of history) {
    const points = historyByAccount.get(row.accountId) ?? []
    points.push({
      month: row.month,
      closingBalance: row.closingBalance,
      contributions: row.contributions,
      expense: expenseByAccountMonth.get(`${row.accountId}|${row.month}`) ?? 0,
    })
    historyByAccount.set(row.accountId, points)
  }

  const accountsByKind = new Map<AccountKind, BreakdownAccount[]>()
  for (const acc of accounts) {
    const kind = classifyAccountType(acc.accountTypeName)
    const points = historyByAccount.get(acc.id) ?? []
    const breakdownAccount: BreakdownAccount = {
      id: acc.id,
      name: acc.name,
      color: acc.color,
      currentBalance: acc.latestSnapshot?.closingBalance ?? 0,
      hasSnapshot: acc.latestSnapshot !== null,
      detail: buildDetail(kind, points),
    }
    const list = accountsByKind.get(kind) ?? []
    list.push(breakdownAccount)
    accountsByKind.set(kind, list)
  }

  const groups: BreakdownGroup[] = GROUP_ORDER.flatMap(({ kind, label }) => {
    const groupAccounts = accountsByKind.get(kind)
    if (!groupAccounts || groupAccounts.length === 0) return []
    return [
      {
        key: kind,
        label,
        subtotal: groupAccounts.reduce((sum, acc) => sum + acc.currentBalance, 0),
        accounts: groupAccounts,
      },
    ]
  })

  // Build MonthData[] for the summary chart.
  const monthMap = new Map<string, { id: string; name: string; color: string; value: number }[]>()
  for (const snap of rawSnapshots) {
    const list = monthMap.get(snap.month) ?? []
    if (!list.find(entry => entry.id === snap.accountId)) {
      list.push({ id: snap.accountId, name: snap.accountName, color: snap.color, value: snap.closingBalance })
    }
    monthMap.set(snap.month, list)
  }
  const monthData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, accs]) => ({ month, accounts: accs }))

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-12 px-6 pb-24">
      <div className="max-w-md mx-auto space-y-6">

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Patrimonio</h1>
          <p className="text-[#94A3B8] text-sm">Todo tu patrimonio en un sitio</p>
        </div>

        <Link
          href={`/recap?year=${recapYear}&month=${recapMonth}`}
          className="inline-flex items-center gap-2 text-sm text-[#6366F1] hover:text-[#818CF8] transition-colors"
        >
          <CalendarCheck size={16} />
          Cerrar mes de {formatMonthLabel(recapYear, recapMonth)} →
        </Link>

        <div className="rounded-xl bg-[#141925] border border-[#1E2A3A] p-5">
          <p className="text-[11px] uppercase tracking-wider text-[#64748B]">Patrimonio total</p>
          <p className="text-4xl font-bold text-white mt-1">{formatCurrency(totalPatrimony)}</p>
          {groups.length > 0 && (
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-xs text-[#94A3B8]">
              {groups.map(group => (
                <span key={group.key}>
                  <span className="text-[#64748B]">{group.label.replace('Cuentas de ', '').replace('Cuentas en ', '')}</span>{' '}
                  {formatCurrency(group.subtotal)}
                </span>
              ))}
            </div>
          )}
        </div>

        {accounts.length === 0 ? (
          <div className="rounded-xl bg-[#141925] border border-[#1E2A3A] p-8 text-center space-y-2">
            <p className="text-[#94A3B8] text-sm">Aún no tienes cuentas activas.</p>
            <Link href="/ajustes/cuentas" className="inline-block text-sm text-[#6366F1] hover:text-[#818CF8] transition-colors">
              Crear tu primera cuenta →
            </Link>
          </div>
        ) : (
          <PatrimonioBreakdown groups={groups} />
        )}

        {monthData.length >= 2 ? (
          <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-4">
            <p className="text-xs text-[#94A3B8] mb-3">Evolución por cuenta</p>
            <PatrimonioChart data={monthData} />
          </div>
        ) : accounts.length > 0 ? (
          <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-6 text-center">
            <p className="text-[#64748B] text-xs">
              La evolución se dibuja al tener al menos dos meses cerrados.
            </p>
          </div>
        ) : null}

        <div className="pt-1">
          <Link href="/ajustes/cuentas" className="text-sm text-[#6366F1] hover:text-[#818CF8] transition-colors">
            Gestionar cuentas →
          </Link>
        </div>

      </div>
    </div>
  )
}
