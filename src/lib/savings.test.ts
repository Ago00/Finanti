import { describe, it, expect } from 'vitest'
import { calculateActualSavings } from './savings'

describe('calculateActualSavings', () => {
  it('returns null when previousMonthIncome is null (no income history)', () => {
    expect(calculateActualSavings({
      previousMonthIncome: null,
      currentMonthExpenses: 1000,
      currentMonthInvestments: 200,
    })).toBeNull()
  })

  it('calculates savings correctly: prev income - expenses - investments', () => {
    expect(calculateActualSavings({
      previousMonthIncome: 3000,
      currentMonthExpenses: 1500,
      currentMonthInvestments: 400,
    })).toBe(1100)
  })

  it('returns negative savings when expenses + investments exceed income', () => {
    expect(calculateActualSavings({
      previousMonthIncome: 2000,
      currentMonthExpenses: 1800,
      currentMonthInvestments: 500,
    })).toBe(-300)
  })

  it('returns the full income when there are no expenses or investments', () => {
    expect(calculateActualSavings({
      previousMonthIncome: 2500,
      currentMonthExpenses: 0,
      currentMonthInvestments: 0,
    })).toBe(2500)
  })

  it('returns zero when expenses + investments exactly equal previous income', () => {
    expect(calculateActualSavings({
      previousMonthIncome: 1000,
      currentMonthExpenses: 700,
      currentMonthInvestments: 300,
    })).toBe(0)
  })
})
