import * as XLSX from 'xlsx'
import { z } from 'zod'

export type ParsedTransaction = {
  amount: number
  paidAt: Date
  categoryName: string
  groupName: string | null
  description: string | null
  prescindible: boolean
}

export type ParseGastosResult = {
  transactions: ParsedTransaction[]
  warnings: string[]
}

const RowSchema = z.object({
  timestamp: z.number(),
  amount: z.number().refine(n => n !== 0, { message: 'amount cannot be zero' }),
  category: z.string().min(1),
  description: z.unknown().optional(),
  group: z.unknown().optional(),
  prescindible: z.unknown().optional(),
})

// Excel serial date: days since 1900-01-01 (with Excel's 1900 leap year bug).
// Unix epoch (1970-01-01) = serial 25569.
function excelSerialToDate(serial: number): Date {
  return new Date(Math.round((serial - 25569) * 86400 * 1000))
}

function parsePrescindible(value: unknown): boolean {
  if (value == null) return false
  if (typeof value === 'boolean') return value
  const s = String(value).toLowerCase().trim()
  return ['sí', 'si', 'yes', '1', 'true'].includes(s)
}

function parseOptionalString(value: unknown): string | null {
  if (value == null) return null
  const s = String(value).trim()
  return s.length > 0 ? s : null
}

export function parseGastosWorkbook(buffer: Buffer): ParseGastosResult {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const sheetName = 'Respuestas de formulario 1'
  const ws = wb.Sheets[sheetName]
  if (!ws) throw new Error(`Sheet "${sheetName}" not found`)

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })
  const transactions: ParsedTransaction[] = []
  const warnings: string[] = []

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (!Array.isArray(row) || row[0] == null || row[1] == null || row[2] == null) continue

    const parsed = RowSchema.safeParse({
      timestamp: row[0],
      amount: row[1],
      category: row[2],
      description: row[3],
      group: row[4],
      prescindible: row[5],
    })

    if (!parsed.success) {
      warnings.push(`Row ${i + 1}: ${parsed.error.issues.map(e => e.message).join(', ')}`)
      continue
    }

    transactions.push({
      amount: parsed.data.amount,
      paidAt: excelSerialToDate(parsed.data.timestamp),
      categoryName: parsed.data.category.trim(),
      groupName: parseOptionalString(parsed.data.group),
      description: parseOptionalString(parsed.data.description),
      prescindible: parsePrescindible(parsed.data.prescindible),
    })
  }

  return { transactions, warnings }
}

// ─── Desglose parser ──────────────────────────────────────────────────────────

export type ParsedBudget = {
  month: Date
  plannedAmount: number
}

export type ParseDesgloseResult = {
  budgets: ParsedBudget[]
  warnings: string[]
}

const MONTH_INDEX: Record<string, number> = {
  Enero: 0, Febrero: 1, Marzo: 2, Abril: 3, Mayo: 4, Junio: 5,
  Julio: 6, Agosto: 7, Septiembre: 8, Octubre: 9, Noviembre: 10, Diciembre: 11,
}

// First month in the Desglose sheet is November 2024
const DESGLOSE_START_YEAR = 2024

export function parseDesgloseSheet(buffer: Buffer): ParseDesgloseResult {
  const wb = XLSX.read(buffer, { type: 'buffer' })
  const ws = wb.Sheets['Desglose']
  if (!ws) throw new Error('Sheet "Desglose" not found')

  const rows = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1 })
  const budgets: ParsedBudget[] = []
  const warnings: string[] = []

  let currentYear = DESGLOSE_START_YEAR
  let prevMonthIndex: number | null = null

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i] as unknown[]
    if (!row || typeof row[0] !== 'string' || !(row[0] in MONTH_INDEX)) continue

    const monthIndex = MONTH_INDEX[row[0] as string]

    if (prevMonthIndex !== null && monthIndex <= prevMonthIndex) currentYear++
    prevMonthIndex = monthIndex

    // Expected gasto is at col 14 of the data row (1-4 rows below the header row)
    let plannedAmount: number | null = null
    for (let j = i + 1; j < Math.min(i + 5, rows.length); j++) {
      const val = (rows[j] as unknown[])?.[14]
      if (typeof val === 'number' && val > 0) { plannedAmount = val; break }
    }

    if (plannedAmount == null) {
      warnings.push(`${row[0]} ${currentYear}: sin valor de expectativa`)
      continue
    }

    budgets.push({ month: new Date(Date.UTC(currentYear, monthIndex, 1)), plannedAmount })
  }

  return { budgets, warnings }
}
