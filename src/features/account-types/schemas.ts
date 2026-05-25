import { z } from 'zod'

export const CreateAccountTypeSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366F1'),
})

export const UpdateAccountTypeSchema = CreateAccountTypeSchema.partial().extend({
  id: z.string().uuid(),
})

export type CreateAccountTypeInput = z.infer<typeof CreateAccountTypeSchema>
export type UpdateAccountTypeInput = z.infer<typeof UpdateAccountTypeSchema>
