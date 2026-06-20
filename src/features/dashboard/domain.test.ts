import { describe, it, expect } from 'vitest'
import { computeAccountSummary, computeTotals, formatEvolutionMonth, computeLivePatrimony } from './domain'

describe('computeAccountSummary', () => {
  const account = { id: 'acc-1', name: 'Savings', color: '#10B981' }

  it('previousBalance null → monthlyChange and monthlyChangePct are null', () => {
    const result = computeAccountSummary(account, 1500, null)
    expect(result.currentBalance).toBe(1500)
    expect(result.previousBalance).toBeNull()
    expect(result.monthlyChange).toBeNull()
    expect(result.monthlyChangePct).toBeNull()
  })

  it('previousBalance 0 → monthlyChange computed, monthlyChangePct null', () => {
    const result = computeAccountSummary(account, 1000, 0)
    expect(result.currentBalance).toBe(1000)
    expect(result.previousBalance).toBe(0)
    expect(result.monthlyChange).toBe(1000)
    expect(result.monthlyChangePct).toBeNull()
  })

  it('previousBalance > 0 → change and pct computed correctly', () => {
    const result = computeAccountSummary(account, 1100, 1000)
    expect(result.currentBalance).toBe(1100)
    expect(result.previousBalance).toBe(1000)
    expect(result.monthlyChange).toBe(100)
    expect(result.monthlyChangePct).toBe(10)
  })

  it('negative change → negative monthlyChange and negative pct', () => {
    const result = computeAccountSummary(account, 800, 1000)
    expect(result.monthlyChange).toBe(-200)
    expect(result.monthlyChangePct).toBe(-20)
  })

  it('latestClosing null → currentBalance is 0 and changes are null', () => {
    const result = computeAccountSummary(account, null, 1000)
    expect(result.currentBalance).toBe(0)
    expect(result.monthlyChange).toBeNull()
    expect(result.monthlyChangePct).toBeNull()
  })

  it('passes through id, name, color', () => {
    const result = computeAccountSummary(account, 500, 400)
    expect(result.id).toBe('acc-1')
    expect(result.name).toBe('Savings')
    expect(result.color).toBe('#10B981')
  })
})

describe('computeTotals', () => {
  it('empty list returns zeros', () => {
    const result = computeTotals([])
    expect(result).toEqual({ tai: 0, tdi: 0, totalBalance: 0 })
  })

  it('single snapshot returns its values', () => {
    const result = computeTotals([{ openingBalance: 1000, closingBalance: 1200 }])
    expect(result.tai).toBe(1000)
    expect(result.tdi).toBe(1200)
    expect(result.totalBalance).toBe(1200)
  })

  it('multiple snapshots sums correctly', () => {
    const result = computeTotals([
      { openingBalance: 1000, closingBalance: 1100 },
      { openingBalance: 500, closingBalance: 600 },
      { openingBalance: 200, closingBalance: 250 },
    ])
    expect(result.tai).toBe(1700)
    expect(result.tdi).toBe(1950)
    expect(result.totalBalance).toBe(1950)
  })

  it('totalBalance equals tdi', () => {
    const result = computeTotals([
      { openingBalance: 100, closingBalance: 300 },
      { openingBalance: 200, closingBalance: 700 },
    ])
    expect(result.totalBalance).toBe(result.tdi)
  })
})

describe('computeLivePatrimony', () => {
  it('positive adjustment: more income than expenses and investments', () => {
    const result = computeLivePatrimony({
      liquidSnapshotTotal: 10000,
      investmentSnapshotTotal: 5000,
      incomesSinceSnapshot: 3000,
      expensesSinceSnapshot: 500,
      investmentsSinceSnapshot: 200,
    })
    expect(result.liquidAdjustment).toBe(2300) // 3000 - 500 - 200
    expect(result.liveTotal).toBe(17300) // 10000 + 2300 + 5000
  })

  it('negative adjustment: expenses and investments exceed income', () => {
    const result = computeLivePatrimony({
      liquidSnapshotTotal: 8000,
      investmentSnapshotTotal: 4000,
      incomesSinceSnapshot: 500,
      expensesSinceSnapshot: 1200,
      investmentsSinceSnapshot: 300,
    })
    expect(result.liquidAdjustment).toBe(-1000) // 500 - 1200 - 300
    expect(result.liveTotal).toBe(11000) // 8000 + (-1000) + 4000
  })

  it('zero adjustment when all inputs are zero (no snapshot)', () => {
    const result = computeLivePatrimony({
      liquidSnapshotTotal: 0,
      investmentSnapshotTotal: 0,
      incomesSinceSnapshot: 0,
      expensesSinceSnapshot: 0,
      investmentsSinceSnapshot: 0,
    })
    expect(result.liquidAdjustment).toBe(0)
    expect(result.liveTotal).toBe(0)
  })

  it('investment executions reduce liquid side but not investment snapshot', () => {
    const result = computeLivePatrimony({
      liquidSnapshotTotal: 10000,
      investmentSnapshotTotal: 5000,
      incomesSinceSnapshot: 2000,
      expensesSinceSnapshot: 200,
      investmentsSinceSnapshot: 1500,
    })
    // Investment executions left the liquid side and are not yet in investment snapshot
    expect(result.liquidAdjustment).toBe(300) // 2000 - 200 - 1500
    expect(result.liveTotal).toBe(15300) // 10000 + 300 + 5000
  })
})

describe('formatEvolutionMonth', () => {
  it('formats year and month with zero-padding', () => {
    const date = new Date(Date.UTC(2026, 0, 1)) // January
    expect(formatEvolutionMonth(date)).toBe('2026-01')
  })

  it('formats double-digit months without extra padding', () => {
    const date = new Date(Date.UTC(2025, 11, 1)) // December
    expect(formatEvolutionMonth(date)).toBe('2025-12')
  })

  it('formats mid-year month correctly', () => {
    const date = new Date(Date.UTC(2026, 4, 1)) // May
    expect(formatEvolutionMonth(date)).toBe('2026-05')
  })

  it('uses UTC month not local month', () => {
    // UTC 2026-01-01T00:00:00Z should be January regardless of local timezone
    const date = new Date('2026-01-01T00:00:00.000Z')
    expect(formatEvolutionMonth(date)).toBe('2026-01')
  })
})
