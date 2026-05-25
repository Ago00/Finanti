import { db } from '@/lib/db'
import { assetClasses } from '@/db/schema'
import { isNull, asc } from 'drizzle-orm'

export type AssetClassRow = {
  id: string
  name: string
  color: string
}

export async function listAssetClasses(): Promise<AssetClassRow[]> {
  return db
    .select({
      id: assetClasses.id,
      name: assetClasses.name,
      color: assetClasses.color,
    })
    .from(assetClasses)
    .where(isNull(assetClasses.archivedAt))
    .orderBy(asc(assetClasses.name))
}
