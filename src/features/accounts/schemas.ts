import { z } from 'zod'

export const CreateAccountSchema = z.object({
  name: z.string().min(1),
  gainMode: z.enum(['auto', 'manual', 'projects']),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366F1'),
  icon: z.string().default('wallet'),
  sortOrder: z.number().int().default(0),
  accountTypeId: z.string().uuid().nullable().optional(),
  assetClassId: z.string().uuid().nullable().optional(),
  parentAccountId: z.string().uuid().nullable().optional(),
})

export const UpdateAccountSchema = CreateAccountSchema.partial()
  .extend({ id: z.string().uuid() })
  .refine(obj => Object.keys(obj).length > 1, { message: 'At least one field to update required' })

export type CreateAccountInput = z.infer<typeof CreateAccountSchema>
export type UpdateAccountInput = z.infer<typeof UpdateAccountSchema>
