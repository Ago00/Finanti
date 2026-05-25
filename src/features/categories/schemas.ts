import { z } from 'zod'

export const CreateCategorySchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#6366F1'),
  icon: z.string().default('tag'),
  sortOrder: z.number().int().default(0),
})

export const UpdateCategorySchema = CreateCategorySchema.partial().extend({
  id: z.string().uuid(),
})

export type CreateCategoryInput = z.infer<typeof CreateCategorySchema>
export type UpdateCategoryInput = z.infer<typeof UpdateCategorySchema>
