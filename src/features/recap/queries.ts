import { db } from '@/lib/db'
import { accounts, incomeSources, categories, assetClasses, monthlySnapshots } from '@/db/schema'
import { isNull, asc, lt, eq, sql } from 'drizzle-orm'

export type RecapAccountPrefill = {
  id: string
  name: string
  gainMode: 'auto' | 'manual' | 'projects'
  color: string
  sortOrder: number
  previousClosingBalance: number
}

export type RecapIncomeSourcePrefill = {
  id: string
  name: string
  color: string
}

export type RecapCategoryPrefill = {
  id: string
  name: string
}

export type RecapAssetClassPrefill = {
  id: string
  name: string
}

export type RecapPrefillData = {
  accounts: RecapAccountPrefill[]
  incomeSources: RecapIncomeSourcePrefill[]
  categories: RecapCategoryPrefill[]
  assetClasses: RecapAssetClassPrefill[]
}

export type ExistingSnapshots = {
  accountId: string
  openingBalance: number
  closingBalance: number
  contributions: number
  gainManual: number | null
}[]

export async function getRecapPrefill(month: Date): Promise<RecapPrefillData> {
  // Sequential execution to avoid PgBouncer transaction-mode connection exhaustion
  const allAccounts = await db
    .select({ id: accounts.id, name: accounts.name, gainMode: accounts.gainMode, color: accounts.color, sortOrder: accounts.sortOrder })
    .from(accounts)
    .where(isNull(accounts.archivedAt))
    .orderBy(asc(accounts.sortOrder))

  const allIncomeSources = await db
    .select({ id: incomeSources.id, name: incomeSources.name, color: incomeSources.color })
    .from(incomeSources)
    .where(isNull(incomeSources.archivedAt))
    .orderBy(asc(incomeSources.sortOrder))

  const allCategories = await db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(isNull(categories.archivedAt))
    .orderBy(asc(categories.name))

  const allAssetClasses = await db
    .select({ id: assetClasses.id, name: assetClasses.name })
    .from(assetClasses)
    .where(isNull(assetClasses.archivedAt))
    .orderBy(asc(assetClasses.name))

  // Use DISTINCT ON to fetch only the most recent snapshot per account before the given month,
  // avoiding loading all historical snapshots into memory.
  const priorSnapshots = await db.execute<{ account_id: string; closing_balance: string }>(
    sql`SELECT DISTINCT ON (account_id) account_id, closing_balance FROM monthly_snapshots WHERE month < ${month} ORDER BY account_id, month DESC`
  )

  const latestPriorByAccount = new Map<string, number>()
  for (const snap of priorSnapshots) {
    latestPriorByAccount.set(snap.account_id, Number(snap.closing_balance))
  }

  return {
    accounts: allAccounts.map(acc => ({
      id: acc.id,
      name: acc.name,
      gainMode: acc.gainMode,
      color: acc.color,
      sortOrder: acc.sortOrder,
      previousClosingBalance: latestPriorByAccount.get(acc.id) ?? 0,
    })),
    incomeSources: allIncomeSources.map(src => ({
      id: src.id,
      name: src.name,
      color: src.color,
    })),
    categories: allCategories.map(cat => ({
      id: cat.id,
      name: cat.name,
    })),
    assetClasses: allAssetClasses.map(ac => ({
      id: ac.id,
      name: ac.name,
    })),
  }
}

export async function getExistingSnapshotsForMonth(month: Date): Promise<ExistingSnapshots> {
  const rows = await db
    .select({
      accountId: monthlySnapshots.accountId,
      openingBalance: monthlySnapshots.openingBalance,
      closingBalance: monthlySnapshots.closingBalance,
      contributions: monthlySnapshots.contributions,
      gainManual: monthlySnapshots.gainManual,
    })
    .from(monthlySnapshots)
    .where(eq(monthlySnapshots.month, month))

  return rows.map(row => ({
    accountId: row.accountId,
    openingBalance: Number(row.openingBalance),
    closingBalance: Number(row.closingBalance),
    contributions: Number(row.contributions),
    gainManual: row.gainManual != null ? Number(row.gainManual) : null,
  }))
}
