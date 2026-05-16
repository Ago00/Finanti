import { listAccounts } from '@/features/accounts/queries'
import { AccountRow } from './account-row'
import Link from 'next/link'

export default async function CuentasPage() {
  const accounts = await listAccounts()

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-12 px-6">
      <div className="max-w-2xl mx-auto space-y-8">

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold text-white">Cuentas</h1>
            <p className="text-[#94A3B8] text-sm">Gestiona tus cuentas de inversión y ahorro</p>
          </div>
          <Link
            href="/patrimonio"
            className="text-sm text-[#64748B] hover:text-[#94A3B8] transition-colors"
          >
            ← Patrimonio
          </Link>
        </div>

        {accounts.length === 0 ? (
          <p className="text-[#64748B] text-sm">No hay cuentas activas.</p>
        ) : (
          <div className="space-y-2">
            {accounts.map(acc => (
              <AccountRow key={acc.id} account={acc} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
