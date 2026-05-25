import { db } from '@/lib/db'
import { transactions, categories, groups, budgets } from '@/db/schema'
import { and, gte, lt, isNull, desc, eq, sum } from 'drizzle-orm'

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
      amount: transactions.amount,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(gte(transactions.paidAt, from), lt(transactions.paidAt, to), isNull(transactions.archivedAt)))

  const map = new Map<string | null, { categoryId: string | null; categoryName: string | null; total: number }>()

  for (const r of rows) {
    const key = r.categoryId ?? null
    const existing = map.get(key)
    const amount = Number(r.amount)
    if (existing) {
      existing.total += amount
    } else {
      map.set(key, { categoryId: key, categoryName: r.categoryName ?? null, total: amount })
    }
  }

  return Array.from(map.values()).sort((a, b) => b.total - a.total)
}

export type MonthlyExpenseTotal = {
  month: string // 'YYYY-MM'
  total: number
}

export async function listMonthlyExpenseTotals(): Promise<MonthlyExpenseTotal[]> {
  const rows = await db
    .select({
      paidAt: transactions.paidAt,
      amount: transactions.amount,
    })
    .from(transactions)
    .where(isNull(transactions.archivedAt))

  const map = new Map<string, number>()

  for (const r of rows) {
    const d = r.paidAt
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    map.set(key, (map.get(key) ?? 0) + Number(r.amount))
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({ month, total }))
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
