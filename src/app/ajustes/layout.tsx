import { requireUser } from '@/lib/auth'
import { AjustesNav } from './ajustes-nav'

export default async function AjustesLayout({ children }: { children: React.ReactNode }) {
  await requireUser()

  return (
    <div className="min-h-screen bg-[#0B0F1A]">
      <AjustesNav />
      <main>{children}</main>
    </div>
  )
}
