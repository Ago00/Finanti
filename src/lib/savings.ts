export type MonthlySavingsInput = {
  previousMonthIncome: number | null
  currentMonthExpenses: number
  currentMonthInvestments: number
}

// Calculates actual savings for the current month using the previous month's
// income. The one-month offset is intentional: income received at end of month
// (e.g. salary on the 26th) is spent the following month, so the correct
// formula is: previousMonthIncome - currentExpenses - currentInvestments.
// Returns null when there is no income history for the previous month, which
// prevents surfacing a misleading zero.
export function calculateActualSavings(input: MonthlySavingsInput): number | null {
  if (input.previousMonthIncome === null) return null
  return input.previousMonthIncome - input.currentMonthExpenses - input.currentMonthInvestments
}
