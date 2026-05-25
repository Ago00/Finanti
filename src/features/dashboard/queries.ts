import { db } from '@/lib/db'
import { accounts, monthlySnapshots, transactions, incomes, budgets, categories, assetClasses } from '@/db/schema'
import { eq, and, gte, lt, isNull, isNotNull, desc, sum, sql } from 'drizzle-orm'

export type DashboardRaw = {
  activeAccounts: { id: string; name: string; color: string; assetClassId: string | null }[]
  recentSnapshots: { accountId: string; month: Date; openingBalance: number; closingBalance: number; contributions: number }[]
  monthlyTotals: { month: Date; total: number }[]
  incomeAdjustments: { accountId: string; month: Date; total: number }[]
  currentMonthExpenses: number
  currentMonthIncome: number
  currentMonthContributions: number
  contributionsByAssetClass: Record<string, number>
}

export async function getDashboardRaw(): Promise<DashboardRaw> {
  const now = new Date()
  const currentMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const currentMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

  const [
    activeAccountRows,
    recentSnapshotRows,
    monthlyTotalRows,
    incomeAdjRows,
    expensesRows,
    incomeRows,
  ] = await Promise.all([
    // Query 1: active accounts ordered by sortOrder
    db
      .select({ id: accounts.id, name: accounts.name, color: accounts.color, assetClassId: accounts.assetClassId })
      .from(accounts)
      .where(isNull(accounts.archivedAt))
      .orderBy(accounts.sortOrder),

    // Query 2: all non-archived snapshots, desc by month
    db
      .select({
        accountId: monthlySnapshots.accountId,
        month: monthlySnapshots.month,
        openingBalance: monthlySnapshots.openingBalance,
        closingBalance: monthlySnapshots.closingBalance,
        contributions: monthlySnapshots.contributions,
      })
      .from(monthlySnapshots)
      .innerJoin(accounts, eq(monthlySnapshots.accountId, accounts.id))
      .where(and(isNull(monthlySnapshots.archivedAt), isNull(accounts.archivedAt)))
      .orderBy(desc(monthlySnapshots.month)),

    // Query 3: sum of closingBalance grouped by month for evolution chart
    db
      .select({ month: monthlySnapshots.month, total: sum(monthlySnapshots.closingBalance) })
      .from(monthlySnapshots)
      .innerJoin(accounts, eq(monthlySnapshots.accountId, accounts.id))
      .where(and(isNull(monthlySnapshots.archivedAt), isNull(accounts.archivedAt)))
      .groupBy(monthlySnapshots.month)
      .orderBy(monthlySnapshots.month),

    // Query 4: income assigned to accounts — grouped by account + month
    db
      .select({
        accountId: incomes.toAccountId,
        month: incomes.budgetMonth,
        total: sum(incomes.amount),
      })
      .from(incomes)
      .where(and(isNull(incomes.archivedAt), isNotNull(incomes.toAccountId)))
      .groupBy(incomes.toAccountId, incomes.budgetMonth),

    // Query 5: expenses current month
    db
      .select({ total: sum(transactions.amount) })
      .from(transactions)
      .where(
        and(
          gte(transactions.paidAt, currentMonthStart),
          lt(transactions.paidAt, currentMonthEnd),
          isNull(transactions.archivedAt),
        ),
      ),

    // Query 6: income current month
    db
      .select({ total: sum(incomes.amount) })
      .from(incomes)
      .where(
        and(
          gte(incomes.budgetMonth, currentMonthStart),
          lt(incomes.budgetMonth, currentMonthEnd),
          isNull(incomes.archivedAt),
        ),
      ),
  ])

  const snapshots = recentSnapshotRows.map((row) => ({
    accountId: row.accountId,
    month: row.month,
    openingBalance: Number(row.openingBalance),
    closingBalance: Number(row.closingBalance),
    contributions: Number(row.contributions),
  }))

  const currentMonthSnapshots = snapshots.filter(s => s.month >= currentMonthStart && s.month < currentMonthEnd)
  const currentMonthContributions = currentMonthSnapshots.reduce((sum, s) => sum + s.contributions, 0)

  const assetClassByAccount = new Map(
    activeAccountRows.filter(a => a.assetClassId).map(a => [a.id, a.assetClassId!]),
  )
  const contributionsByAssetClass: Record<string, number> = {}
  for (const s of currentMonthSnapshots) {
    const acId = assetClassByAccount.get(s.accountId)
    if (acId) contributionsByAssetClass[acId] = (contributionsByAssetClass[acId] ?? 0) + s.contributions
  }

  return {
    activeAccounts: activeAccountRows,
    recentSnapshots: snapshots,
    monthlyTotals: monthlyTotalRows.map((row) => ({
      month: row.month,
      total: Number(row.total),
    })),
    incomeAdjustments: incomeAdjRows
      .filter(r => r.accountId != null)
      .map((row) => ({
        accountId: row.accountId!,
        month: row.month,
        total: Number(row.total ?? 0),
      })),
    currentMonthExpenses: Number(expensesRows[0]?.total ?? 0),
    currentMonthIncome: Number(incomeRows[0]?.total ?? 0),
    currentMonthContributions,
    contributionsByAssetClass,
  }
}

// ─── Dashboard budget lines ───────────────────────────────────────────────────

export type DashboardBudgetLine = {
  categoryId: string | null
  assetClassId: string | null
  plannedAmount: number
  actualAmount: number
  categoryName: string | null
  categoryColor: string | null
  assetClassName: string | null
  assetClassColor: string | null
}

export async function getDashboardBudgetLines(
  monthStart: Date,
  monthEnd: Date,
): Promise<DashboardBudgetLine[]> {
  const [budgetRows, txRows] = await Promise.all([
    db
      .select({
        categoryId: budgets.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        assetClassId: budgets.assetClassId,
        assetClassName: assetClasses.name,
        assetClassColor: assetClasses.color,
        plannedAmount: budgets.plannedAmount,
        actualAmountBudget: budgets.actualAmount,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .leftJoin(assetClasses, eq(budgets.assetClassId, assetClasses.id))
      .where(and(gte(budgets.month, monthStart), lt(budgets.month, monthEnd))),

    db
      .select({
        categoryId: transactions.categoryId,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(
        and(
          gte(transactions.paidAt, monthStart),
          lt(transactions.paidAt, monthEnd),
          isNull(transactions.archivedAt),
        ),
      )
      .groupBy(transactions.categoryId),
  ])

  const actualByCategory = new Map(
    txRows
      .filter(r => r.categoryId != null)
      .map(r => [r.categoryId!, Number(r.total ?? 0)]),
  )

  return budgetRows.map(row => ({
    categoryId: row.categoryId ?? null,
    assetClassId: row.assetClassId ?? null,
    plannedAmount: Number(row.plannedAmount),
    actualAmount: row.categoryId != null
      ? (actualByCategory.get(row.categoryId) ?? 0)
      : Number(row.actualAmountBudget ?? 0),
    categoryName: row.categoryName ?? null,
    categoryColor: row.categoryColor ?? null,
    assetClassName: row.assetClassName ?? null,
    assetClassColor: row.assetClassColor ?? null,
  }))
}

// ─── Monthly P&L (income / expenses / investment gain) ───────────────────────

import type { MonthlyPnlPoint } from '@/features/dashboard/domain'

export async function getMonthlyPnlData(): Promise<MonthlyPnlPoint[]> {
  const now = new Date()
  const currentMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1))

  const [incomeRows, expenseRows, gainRows] = await Promise.all([
    db
      .select({
        month: sql<string>`TO_CHAR(${incomes.budgetMonth}, 'YYYY-MM')`,
        total: sum(incomes.amount),
      })
      .from(incomes)
      .where(and(isNull(incomes.archivedAt), lt(incomes.budgetMonth, currentMonthEnd)))
      .groupBy(incomes.budgetMonth)
      .orderBy(incomes.budgetMonth),

    db
      .select({
        month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${transactions.paidAt}), 'YYYY-MM')`,
        total: sum(transactions.amount),
      })
      .from(transactions)
      .where(and(isNull(transactions.archivedAt), lt(transactions.paidAt, currentMonthEnd)))
      .groupBy(sql`DATE_TRUNC('month', ${transactions.paidAt})`)
      .orderBy(sql`DATE_TRUNC('month', ${transactions.paidAt})`),

    db
      .select({
        month: sql<string>`TO_CHAR(${monthlySnapshots.month}, 'YYYY-MM')`,
        gain: sql<string>`SUM(COALESCE(${monthlySnapshots.gainManual}, ${monthlySnapshots.closingBalance} - ${monthlySnapshots.openingBalance} - ${monthlySnapshots.contributions}))`,
      })
      .from(monthlySnapshots)
      .innerJoin(accounts, eq(monthlySnapshots.accountId, accounts.id))
      .where(and(isNull(accounts.archivedAt), isNull(monthlySnapshots.archivedAt), lt(monthlySnapshots.month, currentMonthEnd)))
      .groupBy(monthlySnapshots.month)
      .orderBy(monthlySnapshots.month),
  ])

  const byMonth = new Map<string, { income: number; expenses: number; invGain: number }>()
  const get = (k: string) => byMonth.get(k) ?? { income: 0, expenses: 0, invGain: 0 }

  for (const r of incomeRows) {
    const e = get(r.month); e.income = Number(r.total ?? 0); byMonth.set(r.month, e)
  }
  for (const r of expenseRows) {
    const e = get(r.month); e.expenses = Number(r.total ?? 0); byMonth.set(r.month, e)
  }
  for (const r of gainRows) {
    const e = get(r.month); e.invGain = Number(r.gain ?? 0); byMonth.set(r.month, e)
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, d]) => ({ month, ...d }))
}
