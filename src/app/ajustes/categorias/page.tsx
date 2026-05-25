import { listCategories } from '@/features/categories/queries'
import { CategoriesSettings } from '@/features/categories/components/categories-settings'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function CategoriasPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const categories = await listCategories()

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-white">Categorías</h2>
        <p className="text-[#94A3B8] text-sm mt-1">Gestiona las categorías de gasto</p>
      </div>
      <CategoriesSettings initialCategories={categories} />
    </div>
  )
}
