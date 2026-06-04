'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Receipt, TrendingUp, CalendarCheck, Settings2, LayoutDashboard } from 'lucide-react'

const items = [
  { label: 'Dashboard', href: '/dashboard', activePrefix: '/dashboard', icon: LayoutDashboard, iconOnly: false },
  { label: 'Gastos', href: '/gastos', activePrefix: '/gastos', icon: Receipt, iconOnly: false },
  { label: 'Patrimonio', href: '/patrimonio', activePrefix: '/patrimonio', icon: TrendingUp, iconOnly: false },
  { label: 'Recap', href: '/recap', activePrefix: '/recap', icon: CalendarCheck, iconOnly: false },
  { label: 'Ajustes', href: '/ajustes/cuentas', activePrefix: '/ajustes', icon: Settings2, iconOnly: true },
]

export function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#0B0F1A] border-t border-[#1E2A3A] flex z-50">
      {items.map(({ label, href, activePrefix, icon: Icon, iconOnly }) => {
        const active = pathname.startsWith(activePrefix)
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center py-1.5 gap-0 text-[9px] font-medium ${
              active ? 'text-white' : 'text-[#64748B]'
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'text-[#6366F1]' : ''}`} />
            {!iconOnly && label}
          </Link>
        )
      })}
    </nav>
  )
}
