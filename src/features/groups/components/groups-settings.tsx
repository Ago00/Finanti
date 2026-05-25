'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createGroup, updateGroup, archiveGroup } from '@/features/groups/actions'
import type { GroupRow } from '@/features/groups/queries'
import { computeNextSortOrder } from '@/features/groups/domain'

type Props = {
  initialGroups: GroupRow[]
}

type EditState = {
  name: string
  color: string
  sortOrder: number
}

export function GroupsSettings({ initialGroups }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', color: '#06B6D4', sortOrder: 0 })
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#06B6D4')
  const [isPending, startTransition] = useTransition()

  function startEdit(group: GroupRow) {
    setEditingId(group.id)
    setEditState({ name: group.name, color: group.color, sortOrder: group.sortOrder })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function handleSaveEdit(id: string) {
    startTransition(async () => {
      await updateGroup({ id, ...editState })
      setEditingId(null)
      router.refresh()
    })
  }

  function handleArchive(id: string, name: string) {
    if (!window.confirm(`¿Archivar el grupo "${name}"?`)) return
    startTransition(async () => {
      await archiveGroup(id)
      router.refresh()
    })
  }

  function handleCreate() {
    if (!newName.trim()) return
    const sortOrder = computeNextSortOrder(initialGroups)
    startTransition(async () => {
      await createGroup({ name: newName.trim(), color: newColor, sortOrder })
      setNewName('')
      setNewColor('#06B6D4')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {initialGroups.length === 0 && (
        <p className="text-[#64748B] text-sm">No hay grupos activos.</p>
      )}

      {initialGroups.map(group => (
        <div key={group.id} className="bg-[#141925] border border-[#1E2A3A] rounded-xl px-4 py-3">
          {editingId === group.id ? (
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
                  type="number"
                  value={editState.sortOrder}
                  onChange={e => setEditState(s => ({ ...s, sortOrder: Number(e.target.value) }))}
                  placeholder="Orden"
                  className="w-20 bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveEdit(group.id)}
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
                style={{ backgroundColor: group.color }}
              />
              <span className="flex-1 text-white text-sm truncate">{group.name}</span>
              <button
                onClick={() => startEdit(group)}
                disabled={isPending}
                className="text-[#64748B] hover:text-[#94A3B8] text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => handleArchive(group.id, group.name)}
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
        <p className="text-[#94A3B8] text-sm font-medium">Nuevo grupo</p>
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
