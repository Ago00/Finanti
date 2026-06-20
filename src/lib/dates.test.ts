import { describe, it, expect } from 'vitest'
import { toBudgetMonth } from './dates'

describe('toBudgetMonth', () => {
  it('returns the first day of the month in UTC', () => {
    const date = new Date('2026-06-15T14:30:00.000Z')
    const result = toBudgetMonth(date)
    expect(result.toISOString()).toBe('2026-06-01T00:00:00.000Z')
  })

  it('works for the first day of the month (idempotent)', () => {
    const date = new Date('2026-06-01T00:00:00.000Z')
    const result = toBudgetMonth(date)
    expect(result.toISOString()).toBe('2026-06-01T00:00:00.000Z')
  })

  it('works for the last day of the month', () => {
    const date = new Date('2026-06-30T23:59:59.999Z')
    const result = toBudgetMonth(date)
    expect(result.toISOString()).toBe('2026-06-01T00:00:00.000Z')
  })

  it('handles month boundary correctly (no off-by-one)', () => {
    const date = new Date('2026-01-31T23:59:59.000Z')
    const result = toBudgetMonth(date)
    expect(result.toISOString()).toBe('2026-01-01T00:00:00.000Z')
  })

  it('handles year boundary (December → December, not January)', () => {
    const date = new Date('2025-12-28T12:00:00.000Z')
    const result = toBudgetMonth(date)
    expect(result.toISOString()).toBe('2025-12-01T00:00:00.000Z')
  })
})
