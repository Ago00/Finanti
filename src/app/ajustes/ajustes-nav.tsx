'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { label: 'Cuentas', href: '/ajustes/cuentas' },
  { label: 'Categorías', href: '/ajustes/categorias' },
  { label: 'Grupos', href: '/ajustes/grupos' },
  { label: 'Ingresos', href: '/ajustes/fuentes-ingreso' },
  { label: 'Clases activo', href: '/ajustes/clases-activo' },
  { label: 'Tipos', href: '/ajustes/tipos-cuenta' },
]

export function AjustesNav() {
  const pathname = usePathname()

  return (
    <nav className="bg-[#141925] border-b border-[#1E2A3A]">
      <div className="flex overflow-x-auto">
        {tabs.map(tab => {
          const isActive = pathname === tab.href
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={[
                'px-5 py-3 text-sm font-medium whitespace-nowrap transition-colors',
                isActive
                  ? 'text-white border-b-2 border-[#6366F1]'
                  : 'text-[#64748B] hover:text-[#94A3B8]',
              ].join(' ')}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
