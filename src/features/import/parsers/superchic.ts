import * as XLSX from 'xlsx'
import { z } from 'zod'
import { addMonths } from 'date-fns'

export type ParsedAccount = {
  name: string
  gainMode: 'auto' | 'manual' | 'projects'
  sortOrder: number
}

export type ParsedSnapshot = {
  accountName: string
  month: Date
  openingBalance: number
  closingBalance: number
  contributions: number
  gainManual: number | null
}

export type ParsedIncome = {
  amount: number
  receivedAt: Date
  budgetMonth: Date
  sourceNameRaw: string
  description: string | null
}

export type ParseSuperchicResult = {
  accounts: ParsedAccount[]
  snapshots: ParsedSnapshot[]
  incomes: ParsedIncome[]
  warnings: string[]
}

// RESUMEN structure: months start at column index 2, first month = October 2023
const RESUMEN_FIRST_MONTH = new Date(Date.UTC(2023, 9, 1)) // 2023-10-01
const RESUMEN_DATA_START_COL = 2

const ACCOUNT_CONFIGS: Record<string, { gainMode: 'auto' | 'manual' | 'projects'; sortOrder: number }> = {
  Santander: { gainMode: 'auto', sortOrder: 0 },
  Revolut: { gainMode: 'auto', sortOrder: 1 },
  Azvalor: { gainMode: 'auto', sortOrder: 2 },
  MyInvestor: { gainMode: 'auto', sortOrder: 3 },
  Civislend: { gainMode: 'projects', sortOrder: 4 },
  Trading212: { gainMode: 'auto', sortOrder: 5 },
  Restaurante: { gainMode: 'manual', sortOrder: 6 },
  BTC: { gainMode: 'auto', sortOrder: 7 },
  Cobas: { gainMode: 'auto', sortOrder: 8 },
}

const INCOME_SOURCE_NAMES = new Set([
  'Parts Marta',
  'Parts Candela',
  'MM',
  'Paga',
  'Restaurant',
  'Otro',
])

const NumericCellSchema = z.union([z.number(), z.string(), z.null(), z.undefined()])

function parseNumericCell(value: unknown): number | null {
  const parsed = NumericCellSchema.safeParse(value)
  if (!parsed.success) return null
  const v = parsed.data
  if (v == null || v === '-') return null
  if (typeof v === 'number') return v
  const cleaned = v.replace(/[€\s]/g, '').replace(',', '.')
  const n = parseFloat(cleaned)
  return isNaN(n) ? null : n
}

function getLabel(row: unknown[]): string | null {
  // col[1] always contains the row label; col[0] is an optional section header
  const label = row[1]
  return typeof label === 'string' && label.trim().length > 0 ? label.trim() : null
}

function columnToMonth(colIndex: number): Date {
  return addMonths(RESUMEN_FIRST_MONTH, colIndex - RESUMEN_DATA_START_COL)
}

export function parseSuperchicWorkbook(buffer: Buffer): ParseSuperchicResult {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets['RESUMEN']
  if (!ws) throw new Error('Sheet "RESUMEN" not found')

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })
  const accounts: ParsedAccount[] = []
  const snapshots: ParsedSnapshot[] = []
  const incomes: ParsedIncome[] = []
  const warnings: string[] = []

  // Track last known closing balance per account for opening balance derivation
  const prevClosing = new Map<string, number>()

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx] as unknown[]
    if (!row || row.length < 3) continue

    const label = getLabel(row)
    if (!label) continue

    if (label in ACCOUNT_CONFIGS) {
      const config = ACCOUNT_CONFIGS[label]
      accounts.push({ name: label, gainMode: config.gainMode, sortOrder: config.sortOrder })

      for (let colIdx = RESUMEN_DATA_START_COL; colIdx < row.length; colIdx++) {
        const closingBalance = parseNumericCell(row[colIdx])
        if (closingBalance === null) continue

        const month = columnToMonth(colIdx)
        const openingBalance = prevClosing.get(label) ?? closingBalance

        snapshots.push({
          accountName: label,
          month,
          openingBalance,
          closingBalance,
          contributions: 0,
          gainManual: null,
        })

        prevClosing.set(label, closingBalance)
      }
      continue
    }

    if (INCOME_SOURCE_NAMES.has(label)) {
      for (let colIdx = RESUMEN_DATA_START_COL; colIdx < row.length; colIdx++) {
        const amount = parseNumericCell(row[colIdx])
        if (amount == null || amount === 0) continue

        const receivedAt = columnToMonth(colIdx)
        const budgetMonth = addMonths(receivedAt, 1)

        incomes.push({
          amount,
          receivedAt,
          budgetMonth,
          sourceNameRaw: label,
          description: null,
        })
      }
      continue
    }
  }

  return { accounts, snapshots, incomes, warnings }
}
