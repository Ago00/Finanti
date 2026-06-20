import { db } from '@/lib/db'
import {
  budgets,
  categories,
  assetClasses,
  transactions,
  incomes,
  investmentExecutions,
  monthlyBudgetMeta,
} from '@/db/schema'
import { eq, and, gte, lt, isNull, sum, isNotNull } from 'drizzle-orm'

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
  budgetId: string
}

export type MonthlyBudgetRaw = {
  totalIncome: number
  lines: BudgetRawLine[]
}

export type InvestmentExecutionRow = {
  id: string
  budgetId: string | null
  assetClassId: string | null
  assetClassName: string | null
  amount: number
  executedAt: Date
  description: string | null
}

export type MonthlyBudgetMetaRow = {
  id: string
  month: Date
  plannedExpenses: number | null
}

// ─── Main budget query ────────────────────────────────────────────────────────

export async function getMonthlyBudgetData(monthDate: Date): Promise<MonthlyBudgetRaw> {
  const monthStart = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1))

  // Sequential execution to avoid PgBouncer transaction-mode connection exhaustion
  const incomeRows = await db
    .select({ total: sum(incomes.amount) })
    .from(incomes)
    .where(and(gte(incomes.budgetMonth, monthStart), lt(incomes.budgetMonth, monthEnd)))

  const budgetRows = await db
    .select({
      id: budgets.id,
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
    .where(and(gte(budgets.month, monthStart), lt(budgets.month, monthEnd)))

  const txRows = await db
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
    .groupBy(transactions.categoryId)

  // Investment actual amount now comes from investment_executions, not snapshots
  const execRows = await db
    .select({
      budgetId: investmentExecutions.budgetId,
      total: sum(investmentExecutions.amount),
    })
    .from(investmentExecutions)
    .where(
      and(
        gte(investmentExecutions.month, monthStart),
        lt(investmentExecutions.month, monthEnd),
        isNull(investmentExecutions.archivedAt),
      ),
    )
    .groupBy(investmentExecutions.budgetId)

  const totalIncome = Number(incomeRows[0]?.total ?? 0)

  const actualByCategory = new Map(
    txRows
      .filter(r => r.categoryId != null)
      .map(r => [r.categoryId!, Number(r.total ?? 0)]),
  )

  const actualByBudgetId = new Map(
    execRows
      .filter(r => r.budgetId != null)
      .map(r => [r.budgetId!, Number(r.total ?? 0)]),
  )

  const lines: BudgetRawLine[] = budgetRows.map(row => {
    const isGasto = row.categoryId != null
    const actual = isGasto
      ? (actualByCategory.get(row.categoryId!) ?? 0)
      : (actualByBudgetId.get(row.id) ?? 0)

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
      budgetId: row.id,
    }
  })

  return { totalIncome, lines }
}

// ─── Investment executions ────────────────────────────────────────────────────

export async function getInvestmentExecutions(month: Date): Promise<InvestmentExecutionRow[]> {
  const monthStart = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))

  const rows = await db
    .select({
      id: investmentExecutions.id,
      budgetId: investmentExecutions.budgetId,
      assetClassId: investmentExecutions.assetClassId,
      assetClassName: assetClasses.name,
      amount: investmentExecutions.amount,
      executedAt: investmentExecutions.executedAt,
      description: investmentExecutions.description,
    })
    .from(investmentExecutions)
    .leftJoin(assetClasses, eq(investmentExecutions.assetClassId, assetClasses.id))
    .where(
      and(
        gte(investmentExecutions.month, monthStart),
        lt(investmentExecutions.month, monthEnd),
        isNull(investmentExecutions.archivedAt),
      ),
    )

  return rows.map(r => ({
    id: r.id,
    budgetId: r.budgetId ?? null,
    assetClassId: r.assetClassId ?? null,
    assetClassName: r.assetClassName ?? null,
    amount: Number(r.amount),
    executedAt: r.executedAt,
    description: r.description ?? null,
  }))
}

export async function getInvestmentExecutionsTotalForMonth(month: Date): Promise<number> {
  const monthStart = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 1))

  const rows = await db
    .select({ total: sum(investmentExecutions.amount) })
    .from(investmentExecutions)
    .where(
      and(
        gte(investmentExecutions.month, monthStart),
        lt(investmentExecutions.month, monthEnd),
        isNull(investmentExecutions.archivedAt),
      ),
    )

  return Number(rows[0]?.total ?? 0)
}

// ─── Monthly budget meta ──────────────────────────────────────────────────────

export async function getMonthlyBudgetMeta(month: Date): Promise<MonthlyBudgetMetaRow | null> {
  const monthStart = new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth(), 1))

  const rows = await db
    .select({
      id: monthlyBudgetMeta.id,
      month: monthlyBudgetMeta.month,
      plannedExpenses: monthlyBudgetMeta.plannedExpenses,
    })
    .from(monthlyBudgetMeta)
    .where(eq(monthlyBudgetMeta.month, monthStart))

  if (rows.length === 0) return null
  const row = rows[0]
  return {
    id: row.id,
    month: row.month,
    plannedExpenses: row.plannedExpenses != null ? Number(row.plannedExpenses) : null,
  }
}

// ─── Income of previous month (for budget form savings preview) ───────────────

// Returns the total income for the month immediately preceding the given monthDate.
// Used by the budget planning form to show the reference income as read-only.
export async function getIncomeForPreviousMonth(monthDate: Date): Promise<number> {
  const prevMonthStart = new Date(Date.UTC(
    monthDate.getUTCMonth() === 0 ? monthDate.getUTCFullYear() - 1 : monthDate.getUTCFullYear(),
    monthDate.getUTCMonth() === 0 ? 11 : monthDate.getUTCMonth() - 1,
    1,
  ))
  const prevMonthEnd = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1))

  const rows = await db
    .select({ total: sum(incomes.amount) })
    .from(incomes)
    .where(
      and(
        gte(incomes.budgetMonth, prevMonthStart),
        lt(incomes.budgetMonth, prevMonthEnd),
        isNull(incomes.archivedAt),
      ),
    )

  return Number(rows[0]?.total ?? 0)
}

// ─── Planned investment lines for a month ────────────────────────────────────

export type PlannedInvestmentLine = {
  budgetId: string
  assetClassId: string
  assetClassName: string
  plannedAmount: number
}

// Returns budget lines that correspond to investment planning (asset_class_id is set)
// for the given month, with the asset class name resolved via JOIN.
export async function getPlannedInvestmentLines(monthDate: Date): Promise<PlannedInvestmentLine[]> {
  const monthStart = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1))
  const monthEnd = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 1))

  const rows = await db
    .select({
      id: budgets.id,
      assetClassId: budgets.assetClassId,
      assetClassName: assetClasses.name,
      plannedAmount: budgets.plannedAmount,
    })
    .from(budgets)
    .innerJoin(assetClasses, eq(budgets.assetClassId, assetClasses.id))
    .where(
      and(
        gte(budgets.month, monthStart),
        lt(budgets.month, monthEnd),
        isNotNull(budgets.assetClassId),
      ),
    )

  return rows.map(r => ({
    budgetId: r.id,
    assetClassId: r.assetClassId!,
    assetClassName: r.assetClassName,
    plannedAmount: Number(r.plannedAmount),
  }))
}
