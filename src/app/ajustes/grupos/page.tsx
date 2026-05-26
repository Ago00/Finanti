import { listGroups } from '@/features/groups/queries'
import { GroupsSettings } from '@/features/groups/components/groups-settings'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function GruposPage() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

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
