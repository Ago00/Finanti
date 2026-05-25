'use client'

import { useState, useTransition } from 'react'
import { createIncomeSource, updateIncomeSource, archiveIncomeSource } from '@/features/income-sources/actions'
import type { IncomeSourceRow } from '@/features/income-sources/queries'

interface Props {
  initialSources: IncomeSourceRow[]
}

export function IncomeSourcesSettings({ initialSources }: Props) {
  const [sources, setSources] = useState<IncomeSourceRow[]>(initialSources)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [editSortOrder, setEditSortOrder] = useState(0)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#10B981')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function startEdit(source: IncomeSourceRow) {
    setEditingId(source.id)
    setEditName(source.name)
    setEditColor(source.color)
    setEditSortOrder(source.sortOrder)
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
        await updateIncomeSource({ id, name: editName, color: editColor, sortOrder: editSortOrder })
        setSources(prev =>
          prev.map(s => s.id === id ? { ...s, name: editName, color: editColor, sortOrder: editSortOrder } : s)
        )
        setEditingId(null)
      } catch {
        setError('Error al guardar. Inténtalo de nuevo.')
      }
    })
  }

  function handleArchive(source: IncomeSourceRow) {
    if (!window.confirm('¿Archivar esta fuente de ingreso?')) return
    startTransition(async () => {
      try {
        await archiveIncomeSource(source.id)
        setSources(prev => prev.filter(s => s.id !== source.id))
      } catch {
        setError('Error al archivar. Inténtalo de nuevo.')
      }
    })
  }

  function handleAdd() {
    if (!newName.trim()) return
    setError(null)
    const maxOrder = sources.length === 0 ? 0 : Math.max(...sources.map(s => s.sortOrder)) + 10
    startTransition(async () => {
      try {
        const created = await createIncomeSource({ name: newName, color: newColor, sortOrder: maxOrder })
        setSources(prev => [...prev, { id: created.id, name: newName, color: newColor, sortOrder: maxOrder }])
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
        {sources.length === 0 && (
          <p className="text-[#64748B] text-sm px-4 py-3">No hay fuentes de ingreso activas.</p>
        )}

        {sources.map(source => (
          <div key={source.id} className="px-4 py-3">
            {editingId === source.id ? (
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
                  <input
                    type="number"
                    value={editSortOrder}
                    onChange={e => setEditSortOrder(Number(e.target.value))}
                    className="w-20 bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]"
                    placeholder="Orden"
                  />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    onClick={() => handleSaveEdit(source.id)}
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
                  style={{ backgroundColor: source.color }}
                />
                <span className="flex-1 text-white text-sm">{source.name}</span>
                <span className="text-[#64748B] text-xs w-10 text-right">{source.sortOrder}</span>
                <button
                  onClick={() => startEdit(source)}
                  disabled={isPending}
                  className="text-[#94A3B8] hover:text-white text-sm disabled:opacity-40"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleArchive(source)}
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
        <p className="text-[#94A3B8] text-sm mb-3">Añadir fuente de ingreso</p>
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
            placeholder="Nombre de la fuente"
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
