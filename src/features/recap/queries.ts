import { db } from '@/lib/db'
import { accounts, incomeSources, categories, assetClasses, monthlySnapshots } from '@/db/schema'
import { isNull, asc, lt, eq, desc } from 'drizzle-orm'

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
  const [allAccounts, allIncomeSources, allCategories, allAssetClasses, priorSnapshots] =
    await Promise.all([
      db
        .select({ id: accounts.id, name: accounts.name, gainMode: accounts.gainMode, color: accounts.color, sortOrder: accounts.sortOrder })
        .from(accounts)
        .where(isNull(accounts.archivedAt))
        .orderBy(asc(accounts.sortOrder)),
      db
        .select({ id: incomeSources.id, name: incomeSources.name, color: incomeSources.color })
        .from(incomeSources)
        .where(isNull(incomeSources.archivedAt))
        .orderBy(asc(incomeSources.sortOrder)),
      db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(isNull(categories.archivedAt))
        .orderBy(asc(categories.name)),
      db
        .select({ id: assetClasses.id, name: assetClasses.name })
        .from(assetClasses)
        .where(isNull(assetClasses.archivedAt))
        .orderBy(asc(assetClasses.name)),
      db
        .select({ accountId: monthlySnapshots.accountId, closingBalance: monthlySnapshots.closingBalance })
        .from(monthlySnapshots)
        .where(lt(monthlySnapshots.month, month))
        .orderBy(desc(monthlySnapshots.month)),
    ])

  const latestPriorByAccount = new Map<string, number>()
  for (const snap of priorSnapshots) {
    if (!latestPriorByAccount.has(snap.accountId)) {
      latestPriorByAccount.set(snap.accountId, Number(snap.closingBalance))
    }
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
