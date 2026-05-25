/**
 * Reconciles Civislend monthly_snapshots against the real platform extract.
 * Ground truth: civislend.xlsx — only "Fondos añadidos/retirados" = contributions,
 * only "Intereses / Intereses de demora" = gain. Inversiones/Devoluciones are
 * internal platform movements and do NOT affect total account balance.
 *
 * Run: pnpm tsx scripts/fix-civislend.ts
 */

import { config } from 'dotenv'
import path from 'path'
config({ path: path.resolve(process.cwd(), '.env.local') })

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and, isNull } from 'drizzle-orm'
import { accounts, monthlySnapshots } from '../src/db/schema'

const client = postgres(process.env.DATABASE_URL!, { ssl: 'require' })
const db = drizzle(client)

// Ground truth derived exclusively from civislend.xlsx extract
// Each entry: [year, monthIndex (0-based), opening, closing, contributions, gain]
const CIVISLEND_TRUTH: Array<{
  year: number
  month: number // 0-based (Jan=0)
  opening: number
  closing: number
  contributions: number
  gain: number
}> = [
  // Jan 2024: deposited 750
  { year: 2024, month: 0, opening: 0, closing: 750.00, contributions: 750.00, gain: 0 },
  // Feb 2024: deposited 250 (first 250 to complete 1000 investment in Panorama)
  { year: 2024, month: 1, opening: 750.00, closing: 1000.00, contributions: 250.00, gain: 0 },
  // Mar-Aug 2024: no cash movements (money locked in project)
  { year: 2024, month: 2, opening: 1000.00, closing: 1000.00, contributions: 0, gain: 0 },
  { year: 2024, month: 3, opening: 1000.00, closing: 1000.00, contributions: 0, gain: 0 },
  { year: 2024, month: 4, opening: 1000.00, closing: 1000.00, contributions: 0, gain: 0 },
  { year: 2024, month: 5, opening: 1000.00, closing: 1000.00, contributions: 0, gain: 0 },
  { year: 2024, month: 6, opening: 1000.00, closing: 1000.00, contributions: 0, gain: 0 },
  { year: 2024, month: 7, opening: 1000.00, closing: 1000.00, contributions: 0, gain: 0 },
  // Sep 2024: 52.65 interest from Panorama Fuerteventura
  { year: 2024, month: 8, opening: 1000.00, closing: 1052.65, contributions: 0, gain: 52.65 },
  // Oct 2024: no movements
  { year: 2024, month: 9, opening: 1052.65, closing: 1052.65, contributions: 0, gain: 0 },
  // Nov 2024: deposited 600
  { year: 2024, month: 10, opening: 1052.65, closing: 1652.65, contributions: 600.00, gain: 0 },
  // Dec 2024: deposited 600
  { year: 2024, month: 11, opening: 1652.65, closing: 2252.65, contributions: 600.00, gain: 0 },
  // Jan 2025: deposited 600
  { year: 2025, month: 0, opening: 2252.65, closing: 2852.65, contributions: 600.00, gain: 0 },
  // Feb 2025: deposited 600
  { year: 2025, month: 1, opening: 2852.65, closing: 3452.65, contributions: 600.00, gain: 0 },
  // Mar 2025: deposited 600 + 52.65 interest from Panorama
  { year: 2025, month: 2, opening: 3452.65, closing: 4105.30, contributions: 600.00, gain: 52.65 },
  // Apr 2025: deposited 800
  { year: 2025, month: 3, opening: 4105.30, closing: 4905.30, contributions: 800.00, gain: 0 },
  // May-Aug 2025: no movements
  { year: 2025, month: 4, opening: 4905.30, closing: 4905.30, contributions: 0, gain: 0 },
  { year: 2025, month: 5, opening: 4905.30, closing: 4905.30, contributions: 0, gain: 0 },
  { year: 2025, month: 6, opening: 4905.30, closing: 4905.30, contributions: 0, gain: 0 },
  { year: 2025, month: 7, opening: 4905.30, closing: 4905.30, contributions: 0, gain: 0 },
  // Sep 2025: 52.65 interest from Panorama
  { year: 2025, month: 8, opening: 4905.30, closing: 4957.95, contributions: 0, gain: 52.65 },
  // Oct 2025: deposited 400
  { year: 2025, month: 9, opening: 4957.95, closing: 5357.95, contributions: 400.00, gain: 0 },
  // Nov 2025: no movements
  { year: 2025, month: 10, opening: 5357.95, closing: 5357.95, contributions: 0, gain: 0 },
  // Dec 2025: 30.12 interest from Panorama
  { year: 2025, month: 11, opening: 5357.95, closing: 5388.07, contributions: 0, gain: 30.12 },
  // Jan 2026: withdrew 1031.07
  { year: 2026, month: 0, opening: 5388.07, closing: 4357.00, contributions: -1031.07, gain: 0 },
  // Feb 2026: 130.10 interest (AZZ + Kota x3 + Villa Puerto de Andratx + demora)
  { year: 2026, month: 1, opening: 4357.00, closing: 4487.10, contributions: 0, gain: 130.10 },
  // Mar 2026: withdrew 703.66+1174.33=1877.99, gained 9.73+3.75+12.43=25.91 interest
  { year: 2026, month: 2, opening: 4487.10, closing: 2635.02, contributions: -1877.99, gain: 25.91 },
  // Apr 2026: gained 80.42+85.67=166.09 interest, withdrew 182.01+1419.09=1601.10
  { year: 2026, month: 3, opening: 2635.02, closing: 1200.01, contributions: -1601.10, gain: 166.09 },
]

function toMonthDate(year: number, monthIndex: number): Date {
  return new Date(Date.UTC(year, monthIndex, 1))
}

async function main() {
  // Get Civislend account ID
  const [acc] = await db
    .select({ id: accounts.id })
    .from(accounts)
    .where(and(eq(accounts.name, 'Civislend'), isNull(accounts.archivedAt)))
    .limit(1)

  if (!acc) {
    console.error('Civislend account not found in DB')
    process.exit(1)
  }

  const accountId = acc.id
  console.log('Civislend account ID:', accountId)

  // Fetch existing snapshots
  const existing = await db
    .select()
    .from(monthlySnapshots)
    .where(and(eq(monthlySnapshots.accountId, accountId), isNull(monthlySnapshots.archivedAt)))

  const existingByKey = new Map(
    existing.map(s => {
      const d = new Date(s.month)
      return [`${d.getUTCFullYear()}-${d.getUTCMonth()}`, s]
    })
  )

  console.log(`\nDB has ${existing.length} Civislend snapshots`)
  console.log(`Truth table has ${CIVISLEND_TRUTH.length} months\n`)

  let updated = 0
  let inserted = 0
  let unchanged = 0

  for (const t of CIVISLEND_TRUTH) {
    const key = `${t.year}-${t.month}`
    const monthDate = toMonthDate(t.year, t.month)
    const label = `${t.year}-${String(t.month + 1).padStart(2, '0')}`

    const existing_snap = existingByKey.get(key)

    if (existing_snap) {
      const dbOpening = Number(existing_snap.openingBalance)
      const dbClosing = Number(existing_snap.closingBalance)
      const dbContrib = Number(existing_snap.contributions)
      const dbGain = dbClosing - dbOpening - dbContrib

      const needsUpdate =
        Math.abs(dbOpening - t.opening) > 0.005 ||
        Math.abs(dbClosing - t.closing) > 0.005 ||
        Math.abs(dbContrib - t.contributions) > 0.005

      if (needsUpdate) {
        console.log(`UPDATE ${label}: open ${dbOpening}→${t.opening}, close ${dbClosing}→${t.closing}, contrib ${dbContrib}→${t.contributions}, gain ${dbGain.toFixed(2)}→${t.gain}`)
        await db
          .update(monthlySnapshots)
          .set({
            openingBalance: String(t.opening),
            closingBalance: String(t.closing),
            contributions: String(t.contributions),
            updatedAt: new Date(),
          })
          .where(and(
            eq(monthlySnapshots.accountId, accountId),
            eq(monthlySnapshots.month, monthDate),
          ))
        updated++
      } else {
        console.log(`OK     ${label}: open=${t.opening}, close=${t.closing}, contrib=${t.contributions}, gain=${t.gain}`)
        unchanged++
      }
    } else {
      console.log(`INSERT ${label}: open=${t.opening}, close=${t.closing}, contrib=${t.contributions}, gain=${t.gain}`)
      await db.insert(monthlySnapshots).values({
        accountId,
        month: monthDate,
        openingBalance: String(t.opening),
        closingBalance: String(t.closing),
        contributions: String(t.contributions),
        gainManual: null,
      })
      inserted++
    }
  }

  console.log(`\nDone: ${updated} updated, ${inserted} inserted, ${unchanged} unchanged`)

  // Verify total gain
  const totalGain = CIVISLEND_TRUTH.reduce((sum, t) => sum + t.gain, 0)
  console.log(`\nTotal gain from truth: ${totalGain.toFixed(2)}€`)
  console.log('Expected from extract: 510.17€ (481.89 intereses + 28.28 demora)')
}

main().catch(console.error).finally(() => client.end())
