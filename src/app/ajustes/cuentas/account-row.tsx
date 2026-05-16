'use client'

import { archiveAccount } from '@/features/accounts/actions'
import type { AccountWithBalance } from '@/features/accounts/queries'

const GAIN_MODE_LABELS: Record<string, string> = {
  auto: 'Auto',
  manual: 'Manual',
  projects: 'Proyectos',
}

export function AccountRow({ account }: { account: AccountWithBalance }) {
  async function handleArchive() {
    if (!confirm(`¿Archivar la cuenta "${account.name}"? No aparecerá en el patrimonio.`)) return
    await archiveAccount(account.id)
  }

  return (
    <div className="flex items-center gap-4 rounded-xl bg-[#141925] border border-[#1E2A3A] px-5 py-4">
      <div
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: account.color }}
      />
      <div className="flex-1 min-w-0">
        <p className="text-white font-medium truncate">{account.name}</p>
        <p className="text-[#64748B] text-xs">{GAIN_MODE_LABELS[account.gainMode]}</p>
      </div>
      <button
        onClick={handleArchive}
        className="text-xs text-[#64748B] hover:text-red-400 transition-colors"
      >
        Archivar
      </button>
    </div>
  )
}
