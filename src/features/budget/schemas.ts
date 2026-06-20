import { z } from 'zod'

export const UpdateBudgetLineSchema = z.object({
  month: z.string().datetime(),
  categoryId: z.string().uuid().nullable().optional(),
  assetClassId: z.string().uuid().nullable().optional(),
  plannedAmount: z.number().positive(),
})

export type UpdateBudgetLineInput = z.infer<typeof UpdateBudgetLineSchema>

export const ConfirmInvestmentSchema = z.object({
  budgetId: z.string().uuid(),
  amount: z.number().positive(),
  month: z.string().datetime(),
  assetClassId: z.string().uuid().nullable().optional(),
})

export type ConfirmInvestmentInput = z.infer<typeof ConfirmInvestmentSchema>

export const AddUnplannedInvestmentSchema = z.object({
  month: z.string().datetime(),
  assetClassId: z.string().uuid().nullable().optional(),
  amount: z.number().positive(),
  description: z.string().max(300).nullable().optional(),
})

export type AddUnplannedInvestmentInput = z.infer<typeof AddUnplannedInvestmentSchema>

export const SetMonthlyBudgetSchema = z.object({
  month: z.string().datetime(),
  plannedExpenses: z.number().min(0),
  investmentLines: z.array(
    z.object({
      assetClassId: z.string().uuid(),
      amount: z.number().positive(),
    }),
  ),
})

export type SetMonthlyBudgetInput = z.infer<typeof SetMonthlyBudgetSchema>
