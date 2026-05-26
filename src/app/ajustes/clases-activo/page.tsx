import { listAssetClasses } from '@/features/asset-classes/queries'
import { AssetClassesSettings } from '@/features/asset-classes/components/asset-classes-settings'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function ClasesActivoPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  const classes = await listAssetClasses()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Clases de activo</h2>
        <p className="text-[#94A3B8] text-sm mt-1">Gestiona tus clases de activo</p>
      </div>
      <AssetClassesSettings initialClasses={classes} />
    </div>
  )
}
