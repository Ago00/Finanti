import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { listAccounts, listAccountTypes } from '@/features/accounts/queries'
import { listAssetClasses } from '@/features/asset-classes/queries'
import { AccountsSettings } from '@/features/accounts/components/accounts-settings'
import Link from 'next/link'

export default async function CuentasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [accounts, accountTypes, assetClasses] = await Promise.all([
    listAccounts(),
    listAccountTypes(),
    listAssetClasses(),
  ])

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

        <AccountsSettings
          initialAccounts={accounts}
          accountTypes={accountTypes}
          assetClasses={assetClasses}
        />

      </div>
    </div>
  )
}
