'use server'

import { db } from '@/lib/db'
import { assetClasses } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { CreateAssetClassSchema, UpdateAssetClassSchema } from './schemas'
import type { CreateAssetClassInput, UpdateAssetClassInput } from './schemas'
import { validateAssetClassName, normalizeColor } from './domain'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

export async function createAssetClass(input: CreateAssetClassInput) {
  const data = CreateAssetClassSchema.parse(input)
  validateAssetClassName(data.name)
  await requireAuth()

  const [created] = await db
    .insert(assetClasses)
    .values({
      name: data.name,
      color: normalizeColor(data.color),
    })
    .returning({ id: assetClasses.id })

  revalidatePath('/ajustes/clases-activo')
  revalidatePath('/recap')
  return created
}

export async function updateAssetClass(input: UpdateAssetClassInput) {
  const { id, ...data } = UpdateAssetClassSchema.parse(input)
  if (data.name !== undefined) validateAssetClassName(data.name)
  await requireAuth()

  await db
    .update(assetClasses)
    .set({
      ...data,
      ...(data.color !== undefined ? { color: normalizeColor(data.color) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(assetClasses.id, id), isNull(assetClasses.archivedAt)))

  revalidatePath('/ajustes/clases-activo')
  revalidatePath('/recap')
}

export async function archiveAssetClass(id: string) {
  const validId = z.string().uuid().parse(id)
  await requireAuth()

  await db
    .update(assetClasses)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(assetClasses.id, validId), isNull(assetClasses.archivedAt)))

  revalidatePath('/ajustes/clases-activo')
  revalidatePath('/recap')
}
