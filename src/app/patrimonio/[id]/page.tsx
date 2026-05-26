import { getAccountWithHistory } from '@/features/accounts/queries'
import { GAIN_MODE_LABELS } from '@/features/accounts/domain'
import { notFound, redirect } from 'next/navigation'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

function formatPercent(value: number) {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function formatMonth(date: Date) {
  return date.toLocaleDateString('es-ES', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const { id } = await params
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) notFound()

  const result = await getAccountWithHistory(parsed.data)
  if (!result) notFound()

  const { account, snapshots } = result

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-12 px-6">
      <div className="max-w-3xl mx-auto space-y-8">

        {/* Back link */}
        <Link href="/patrimonio" className="text-sm text-[#64748B] hover:text-[#94A3B8] transition-colors">
          ← Patrimonio
        </Link>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: account.color }}
          />
          <h1 className="text-2xl font-semibold text-white">{account.name}</h1>
          <span className="text-xs text-[#64748B] bg-[#1E2A3A] px-2 py-0.5 rounded">
            {GAIN_MODE_LABELS[account.gainMode]}
          </span>
        </div>

        {/* Latest snapshot summary */}
        {snapshots[0] && (
          <div className="rounded-xl bg-[#141925] border border-[#1E2A3A] p-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Saldo cierre', value: formatCurrency(snapshots[0].closingBalance) },
              { label: 'Saldo apertura', value: formatCurrency(snapshots[0].openingBalance) },
              { label: 'Aportaciones', value: formatCurrency(snapshots[0].contributions) },
              {
                label: 'Ganancia',
                value: `${formatCurrency(snapshots[0].gain)} (${formatPercent(snapshots[0].gainPercentage)})`,
                colored: true,
                positive: snapshots[0].gain >= 0,
              },
            ].map(item => (
              <div key={item.label} className="space-y-1">
                <p className="text-[#64748B] text-xs uppercase tracking-wider">{item.label}</p>
                <p className={`font-semibold ${
                  item.colored
                    ? item.positive ? 'text-emerald-400' : 'text-red-400'
                    : 'text-white'
                }`}>
                  {item.value}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Snapshot history table */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[#94A3B8] uppercase tracking-wider">Historial</h2>
          {snapshots.length === 0 ? (
            <p className="text-[#64748B] text-sm">Sin datos.</p>
          ) : (
            <div className="rounded-xl border border-[#1E2A3A] overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#141925] text-[#64748B] text-xs uppercase tracking-wider">
                    <th className="text-left px-4 py-3">Mes</th>
                    <th className="text-right px-4 py-3">Apertura</th>
                    <th className="text-right px-4 py-3">Cierre</th>
                    <th className="text-right px-4 py-3">Aport.</th>
                    <th className="text-right px-4 py-3">Ganancia</th>
                  </tr>
                </thead>
                <tbody>
                  {snapshots.map((snap, i) => (
                    <tr
                      key={i}
                      className="border-t border-[#1E2A3A] hover:bg-[#141925] transition-colors"
                    >
                      <td className="px-4 py-3 text-[#94A3B8] capitalize">{formatMonth(snap.month)}</td>
                      <td className="px-4 py-3 text-right text-[#94A3B8]">{formatCurrency(snap.openingBalance)}</td>
                      <td className="px-4 py-3 text-right text-white font-medium">{formatCurrency(snap.closingBalance)}</td>
                      <td className="px-4 py-3 text-right text-[#94A3B8]">{formatCurrency(snap.contributions)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${snap.gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatCurrency(snap.gain)}
                        <span className="text-xs ml-1 opacity-70">
                          ({formatPercent(snap.gainPercentage)})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
