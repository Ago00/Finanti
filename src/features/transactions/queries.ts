import { db } from '@/lib/db'
import { transactions, categories, groups, budgets } from '@/db/schema'
import { and, gte, lt, isNull, desc, eq, sum, sql } from 'drizzle-orm'

export type TransactionWithRefs = {
  id: string
  amount: number
  paidAt: Date
  categoryId: string | null
  categoryName: string | null
  groupId: string | null
  groupName: string | null
  description: string | null
  prescindible: boolean
}

export async function listTransactionsByMonth(
  year: number,
  month: number,
): Promise<TransactionWithRefs[]> {
  const from = new Date(Date.UTC(year, month - 1, 1))
  const to = new Date(Date.UTC(year, month, 1))

  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      paidAt: transactions.paidAt,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      groupId: transactions.groupId,
      groupName: groups.name,
      description: transactions.description,
      prescindible: transactions.prescindible,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(groups, eq(transactions.groupId, groups.id))
    .where(and(gte(transactions.paidAt, from), lt(transactions.paidAt, to), isNull(transactions.archivedAt)))
    .orderBy(desc(transactions.paidAt))

  return rows.map(r => ({
    id: r.id,
    amount: Number(r.amount),
    paidAt: r.paidAt,
    categoryId: r.categoryId ?? null,
    categoryName: r.categoryName ?? null,
    groupId: r.groupId ?? null,
    groupName: r.groupName ?? null,
    description: r.description ?? null,
    prescindible: r.prescindible,
  }))
}

export async function listCategories(): Promise<{ id: string; name: string }[]> {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .where(isNull(categories.archivedAt))
    .orderBy(categories.name)
}

export async function listGroups(): Promise<{ id: string; name: string }[]> {
  return db
    .select({ id: groups.id, name: groups.name })
    .from(groups)
    .where(isNull(groups.archivedAt))
    .orderBy(groups.name)
}

export type CategoryTotal = {
  categoryId: string | null
  categoryName: string | null
  total: number
}

export async function listCategoryTotals(year: number, month: number): Promise<CategoryTotal[]> {
  const from = new Date(Date.UTC(year, month - 1, 1))
  const to = new Date(Date.UTC(year, month, 1))

  const rows = await db
    .select({
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      total: sum(transactions.amount),
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(gte(transactions.paidAt, from), lt(transactions.paidAt, to), isNull(transactions.archivedAt)))
    .groupBy(transactions.categoryId, categories.name)
    .orderBy(desc(sum(transactions.amount)))

  return rows.map(r => ({
    categoryId: r.categoryId ?? null,
    categoryName: r.categoryName ?? null,
    total: Number(r.total ?? 0),
  }))
}

export type MonthlyExpenseTotal = {
  month: string // 'YYYY-MM'
  total: number
}

export async function listMonthlyExpenseTotals(): Promise<MonthlyExpenseTotal[]> {
  const rows = await db
    .select({
      month: sql<string>`TO_CHAR(DATE_TRUNC('month', ${transactions.paidAt}), 'YYYY-MM')`,
      total: sum(transactions.amount),
    })
    .from(transactions)
    .where(isNull(transactions.archivedAt))
    .groupBy(sql`DATE_TRUNC('month', ${transactions.paidAt})`)
    .orderBy(sql`DATE_TRUNC('month', ${transactions.paidAt})`)

  return rows.map(r => ({
    month: r.month,
    total: Number(r.total ?? 0),
  }))
}

export async function getBudgetTotalForMonth(year: number, month: number): Promise<number> {
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const monthEnd = new Date(Date.UTC(year, month, 1))

  const result = await db
    .select({ total: sum(budgets.plannedAmount) })
    .from(budgets)
    .where(and(gte(budgets.month, monthStart), lt(budgets.month, monthEnd), isNull(budgets.archivedAt)))

  return Number(result[0]?.total ?? 0)
}

// Returns category totals for multiple months at once.
// Keyed by 'YYYY-MM' so callers can address each month independently.
export async function listCategoryTotalsByMonths(
  months: { year: number; month: number }[],
): Promise<Record<string, CategoryTotal[]>> {
  if (months.length === 0) return {}

  const result: Record<string, CategoryTotal[]> = {}
  // Sequential to avoid PgBouncer connection exhaustion
  for (const { year, month } of months) {
    const key = `${year}-${String(month).padStart(2, '0')}`
    result[key] = await listCategoryTotals(year, month)
  }
  return result
}

export async function listTransactionsByMonthFiltered(
  year: number,
  month: number,
  filters: { categoryId?: string; groupId?: string; prescindible?: boolean },
): Promise<TransactionWithRefs[]> {
  const from = new Date(Date.UTC(year, month - 1, 1))
  const to = new Date(Date.UTC(year, month, 1))

  const conditions = [
    gte(transactions.paidAt, from),
    lt(transactions.paidAt, to),
    isNull(transactions.archivedAt),
  ]
  if (filters.categoryId) conditions.push(eq(transactions.categoryId, filters.categoryId))
  if (filters.groupId) conditions.push(eq(transactions.groupId, filters.groupId))
  if (filters.prescindible === true) conditions.push(eq(transactions.prescindible, true))

  const rows = await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      paidAt: transactions.paidAt,
      categoryId: transactions.categoryId,
      categoryName: categories.name,
      groupId: transactions.groupId,
      groupName: groups.name,
      description: transactions.description,
      prescindible: transactions.prescindible,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(groups, eq(transactions.groupId, groups.id))
    .where(and(...conditions))
    .orderBy(desc(transactions.paidAt))

  return rows.map(r => ({
    id: r.id,
    amount: Number(r.amount),
    paidAt: r.paidAt,
    categoryId: r.categoryId ?? null,
    categoryName: r.categoryName ?? null,
    groupId: r.groupId ?? null,
    groupName: r.groupName ?? null,
    description: r.description ?? null,
    prescindible: r.prescindible,
  }))
}
