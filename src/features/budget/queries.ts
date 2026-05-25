import { db } from '@/lib/db'
import {
  budgets,
  categories,
  assetClasses,
  transactions,
  incomes,
  monthlySnapshots,
  accounts,
} from '@/db/schema'
import { eq, and, gte, lt, isNull, sum } from 'drizzle-orm'

// ─── Types ────────────────────────────────────────────────────────────────────

export type BudgetRawLine = {
  categoryId: string | null
  categoryName: string | null
  categoryColor: string | null
  assetClassId: string | null
  assetClassName: string | null
  assetClassColor: string | null
  plannedAmount: number
  actualAmount: number
  type: 'gasto' | 'inversion'
  month: string // ISO datetime string
}

export type MonthlyBudgetRaw = {
  totalIncome: number
  lines: BudgetRawLine[]
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getMonthlyBudgetData(monthDate: Date): Promise<MonthlyBudgetRaw> {
  const monthStart = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1))

  const [incomeRows, budgetRows, txRows, snapRows] = await Promise.all([
    // Query 1 — total income for the budget month
    db
      .select({ total: sum(incomes.amount) })
      .from(incomes)
      .where(and(gte(incomes.budgetMonth, monthStart), lt(incomes.budgetMonth, monthEnd))),

    // Query 2 — budget lines with category / assetClass labels
    db
      .select({
        categoryId: budgets.categoryId,
        categoryName: categories.name,
        categoryColor: categories.color,
        assetClassId: budgets.assetClassId,
        assetClassName: assetClasses.name,
        assetClassColor: assetClasses.color,
        plannedAmount: budgets.plannedAmount,
        month: budgets.month,
      })
      .from(budgets)
      .leftJoin(categories, eq(budgets.categoryId, categories.id))
      .leftJoin(assetClasses, eq(budgets.assetClassId, assetClasses.id))
      .where(and(gte(budgets.month, monthStart), lt(budgets.month, monthEnd))),

    // Query 3 — actual spending grouped by category
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

    // Query 4 — contributions grouped by assetClass
    db
      .select({
        assetClassId: accounts.assetClassId,
        totalContributions: sum(monthlySnapshots.contributions),
      })
      .from(monthlySnapshots)
      .innerJoin(accounts, eq(monthlySnapshots.accountId, accounts.id))
      .where(
        and(
          gte(monthlySnapshots.month, monthStart),
          lt(monthlySnapshots.month, monthEnd),
          isNull(monthlySnapshots.archivedAt),
          isNull(accounts.archivedAt),
        ),
      )
      .groupBy(accounts.assetClassId),
  ])

  const totalIncome = Number(incomeRows[0]?.total ?? 0)

  const actualByCategory = new Map(
    txRows
      .filter(r => r.categoryId != null)
      .map(r => [r.categoryId!, Number(r.total ?? 0)]),
  )

  const actualByAssetClass = new Map(
    snapRows
      .filter(r => r.assetClassId)
      .map(r => [r.assetClassId!, Number(r.totalContributions ?? 0)]),
  )

  const lines: BudgetRawLine[] = budgetRows.map(row => {
    const isGasto = row.categoryId != null
    const actual = isGasto
      ? (actualByCategory.get(row.categoryId!) ?? 0)
      : (actualByAssetClass.get(row.assetClassId!) ?? 0)

    return {
      categoryId: row.categoryId ?? null,
      categoryName: row.categoryName ?? null,
      categoryColor: row.categoryColor ?? null,
      assetClassId: row.assetClassId ?? null,
      assetClassName: row.assetClassName ?? null,
      assetClassColor: row.assetClassColor ?? null,
      plannedAmount: Number(row.plannedAmount),
      actualAmount: actual,
      type: isGasto ? 'gasto' : 'inversion',
      month: row.month.toISOString(),
    }
  })

  return { totalIncome, lines }
}
