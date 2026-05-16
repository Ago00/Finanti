import { describe, it, expect, beforeAll } from 'vitest'
import * as fs from 'fs'
import * as path from 'path'
import { parseSuperchicWorkbook, type ParseSuperchicResult } from './superchic'

const EXCEL_PATH = path.resolve(__dirname, '../../../../../referencias/SuperChic 2.xlsx')

describe('parseSuperchicWorkbook', () => {
  let result: ParseSuperchicResult

  beforeAll(() => {
    const buffer = fs.readFileSync(EXCEL_PATH)
    result = parseSuperchicWorkbook(buffer)
  })

  it('parses all 9 accounts', () => {
    expect(result.accounts.length).toBe(9)
    const names = result.accounts.map(a => a.name)
    expect(names).toContain('Santander')
    expect(names).toContain('Revolut')
    expect(names).toContain('Azvalor')
    expect(names).toContain('MyInvestor')
    expect(names).toContain('Civislend')
    expect(names).toContain('Trading212')
    expect(names).toContain('Restaurante')
    expect(names).toContain('BTC')
    expect(names).toContain('Cobas')
  })

  it('assigns correct gainMode to each account', () => {
    const byName = Object.fromEntries(result.accounts.map(a => [a.name, a.gainMode]))
    expect(byName.Santander).toBe('auto')
    expect(byName.Civislend).toBe('projects')
    expect(byName.Restaurante).toBe('manual')
    expect(byName.BTC).toBe('auto')
  })

  it('parses Santander snapshot for October 2023 correctly', () => {
    const snap = result.snapshots.find(
      s => s.accountName === 'Santander' && s.month.getUTCFullYear() === 2023 && s.month.getUTCMonth() === 9
    )
    expect(snap).toBeDefined()
    expect(snap!.closingBalance).toBe(45.19)
  })

  it('skips null/dash cells (MyInvestor has no snapshot for Oct/Nov 2023)', () => {
    const earlyMyInvestor = result.snapshots.filter(
      s =>
        s.accountName === 'MyInvestor' &&
        s.month.getUTCFullYear() === 2023 &&
        s.month.getUTCMonth() <= 10
    )
    expect(earlyMyInvestor.length).toBe(0)
  })

  it('sets opening balance of first snapshot equal to closing', () => {
    const firstSantander = result.snapshots
      .filter(s => s.accountName === 'Santander')
      .sort((a, b) => a.month.getTime() - b.month.getTime())[0]
    expect(firstSantander.openingBalance).toBe(firstSantander.closingBalance)
  })

  it('derives opening balance from previous month closing', () => {
    const santanderSnaps = result.snapshots
      .filter(s => s.accountName === 'Santander')
      .sort((a, b) => a.month.getTime() - b.month.getTime())
    // Opening of month[1] = closing of month[0]
    expect(santanderSnaps[1].openingBalance).toBe(santanderSnaps[0].closingBalance)
  })

  it('parses income entries with budgetMonth = receivedAt + 1 month', () => {
    expect(result.incomes.length).toBeGreaterThan(0)
    for (const income of result.incomes) {
      const expectedBudgetMonth = new Date(income.receivedAt)
      expectedBudgetMonth.setUTCMonth(expectedBudgetMonth.getUTCMonth() + 1)
      expect(income.budgetMonth.getUTCFullYear()).toBe(expectedBudgetMonth.getUTCFullYear())
      expect(income.budgetMonth.getUTCMonth()).toBe(expectedBudgetMonth.getUTCMonth())
    }
  })

  it('parses MM income for October 2023 as 609.49', () => {
    const mmOct23 = result.incomes.find(
      i =>
        i.sourceNameRaw === 'MM' &&
        i.receivedAt.getUTCFullYear() === 2023 &&
        i.receivedAt.getUTCMonth() === 9
    )
    expect(mmOct23).toBeDefined()
    expect(mmOct23!.amount).toBe(609.49)
  })

  it('returns no warnings', () => {
    expect(result.warnings.length).toBe(0)
  })
})
