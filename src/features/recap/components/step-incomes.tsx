'use client'

import type { RecapIncomeInput } from '../domain'
import { calculateBudgetMonth } from '../domain'

type IncomeSource = { id: string; name: string; color: string }
type Account = { id: string; name: string }

type Props = {
  incomeSources: IncomeSource[]
  accounts: Account[]
  inputs: RecapIncomeInput[]
  onChange: (updated: RecapIncomeInput[]) => void
  month: { year: number; month: number }
}

const inputClass =
  'bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]'

function defaultReceivedAt(year: number, month: number): string {
  const mm = String(month).padStart(2, '0')
  return `${year}-${mm}-25`
}

function buildDefaultInput(sourceId: string, year: number, month: number): RecapIncomeInput {
  const receivedAt = defaultReceivedAt(year, month)
  const budgetDate = calculateBudgetMonth(new Date(receivedAt + 'T12:00:00Z'))
  return { incomeSourceId: sourceId, amount: 0, receivedAt, budgetMonth: budgetDate.toISOString().slice(0, 10), toAccountId: null }
}

export function StepIncomes({ incomeSources, accounts, inputs, onChange, month }: Props) {
  const activeIds = new Set(inputs.map((i) => i.incomeSourceId))
  const hasInactive = incomeSources.some((s) => !activeIds.has(s.id))

  function handleAdd(sourceId: string) {
    onChange([...inputs, buildDefaultInput(sourceId, month.year, month.month)])
  }

  function handleRemove(sourceId: string) {
    onChange(inputs.filter((i) => i.incomeSourceId !== sourceId))
  }

  function handleChange(sourceId: string, patch: Partial<RecapIncomeInput>) {
    onChange(
      inputs.map((i) => {
        if (i.incomeSourceId !== sourceId) return i
        const updated = { ...i, ...patch }
        if (patch.receivedAt !== undefined) {
          const budgetDate = calculateBudgetMonth(new Date(updated.receivedAt + 'T12:00:00Z'))
          updated.budgetMonth = budgetDate.toISOString().slice(0, 10)
        }
        return updated
      }),
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {incomeSources.map((source) => {
        const entry = inputs.find((i) => i.incomeSourceId === source.id)
        const isActive = entry !== undefined

        if (!isActive) {
          return (
            <div
              key={source.id}
              className="rounded-xl bg-[#141925] border border-[#1E2A3A] p-4 flex items-center justify-between opacity-50"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                <span className="text-[#94A3B8] text-sm">{source.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleAdd(source.id)}
                className="w-7 h-7 rounded-full bg-[#1E2A3A] text-[#6366F1] text-lg leading-none flex items-center justify-center hover:bg-[#6366F1] hover:text-white transition-colors"
              >
                +
              </button>
            </div>
          )
        }

        return (
          <div key={source.id} className="rounded-xl bg-[#141925] border border-[#1E2A3A] p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: source.color }} />
                <span className="text-white font-medium">{source.name}</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(source.id)}
                className="text-[#64748B] hover:text-red-400 text-lg leading-none transition-colors"
              >
                ×
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#64748B]">Importe</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={entry.amount}
                  onChange={(e) => handleChange(source.id, { amount: e.target.valueAsNumber || 0 })}
                  className={inputClass + ' w-full'}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-[#64748B]">Fecha de cobro</label>
                <input
                  type="date"
                  value={entry.receivedAt}
                  onChange={(e) => handleChange(source.id, { receivedAt: e.target.value })}
                  className={inputClass + ' w-full'}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#64748B]">→ Deposita en cuenta</label>
              <select
                value={entry.toAccountId ?? ''}
                onChange={(e) => handleChange(source.id, { toAccountId: e.target.value || null })}
                className={inputClass + ' w-full'}
              >
                <option value="">Sin asignar</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>
          </div>
        )
      })}

      {hasInactive && (
        <button
          type="button"
          onClick={() => {
            const first = incomeSources.find((s) => !activeIds.has(s.id))
            if (first) handleAdd(first.id)
          }}
          className="mt-1 w-full rounded-lg border border-dashed border-[#1E2A3A] py-2 text-sm text-[#6366F1] hover:border-[#6366F1] transition-colors"
        >
          Añadir ingreso
        </button>
      )}
    </div>
  )
}
