import { describe, it, expect } from 'vitest'
import {
  computeSnapshot,
  computeRecapSummary,
  calculateBudgetMonth,
  validateRecapPayload,
  computeOpeningBalancesForNewMonth,
} from './domain'

describe('computeSnapshot', () => {
  it('auto mode: gain is positive when closing > opening + contributions', () => {
    const result = computeSnapshot({
      id: '1',
      name: 'Savings',
      gainMode: 'auto',
      openingBalance: 1000,
      contributions: 200,
      closingBalance: 1500,
    })
    expect(result.gain).toBe(300)
  })

  it('auto mode: gain is negative when closing < opening + contributions', () => {
    const result = computeSnapshot({
      id: '1',
      name: 'Savings',
      gainMode: 'auto',
      openingBalance: 1000,
      contributions: 0,
      closingBalance: 800,
    })
    expect(result.gain).toBe(-200)
  })

  it('manual mode: gain uses gainManual value', () => {
    const result = computeSnapshot({
      id: '1',
      name: 'Fund',
      gainMode: 'manual',
      openingBalance: 1000,
      contributions: 0,
      closingBalance: 1200,
      gainManual: 150,
    })
    expect(result.gain).toBe(150)
  })

  it('manual mode: gain defaults to 0 when gainManual is null', () => {
    const result = computeSnapshot({
      id: '1',
      name: 'Fund',
      gainMode: 'manual',
      openingBalance: 1000,
      contributions: 0,
      closingBalance: 1200,
      gainManual: null,
    })
    expect(result.gain).toBe(0)
  })

  it('projects mode: gain is always 0', () => {
    const result = computeSnapshot({
      id: '1',
      name: 'Project',
      gainMode: 'projects',
      openingBalance: 5000,
      contributions: 1000,
      closingBalance: 7000,
    })
    expect(result.gain).toBe(0)
  })

  it('gainPercentage is 0 when openingBalance is 0', () => {
    const result = computeSnapshot({
      id: '1',
      name: 'New Account',
      gainMode: 'auto',
      openingBalance: 0,
      contributions: 500,
      closingBalance: 600,
    })
    expect(result.gainPercentage).toBe(0)
  })

  it('gainPercentage is computed correctly when openingBalance > 0', () => {
    const result = computeSnapshot({
      id: '1',
      name: 'Savings',
      gainMode: 'auto',
      openingBalance: 1000,
      contributions: 0,
      closingBalance: 1100,
    })
    expect(result.gainPercentage).toBeCloseTo(10)
  })
})

describe('computeRecapSummary', () => {
  it('empty array returns all zeros', () => {
    const result = computeRecapSummary([])
    expect(result).toEqual({
      totalClosingBalance: 0,
      totalGain: 0,
      totalContributions: 0,
    })
  })

  it('multi-account sums correctly', () => {
    const result = computeRecapSummary([
      {
        id: '1',
        name: 'A',
        gainMode: 'auto',
        openingBalance: 1000,
        contributions: 200,
        closingBalance: 1400,
      },
      {
        id: '2',
        name: 'B',
        gainMode: 'manual',
        openingBalance: 500,
        contributions: 0,
        closingBalance: 600,
        gainManual: 80,
      },
    ])
    expect(result.totalClosingBalance).toBe(2000)
    expect(result.totalGain).toBe(280)
    expect(result.totalContributions).toBe(200)
  })
})

describe('calculateBudgetMonth', () => {
  it('May returns May 1st of same year', () => {
    const result = calculateBudgetMonth(new Date('2026-05-17T10:00:00Z'))
    expect(result.toISOString()).toBe('2026-05-01T00:00:00.000Z')
  })

  it('December returns December 1st of same year', () => {
    const result = calculateBudgetMonth(new Date('2026-12-15T00:00:00Z'))
    expect(result.toISOString()).toBe('2026-12-01T00:00:00.000Z')
  })

  it('January returns January 1st of same year', () => {
    const result = calculateBudgetMonth(new Date('2026-01-31T23:59:59Z'))
    expect(result.toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })
})

describe('validateRecapPayload', () => {
  const baseAccount = {
    id: '1',
    name: 'Checking',
    gainMode: 'auto' as const,
    openingBalance: 1000,
    contributions: 0,
    closingBalance: 1100,
  }

  const basePayload = {
    month: '2026-05-01T00:00:00.000Z',
    accounts: [baseAccount],
    incomes: [],
    movements: [],
    budgets: [],
  }

  it('happy path does not throw', () => {
    expect(() => validateRecapPayload(basePayload)).not.toThrow()
  })

  it('throws when accounts array is empty', () => {
    expect(() =>
      validateRecapPayload({ ...basePayload, accounts: [] }),
    ).toThrow('Al menos una cuenta es requerida')
  })

  it('throws when manual account has null gainManual', () => {
    expect(() =>
      validateRecapPayload({
        ...basePayload,
        accounts: [
          { ...baseAccount, name: 'Fund', gainMode: 'manual', gainManual: null },
        ],
      }),
    ).toThrow('La cuenta "Fund" requiere ganancia manual')
  })

  it('throws when manual account has undefined gainManual', () => {
    expect(() =>
      validateRecapPayload({
        ...basePayload,
        accounts: [
          { ...baseAccount, name: 'Fund', gainMode: 'manual' },
        ],
      }),
    ).toThrow('La cuenta "Fund" requiere ganancia manual')
  })

  it('throws when closingBalance is negative', () => {
    expect(() =>
      validateRecapPayload({
        ...basePayload,
        accounts: [
          { ...baseAccount, name: 'Checking', closingBalance: -50 },
        ],
      }),
    ).toThrow('El saldo de cierre de "Checking" no puede ser negativo')
  })
})

describe('computeOpeningBalancesForNewMonth', () => {
  it('maps closingBalance to openingBalance for each entry', () => {
    const result = computeOpeningBalancesForNewMonth([
      { accountId: 'a1', closingBalance: 1500 },
      { accountId: 'a2', closingBalance: 3000 },
    ])
    expect(result).toEqual([
      { accountId: 'a1', openingBalance: 1500 },
      { accountId: 'a2', openingBalance: 3000 },
    ])
  })

  it('returns empty array for empty input', () => {
    const result = computeOpeningBalancesForNewMonth([])
    expect(result).toEqual([])
  })
})
