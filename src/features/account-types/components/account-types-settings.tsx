'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createAccountType, updateAccountType, archiveAccountType } from '@/features/account-types/actions'
import type { AccountTypeRow } from '@/features/account-types/queries'

type Props = {
  initialTypes: AccountTypeRow[]
}

type EditState = {
  name: string
  color: string
}

export function AccountTypesSettings({ initialTypes }: Props) {
  const router = useRouter()
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editState, setEditState] = useState<EditState>({ name: '', color: '#6366F1' })
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#6366F1')
  const [isPending, startTransition] = useTransition()

  function startEdit(type: AccountTypeRow) {
    setEditingId(type.id)
    setEditState({ name: type.name, color: type.color })
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function handleSaveEdit(id: string) {
    startTransition(async () => {
      await updateAccountType({ id, ...editState })
      setEditingId(null)
      router.refresh()
    })
  }

  function handleArchive(id: string, name: string) {
    if (!window.confirm(`¿Archivar el tipo de cuenta "${name}"?`)) return
    startTransition(async () => {
      await archiveAccountType(id)
      router.refresh()
    })
  }

  function handleCreate() {
    if (!newName.trim()) return
    startTransition(async () => {
      await createAccountType({ name: newName.trim(), color: newColor })
      setNewName('')
      setNewColor('#6366F1')
      router.refresh()
    })
  }

  return (
    <div className="space-y-3">
      {initialTypes.length === 0 && (
        <p className="text-[#64748B] text-sm">No hay tipos de cuenta activos.</p>
      )}

      {initialTypes.map(type => (
        <div key={type.id} className="bg-[#141925] border border-[#1E2A3A] rounded-xl px-4 py-3">
          {editingId === type.id ? (
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
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleSaveEdit(type.id)}
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
                style={{ backgroundColor: type.color }}
              />
              <span className="flex-1 text-white text-sm truncate">{type.name}</span>
              <button
                onClick={() => startEdit(type)}
                disabled={isPending}
                className="text-[#64748B] hover:text-[#94A3B8] text-sm"
              >
                Editar
              </button>
              <button
                onClick={() => handleArchive(type.id, type.name)}
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
        <p className="text-[#94A3B8] text-sm font-medium">Nuevo tipo de cuenta</p>
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
