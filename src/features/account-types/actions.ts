'use server'

import { db } from '@/lib/db'
import { accountTypes } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { CreateAccountTypeSchema, UpdateAccountTypeSchema } from './schemas'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

function normalizeColor(c: string): string {
  if (/^#[0-9A-Fa-f]{6}$/.test(c)) return c.toUpperCase()
  return '#6366F1'
}

export async function createAccountType(input: unknown) {
  const data = CreateAccountTypeSchema.parse(input)
  await requireAuth()
  await db.insert(accountTypes).values({
    name: data.name,
    color: normalizeColor(data.color),
  })
  revalidatePath('/ajustes/tipos-cuenta')
}

export async function updateAccountType(input: unknown) {
  const { id, ...data } = UpdateAccountTypeSchema.parse(input)
  await requireAuth()
  await db
    .update(accountTypes)
    .set({
      ...data,
      ...(data.color !== undefined ? { color: normalizeColor(data.color) } : {}),
      updatedAt: new Date(),
    })
    .where(and(eq(accountTypes.id, id), isNull(accountTypes.archivedAt)))
  revalidatePath('/ajustes/tipos-cuenta')
}

export async function archiveAccountType(id: string) {
  const validId = z.string().uuid().parse(id)
  await requireAuth()
  await db
    .update(accountTypes)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(accountTypes.id, validId), isNull(accountTypes.archivedAt)))
  revalidatePath('/ajustes/tipos-cuenta')
}
