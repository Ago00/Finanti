'use server'

import { db } from '@/lib/db'
import { transactions } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { CreateTransactionSchema, UpdateTransactionSchema } from './schemas'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

export async function createTransaction(input: unknown) {
  await requireAuth()
  const data = CreateTransactionSchema.parse(input)
  const [created] = await db
    .insert(transactions)
    .values({
      amount: String(data.amount),
      paidAt: new Date(data.paidAt),
      categoryId: data.categoryId ?? null,
      groupId: data.groupId ?? null,
      description: data.description ?? null,
      prescindible: data.prescindible,
    })
    .returning({ id: transactions.id })
  revalidatePath('/gastos')
  return created
}

export async function updateTransaction(input: unknown) {
  await requireAuth()
  const { id, ...data } = UpdateTransactionSchema.parse(input)
  await db
    .update(transactions)
    .set({
      amount: String(data.amount),
      paidAt: new Date(data.paidAt),
      categoryId: data.categoryId ?? null,
      groupId: data.groupId ?? null,
      description: data.description ?? null,
      prescindible: data.prescindible,
      updatedAt: new Date(),
    })
    .where(and(eq(transactions.id, id), isNull(transactions.archivedAt)))
  revalidatePath('/gastos')
}

export async function archiveTransaction(id: string) {
  await requireAuth()
  const validId = z.string().uuid().parse(id)
  await db
    .update(transactions)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(transactions.id, validId), isNull(transactions.archivedAt)))
  revalidatePath('/gastos')
}
