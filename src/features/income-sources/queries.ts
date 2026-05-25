import { db } from '@/lib/db'
import { incomeSources } from '@/db/schema'
import { isNull, asc } from 'drizzle-orm'

export type IncomeSourceRow = {
  id: string
  name: string
  color: string
  sortOrder: number
}

export async function listIncomeSources(): Promise<IncomeSourceRow[]> {
  return db
    .select({
      id: incomeSources.id,
      name: incomeSources.name,
      color: incomeSources.color,
      sortOrder: incomeSources.sortOrder,
    })
    .from(incomeSources)
    .where(isNull(incomeSources.archivedAt))
    .orderBy(asc(incomeSources.sortOrder))
}
