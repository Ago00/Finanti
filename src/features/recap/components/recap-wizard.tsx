'use client'

import type { RecapPrefillData, ExistingSnapshots } from '../queries'
import type { RecapAccountInput, RecapIncomeInput, RecapMovementInput, RecapBudgetInput } from '../domain'
import { StepBalances } from './step-balances'
import { StepIncomes } from './step-incomes'
import { StepMovements } from './step-movements'
import { StepBudget } from './step-budget'
import { StepConfirm } from './step-confirm'
import { saveRecap } from '../actions'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Step = 'balances' | 'incomes' | 'movements' | 'budget' | 'confirm'
const STEPS: Step[] = ['balances', 'incomes', 'movements', 'budget', 'confirm']
const STEP_LABELS: Record<Step, string> = {
  balances: 'Saldos',
  incomes: 'Ingresos',
  movements: 'Movimientos',
  budget: 'Plan',
  confirm: 'Confirmar',
}

type Props = {
  prefill: RecapPrefillData
  existingSnapshots: ExistingSnapshots
  month: { year: number; month: number }
}

export function RecapWizard({ prefill, existingSnapshots, month }: Props) {
  const router = useRouter()

  const initialAccounts: RecapAccountInput[] = prefill.accounts.map(acc => {
    const existing = existingSnapshots.find(s => s.accountId === acc.id)
    return {
      id: acc.id,
      name: acc.name,
      gainMode: acc.gainMode,
      openingBalance: existing?.openingBalance ?? acc.previousClosingBalance,
      contributions: existing?.contributions ?? 0,
      closingBalance: existing?.closingBalance ?? acc.previousClosingBalance,
      gainManual: existing?.gainManual ?? null,
    }
  })

  const [step, setStep] = useState<Step>('balances')
  const [accountInputs, setAccountInputs] = useState<RecapAccountInput[]>(initialAccounts)
  const [incomeInputs, setIncomeInputs] = useState<RecapIncomeInput[]>([])
  const [movementInputs, setMovementInputs] = useState<RecapMovementInput[]>([])
  const [budgetInputs, setBudgetInputs] = useState<RecapBudgetInput[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const currentIndex = STEPS.indexOf(step)

  function goNext() {
    if (currentIndex < STEPS.length - 1) {
      setStep(STEPS[currentIndex + 1])
    }
  }

  function goPrev() {
    if (currentIndex > 0) {
      setStep(STEPS[currentIndex - 1])
    }
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      const monthDate = new Date(Date.UTC(month.year, month.month - 1, 1))
      await saveRecap({
        month: monthDate.toISOString(),
        accounts: accountInputs,
        incomes: incomeInputs.filter(i => i.amount > 0),
        movements: movementInputs,
        budgets: budgetInputs.filter(b => b.plannedAmount > 0),
      })
      router.push('/patrimonio')
    } catch (err) {
      setError((err as Error).message)
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto space-y-6 py-8 px-4">
      <div className="flex items-center">
        {STEPS.map((s, idx) => (
          <div key={s} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  idx <= currentIndex
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-700 text-gray-400'
                }`}
              >
                {idx + 1}
              </div>
              <span className="mt-1 text-xs text-gray-400">{STEP_LABELS[s]}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-1 mb-5 ${
                  idx < currentIndex ? 'bg-indigo-600' : 'bg-gray-700'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      <div>
        {step === 'balances' && (
          <StepBalances
            accounts={accountInputs}
            onChange={setAccountInputs}
          />
        )}
        {step === 'incomes' && (
          <StepIncomes
            incomeSources={prefill.incomeSources}
            accounts={prefill.accounts.map(a => ({ id: a.id, name: a.name }))}
            inputs={incomeInputs}
            onChange={setIncomeInputs}
            month={month}
          />
        )}
        {step === 'movements' && (
          <StepMovements
            accounts={prefill.accounts}
            inputs={movementInputs}
            onChange={setMovementInputs}
          />
        )}
        {step === 'budget' && (
          <StepBudget
            categories={prefill.categories}
            assetClasses={prefill.assetClasses}
            inputs={budgetInputs}
            onChange={setBudgetInputs}
          />
        )}
        {step === 'confirm' && (
          <StepConfirm
            accounts={accountInputs}
            incomes={incomeInputs}
            movements={movementInputs}
            budgets={budgetInputs}
            accountMeta={prefill.accounts.map(a => ({ id: a.id, name: a.name }))}
            incomeMeta={prefill.incomeSources.map(s => ({ id: s.id, name: s.name }))}
            categoryMeta={prefill.categories}
            assetClassMeta={prefill.assetClasses}
          />
        )}
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex justify-between">
        <button
          type="button"
          onClick={goPrev}
          disabled={currentIndex === 0}
          className="px-4 py-2 rounded bg-gray-700 text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-600"
        >
          Anterior
        </button>

        {step !== 'confirm' ? (
          <button
            type="button"
            onClick={goNext}
            className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-500"
          >
            Siguiente
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded bg-[#6366F1] text-white hover:bg-[#818CF8] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando…' : 'Guardar Recap'}
          </button>
        )}
      </div>
    </div>
  )
}
