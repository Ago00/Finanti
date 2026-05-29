import { listGroups } from '@/features/groups/queries'
import { GroupsSettings } from '@/features/groups/components/groups-settings'
import { requireUser } from '@/lib/auth'

export default async function GruposPage() {
  await requireUser()

  const groups = await listGroups()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Grupos</h2>
        <p className="text-[#94A3B8] text-sm mt-1">Gestiona los grupos de gasto</p>
      </div>
      <GroupsSettings initialGroups={groups} />
    </div>
  )
}
