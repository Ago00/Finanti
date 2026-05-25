export type GainMode = 'auto' | 'manual' | 'projects'

export type RecapAccountInput = {
  id: string
  name: string
  gainMode: GainMode
  openingBalance: number
  contributions: number
  closingBalance: number
  gainManual?: number | null
}

export type RecapIncomeInput = {
  incomeSourceId: string
  amount: number
  receivedAt: string
  budgetMonth: string
  toAccountId: string | null
}

export type RecapMovementInput = {
  fromAccountId: string
  toAccountId: string
  amount: number
  description?: string | null
}

export type RecapBudgetInput = {
  categoryId?: string | null
  assetClassId?: string | null
  plannedAmount: number
}

export type RecapPayload = {
  month: string
  accounts: RecapAccountInput[]
  incomes: RecapIncomeInput[]
  movements: RecapMovementInput[]
  budgets: RecapBudgetInput[]
}

export type SnapshotResult = {
  gain: number
  gainPercentage: number
}

export type RecapSummary = {
  totalClosingBalance: number
  totalGain: number
  totalContributions: number
}

export function computeSnapshot(input: RecapAccountInput): SnapshotResult {
  let gain: number

  if (input.gainMode === 'auto') {
    gain = input.closingBalance - input.openingBalance - input.contributions
  } else if (input.gainMode === 'manual') {
    gain = input.gainManual ?? 0
  } else {
    gain = 0
  }

  const gainPercentage =
    input.openingBalance === 0 ? 0 : (gain / input.openingBalance) * 100

  return { gain, gainPercentage }
}

export function computeRecapSummary(inputs: RecapAccountInput[]): RecapSummary {
  const totalClosingBalance = inputs.reduce((sum, i) => sum + i.closingBalance, 0)
  const totalGain = inputs.reduce((sum, i) => sum + computeSnapshot(i).gain, 0)
  const totalContributions = inputs.reduce((sum, i) => sum + i.contributions, 0)

  return { totalClosingBalance, totalGain, totalContributions }
}

export function calculateBudgetMonth(receivedAt: Date): Date {
  return new Date(Date.UTC(receivedAt.getUTCFullYear(), receivedAt.getUTCMonth(), 1))
}

export function validateRecapPayload(payload: RecapPayload): void {
  if (payload.accounts.length === 0) {
    throw new Error('Al menos una cuenta es requerida')
  }

  for (const account of payload.accounts) {
    if (account.gainMode === 'manual' && (account.gainManual === null || account.gainManual === undefined)) {
      throw new Error(`La cuenta "${account.name}" requiere ganancia manual`)
    }

    if (account.closingBalance < 0) {
      throw new Error(`El saldo de cierre de "${account.name}" no puede ser negativo`)
    }
  }
}

export function computeOpeningBalancesForNewMonth(
  previousSnapshots: { accountId: string; closingBalance: number }[],
): { accountId: string; openingBalance: number }[] {
  return previousSnapshots.map((s) => ({
    accountId: s.accountId,
    openingBalance: s.closingBalance,
  }))
}
