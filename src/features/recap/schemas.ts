import { z } from 'zod'

export const RecapAccountInputSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  gainMode: z.enum(['auto', 'manual', 'projects']),
  openingBalance: z.number(),
  contributions: z.number(),
  closingBalance: z.number().min(0),
  gainManual: z.number().nullable().optional(),
})

export const RecapIncomeInputSchema = z.object({
  incomeSourceId: z.string().uuid(),
  amount: z.number().positive(),
  receivedAt: z.string().min(1),
  budgetMonth: z.string().min(1),
  toAccountId: z.string().uuid().nullish().transform(v => v ?? null),
})

export const RecapMovementInputSchema = z.object({
  fromAccountId: z.string().uuid(),
  toAccountId: z.string().uuid(),
  amount: z.number().positive(),
  description: z.string().max(200).nullable().optional(),
}).refine(d => d.fromAccountId !== d.toAccountId, {
  message: 'La cuenta de origen y destino no pueden ser la misma',
})

export const RecapBudgetInputSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  assetClassId: z.string().uuid().nullable().optional(),
  plannedAmount: z.number().positive(),
}).refine(d => d.categoryId || d.assetClassId, {
  message: 'Se requiere categoría o clase de activo',
})

export const RecapPayloadSchema = z.object({
  month: z.string().datetime(),
  accounts: z.array(RecapAccountInputSchema).min(1),
  incomes: z.array(RecapIncomeInputSchema),
  movements: z.array(RecapMovementInputSchema),
  budgets: z.array(RecapBudgetInputSchema),
})

export type RecapPayloadInput = z.infer<typeof RecapPayloadSchema>
