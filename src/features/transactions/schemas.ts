import { z } from 'zod'

export const CreateTransactionSchema = z.object({
  amount: z.number().positive(),
  paidAt: z.string().datetime(),
  categoryId: z.string().uuid().nullable().optional(),
  groupId: z.string().uuid().nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  prescindible: z.boolean().default(false),
})

export type CreateTransactionInput = z.infer<typeof CreateTransactionSchema>

export const MonthFilterSchema = z.object({
  year: z.number().int().min(2020),
  month: z.number().int().min(1).max(12),
})

export const UpdateTransactionSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
  paidAt: z.string().datetime(),
  categoryId: z.string().uuid().nullable().optional(),
  groupId: z.string().uuid().nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  prescindible: z.boolean().default(false),
})

export type UpdateTransactionInput = z.infer<typeof UpdateTransactionSchema>
