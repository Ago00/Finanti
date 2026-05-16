import { db } from '@/lib/db'
import { accounts, monthlySnapshots } from '@/db/schema'
import { eq, isNull, desc, and } from 'drizzle-orm'
import {
  calculateGain,
  calculateGainPercentage,
  calculateMonthlyChange,
  calculateMonthlyChangePercentage,
  calculateTotalGain,
  calculateTotalGainPercentage,
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
  totalGain: number
  totalGainPercentage: number
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
