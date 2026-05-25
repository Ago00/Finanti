import { describe, it, expect } from 'vitest'
import { groupTransactionsByDay, sumTransactions, filterByMonth, TransactionRow } from './domain'

function makeTx(overrides: Partial<TransactionRow> & { paidAt: Date }): TransactionRow {
  return {
    id: crypto.randomUUID(),
    amount: 100,
    categoryName: null,
    groupName: null,
    description: null,
    prescindible: false,
    ...overrides,
  }
}

describe('groupTransactionsByDay', () => {
  it('returns empty array for empty input', () => {
    expect(groupTransactionsByDay([])).toEqual([])
  })

  it('single item produces one group', () => {
    const tx = makeTx({ paidAt: new Date('2026-05-10T10:00:00Z') })
    const result = groupTransactionsByDay([tx])
    expect(result).toHaveLength(1)
    expect(result[0].date).toBe('2026-05-10')
    expect(result[0].items).toHaveLength(1)
  })

  it('multiple items on the same day are grouped together', () => {
    const tx1 = makeTx({ paidAt: new Date('2026-05-10T08:00:00Z') })
    const tx2 = makeTx({ paidAt: new Date('2026-05-10T14:00:00Z') })
    const result = groupTransactionsByDay([tx1, tx2])
    expect(result).toHaveLength(1)
    expect(result[0].items).toHaveLength(2)
  })

  it('items on different days produce separate groups sorted descending', () => {
    const txA = makeTx({ paidAt: new Date('2026-05-08T10:00:00Z') })
    const txB = makeTx({ paidAt: new Date('2026-05-10T10:00:00Z') })
    const txC = makeTx({ paidAt: new Date('2026-05-09T10:00:00Z') })
    const result = groupTransactionsByDay([txA, txB, txC])
    expect(result).toHaveLength(3)
    expect(result[0].date).toBe('2026-05-10')
    expect(result[1].date).toBe('2026-05-09')
    expect(result[2].date).toBe('2026-05-08')
  })

  it('items within a day are sorted descending by paidAt', () => {
    const earlier = makeTx({ paidAt: new Date('2026-05-10T06:00:00Z') })
    const later = makeTx({ paidAt: new Date('2026-05-10T20:00:00Z') })
    const result = groupTransactionsByDay([earlier, later])
    expect(result[0].items[0].paidAt).toEqual(later.paidAt)
    expect(result[0].items[1].paidAt).toEqual(earlier.paidAt)
  })
})

describe('sumTransactions', () => {
  it('returns 0 for empty array', () => {
    expect(sumTransactions([])).toBe(0)
  })

  it('sums positive amounts correctly', () => {
    expect(sumTransactions([{ amount: 10 }, { amount: 25 }, { amount: 5 }])).toBe(40)
  })
})

describe('filterByMonth', () => {
  it('includes transactions in the matching month', () => {
    const tx = makeTx({ paidAt: new Date('2026-05-15T12:00:00Z') })
    expect(filterByMonth([tx], 2026, 5)).toHaveLength(1)
  })

  it('excludes transactions from other months', () => {
    const txApril = makeTx({ paidAt: new Date('2026-04-15T12:00:00Z') })
    const txJune = makeTx({ paidAt: new Date('2026-06-01T00:00:00Z') })
    expect(filterByMonth([txApril, txJune], 2026, 5)).toHaveLength(0)
  })

  it('uses UTC month from paidAt', () => {
    const tx = makeTx({ paidAt: new Date('2026-05-31T23:59:59Z') })
    expect(filterByMonth([tx], 2026, 5)).toHaveLength(1)
  })
})
