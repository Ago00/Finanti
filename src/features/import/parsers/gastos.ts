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
