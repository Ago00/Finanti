import { listAccounts } from '@/features/accounts/queries'
import Link from 'next/link'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export default async function PatrimonioPage() {
  const accounts = await listAccounts()

  const totalPatrimony = accounts.reduce(
    (sum, acc) => sum + (acc.latestSnapshot?.closingBalance ?? 0),
    0
  )

  const totalMonthlyChange = accounts.reduce(
    (sum, acc) => sum + (acc.monthlyChange ?? 0),
    0
  )

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold text-white">Patrimonio</h1>
          <p className="text-[#94A3B8] text-sm">Saldo total de todas tus cuentas</p>
        </div>

        {/* Total summary */}
        <div className="rounded-xl bg-[#141925] border border-[#1E2A3A] p-6 space-y-1">
          <p className="text-[#64748B] text-xs uppercase tracking-wider">Patrimonio total</p>
          <p className="text-4xl font-bold text-white">{formatCurrency(totalPatrimony)}</p>
          {totalMonthlyChange !== 0 && (
            <p className={`text-sm ${totalMonthlyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {totalMonthlyChange >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(totalMonthlyChange))} este mes
            </p>
          )}
        </div>

        {/* Accounts list */}
        {accounts.length === 0 ? (
          <p className="text-[#64748B] text-sm">No hay cuentas activas.</p>
        ) : (
          <div className="space-y-3">
            {accounts.map(acc => (
              <Link
                key={acc.id}
                href={`/patrimonio/${acc.id}`}
                className="block rounded-xl bg-[#141925] border border-[#1E2A3A] p-5 hover:border-[#334155] transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: acc.color }}
                    />
                    <span className="text-white font-medium truncate">{acc.name}</span>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-white font-semibold">
                      {acc.latestSnapshot
                        ? formatCurrency(acc.latestSnapshot.closingBalance)
                        : '—'}
                    </p>
                    {acc.monthlyChange != null && acc.monthlyChangePercentage != null && (
                      <p className={`text-xs ${acc.monthlyChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {acc.monthlyChange >= 0 ? '+' : ''}{formatCurrency(acc.monthlyChange)}
                        {' '}({formatPercent(acc.monthlyChangePercentage)})
                      </p>
                    )}
                  </div>
                </div>

                {acc.latestSnapshot && (
                  <div className="mt-3 flex gap-4 text-xs text-[#64748B]">
                    <span>
                      Ganancia:{' '}
                      <span className={acc.latestSnapshot.gain >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                        {formatCurrency(acc.latestSnapshot.gain)}
                        {' '}({formatPercent(acc.latestSnapshot.gainPercentage)})
                      </span>
                    </span>
                    <span>
                      {new Date(acc.latestSnapshot.month).toLocaleDateString('es-ES', {
                        month: 'long',
                        year: 'numeric',
                        timeZone: 'UTC',
                      })}
                    </span>
                  </div>
                )}
              </Link>
            ))}
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
