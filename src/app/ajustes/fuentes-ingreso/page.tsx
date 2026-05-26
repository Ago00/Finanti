import { listIncomeSources } from '@/features/income-sources/queries'
import { IncomeSourcesSettings } from '@/features/income-sources/components/income-sources-settings'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function FuentesIngresoPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const sources = await listIncomeSources()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Fuentes de ingreso</h2>
        <p className="text-[#94A3B8] text-sm mt-1">Gestiona tus fuentes de ingreso</p>
      </div>
      <IncomeSourcesSettings initialSources={sources} />
    </div>
  )
}
