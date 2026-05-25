'use server'

import { db } from '@/lib/db'
import { incomeSources } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { CreateIncomeSourceSchema, UpdateIncomeSourceSchema } from './schemas'
import type { CreateIncomeSourceInput, UpdateIncomeSourceInput } from './schemas'
import { validateIncomeSourceName, normalizeColor } from './domain'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

export async function createIncomeSource(input: CreateIncomeSourceInput) {
  const data = CreateIncomeSourceSchema.parse(input)
  validateIncomeSourceName(data.name)
  await requireAuth()

  const [created] = await db
    .insert(incomeSources)
    .values({
      name: data.name,
      color: normalizeColor(data.color),
      sortOrder: data.sortOrder,
    })
    .returning({ id: incomeSources.id })

  revalidatePath('/ajustes/fuentes-ingreso')
  revalidatePath('/recap')
  return created
}

export async function updateIncomeSource(input: UpdateIncomeSourceInput) {
  const { id, ...data } = UpdateIncomeSourceSchema.parse(input)
  if (data.name !== undefined) validateIncomeSourceName(data.name)
  await requireAuth()

  await db
    .update(incomeSources)
    .set({
      ...data,
      ...(data.color !== undefined ? { color: normalizeColor(data.color) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(incomeSources.id, id), isNull(incomeSources.archivedAt)))

  revalidatePath('/ajustes/fuentes-ingreso')
  revalidatePath('/recap')
}

export async function archiveIncomeSource(id: string) {
  const validId = z.string().uuid().parse(id)
  await requireAuth()

  await db
    .update(incomeSources)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(incomeSources.id, validId), isNull(incomeSources.archivedAt)))

  revalidatePath('/ajustes/fuentes-ingreso')
  revalidatePath('/recap')
}
