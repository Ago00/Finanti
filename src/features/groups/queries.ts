import { db } from '@/lib/db'
import { groups } from '@/db/schema'
import { isNull, asc } from 'drizzle-orm'

export type GroupRow = {
  id: string
  name: string
  color: string
  sortOrder: number
}

export async function listGroups(): Promise<GroupRow[]> {
  return db
    .select({
      id: groups.id,
      name: groups.name,
      color: groups.color,
      sortOrder: groups.sortOrder,
    })
    .from(groups)
    .where(isNull(groups.archivedAt))
    .orderBy(asc(groups.sortOrder))
}
