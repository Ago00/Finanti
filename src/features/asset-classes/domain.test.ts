import { describe, it, expect } from 'vitest'
import { validateAssetClassName, normalizeColor, sortAlphabetically } from './domain'

describe('validateAssetClassName', () => {
  it('throws for empty string', () => {
    expect(() => validateAssetClassName('')).toThrow()
  })

  it('throws for whitespace-only string', () => {
    expect(() => validateAssetClassName('   ')).toThrow()
  })

  it('does not throw for valid name', () => {
    expect(() => validateAssetClassName('Renta variable')).not.toThrow()
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

describe('sortAlphabetically', () => {
  it('sorts items by name in ascending order', () => {
    const items = [
      { name: 'Renta variable' },
      { name: 'Inmuebles' },
      { name: 'Renta fija' },
    ]
    const result = sortAlphabetically(items)
    expect(result[0].name).toBe('Inmuebles')
    expect(result[1].name).toBe('Renta fija')
    expect(result[2].name).toBe('Renta variable')
  })

  it('does not mutate the original array', () => {
    const items = [{ name: 'Z' }, { name: 'A' }]
    const original = [...items]
    sortAlphabetically(items)
    expect(items[0].name).toBe(original[0].name)
  })

  it('handles single item', () => {
    const items = [{ name: 'Liquidez' }]
    expect(sortAlphabetically(items)).toHaveLength(1)
  })
})
