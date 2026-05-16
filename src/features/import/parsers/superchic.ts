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

// Monthly sheet tabs use "S&P500" for what RESUMEN calls "MyInvestor"
const MONTHLY_ACCOUNT_ALIASES: Record<string, string> = {
  'S&P500': 'MyInvestor',
}

const INCOME_SOURCE_NAMES = new Set([
  'Parts Marta',
  'Parts Candela',
  'MM',
  'Paga',
  'Restaurant',
  'Otro',
])

const MONTH_NAME_TO_INDEX: Record<string, number> = {
  Enero: 0, Febrero: 1, Marzo: 2, Abril: 3, Mayo: 4, Junio: 5,
  Julio: 6, Agosto: 7, Septiembre: 8, Octubre: 9, Noviembre: 10, Diciembre: 11,
}

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

// Parses each monthly tab (e.g. "Enero25") to extract contributions per account per month.
// Each tab has side-by-side blocks at col 6 and col 11: account name row → header row → data row.
// The "Ingreso"/"Ingresos" header column holds the contribution amount.
function parseMonthlyContributions(wb: XLSX.WorkBook): Map<string, Map<string, number>> {
  const result = new Map<string, Map<string, number>>()
  const knownAccounts = new Set(Object.keys(ACCOUNT_CONFIGS))

  for (const sheetName of wb.SheetNames) {
    if (sheetName === 'RESUMEN') continue
    const match = sheetName.match(/^([A-Za-záéíóúü]+)(\d{2})$/)
    if (!match) continue
    const monthIndex = MONTH_NAME_TO_INDEX[match[1]]
    if (monthIndex === undefined) continue
    const year = 2000 + parseInt(match[2])
    const monthKey = `${year}-${monthIndex}`

    const ws = wb.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })

    for (let rowIdx = 0; rowIdx < rows.length - 2; rowIdx++) {
      const row = rows[rowIdx] as unknown[]

      for (const colBase of [6, 11]) {
        const cellValue = row[colBase]
        if (typeof cellValue !== 'string') continue
        const rawName = cellValue.trim()
        const accountName = MONTHLY_ACCOUNT_ALIASES[rawName] ?? rawName
        if (!knownAccounts.has(accountName)) continue

        const headerRow = (rows[rowIdx + 1] ?? []) as unknown[]
        const dataRow = (rows[rowIdx + 2] ?? []) as unknown[]

        for (let offset = 0; offset <= 4; offset++) {
          const header = headerRow[colBase + offset]
          if (typeof header !== 'string') continue
          if (header.toLowerCase() === 'ingreso' || header.toLowerCase() === 'ingresos') {
            const contribution = parseNumericCell(dataRow[colBase + offset])
            if (contribution !== null && contribution !== 0) {
              if (!result.has(accountName)) result.set(accountName, new Map())
              result.get(accountName)!.set(monthKey, contribution)
            }
            break
          }
        }
      }
    }
  }

  return result
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
          contributions: 0, // filled in below from monthly tabs
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

  // Merge contributions from monthly tabs into snapshots
  const contributions = parseMonthlyContributions(wb)
  for (const snap of snapshots) {
    const monthKey = `${snap.month.getUTCFullYear()}-${snap.month.getUTCMonth()}`
    snap.contributions = contributions.get(snap.accountName)?.get(monthKey) ?? 0
  }

  return { accounts, snapshots, incomes, warnings }
}
