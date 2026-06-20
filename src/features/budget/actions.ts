'use server'

import { db } from '@/lib/db'
import { budgets, investmentExecutions, monthlyBudgetMeta } from '@/db/schema'
import { and, eq, inArray, isNotNull, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { toBudgetMonth } from '@/lib/dates'
import { UpdateBudgetLineSchema, ConfirmInvestmentSchema, AddUnplannedInvestmentSchema, SetMonthlyBudgetSchema } from './schemas'

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

// Marks a planned investment budget line as executed by inserting a record
// in investment_executions with the given amount (which may differ from the
// planned amount if the user edited it before confirming).
export async function confirmInvestment(rawInput: unknown): Promise<void> {
  await requireAuth()
  const { budgetId, amount, month, assetClassId } = ConfirmInvestmentSchema.parse(rawInput)

  await db.insert(investmentExecutions).values({
    month: toBudgetMonth(new Date(month)),
    assetClassId: assetClassId ?? null,
    budgetId,
    amount: String(amount),
    executedAt: new Date(),
  })

  revalidatePath('/presupuesto')
  revalidatePath('/dashboard')
}

// Records an investment that was not in the budget plan for the month.
// budget_id is null because there is no corresponding budget line.
export async function addUnplannedInvestment(rawInput: unknown): Promise<void> {
  await requireAuth()
  const { month, assetClassId, amount, description } = AddUnplannedInvestmentSchema.parse(rawInput)

  await db.insert(investmentExecutions).values({
    month: toBudgetMonth(new Date(month)),
    assetClassId: assetClassId ?? null,
    budgetId: null,
    amount: String(amount),
    executedAt: new Date(),
    description: description ?? null,
  })

  revalidatePath('/presupuesto')
  revalidatePath('/dashboard')
}

// Saves the monthly budget plan: planned expenses + investment lines.
// Investment lines stored in `budgets` (with asset_class_id) are replaced atomically
// so that the plan always reflects the current state of the form.
// Category-based budget lines (category_id set) are not touched.
export async function setMonthlyBudget(rawInput: unknown): Promise<void> {
  await requireAuth()
  const { month, plannedExpenses, investmentLines } = SetMonthlyBudgetSchema.parse(rawInput)
  const monthDate = toBudgetMonth(new Date(month))

  await db.transaction(async (tx) => {
    // Upsert planned_expenses in monthly_budget_meta
    await tx
      .insert(monthlyBudgetMeta)
      .values({
        month: monthDate,
        plannedExpenses: String(plannedExpenses),
      })
      .onConflictDoUpdate({
        target: monthlyBudgetMeta.month,
        set: {
          plannedExpenses: String(plannedExpenses),
          updatedAt: new Date(),
        },
      })

    // Replace investment lines (asset_class_id rows) for this month.
    // Category lines (category_id rows) are left untouched.
    // Delete executions linked to budget rows being removed, then delete the rows.
    const budgetRowsToDelete = await tx
      .select({ id: budgets.id })
      .from(budgets)
      .where(and(eq(budgets.month, monthDate), isNotNull(budgets.assetClassId)))
    if (budgetRowsToDelete.length > 0) {
      await tx
        .delete(investmentExecutions)
        .where(inArray(investmentExecutions.budgetId, budgetRowsToDelete.map(r => r.id)))
    }
    // Also remove unplanned executions for this month so the panel stays clean.
    await tx
      .delete(investmentExecutions)
      .where(and(eq(investmentExecutions.month, monthDate), isNull(investmentExecutions.budgetId)))
    await tx
      .delete(budgets)
      .where(and(eq(budgets.month, monthDate), isNotNull(budgets.assetClassId)))

    if (investmentLines.length > 0) {
      await tx.insert(budgets).values(
        investmentLines.map(line => ({
          month: monthDate,
          categoryId: null,
          assetClassId: line.assetClassId,
          plannedAmount: String(line.amount),
        })),
      )
    }
  })

  revalidatePath('/presupuesto')
  revalidatePath('/dashboard')
}
