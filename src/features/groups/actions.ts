'use server'

import { db } from '@/lib/db'
import { groups } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { CreateGroupSchema, UpdateGroupSchema } from './schemas'
import { normalizeColor } from './domain'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

export async function createGroup(input: unknown) {
  const data = CreateGroupSchema.parse(input)
  await requireAuth()
  await db.insert(groups).values({
    name: data.name,
    color: normalizeColor(data.color),
    sortOrder: data.sortOrder,
  })
  revalidatePath('/ajustes/grupos')
}

export async function updateGroup(input: unknown) {
  const { id, ...data } = UpdateGroupSchema.parse(input)
  await requireAuth()
  await db
    .update(groups)
    .set({ ...data, ...(data.color !== undefined ? { color: normalizeColor(data.color) } : {}), updatedAt: new Date() })
    .where(and(eq(groups.id, id), isNull(groups.archivedAt)))
  revalidatePath('/ajustes/grupos')
}

export async function archiveGroup(id: string) {
  const validId = z.string().uuid().parse(id)
  await requireAuth()
  await db
    .update(groups)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(groups.id, validId), isNull(groups.archivedAt)))
  revalidatePath('/ajustes/grupos')
}
