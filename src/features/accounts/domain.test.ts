import { describe, it, expect } from 'vitest'
import {
  calculateGain,
  calculateGainPercentage,
  calculateMonthlyChange,
  calculateMonthlyChangePercentage,
  classifyAccountType,
  calculateTotalPatrimony,
  calculateSavingsMetrics,
  calculateInvestmentMetrics,
  calculateInKindMetrics,
  type MonthlyPoint,
} from './domain'

function point(partial: Partial<MonthlyPoint> & { month: string; closingBalance: number }): MonthlyPoint {
  return { contributions: 0, expense: 0, ...partial }
}

describe('calculateGain', () => {
  it('auto: gain = closing - opening - contributions', () => {
    expect(calculateGain({ openingBalance: 1000, closingBalance: 1100, contributions: 50, gainMode: 'auto' })).toBe(50)
  })

  it('auto: negative gain (loss)', () => {
    expect(calculateGain({ openingBalance: 1000, closingBalance: 900, contributions: 0, gainMode: 'auto' })).toBe(-100)
  })

  it('manual: returns manualGain', () => {
    expect(calculateGain({ openingBalance: 1000, closingBalance: 1100, contributions: 50, gainMode: 'manual', manualGain: 75 })).toBe(75)
  })

  it('manual: returns 0 if manualGain is null', () => {
    expect(calculateGain({ openingBalance: 1000, closingBalance: 1100, contributions: 50, gainMode: 'manual', manualGain: null })).toBe(0)
  })

  it('projects: always returns 0', () => {
    expect(calculateGain({ openingBalance: 1000, closingBalance: 1200, contributions: 100, gainMode: 'projects' })).toBe(0)
  })
})

describe('calculateGainPercentage', () => {
  it('calculates percentage relative to opening', () => {
    expect(calculateGainPercentage(100, 1000)).toBeCloseTo(10)
  })

  it('returns 0 if opening is 0', () => {
    expect(calculateGainPercentage(50, 0)).toBe(0)
  })
})

describe('calculateMonthlyChange', () => {
  it('positive change', () => {
    expect(calculateMonthlyChange(1000, 1100)).toBe(100)
  })

  it('negative change', () => {
    expect(calculateMonthlyChange(1100, 1000)).toBe(-100)
  })
})

describe('calculateMonthlyChangePercentage', () => {
  it('calculates percentage change', () => {
    expect(calculateMonthlyChangePercentage(1000, 1100)).toBeCloseTo(10)
  })

  it('returns 0 if previous is 0', () => {
    expect(calculateMonthlyChangePercentage(0, 100)).toBe(0)
  })
})

describe('classifyAccountType', () => {
  it('classifies savings type names', () => {
    expect(classifyAccountType('Ahorro')).toBe('savings')
    expect(classifyAccountType('Cuenta corriente')).toBe('savings')
  })

  it('classifies in-kind type names', () => {
    expect(classifyAccountType('Especie')).toBe('in-kind')
    expect(classifyAccountType('Tickets restaurante')).toBe('in-kind')
  })

  it('classifies investment type names', () => {
    expect(classifyAccountType('Inversión')).toBe('investment')
    expect(classifyAccountType('Fondo indexado')).toBe('investment')
  })

  it('is case- and accent-insensitive', () => {
    expect(classifyAccountType('INVERSIÓN')).toBe('investment')
    expect(classifyAccountType('inversion')).toBe('investment')
  })

  it('returns unclassified for null', () => {
    expect(classifyAccountType(null)).toBe('unclassified')
  })

  it('returns unclassified for an unknown type name', () => {
    expect(classifyAccountType('Otra cosa')).toBe('unclassified')
  })
})

describe('calculateTotalPatrimony', () => {
  it('sums the latest closing balances', () => {
    expect(calculateTotalPatrimony([12400, 6850, 18300])).toBe(37550)
  })

  it('returns 0 with no accounts', () => {
    expect(calculateTotalPatrimony([])).toBe(0)
  })

  it('handles negative balances', () => {
    expect(calculateTotalPatrimony([1000, -300])).toBe(700)
  })
})

describe('calculateSavingsMetrics', () => {
  it('computes balance, month change and range change', () => {
    const points = [
      point({ month: '2026-04', closingBalance: 12100 }),
      point({ month: '2026-05', closingBalance: 12100 }),
      point({ month: '2026-06', closingBalance: 12400 }),
    ]
    expect(calculateSavingsMetrics(points)).toEqual({
      balance: 12400,
      monthChange: 300,
      rangeChange: 300,
    })
  })

  it('returns zeros for an empty history', () => {
    expect(calculateSavingsMetrics([])).toEqual({ balance: 0, monthChange: 0, rangeChange: 0 })
  })

  it('uses zero month change with a single point', () => {
    const points = [point({ month: '2026-06', closingBalance: 5000 })]
    expect(calculateSavingsMetrics(points)).toEqual({ balance: 5000, monthChange: 0, rangeChange: 0 })
  })

  it('reports negative variation when the balance drops', () => {
    const points = [
      point({ month: '2026-05', closingBalance: 5000 }),
      point({ month: '2026-06', closingBalance: 4500 }),
    ]
    expect(calculateSavingsMetrics(points).monthChange).toBe(-500)
  })
})

describe('calculateInvestmentMetrics', () => {
  it('computes value, accumulated contributions, gain and gain percentage', () => {
    const points = [
      point({ month: '2026-05', closingBalance: 9000, contributions: 8000 }),
      point({ month: '2026-06', closingBalance: 11000, contributions: 2000 }),
    ]
    const metrics = calculateInvestmentMetrics(points)
    expect(metrics.value).toBe(11000)
    expect(metrics.contributed).toBe(10000)
    expect(metrics.gain).toBe(1000)
    expect(metrics.gainPercentage).toBeCloseTo(10)
  })

  it('reports a loss when value is below contributed', () => {
    const points = [point({ month: '2026-06', closingBalance: 900, contributions: 1000 })]
    const metrics = calculateInvestmentMetrics(points)
    expect(metrics.gain).toBe(-100)
    expect(metrics.gainPercentage).toBeCloseTo(-10)
  })

  it('returns zero percentage when nothing was contributed', () => {
    const points = [point({ month: '2026-06', closingBalance: 500, contributions: 0 })]
    expect(calculateInvestmentMetrics(points).gainPercentage).toBe(0)
  })

  it('returns zeros for an empty history', () => {
    expect(calculateInvestmentMetrics([])).toEqual({ value: 0, contributed: 0, gain: 0, gainPercentage: 0 })
  })
})

describe('calculateInKindMetrics', () => {
  it('reports the latest balance, contribution and expense', () => {
    const points = [
      point({ month: '2026-05', closingBalance: 185, contributions: 190, expense: 215 }),
      point({ month: '2026-06', closingBalance: 220, contributions: 190, expense: 155 }),
    ]
    expect(calculateInKindMetrics(points)).toEqual({
      balance: 220,
      monthContribution: 190,
      monthExpense: 155,
    })
  })

  it('defaults expense to zero when the account has no transactions', () => {
    const points = [point({ month: '2026-06', closingBalance: 100, contributions: 50 })]
    expect(calculateInKindMetrics(points).monthExpense).toBe(0)
  })

  it('returns zeros for an empty history', () => {
    expect(calculateInKindMetrics([])).toEqual({ balance: 0, monthContribution: 0, monthExpense: 0 })
  })
})
