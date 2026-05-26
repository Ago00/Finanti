import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AjustesNav } from './ajustes-nav'

export default async function AjustesLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  const user = session?.user ?? null
  if (!user) redirect('/login')

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <AjustesNav />
      <main>{children}</main>
    </div>
  )
}
