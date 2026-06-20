'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, X } from 'lucide-react'
import { updateBudgetLine } from '@/features/budget/actions'

export type CategoryOption = {
  id: string
  name: string
  color: string
}

export type AssetClassOption = {
  id: string
  name: string
  color: string
}

type Props = {
  month: string // ISO datetime of the month (e.g. 2026-06-01T00:00:00.000Z)
  availableCategories: CategoryOption[]
  availableAssetClasses: AssetClassOption[]
}

type LineType = 'gasto' | 'inversion'

export function AddBudgetLineForm({ month, availableCategories, availableAssetClasses }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [lineType, setLineType] = useState<LineType>('gasto')
  const [categoryId, setCategoryId] = useState('')
  const [assetClassId, setAssetClassId] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleClose() {
    setOpen(false)
    setCategoryId('')
    setAssetClassId('')
    setAmount('')
    setError(null)
  }

  function handleSubmit() {
    const n = parseFloat(amount)
    if (isNaN(n) || n <= 0) {
      setError('El importe debe ser positivo')
      return
    }
    if (lineType === 'gasto' && !categoryId) {
      setError('Selecciona una categoría')
      return
    }
    if (lineType === 'inversion' && !assetClassId) {
      setError('Selecciona una clase de activo')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        await updateBudgetLine({
          month,
          categoryId: lineType === 'gasto' ? categoryId : null,
          assetClassId: lineType === 'inversion' ? assetClassId : null,
          plannedAmount: n,
        })
        handleClose()
        router.refresh()
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al guardar')
      }
    })
  }

  const noCategories = availableCategories.length === 0
  const noAssetClasses = availableAssetClasses.length === 0

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-[#6366F1] hover:text-[#818CF8] py-1"
      >
        <Plus size={15} />
        Añadir línea de presupuesto
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md rounded-t-3xl sm:rounded-2xl bg-[#141925] border border-[#1E2A3A] px-5 pt-5 pb-10 sm:pb-6 space-y-4">
            <div className="mx-auto w-10 h-1 rounded-full bg-[#374151] sm:hidden mb-2" />

            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-white">Nueva línea de presupuesto</h2>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-xl flex items-center justify-center bg-[#1E2A3A]"
              >
                <X size={14} className="text-[#94A3B8]" />
              </button>
            </div>

            {/* Type selector */}
            <div className="flex rounded-xl overflow-hidden border border-[#1E2A3A]">
              {(['gasto', 'inversion'] as LineType[]).map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setLineType(t); setCategoryId(''); setAssetClassId('') }}
                  className="flex-1 py-2 text-sm font-medium transition-colors"
                  style={{
                    background: lineType === t ? '#6366F1' : 'transparent',
                    color: lineType === t ? '#fff' : '#64748B',
                  }}
                >
                  {t === 'gasto' ? 'Gasto' : 'Inversión'}
                </button>
              ))}
            </div>

            {/* Category / Asset class selector */}
            {lineType === 'gasto' ? (
              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Categoría</label>
                {noCategories ? (
                  <p className="text-sm text-[#64748B]">No hay categorías disponibles</p>
                ) : (
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[#0B0F1A] border border-[#1E2A3A] text-white outline-none"
                  >
                    <option value="">Selecciona una categoría</option>
                    {availableCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                )}
              </div>
            ) : (
              <div>
                <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Clase de activo</label>
                {noAssetClasses ? (
                  <p className="text-sm text-[#64748B]">No hay clases de activo disponibles</p>
                ) : (
                  <select
                    value={assetClassId}
                    onChange={e => setAssetClassId(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm bg-[#0B0F1A] border border-[#1E2A3A] text-white outline-none"
                  >
                    <option value="">Selecciona una clase de activo</option>
                    {availableAssetClasses.map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {/* Amount */}
            <div>
              <label className="text-xs font-medium text-[#94A3B8] mb-1.5 block">Importe planificado</label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full px-4 py-3 pr-10 rounded-xl text-sm bg-[#0B0F1A] border border-[#1E2A3A] text-white outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[#64748B]">€</span>
              </div>
            </div>

            {error && <p className="text-xs text-red-400">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="w-full py-3 rounded-xl font-semibold text-sm text-white bg-[#6366F1] disabled:opacity-60"
            >
              {isPending ? 'Guardando…' : 'Añadir línea'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
