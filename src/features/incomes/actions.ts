'use server'

import { db } from '@/lib/db'
import { incomes } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { UpdateIncomeSchema } from './schemas'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

export async function updateIncome(input: unknown) {
  await requireAuth()
  const { id, ...data } = UpdateIncomeSchema.parse(input)
  await db
    .update(incomes)
    .set({
      amount: String(data.amount),
      receivedAt: new Date(data.receivedAt),
      incomeSourceId: data.incomeSourceId ?? null,
      description: data.description ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(incomes.id, id), isNull(incomes.archivedAt)))
  revalidatePath('/ingresos')
}

export async function archiveIncome(id: string) {
  await requireAuth()
  const validId = z.string().uuid().parse(id)
  await db
    .update(incomes)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(incomes.id, validId), isNull(incomes.archivedAt)))
  revalidatePath('/ingresos')
}
