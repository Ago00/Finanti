import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0B0F1A] flex items-center justify-center">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-semibold text-white">Bienvenido a Finanti</h1>
        <p className="text-[#94A3B8]">Dashboard en construcción</p>
        <p className="text-[#64748B] text-sm">{user.email}</p>
      </div>
    </div>
  )
}
