import { z } from 'zod'

export const CreateAssetClassSchema = z.object({
  name: z.string().min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).default('#10B981'),
})

export const UpdateAssetClassSchema = CreateAssetClassSchema.partial().extend({
  id: z.string().uuid(),
})

export type CreateAssetClassInput = z.infer<typeof CreateAssetClassSchema>
export type UpdateAssetClassInput = z.infer<typeof UpdateAssetClassSchema>
