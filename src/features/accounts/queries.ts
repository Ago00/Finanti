import { db } from '@/lib/db'
import { accounts, monthlySnapshots } from '@/db/schema'
import { eq, isNull, desc, and } from 'drizzle-orm'
import {
  calculateGain,
  calculateGainPercentage,
  calculateMonthlyChange,
  calculateMonthlyChangePercentage,
} from './domain'

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
  latestSnapshot: AccountSnapshot | null
  monthlyChange: number | null
  monthlyChangePercentage: number | null
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
    .select()
    .from(accounts)
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
    const latest = snaps[0] ? toSnapshot(snaps[0], acc.gainMode) : null
    const previous = snaps[1] ? toSnapshot(snaps[1], acc.gainMode) : null

    return {
      id: acc.id,
      name: acc.name,
      gainMode: acc.gainMode,
      color: acc.color,
      icon: acc.icon,
      sortOrder: acc.sortOrder,
      latestSnapshot: latest,
      monthlyChange: latest && previous
        ? calculateMonthlyChange(previous.closingBalance, latest.closingBalance)
        : null,
      monthlyChangePercentage: latest && previous
        ? calculateMonthlyChangePercentage(previous.closingBalance, latest.closingBalance)
        : null,
    }
  })
}

export async function getAccountWithHistory(accountId: string) {
  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.id, accountId), isNull(accounts.archivedAt)))
    .limit(1)

  if (!account) return null

  const snaps = await db
    .select()
    .from(monthlySnapshots)
    .where(and(eq(monthlySnapshots.accountId, accountId), isNull(monthlySnapshots.archivedAt)))
    .orderBy(desc(monthlySnapshots.month))

  const snapshots = snaps.map(raw => toSnapshot(raw, account.gainMode))

  return { account, snapshots }
}
