import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { parseGastosWorkbook, type ParseGastosResult } from './gastos'

const EXCEL_PATH = path.resolve(__dirname, '../../../../../referencias/Gastos.xlsx')

describe('parseGastosWorkbook', () => {
  let result: ParseGastosResult

  beforeAll(() => {
    const buffer = fs.readFileSync(EXCEL_PATH)
    result = parseGastosWorkbook(buffer)
  })

  it('parses all valid rows without crashing', () => {
    // ~959 data rows (3 empty rows at end, 1 zero-amount row excluded)
    expect(result.transactions.length).toBeGreaterThan(950)
  })

  it('parses a normal row with correct fields', () => {
    const first = result.transactions[0]
    expect(first.amount).toBe(12.38)
    expect(first.categoryName).toBe('Comida')
    expect(first.description).toBe('Trabajo')
    expect(first.groupName).toBeNull()
    expect(first.prescindible).toBe(false)
    expect(first.paidAt).toBeInstanceOf(Date)
    expect(first.paidAt.getUTCFullYear()).toBe(2024)
    expect(first.paidAt.getUTCMonth()).toBe(8) // September = 8 (0-indexed)
  })

  it('handles empty group as null', () => {
    const noGroup = result.transactions.find(t => t.groupName === null)
    expect(noGroup).toBeDefined()
  })

  it('parses prescindible "Sí" as true', () => {
    const prescindibles = result.transactions.filter(t => t.prescindible)
    expect(prescindibles.length).toBeGreaterThan(0)
    expect(prescindibles[0].amount).toBe(3.98)
    expect(prescindibles[0].categoryName).toBe('Tomar algo')
  })

  it('trims trailing whitespace from group names', () => {
    for (const t of result.transactions) {
      if (t.groupName !== null) {
        expect(t.groupName).toBe(t.groupName.trim())
      }
    }
  })

  it('returns at most 1 warning (zero-amount row)', () => {
    // Only zero-amount rows generate warnings; negative amounts are valid (refunds)
    expect(result.warnings.length).toBeLessThanOrEqual(1)
  })

  it('parses all expected category names', () => {
    const categories = new Set(result.transactions.map(t => t.categoryName))
    expect(categories.has('Comida')).toBe(true)
    expect(categories.has('Tomar algo')).toBe(true)
    expect(categories.has('Transporte')).toBe(true)
  })
})
