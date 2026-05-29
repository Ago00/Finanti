import { listAssetClasses } from '@/features/asset-classes/queries'
import { AssetClassesSettings } from '@/features/asset-classes/components/asset-classes-settings'
import { requireUser } from '@/lib/auth'

export default async function ClasesActivoPage() {
  await requireUser()

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
