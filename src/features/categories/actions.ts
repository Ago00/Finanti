'use server'

import { db } from '@/lib/db'
import { categories } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { CreateCategorySchema, UpdateCategorySchema } from './schemas'
import { normalizeColor } from './domain'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

export async function createCategory(input: unknown) {
  const data = CreateCategorySchema.parse(input)
  await requireAuth()
  await db.insert(categories).values({
    name: data.name,
    color: normalizeColor(data.color),
    icon: data.icon,
    sortOrder: data.sortOrder,
  })
  revalidatePath('/ajustes/categorias')
}

export async function updateCategory(input: unknown) {
  const { id, ...data } = UpdateCategorySchema.parse(input)
  await requireAuth()
  await db
    .update(categories)
    .set({ ...data, ...(data.color !== undefined ? { color: normalizeColor(data.color) } : {}), updatedAt: new Date() })
    .where(and(eq(categories.id, id), isNull(categories.archivedAt)))
  revalidatePath('/ajustes/categorias')
}

export async function archiveCategory(id: string) {
  const validId = z.string().uuid().parse(id)
  await requireAuth()
  await db
    .update(categories)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(categories.id, validId), isNull(categories.archivedAt)))
  revalidatePath('/ajustes/categorias')
}
