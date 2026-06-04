export const GAIN_MODE_LABELS: Record<'auto' | 'manual' | 'projects', string> = {
  auto: 'Auto',
  manual: 'Manual',
  projects: 'Proyectos',
}

export type GainInput = {
  openingBalance: number
  closingBalance: number
  contributions: number
  gainMode: 'auto' | 'manual' | 'projects'
  manualGain?: number | null
}

export function calculateGain(input: GainInput): number {
  if (input.gainMode === 'manual') return input.manualGain ?? 0
  if (input.gainMode === 'projects') return 0
  return input.closingBalance - input.openingBalance - input.contributions
}

export function calculateGainPercentage(gain: number, openingBalance: number): number {
  if (openingBalance === 0) return 0
  return (gain / openingBalance) * 100
}

export function calculateMonthlyChange(previousClosing: number, currentClosing: number): number {
  return currentClosing - previousClosing
}

export function calculateMonthlyChangePercentage(previousClosing: number, currentClosing: number): number {
  if (previousClosing === 0) return 0
  return ((currentClosing - previousClosing) / Math.abs(previousClosing)) * 100
}

export function calculateTotalGain(snapshots: { gain: number }[]): number {
  return snapshots.reduce((sum, s) => sum + s.gain, 0)
}

export function calculateTotalGainPercentage(
  totalGain: number,
  firstOpeningBalance: number,
  totalContributions: number,
): number {
  const base = firstOpeningBalance + totalContributions
  if (base === 0) return 0
  return (totalGain / base) * 100
}

// ─── Patrimonio breakdown ───────────────────────────────────────────────────
//
// The three breakdown groups (savings / in-kind / investment) come from the
// free-text `account_types.name`. Each kind drives a different detail view, so
// the type name is normalized into a stable union. Accounts without a type, or
// with a name that matches no keyword, fall into 'unclassified' and degrade to
// the safest (balance-only) detail.

export type AccountKind = 'savings' | 'in-kind' | 'investment' | 'unclassified'

const SAVINGS_KEYWORDS = ['ahorro', 'corriente', 'banco', 'efectivo', 'caja']
const IN_KIND_KEYWORDS = ['especie', 'restaurante', 'ticket', 'vale']
const INVESTMENT_KEYWORDS = ['inversion', 'fondo', 'broker', 'pension', 'cripto', 'bolsa']

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
}

export function classifyAccountType(typeName: string | null): AccountKind {
  if (typeName === null) return 'unclassified'
  const name = normalize(typeName)
  if (SAVINGS_KEYWORDS.some(keyword => name.includes(keyword))) return 'savings'
  if (IN_KIND_KEYWORDS.some(keyword => name.includes(keyword))) return 'in-kind'
  if (INVESTMENT_KEYWORDS.some(keyword => name.includes(keyword))) return 'investment'
  return 'unclassified'
}

export function calculateTotalPatrimony(latestClosingBalances: number[]): number {
  return latestClosingBalances.reduce((sum, balance) => sum + balance, 0)
}

// A single account's value across one month. Balances are ordered oldest first.
export type MonthlyPoint = {
  month: string // 'YYYY-MM'
  closingBalance: number
  contributions: number
  expense: number
}

export type SavingsMetrics = {
  balance: number
  monthChange: number
  rangeChange: number // variation over the whole provided window
}

export function calculateSavingsMetrics(points: MonthlyPoint[]): SavingsMetrics {
  if (points.length === 0) {
    return { balance: 0, monthChange: 0, rangeChange: 0 }
  }
  const latest = points[points.length - 1]
  const previous = points[points.length - 2]
  const oldest = points[0]
  return {
    balance: latest.closingBalance,
    monthChange: previous ? latest.closingBalance - previous.closingBalance : 0,
    rangeChange: latest.closingBalance - oldest.closingBalance,
  }
}

export type InvestmentMetrics = {
  value: number
  contributed: number // accumulated contributions across the window
  gain: number
  gainPercentage: number
}

export function calculateInvestmentMetrics(points: MonthlyPoint[]): InvestmentMetrics {
  if (points.length === 0) {
    return { value: 0, contributed: 0, gain: 0, gainPercentage: 0 }
  }
  const value = points[points.length - 1].closingBalance
  const contributed = points.reduce((sum, point) => sum + point.contributions, 0)
  const gain = value - contributed
  return {
    value,
    contributed,
    gain,
    gainPercentage: contributed === 0 ? 0 : (gain / contributed) * 100,
  }
}

export type InKindMetrics = {
  balance: number
  monthContribution: number
  monthExpense: number
}

export function calculateInKindMetrics(points: MonthlyPoint[]): InKindMetrics {
  if (points.length === 0) {
    return { balance: 0, monthContribution: 0, monthExpense: 0 }
  }
  const latest = points[points.length - 1]
  return {
    balance: latest.closingBalance,
    monthContribution: latest.contributions,
    monthExpense: latest.expense,
  }
}
