'use server'

import { db } from '@/lib/db'
import { incomes } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { UpdateIncomeSchema, CreateIncomeSchema } from './schemas'
import { toBudgetMonth } from '@/lib/dates'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

// Creates a new income entry. budget_month is derived automatically from
// received_at: the income belongs to the month it was received in.
export async function createIncome(rawInput: unknown): Promise<void> {
  await requireAuth()
  const data = CreateIncomeSchema.parse(rawInput)
  const receivedAt = new Date(data.receivedAt)
  const budgetMonth = toBudgetMonth(receivedAt)

  await db.insert(incomes).values({
    amount: String(data.amount),
    receivedAt,
    budgetMonth,
    incomeSourceId: data.incomeSourceId ?? null,
    toAccountId: data.toAccountId ?? null,
    description: data.description ?? null,
  })

  revalidatePath('/ingresos')
  revalidatePath('/dashboard')
}

export async function updateIncome(input: unknown) {
  await requireAuth()
  const { id, ...data } = UpdateIncomeSchema.parse(input)
  const receivedAt = new Date(data.receivedAt)
  const budgetMonth = toBudgetMonth(receivedAt)

  await db
    .update(incomes)
    .set({
      amount: String(data.amount),
      receivedAt,
      budgetMonth,
      incomeSourceId: data.incomeSourceId ?? null,
      description: data.description ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(incomes.id, id), isNull(incomes.archivedAt)))
  revalidatePath('/ingresos')
  revalidatePath('/dashboard')
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
