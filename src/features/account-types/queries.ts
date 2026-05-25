import { db } from '@/lib/db'
import { accountTypes } from '@/db/schema'
import { isNull, asc } from 'drizzle-orm'

export type AccountTypeRow = {
  id: string
  name: string
  color: string
}

export async function listAccountTypes(): Promise<AccountTypeRow[]> {
  return db
    .select({
      id: accountTypes.id,
      name: accountTypes.name,
      color: accountTypes.color,
    })
    .from(accountTypes)
    .where(isNull(accountTypes.archivedAt))
    .orderBy(asc(accountTypes.name))
}
