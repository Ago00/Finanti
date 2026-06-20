'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'motion/react'
import { LayoutDashboard, Receipt, PiggyBank, TrendingUp, Settings2 } from 'lucide-react'

const C = {
  card:    '#111827',
  border:  '#1F2937',
  primary: '#6366F1',
  white:   '#F9FAFB',
  muted:   '#6B7280',
}

const items = [
  { label: 'Dashboard',   href: '/dashboard',    activePrefix: '/dashboard',    icon: LayoutDashboard },
  { label: 'Gastos',      href: '/gastos',        activePrefix: '/gastos',        icon: Receipt         },
  { label: 'Presupuesto', href: '/presupuesto',   activePrefix: '/presupuesto',   icon: PiggyBank       },
  { label: 'Ingresos',    href: '/ingresos',      activePrefix: '/ingresos',      icon: TrendingUp      },
  { label: 'Ajustes',     href: '/ajustes/cuentas', activePrefix: '/ajustes',     icon: Settings2       },
]

export function BottomNav() {
  const pathname = usePathname()

  if (pathname === '/login') return null

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex w-full"
      style={{ background: C.card, borderTop: `1px solid ${C.border}` }}
    >
      {items.map(({ label, href, activePrefix, icon: Icon }) => {
        const active = pathname.startsWith(activePrefix)
        return (
          <Link
            key={href}
            href={href}
            className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative"
          >
            {/* Active indicator — top line with layoutId for animation */}
            <AnimatePresence>
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-8 rounded-full"
                  style={{ background: C.primary }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                />
              )}
            </AnimatePresence>

            <motion.div
              animate={{
                scale: active ? 1.1 : 1,
                y: active ? -1 : 0,
              }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            >
              <Icon size={20} style={{ color: active ? C.primary : C.muted }} />
            </motion.div>

            <span
              className="text-[9px] font-medium"
              style={{ color: active ? C.white : C.muted }}
            >
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
