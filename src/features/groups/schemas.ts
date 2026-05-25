import { z } from 'zod'

export const CreateGroupSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#06B6D4'),
  sortOrder: z.number().int().default(0),
})

export const UpdateGroupSchema = CreateGroupSchema.partial().extend({
  id: z.string().uuid(),
})

export type CreateGroupInput = z.infer<typeof CreateGroupSchema>
export type UpdateGroupInput = z.infer<typeof UpdateGroupSchema>
