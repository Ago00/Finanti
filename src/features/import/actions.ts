'use server'

import { db } from '@/lib/db'
import {
  accounts,
  categories,
  groups,
  transactions,
  incomes,
  incomeSources,
  monthlySnapshots,
} from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { parseGastosWorkbook } from './parsers/gastos'
import { parseSuperchicWorkbook } from './parsers/superchic'
import { createClient } from '@/lib/supabase/server'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

export type ImportResult = {
  inserted: number
  skipped: number
  warnings: string[]
}

export async function importGastos(formData: FormData): Promise<ImportResult> {
  await requireAuth()

  const file = formData.get('file') as File
  if (!file) throw new Error('No se recibió ningún archivo')

  const buffer = Buffer.from(await file.arrayBuffer())
  const { transactions: rows, warnings } = parseGastosWorkbook(buffer)

  let inserted = 0
  let skipped = 0

  for (const row of rows) {
    // Upsert category
    let categoryId: string | null = null
    const existingCategory = await db
      .select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.name, row.categoryName), isNull(categories.archivedAt)))
      .limit(1)

    if (existingCategory.length > 0) {
      categoryId = existingCategory[0].id
    } else {
      const [newCategory] = await db.insert(categories).values({ name: row.categoryName }).returning({ id: categories.id })
      categoryId = newCategory.id
    }

    // Upsert group if present
    let groupId: string | null = null
    if (row.groupName) {
      const existingGroup = await db
        .select({ id: groups.id })
        .from(groups)
        .where(and(eq(groups.name, row.groupName), isNull(groups.archivedAt)))
        .limit(1)

      if (existingGroup.length > 0) {
        groupId = existingGroup[0].id
      } else {
        const [newGroup] = await db.insert(groups).values({ name: row.groupName }).returning({ id: groups.id })
        groupId = newGroup.id
      }
    }

    // Idempotency check: deduplicate by (paidAt + amount + description)
    const existing = await db
      .select({ id: transactions.id })
      .from(transactions)
      .where(
        and(
          eq(transactions.paidAt, row.paidAt),
          eq(transactions.amount, String(row.amount)),
          row.description ? eq(transactions.description, row.description) : isNull(transactions.description)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      skipped++
      continue
    }

    await db.insert(transactions).values({
      amount: String(row.amount),
      paidAt: row.paidAt,
      categoryId,
      groupId,
      description: row.description,
      prescindible: row.prescindible,
    })
    inserted++
  }

  return { inserted, skipped, warnings }
}

export async function importSuperchic(formData: FormData): Promise<ImportResult> {
  await requireAuth()

  const file = formData.get('file') as File
  if (!file) throw new Error('No se recibió ningún archivo')

  const buffer = Buffer.from(await file.arrayBuffer())
  const { accounts: parsedAccounts, snapshots, incomes: parsedIncomes, warnings } = parseSuperchicWorkbook(buffer)

  let inserted = 0
  let skipped = 0

  // Upsert accounts
  const accountIdByName = new Map<string, string>()
  for (const acc of parsedAccounts) {
    const existing = await db
      .select({ id: accounts.id })
      .from(accounts)
      .where(and(eq(accounts.name, acc.name), isNull(accounts.archivedAt)))
      .limit(1)

    if (existing.length > 0) {
      accountIdByName.set(acc.name, existing[0].id)
    } else {
      const [created] = await db
        .insert(accounts)
        .values({ name: acc.name, gainMode: acc.gainMode, sortOrder: acc.sortOrder })
        .returning({ id: accounts.id })
      accountIdByName.set(acc.name, created.id)
    }
  }

  // Upsert snapshots
  for (const snap of snapshots) {
    const accountId = accountIdByName.get(snap.accountName)
    if (!accountId) {
      warnings.push(`Cuenta desconocida: ${snap.accountName}`)
      continue
    }

    const existing = await db
      .select({ id: monthlySnapshots.id })
      .from(monthlySnapshots)
      .where(and(eq(monthlySnapshots.accountId, accountId), eq(monthlySnapshots.month, snap.month)))
      .limit(1)

    if (existing.length > 0) {
      skipped++
      continue
    }

    await db.insert(monthlySnapshots).values({
      accountId,
      month: snap.month,
      openingBalance: String(snap.openingBalance),
      closingBalance: String(snap.closingBalance),
      contributions: String(snap.contributions),
      gainManual: snap.gainManual != null ? String(snap.gainManual) : null,
    })
    inserted++
  }

  // Upsert income sources and incomes
  const sourceIdByName = new Map<string, string>()
  for (const inc of parsedIncomes) {
    let sourceId = sourceIdByName.get(inc.sourceNameRaw)
    if (!sourceId) {
      const existing = await db
        .select({ id: incomeSources.id })
        .from(incomeSources)
        .where(and(eq(incomeSources.name, inc.sourceNameRaw), isNull(incomeSources.archivedAt)))
        .limit(1)

      if (existing.length > 0) {
        sourceId = existing[0].id
      } else {
        const [created] = await db
          .insert(incomeSources)
          .values({ name: inc.sourceNameRaw, sortOrder: sourceIdByName.size })
          .returning({ id: incomeSources.id })
        sourceId = created.id
      }
      sourceIdByName.set(inc.sourceNameRaw, sourceId)
    }

    // Idempotency: deduplicate by (receivedAt + amount + sourceId)
    const existing = await db
      .select({ id: incomes.id })
      .from(incomes)
      .where(
        and(
          eq(incomes.receivedAt, inc.receivedAt),
          eq(incomes.amount, String(inc.amount)),
          eq(incomes.incomeSourceId, sourceId)
        )
      )
      .limit(1)

    if (existing.length > 0) {
      skipped++
      continue
    }

    await db.insert(incomes).values({
      amount: String(inc.amount),
      receivedAt: inc.receivedAt,
      budgetMonth: inc.budgetMonth,
      incomeSourceId: sourceId,
      description: inc.description,
    })
    inserted++
  }

  return { inserted, skipped, warnings }
}
