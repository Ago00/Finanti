import { db } from '@/lib/db'
import { accounts, accountTypes, monthlySnapshots, transactions } from '@/db/schema'
import { eq, isNull, desc, and, asc } from 'drizzle-orm'
import {
  calculateGain,
  calculateGainPercentage,
  calculateMonthlyChange,
  calculateMonthlyChangePercentage,
  calculateTotalGain,
  calculateTotalGainPercentage,
} from './domain'

export type SnapshotByMonth = {
  month: string // 'YYYY-MM'
  accountId: string
  accountName: string
  color: string
  closingBalance: number
}

export type AccountTypeRow = { id: string; name: string; color: string }

export type AccountSnapshot = {
  month: Date
  openingBalance: number
  closingBalance: number
  contributions: number
  gainManual: number | null
  gain: number
  gainPercentage: number
}

export type AccountWithBalance = {
  id: string
  name: string
  gainMode: 'auto' | 'manual' | 'projects'
  color: string
  icon: string
  sortOrder: number
  accountTypeId: string | null
  accountTypeName: string | null
  assetClassId: string | null
  latestSnapshot: AccountSnapshot | null
  monthlyChange: number | null
  monthlyChangePercentage: number | null
  totalGain: number
  totalGainPercentage: number
}

export async function listAccountTypes(): Promise<AccountTypeRow[]> {
  return db
    .select({ id: accountTypes.id, name: accountTypes.name, color: accountTypes.color })
    .from(accountTypes)
    .where(isNull(accountTypes.archivedAt))
    .orderBy(asc(accountTypes.name))
}

function toSnapshot(
  raw: typeof monthlySnapshots.$inferSelect,
  gainMode: 'auto' | 'manual' | 'projects'
): AccountSnapshot {
  const opening = Number(raw.openingBalance)
  const closing = Number(raw.closingBalance)
  const contributions = Number(raw.contributions)
  const manualGain = raw.gainManual != null ? Number(raw.gainManual) : null
  const gain = calculateGain({ openingBalance: opening, closingBalance: closing, contributions, gainMode, manualGain })
  return {
    month: raw.month,
    openingBalance: opening,
    closingBalance: closing,
    contributions,
    gainManual: manualGain,
    gain,
    gainPercentage: calculateGainPercentage(gain, opening),
  }
}

export async function listAccounts(): Promise<AccountWithBalance[]> {
  const allAccounts = await db
    .select({
      id: accounts.id,
      name: accounts.name,
      gainMode: accounts.gainMode,
      color: accounts.color,
      icon: accounts.icon,
      sortOrder: accounts.sortOrder,
      accountTypeId: accounts.accountTypeId,
      accountTypeName: accountTypes.name,
      assetClassId: accounts.assetClassId,
    })
    .from(accounts)
    .leftJoin(accountTypes, eq(accounts.accountTypeId, accountTypes.id))
    .where(isNull(accounts.archivedAt))
    .orderBy(accounts.sortOrder)

  // Sorted globally desc; in-memory grouping preserves order so snaps[0]/[1] are the two most-recent per account.
  const allSnapshots = await db
    .select()
    .from(monthlySnapshots)
    .where(isNull(monthlySnapshots.archivedAt))
    .orderBy(desc(monthlySnapshots.month))

  const snapshotsByAccount = new Map<string, (typeof allSnapshots)[number][]>()
  for (const snap of allSnapshots) {
    const list = snapshotsByAccount.get(snap.accountId) ?? []
    list.push(snap)
    snapshotsByAccount.set(snap.accountId, list)
  }

  return allAccounts.map(acc => {
    const snaps = snapshotsByAccount.get(acc.id) ?? []
    const parsed = snaps.map(raw => toSnapshot(raw, acc.gainMode))
    // snaps is desc by month; parsed[0] = latest, parsed[last] = oldest
    const latest = parsed[0] ?? null
    const previous = parsed[1] ?? null
    const oldest = parsed[parsed.length - 1] ?? null

    const totalGain = calculateTotalGain(parsed)
    const totalContributions = parsed.reduce((sum, s) => sum + s.contributions, 0)
    const totalGainPercentage = calculateTotalGainPercentage(
      totalGain,
      oldest?.openingBalance ?? 0,
      totalContributions,
    )

    return {
      id: acc.id,
      name: acc.name,
      gainMode: acc.gainMode,
      color: acc.color,
      icon: acc.icon,
      sortOrder: acc.sortOrder,
      accountTypeId: acc.accountTypeId ?? null,
      accountTypeName: acc.accountTypeName ?? null,
      assetClassId: acc.assetClassId ?? null,
      latestSnapshot: latest,
      monthlyChange: latest && previous
        ? calculateMonthlyChange(previous.closingBalance, latest.closingBalance)
        : null,
      monthlyChangePercentage: latest && previous
        ? calculateMonthlyChangePercentage(previous.closingBalance, latest.closingBalance)
        : null,
      totalGain,
      totalGainPercentage,
    }
  })
}

export async function listAllSnapshotsByMonth(): Promise<SnapshotByMonth[]> {
  function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`
  }

  const rows = await db
    .select({
      month: monthlySnapshots.month,
      accountId: monthlySnapshots.accountId,
      accountName: accounts.name,
      color: accounts.color,
      closingBalance: monthlySnapshots.closingBalance,
    })
    .from(monthlySnapshots)
    .innerJoin(accounts, eq(monthlySnapshots.accountId, accounts.id))
    .where(and(isNull(monthlySnapshots.archivedAt), isNull(accounts.archivedAt)))
    .orderBy(asc(monthlySnapshots.month))

  return rows.map(row => ({
    month: row.month.getUTCFullYear() + '-' + pad(row.month.getUTCMonth() + 1),
    accountId: row.accountId,
    accountName: row.accountName,
    color: row.color,
    closingBalance: Number(row.closingBalance),
  }))
}

export type AccountMonthlyHistory = {
  accountId: string
  month: string // 'YYYY-MM'
  closingBalance: number
  contributions: number
}

// Per-account monthly history (oldest month first), used to build the inline
// detail of each account in the patrimonio breakdown.
export async function listAccountMonthlyHistory(): Promise<AccountMonthlyHistory[]> {
  function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`
  }

  const rows = await db
    .select({
      accountId: monthlySnapshots.accountId,
      month: monthlySnapshots.month,
      closingBalance: monthlySnapshots.closingBalance,
      contributions: monthlySnapshots.contributions,
    })
    .from(monthlySnapshots)
    .where(isNull(monthlySnapshots.archivedAt))
    .orderBy(asc(monthlySnapshots.month))

  return rows.map(row => ({
    accountId: row.accountId,
    month: row.month.getUTCFullYear() + '-' + pad(row.month.getUTCMonth() + 1),
    closingBalance: Number(row.closingBalance),
    contributions: Number(row.contributions),
  }))
}

export type ExpenseByAccountMonth = {
  accountId: string
  month: string // 'YYYY-MM'
  expense: number
}

// Total expense per account and calendar month, derived from transactions tied
// to an account. Accounts without transactions simply don't appear here, so the
// caller must default their expense to 0.
export type ActiveAccountOption = { id: string; name: string }

export async function getActiveAccountOptions(): Promise<ActiveAccountOption[]> {
  return db
    .select({ id: accounts.id, name: accounts.name })
    .from(accounts)
    .where(isNull(accounts.archivedAt))
    .orderBy(asc(accounts.sortOrder))
}

export async function listExpensesByAccountMonth(): Promise<ExpenseByAccountMonth[]> {
  function pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`
  }

  const rows = await db
    .select({
      accountId: transactions.accountId,
      paidAt: transactions.paidAt,
      amount: transactions.amount,
    })
    .from(transactions)
    .where(isNull(transactions.archivedAt))

  const totals = new Map<string, number>()
  for (const row of rows) {
    if (row.accountId === null) continue
    const month = row.paidAt.getUTCFullYear() + '-' + pad(row.paidAt.getUTCMonth() + 1)
    const key = `${row.accountId}|${month}`
    totals.set(key, (totals.get(key) ?? 0) + Number(row.amount))
  }

  return Array.from(totals.entries()).map(([key, expense]) => {
    const [accountId, month] = key.split('|')
    return { accountId, month, expense }
  })
}
