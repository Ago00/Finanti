import { describe, it, expect } from 'vitest'
import { sumIncomes, groupIncomesBySource } from './domain'
import type { IncomeEntry } from './domain'

function makeEntry(overrides: Partial<IncomeEntry> & { amount: number; sourceName: string }): IncomeEntry {
  return {
    id: crypto.randomUUID(),
    receivedAt: new Date('2026-05-10T00:00:00Z'),
    budgetMonth: new Date('2026-06-01T00:00:00Z'),
    incomeSourceId: null,
    sourceColor: '#10B981',
    description: null,
    ...overrides,
  }
}

describe('sumIncomes', () => {
  it('returns 0 for empty list', () => {
    expect(sumIncomes([])).toBe(0)
  })

  it('returns sum for single entry', () => {
    expect(sumIncomes([{ amount: 1500 }])).toBe(1500)
  })

  it('returns correct sum for multiple entries', () => {
    expect(sumIncomes([{ amount: 1000 }, { amount: 500 }, { amount: 250 }])).toBe(1750)
  })

  it('handles decimal amounts', () => {
    expect(sumIncomes([{ amount: 1000.50 }, { amount: 499.50 }])).toBeCloseTo(1500)
  })
})

describe('groupIncomesBySource', () => {
  it('returns empty array for empty input', () => {
    expect(groupIncomesBySource([])).toEqual([])
  })

  it('groups entries by sourceName', () => {
    const entries = [
      makeEntry({ amount: 1000, sourceName: 'Nómina' }),
      makeEntry({ amount: 500, sourceName: 'Freelance' }),
      makeEntry({ amount: 200, sourceName: 'Nómina' }),
    ]
    const result = groupIncomesBySource(entries)
    const nomina = result.find(g => g.sourceName === 'Nómina')
    const freelance = result.find(g => g.sourceName === 'Freelance')

    expect(nomina?.entries).toHaveLength(2)
    expect(freelance?.entries).toHaveLength(1)
  })

  it('sums totals correctly per source', () => {
    const entries = [
      makeEntry({ amount: 1000, sourceName: 'Nómina' }),
      makeEntry({ amount: 200, sourceName: 'Nómina' }),
      makeEntry({ amount: 300, sourceName: 'Freelance' }),
    ]
    const result = groupIncomesBySource(entries)
    const nomina = result.find(g => g.sourceName === 'Nómina')
    const freelance = result.find(g => g.sourceName === 'Freelance')

    expect(nomina?.total).toBe(1200)
    expect(freelance?.total).toBe(300)
  })

  it('orders groups by total descending', () => {
    const entries = [
      makeEntry({ amount: 300, sourceName: 'Freelance' }),
      makeEntry({ amount: 1200, sourceName: 'Nómina' }),
      makeEntry({ amount: 50, sourceName: 'Dividendos' }),
    ]
    const result = groupIncomesBySource(entries)
    expect(result[0].sourceName).toBe('Nómina')
    expect(result[1].sourceName).toBe('Freelance')
    expect(result[2].sourceName).toBe('Dividendos')
  })

  it('single source returns one group with all entries', () => {
    const entries = [
      makeEntry({ amount: 400, sourceName: 'Nómina' }),
      makeEntry({ amount: 600, sourceName: 'Nómina' }),
    ]
    const result = groupIncomesBySource(entries)
    expect(result).toHaveLength(1)
    expect(result[0].total).toBe(1000)
    expect(result[0].entries).toHaveLength(2)
  })

  it('uses sourceColor from first entry of the group', () => {
    const entries = [
      makeEntry({ amount: 500, sourceName: 'Nómina', sourceColor: '#FF0000' }),
    ]
    const result = groupIncomesBySource(entries)
    expect(result[0].sourceColor).toBe('#FF0000')
  })
})
