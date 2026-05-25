import { z } from 'zod'

export const UpdateBudgetLineSchema = z.object({
  month: z.string().datetime(),
  categoryId: z.string().uuid().nullable().optional(),
  assetClassId: z.string().uuid().nullable().optional(),
  plannedAmount: z.number().positive(),
})

export type UpdateBudgetLineInput = z.infer<typeof UpdateBudgetLineSchema>
