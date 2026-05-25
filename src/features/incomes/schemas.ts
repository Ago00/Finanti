import { z } from 'zod'

export const UpdateIncomeSchema = z.object({
  id: z.string().uuid(),
  amount: z.number().positive(),
  receivedAt: z.string().datetime(),
  incomeSourceId: z.string().uuid().nullable().optional(),
  description: z.string().max(300).nullable().optional(),
})
export type UpdateIncomeInput = z.infer<typeof UpdateIncomeSchema>
