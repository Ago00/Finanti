import { describe, it, expect } from 'vitest'
import {
  validateEntityName,
  normalizeColor,
  computeNextSortOrder,
  sortByOrderAndName,
} from './domain'

describe('validateEntityName', () => {
  it('throws for empty string', () => {
    expect(() => validateEntityName('')).toThrow()
  })

  it('throws for whitespace-only string', () => {
    expect(() => validateEntityName('   ')).toThrow()
  })

  it('does not throw for valid name', () => {
    expect(() => validateEntityName('Alimentación')).not.toThrow()
  })
})

describe('normalizeColor', () => {
  it('converts lowercase hex to uppercase', () => {
    expect(normalizeColor('#6366f1')).toBe('#6366F1')
  })

  it('keeps already uppercase unchanged', () => {
    expect(normalizeColor('#6366F1')).toBe('#6366F1')
  })

  it('converts mixed case to uppercase', () => {
    expect(normalizeColor('#aAbBcC')).toBe('#AABBCC')
  })
})

describe('computeNextSortOrder', () => {
  it('returns 0 for empty list', () => {
    expect(computeNextSortOrder([])).toBe(0)
  })

  it('returns max + 10 for single item', () => {
    expect(computeNextSortOrder([{ sortOrder: 10 }])).toBe(20)
  })

  it('returns max + 10 for multiple items', () => {
    expect(computeNextSortOrder([{ sortOrder: 10 }, { sortOrder: 30 }, { sortOrder: 20 }])).toBe(40)
  })

  it('handles sortOrder of 0', () => {
    expect(computeNextSortOrder([{ sortOrder: 0 }])).toBe(10)
  })
})

describe('sortByOrderAndName', () => {
  it('sorts by sortOrder ascending', () => {
    const items = [
      { sortOrder: 20, name: 'B' },
      { sortOrder: 10, name: 'A' },
    ]
    const result = sortByOrderAndName(items)
    expect(result[0].sortOrder).toBe(10)
    expect(result[1].sortOrder).toBe(20)
  })

  it('breaks ties by name alphabetically', () => {
    const items = [
      { sortOrder: 10, name: 'Transporte' },
      { sortOrder: 10, name: 'Alimentación' },
    ]
    const result = sortByOrderAndName(items)
    expect(result[0].name).toBe('Alimentación')
    expect(result[1].name).toBe('Transporte')
  })

  it('does not mutate the original array', () => {
    const items = [{ sortOrder: 20, name: 'B' }, { sortOrder: 10, name: 'A' }]
    const original = [...items]
    sortByOrderAndName(items)
    expect(items[0].name).toBe(original[0].name)
  })
})
