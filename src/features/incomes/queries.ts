import { db } from '@/lib/db'
import { incomes, incomeSources } from '@/db/schema'
import { eq, and, gte, lt, isNull, desc } from 'drizzle-orm'

export type IncomeRow = {
  id: string
  amount: number
  receivedAt: Date
  budgetMonth: Date
  incomeSourceId: string | null
  sourceName: string
  sourceColor: string
  description: string | null
}

export async function listIncomesByBudgetMonth(year: number, month: number): Promise<IncomeRow[]> {
  const monthStart = new Date(Date.UTC(year, month - 1, 1))
  const monthEnd   = new Date(Date.UTC(year, month, 1))

  return db
    .select({
      id: incomes.id,
      amount: incomes.amount,
      receivedAt: incomes.receivedAt,
      budgetMonth: incomes.budgetMonth,
      incomeSourceId: incomes.incomeSourceId,
      sourceName: incomeSources.name,
      sourceColor: incomeSources.color,
      description: incomes.description,
    })
    .from(incomes)
    .leftJoin(incomeSources, eq(incomes.incomeSourceId, incomeSources.id))
    .where(and(
      gte(incomes.budgetMonth, monthStart),
      lt(incomes.budgetMonth, monthEnd),
      isNull(incomes.archivedAt),
    ))
    .orderBy(desc(incomes.receivedAt))
    .then(rows => rows.map(r => ({
      id: r.id,
      amount: Number(r.amount),
      receivedAt: r.receivedAt,
      budgetMonth: r.budgetMonth,
      incomeSourceId: r.incomeSourceId ?? null,
      sourceName: r.sourceName ?? 'Sin fuente',
      sourceColor: r.sourceColor ?? '#94A3B8',
      description: r.description ?? null,
    })))
}
