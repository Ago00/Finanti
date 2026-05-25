'use client'

import type { RecapAccountInput } from '../domain'

type Props = {
  accounts: RecapAccountInput[]
  onChange: (updated: RecapAccountInput[]) => void
}

function formatCurrency(n: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
}

const inputClass =
  'bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1] w-full'

const labelClass = 'text-sm text-[#94A3B8]'

function update(
  accounts: RecapAccountInput[],
  index: number,
  patch: Partial<RecapAccountInput>,
): RecapAccountInput[] {
  return accounts.map((a, i) => (i === index ? { ...a, ...patch } : a))
}

export function StepBalances({ accounts, onChange }: Props) {
  return (
    <div className="flex flex-col gap-4">
      {accounts.map((account, i) => {
        const computedGain =
          account.gainMode === 'auto'
            ? account.closingBalance - account.openingBalance - account.contributions
            : null

        return (
          <div
            key={account.id}
            className="rounded-xl bg-[#141925] border border-[#1E2A3A] p-4 flex flex-col gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#6366F1] shrink-0" />
              <span className="text-white font-medium">{account.name}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className={labelClass}>Saldo apertura</span>
              <span className="text-[#94A3B8] text-sm">{formatCurrency(account.openingBalance)}</span>
            </div>

            <div className="flex items-center justify-between gap-4">
              <span className={labelClass}>Aportaciones</span>
              <input
                type="number"
                step="0.01"
                value={account.contributions}
                onChange={(e) =>
                  onChange(update(accounts, i, { contributions: e.target.valueAsNumber || 0 }))
                }
                className={inputClass + ' max-w-[160px]'}
              />
            </div>

            <div className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-4">
                <span className={labelClass}>Saldo cierre</span>
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  required
                  value={account.closingBalance}
                  onChange={(e) =>
                    onChange(update(accounts, i, { closingBalance: e.target.valueAsNumber || 0 }))
                  }
                  className={inputClass + ' max-w-[160px]'}
                />
              </div>
              {account.gainMode === 'auto' && computedGain !== null && (
                <p
                  className={
                    'text-sm text-right ' +
                    (computedGain > 0
                      ? 'text-emerald-400'
                      : computedGain < 0
                        ? 'text-red-400'
                        : 'text-[#64748B]')
                  }
                >
                  Ganancia estimada: {formatCurrency(computedGain)}
                </p>
              )}
            </div>

            {account.gainMode === 'manual' && (
              <div className="flex items-center justify-between gap-4">
                <span className={labelClass}>Ganancia (€)</span>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={account.gainManual ?? 0}
                  onChange={(e) =>
                    onChange(update(accounts, i, { gainManual: e.target.valueAsNumber }))
                  }
                  className={inputClass + ' max-w-[160px]'}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
