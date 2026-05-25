import { db } from '@/lib/db'
import { categories } from '@/db/schema'
import { isNull, asc } from 'drizzle-orm'

export type CategoryRow = {
  id: string
  name: string
  color: string
  icon: string
  sortOrder: number
}

export async function listCategories(): Promise<CategoryRow[]> {
  return db
    .select({
      id: categories.id,
      name: categories.name,
      color: categories.color,
      icon: categories.icon,
      sortOrder: categories.sortOrder,
    })
    .from(categories)
    .where(isNull(categories.archivedAt))
    .orderBy(asc(categories.sortOrder))
}
