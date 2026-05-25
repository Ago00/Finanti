'use server'

import { db } from '@/lib/db'
import { budgets } from '@/db/schema'
import { and, eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { UpdateBudgetLineSchema } from './schemas'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

export async function updateBudgetLine(rawInput: unknown): Promise<void> {
  await requireAuth()
  const data = UpdateBudgetLineSchema.parse(rawInput)
  const monthDate = new Date(data.month)

  await db.transaction(async (tx) => {
    await tx
      .delete(budgets)
      .where(
        and(
          eq(budgets.month, monthDate),
          data.categoryId
            ? eq(budgets.categoryId, data.categoryId)
            : eq(budgets.assetClassId, data.assetClassId!),
        ),
      )
    await tx.insert(budgets).values({
      month: monthDate,
      categoryId: data.categoryId ?? null,
      assetClassId: data.assetClassId ?? null,
      plannedAmount: String(data.plannedAmount),
    })
  })

  revalidatePath('/presupuesto')
  revalidatePath('/dashboard')
}
