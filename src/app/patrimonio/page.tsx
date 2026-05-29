import { listAccounts, listAllSnapshotsByMonth } from '@/features/accounts/queries'
import { PatrimonioChart } from '@/features/accounts/components/patrimonio-chart'
import { formatMonthLabel } from '@/lib/dates'
import { CalendarCheck } from 'lucide-react'
import Link from 'next/link'
import { requireUser } from '@/lib/auth'
import { formatCurrency } from '@/lib/formatting'

export default async function PatrimonioPage() {
  await requireUser()

  const [accounts, rawSnapshots] = await Promise.all([
    listAccounts(),
    listAllSnapshotsByMonth(),
  ])

  const now = new Date()
  const recapYear = now.getUTCFullYear()
  const recapMonth = now.getUTCMonth() + 1

  const totalPatrimony = accounts.reduce(
    (sum, acc) => sum + (acc.latestSnapshot?.closingBalance ?? 0),
    0
  )

  const totalMonthlyChange = accounts
    .filter(acc => acc.monthlyChange !== null)
    .reduce((sum, acc) => sum + (acc.monthlyChange ?? 0), 0)

  const hasMonthlyChange = accounts.some(acc => acc.monthlyChange !== null)

  // Group accounts by type name
  const byType = new Map<string, typeof accounts>()
  for (const acc of accounts) {
    const key = acc.accountTypeName ?? 'Sin clasificar'
    const group = byType.get(key) ?? []
    group.push(acc)
    byType.set(key, group)
  }

  // Build MonthData[] for the chart
  // Group snapshots by month, then build per-account entries
  const monthMap = new Map<string, { id: string; name: string; color: string; value: number }[]>()
  for (const snap of rawSnapshots) {
    const list = monthMap.get(snap.month) ?? []
    const existing = list.find(e => e.id === snap.accountId)
    if (!existing) {
      list.push({ id: snap.accountId, name: snap.accountName, color: snap.color, value: snap.closingBalance })
    }
    monthMap.set(snap.month, list)
  }
  const monthData = Array.from(monthMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, accs]) => ({ month, accounts: accs }))

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Patrimonio</h1>
          <p className="text-[#94A3B8] text-sm">Saldo total de todas tus cuentas</p>
        </div>

        <Link
          href={`/recap?year=${recapYear}&month=${recapMonth}`}
          className="inline-flex items-center gap-2 text-sm text-[#6366F1] hover:text-[#818CF8] transition-colors"
        >
          <CalendarCheck size={16} />
          Cerrar mes de {formatMonthLabel(recapYear, recapMonth)} →
        </Link>

        {/* Total summary */}
        <div className="rounded-xl bg-[#141925] border border-[#1E2A3A] p-6 space-y-1">
          <p className="text-[#64748B] text-xs uppercase tracking-wider">Patrimonio total</p>
          <p className="text-4xl font-bold text-white">{formatCurrency(totalPatrimony)}</p>
          {hasMonthlyChange && totalMonthlyChange !== 0 && (
            <p className={`text-sm ${totalMonthlyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalMonthlyChange >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(totalMonthlyChange))} este mes
            </p>
          )}
        </div>

        {/* Accounts grouped by type */}
        {accounts.length === 0 ? (
          <p className="text-[#64748B] text-sm">No hay cuentas activas.</p>
        ) : (
          <div className="space-y-6">
            {Array.from(byType.entries()).map(([typeName, typeAccounts]) => {
              const showHeader = !(byType.size === 1 && typeName === 'Sin clasificar')
              return (
              <div key={typeName} className="space-y-2">
                {showHeader && (
                <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider px-1">
                  {typeName}
                </h2>
                )}
                <div className="space-y-2">
                  {typeAccounts.map(acc => (
                    <Link
                      key={acc.id}
                      href={`/patrimonio/${acc.id}`}
                      className="bg-[#141925] border border-[#1E2A3A] rounded-xl px-4 py-3 flex items-center gap-3 hover:border-[#6366F1] transition-colors"
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: acc.color }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{acc.name}</p>
                        {acc.monthlyChange !== null && (
                          <p className={`text-xs ${acc.monthlyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {acc.monthlyChange >= 0 ? '+' : ''}{formatCurrency(acc.monthlyChange)} este mes
                          </p>
                        )}
                      </div>
                      <span className="text-white font-semibold text-sm shrink-0">
                        {acc.latestSnapshot ? formatCurrency(acc.latestSnapshot.closingBalance) : '—'}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )})}
          </div>
        )}

        {/* Evolution chart */}
        {monthData.length >= 2 && (
          <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-4">
            <p className="text-xs text-[#94A3B8] mb-3">Evolución por cuenta</p>
            <PatrimonioChart data={monthData} />
          </div>
        )}

        <div className="pt-2">
          <Link href="/ajustes/cuentas" className="text-sm text-[#6366F1] hover:text-[#818CF8] transition-colors">
            Gestionar cuentas →
          </Link>
        </div>

      </div>
    </div>
  )
}
