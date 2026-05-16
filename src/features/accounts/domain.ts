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
