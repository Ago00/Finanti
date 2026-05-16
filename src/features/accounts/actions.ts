'use server'

import { db } from '@/lib/db'
import { accounts } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { CreateAccountSchema, UpdateAccountSchema } from './schemas'
import type { CreateAccountInput, UpdateAccountInput } from './schemas'

async function requireAuth() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autorizado')
  return user
}

export async function createAccount(input: CreateAccountInput) {
  const data = CreateAccountSchema.parse(input)
  await requireAuth()

  const [created] = await db
    .insert(accounts)
    .values({
      name: data.name,
      gainMode: data.gainMode,
      color: data.color,
      icon: data.icon,
      sortOrder: data.sortOrder,
      accountTypeId: data.accountTypeId ?? null,
      assetClassId: data.assetClassId ?? null,
      parentAccountId: data.parentAccountId ?? null,
    })
    .returning({ id: accounts.id })

  revalidatePath('/patrimonio')
  revalidatePath('/ajustes/cuentas')
  return created
}

export async function updateAccount(input: UpdateAccountInput) {
  const { id, ...data } = UpdateAccountSchema.parse(input)
  await requireAuth()

  await db
    .update(accounts)
    .set({
      ...data,
      accountTypeId: data.accountTypeId ?? null,
      assetClassId: data.assetClassId ?? null,
      parentAccountId: data.parentAccountId ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(accounts.id, id), isNull(accounts.archivedAt)))

  revalidatePath('/patrimonio')
  revalidatePath('/ajustes/cuentas')
}

export async function archiveAccount(id: string) {
  const validId = z.string().uuid().parse(id)
  await requireAuth()

  await db
    .update(accounts)
    .set({ archivedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(accounts.id, validId), isNull(accounts.archivedAt)))

  revalidatePath('/patrimonio')
  revalidatePath('/ajustes/cuentas')
}
