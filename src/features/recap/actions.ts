'use server'

import { db } from '@/lib/db'
import { monthlySnapshots, incomes, accountMovements, budgets } from '@/db/schema'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { eq, and, gte, lt } from 'drizzle-orm'
import { RecapPayloadSchema } from './schemas'
import type { RecapPayloadInput } from './schemas'
import { validateRecapPayload } from './domain'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

export async function saveRecap(rawInput: unknown): Promise<void> {
  await requireAuth()
  const data = RecapPayloadSchema.parse(rawInput)
  validateRecapPayload(data)
  await persistRecap(data)
  revalidatePath('/patrimonio')
  revalidatePath('/recap')
  revalidatePath('/gastos')
}

async function persistRecap(data: RecapPayloadInput): Promise<void> {
  await db.transaction(async (tx) => {
    for (const acc of data.accounts) {
      await tx
        .delete(monthlySnapshots)
        .where(and(eq(monthlySnapshots.accountId, acc.id), eq(monthlySnapshots.month, new Date(data.month))))
      await tx.insert(monthlySnapshots).values({
        accountId: acc.id,
        month: new Date(data.month),
        openingBalance: String(acc.openingBalance),
        closingBalance: String(acc.closingBalance),
        contributions: String(acc.contributions),
        gainManual: acc.gainManual != null ? String(acc.gainManual) : null,
      })
    }

    const monthStart = new Date(data.month)
    const monthEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1))
    await tx.delete(incomes).where(and(gte(incomes.receivedAt, monthStart), lt(incomes.receivedAt, monthEnd)))
    await tx.delete(accountMovements).where(and(gte(accountMovements.occurredAt, monthStart), lt(accountMovements.occurredAt, monthEnd)))

    for (const inc of data.incomes) {
      await tx.insert(incomes).values({
        amount: String(inc.amount),
        receivedAt: new Date(inc.receivedAt),
        budgetMonth: new Date(inc.budgetMonth),
        incomeSourceId: inc.incomeSourceId,
        toAccountId: inc.toAccountId ?? null,
        description: null,
      })
    }

    for (const mv of data.movements) {
      await tx.insert(accountMovements).values({
        fromAccountId: mv.fromAccountId,
        toAccountId: mv.toAccountId,
        amount: String(mv.amount),
        occurredAt: new Date(data.month),
        description: mv.description ?? null,
      })
    }

    for (const bud of data.budgets) {
      if (bud.plannedAmount === 0) continue
      await tx
        .delete(budgets)
        .where(
          and(
            eq(budgets.month, new Date(data.month)),
            bud.categoryId
              ? eq(budgets.categoryId, bud.categoryId)
              : eq(budgets.assetClassId, bud.assetClassId!),
          ),
        )
      await tx.insert(budgets).values({
        month: new Date(data.month),
        categoryId: bud.categoryId ?? null,
        assetClassId: bud.assetClassId ?? null,
        plannedAmount: String(bud.plannedAmount),
      })
    }
  })
}
