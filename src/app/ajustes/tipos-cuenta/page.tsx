import { listAccountTypes } from '@/features/account-types/queries'
import { AccountTypesSettings } from '@/features/account-types/components/account-types-settings'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function TiposCuentaPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const types = await listAccountTypes()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Tipos de cuenta</h2>
        <p className="text-[#94A3B8] text-sm mt-1">Gestiona los tipos de cuenta</p>
      </div>
      <AccountTypesSettings initialTypes={types} />
    </div>
  )
}
