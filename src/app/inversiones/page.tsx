import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function InversionesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0B0F1A] py-8 px-4 pb-24">
      <div className="max-w-lg mx-auto space-y-5">
        <h1 className="text-2xl font-semibold text-white">Inversiones</h1>
        <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl p-8 text-center">
          <p className="text-[#64748B] text-sm">Análisis detallado de inversiones</p>
          <p className="text-[#64748B] text-xs mt-1">Próximamente</p>
        </div>
      </div>
    </div>
  )
}
