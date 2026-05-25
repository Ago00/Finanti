'use client'

import { useState, useTransition } from 'react'
import { createAssetClass, updateAssetClass, archiveAssetClass } from '@/features/asset-classes/actions'
import type { AssetClassRow } from '@/features/asset-classes/queries'

interface Props {
  initialClasses: AssetClassRow[]
}

export function AssetClassesSettings({ initialClasses }: Props) {
  const [classes, setClasses] = useState<AssetClassRow[]>(initialClasses)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#10B981')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function startEdit(assetClass: AssetClassRow) {
    setEditingId(assetClass.id)
    setEditName(assetClass.name)
    setEditColor(assetClass.color)
    setError(null)
  }

  function cancelEdit() {
    setEditingId(null)
    setError(null)
  }

  function handleSaveEdit(id: string) {
    setError(null)
    startTransition(async () => {
      try {
        await updateAssetClass({ id, name: editName, color: editColor })
        setClasses(prev =>
          prev.map(c => c.id === id ? { ...c, name: editName, color: editColor } : c)
        )
        setEditingId(null)
      } catch {
        setError('Error al guardar. Inténtalo de nuevo.')
      }
    })
  }

  function handleArchive(assetClass: AssetClassRow) {
    if (!window.confirm('¿Archivar esta clase de activo?')) return
    startTransition(async () => {
      try {
        await archiveAssetClass(assetClass.id)
        setClasses(prev => prev.filter(c => c.id !== assetClass.id))
      } catch {
        setError('Error al archivar. Inténtalo de nuevo.')
      }
    })
  }

  function handleAdd() {
    if (!newName.trim()) return
    setError(null)
    startTransition(async () => {
      try {
        const created = await createAssetClass({ name: newName, color: newColor })
        setClasses(prev =>
          [...prev, { id: created.id, name: newName, color: newColor }].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        )
        setNewName('')
        setNewColor('#10B981')
      } catch {
        setError('Error al añadir. Inténtalo de nuevo.')
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}

      <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl divide-y divide-[#1E2A3A]">
        {classes.length === 0 && (
          <p className="text-[#64748B] text-sm px-4 py-3">No hay clases de activo activas.</p>
        )}

        {classes.map(assetClass => (
          <div key={assetClass.id} className="px-4 py-3">
            {editingId === assetClass.id ? (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editColor}
                    onChange={e => setEditColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
                  />
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="flex-1 bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]"
                    placeholder="Nombre"
                  />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => handleSaveEdit(assetClass.id)}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg bg-[#6366F1] text-white text-sm hover:bg-[#818CF8] disabled:opacity-40"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={cancelEdit}
                    disabled={isPending}
                    className="px-4 py-2 rounded-lg text-[#94A3B8] text-sm hover:text-white disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: assetClass.color }}
                />
                <span className="flex-1 text-white text-sm">{assetClass.name}</span>
                <button
                  onClick={() => startEdit(assetClass)}
                  disabled={isPending}
                  className="text-[#94A3B8] hover:text-white text-sm disabled:opacity-40"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleArchive(assetClass)}
                  disabled={isPending}
                  className="text-red-400 hover:text-red-300 text-sm disabled:opacity-40"
                >
                  Archivar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-[#141925] border border-[#1E2A3A] rounded-xl px-4 py-4">
        <p className="text-[#94A3B8] text-sm mb-3">Añadir clase de activo</p>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={newColor}
            onChange={e => setNewColor(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
          />
          <input
            type="text"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            placeholder="Nombre de la clase"
            className="flex-1 bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]"
          />
          <button
            onClick={handleAdd}
            disabled={isPending || !newName.trim()}
            className="px-4 py-2 rounded-lg bg-[#6366F1] text-white text-sm hover:bg-[#818CF8] disabled:opacity-40"
          >
            Añadir
          </button>
        </div>
      </div>
    </div>
  )
}
