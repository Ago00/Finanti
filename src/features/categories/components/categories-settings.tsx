'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCategory, updateCategory, archiveCategory } from '@/features/categories/actions'
import type { CategoryRow } from '@/features/categories/queries'
import { computeNextSortOrder } from '@/features/categories/domain'

type Props = {
  initialCategories: CategoryRow[]
}

type EditState = {
  name: string
  color: string
  icon: string
  sortOrder: number
}

export function CategoriesSettings({ initialCategories }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', color: '#6366F1', icon: 'tag', sortOrder: 0 })
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366F1')
  const [newIcon, setNewIcon] = useState('tag')
  const [isPending, startTransition] = useTransition()

  function startEdit(cat: CategoryRow) {
    setEditingId(cat.id)
    setEditState({ name: cat.name, color: cat.color, icon: cat.icon, sortOrder: cat.sortOrder })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function handleSaveEdit(id: string) {
    startTransition(async () => {
      await updateCategory({ id, ...editState })
      setEditingId(null)
      router.refresh()
    })
  }

  function handleArchive(id: string, name: string) {
    if (!window.confirm(`¿Archivar la categoría "${name}"?`)) return
    startTransition(async () => {
      await archiveCategory(id)
      router.refresh()
    })
  }

  function handleCreate() {
    if (!newName.trim()) return
    const sortOrder = computeNextSortOrder(initialCategories)
    startTransition(async () => {
      await createCategory({ name: newName.trim(), color: newColor, icon: newIcon, sortOrder })
      setNewName('')
      setNewColor('#6366F1')
      setNewIcon('tag')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {initialCategories.length === 0 && (
        <p className="text-[#64748B] text-sm">No hay categorías activas.</p>
      )}

      {initialCategories.map(cat => (
        <div key={cat.id} className="bg-[#141925] border border-[#1E2A3A] rounded-xl px-4 py-3">
          {editingId === cat.id ? (
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={editState.name}
                  onChange={e => setEditState(s => ({ ...s, name: e.target.value }))}
                  placeholder="Nombre"
                  className="flex-1 bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]"
                />
                <input
                  type="color"
                  value={editState.color}
                  onChange={e => setEditState(s => ({ ...s, color: e.target.value }))}
                  className="w-10 h-9 rounded-lg border border-[#1E2A3A] bg-[#0B0F1A] cursor-pointer"
                  title="Color"
                />
                <input
                  type="text"
                  value={editState.icon}
                  onChange={e => setEditState(s => ({ ...s, icon: e.target.value }))}
                  placeholder="Icono"
                  className="w-24 bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]"
                />
                <input
                  type="number"
                  value={editState.sortOrder}
                  onChange={e => setEditState(s => ({ ...s, sortOrder: Number(e.target.value) }))}
                  placeholder="Orden"
                  className="w-20 bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveEdit(cat.id)}
                  disabled={isPending}
                  className="px-4 py-2 rounded-lg bg-[#6366F1] text-white text-sm hover:bg-[#818CF8] disabled:opacity-40"
                >
                  Guardar
                </button>
                <button
                  onClick={cancelEdit}
                  disabled={isPending}
                  className="text-[#64748B] hover:text-[#94A3B8] text-sm"
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="flex-1 text-white text-sm truncate">{cat.name}</span>
              <span className="text-[#64748B] text-xs">{cat.icon}</span>
              <button
                onClick={() => startEdit(cat)}
                disabled={isPending}
                className="text-[#64748B] hover:text-[#94A3B8] text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => handleArchive(cat.id, cat.name)}
                disabled={isPending}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Archivar
              </button>
            </div>
          )}
        </div>
      ))}

      <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl px-4 py-4 space-y-3">
        <p className="text-[#94A3B8] text-sm font-medium">Nueva categoría</p>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Nombre"
            className="flex-1 bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]"
          />
          <input
            type="color"
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            className="w-10 h-9 rounded-lg border border-[#1E2A3A] bg-[#0B0F1A] cursor-pointer"
            title="Color"
          />
          <input
            type="text"
            value={newIcon}
            onChange={e => setNewIcon(e.target.value)}
            placeholder="Icono"
            className="w-24 bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={isPending || !newName.trim()}
          className="px-4 py-2 rounded-lg bg-[#6366F1] text-white text-sm hover:bg-[#818CF8] disabled:opacity-40"
        >
          Añadir
        </button>
      </div>
    </div>
  )
}
