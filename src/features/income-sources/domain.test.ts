import { describe, it, expect } from 'vitest'
import {
  validateIncomeSourceName,
  normalizeColor,
  computeNextSortOrder,
  sortByOrderAndName,
} from './domain'

describe('validateIncomeSourceName', () => {
  it('throws for empty string', () => {
    expect(() => validateIncomeSourceName('')).toThrow()
  })

  it('throws for whitespace-only string', () => {
    expect(() => validateIncomeSourceName('   ')).toThrow()
  })

  it('does not throw for valid name', () => {
    expect(() => validateIncomeSourceName('Salario')).not.toThrow()
  })
})

describe('normalizeColor', () => {
  it('converts lowercase hex to uppercase', () => {
    expect(normalizeColor('#aabbcc')).toBe('#AABBCC')
  })

  it('keeps already uppercase unchanged', () => {
    expect(normalizeColor('#10B981')).toBe('#10B981')
  })

  it('converts mixed case to uppercase', () => {
    expect(normalizeColor('#aAbBcC')).toBe('#AABBCC')
  })
})

describe('computeNextSortOrder', () => {
  it('returns 0 for empty list', () => {
    expect(computeNextSortOrder([])).toBe(0)
  })

  it('returns max + 10 for multiple items', () => {
    expect(computeNextSortOrder([{ sortOrder: 5 }, { sortOrder: 20 }])).toBe(30)
  })

  it('returns max + 10 for single item', () => {
    expect(computeNextSortOrder([{ sortOrder: 10 }])).toBe(20)
  })

  it('handles sortOrder of 0', () => {
    expect(computeNextSortOrder([{ sortOrder: 0 }])).toBe(10)
  })
})

describe('sortByOrderAndName', () => {
  it('sorts by sortOrder ascending', () => {
    const items = [
      { sortOrder: 20, name: 'Freelance' },
      { sortOrder: 10, name: 'Salario' },
    ]
    const result = sortByOrderAndName(items)
    expect(result[0].sortOrder).toBe(10)
    expect(result[1].sortOrder).toBe(20)
  })

  it('breaks ties by name alphabetically', () => {
    const items = [
      { sortOrder: 10, name: 'Salario' },
      { sortOrder: 10, name: 'Alquiler' },
    ]
    const result = sortByOrderAndName(items)
    expect(result[0].name).toBe('Alquiler')
    expect(result[1].name).toBe('Salario')
  })

  it('does not mutate the original array', () => {
    const items = [{ sortOrder: 20, name: 'B' }, { sortOrder: 10, name: 'A' }]
    const original = [...items]
    sortByOrderAndName(items)
    expect(items[0].name).toBe(original[0].name)
  })
})
