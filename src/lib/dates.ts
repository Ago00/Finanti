import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export { es }

export function formatMonthLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: es })
}

// Returns the first day of the month in UTC for the given date.
// Used to derive budget_month from received_at for incomes and
// from month for investment executions.
export function toBudgetMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
}

// Compact label from a 'YYYY-MM' key, e.g. '2026-06' → "jun 26".
export function formatShortMonth(yyyyMM: string): string {
  const [year, month] = yyyyMM.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, 1))
    .toLocaleDateString('es-ES', { month: 'short', year: '2-digit', timeZone: 'UTC' })
    .replace('.', '')
}
