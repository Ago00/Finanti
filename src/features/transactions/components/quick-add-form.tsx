'use client'

import { useState } from 'react'
import { createTransaction } from '../actions'

type Props = {
  categories: { id: string; name: string }[]
  groups: { id: string; name: string }[]
}

export function QuickAddForm({ categories, groups }: Props) {
  const [amount, setAmount] = useState('')
  const [paidAt, setPaidAt] = useState(() => new Date().toLocaleDateString('sv'))
  const [categoryId, setCategoryId] = useState('')
  const [groupId, setGroupId] = useState('')
  const [description, setDescription] = useState('')
  const [prescindible, setPrescindible] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await createTransaction({
        amount: parseFloat(amount),
        paidAt: new Date(paidAt + 'T12:00:00').toISOString(),
        categoryId: categoryId || null,
        groupId: groupId || null,
        description: description || null,
        prescindible,
      })
      setAmount('')
      setDescription('')
      setCategoryId('')
      setGroupId('')
      setPrescindible(false)
      setPaidAt(new Date().toLocaleDateString('sv'))
      setLoading(false)
    } catch (err) {
      setError((err as Error).message)
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl bg-[#141925] border border-[#1E2A3A] p-4 space-y-3"
    >
      <input
        type="number"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        placeholder="0.00"
        step="0.01"
        min="0.01"
        required
        className="w-full bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-lg font-semibold text-center placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1]"
      />

      <input
        type="date"
        value={paidAt}
        onChange={e => setPaidAt(e.target.value)}
        className="w-full bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1]"
      />

      <div className="grid grid-cols-2 gap-2">
        <select
          value={categoryId}
          onChange={e => setCategoryId(e.target.value)}
          className="w-full bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1]"
        >
          <option value="">Sin categoría</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select
          value={groupId}
          onChange={e => setGroupId(e.target.value)}
          className="w-full bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1]"
        >
          <option value="">Sin grupo</option>
          {groups.map(g => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      <input
        type="text"
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Descripción (opcional)"
        maxLength={200}
        className="w-full bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm placeholder:text-[#64748B] focus:outline-none focus:border-[#6366F1]"
      />

      <label className="flex items-center gap-2 text-sm text-[#94A3B8]">
        <input
          type="checkbox"
          checked={prescindible}
          onChange={e => setPrescindible(e.target.checked)}
        />
        Prescindible
      </label>

      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#6366F1] hover:bg-[#818CF8] text-white rounded-lg py-2.5 text-sm font-medium transition-colors disabled:opacity-50"
      >
        {loading ? 'Guardando...' : 'Añadir gasto'}
      </button>
    </form>
  )
}
