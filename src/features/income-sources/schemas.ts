import { z } from 'zod'

export const CreateIncomeSourceSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#10B981'),
  sortOrder: z.number().int().default(0),
})

export const UpdateIncomeSourceSchema = CreateIncomeSourceSchema.partial().extend({
  id: z.string().uuid(),
})

export type CreateIncomeSourceInput = z.infer<typeof CreateIncomeSourceSchema>
export type UpdateIncomeSourceInput = z.infer<typeof UpdateIncomeSourceSchema>
