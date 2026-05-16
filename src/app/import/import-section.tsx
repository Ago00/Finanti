'use client'

import { useState, useRef } from 'react'
import { importGastos, importSuperchic, type ImportResult } from '@/features/import/actions'

type Props = {
  title: string
  description: string
  actionType: 'gastos' | 'superchic'
}

export function ImportSection({ title, description, actionType }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = inputRef.current?.files?.[0]
    if (!file) return

    setLoading(true)
    setResult(null)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = actionType === 'gastos'
        ? await importGastos(formData)
        : await importSuperchic(formData)
      setResult(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-xl border border-[#1F2937] bg-[#131826] p-6 space-y-4">
      <div className="space-y-1">
        <h2 className="text-white font-medium">{title}</h2>
        <p className="text-[#64748B] text-sm">{description}</p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx"
          required
          className="text-sm text-[#94A3B8] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#1A2032] file:text-white hover:file:bg-[#1F2937] cursor-pointer"
        />
        <button
          type="submit"
          disabled={loading}
          className="py-2 px-5 rounded-lg bg-[#6366F1] text-white text-sm font-medium hover:bg-[#4F46E5] disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {loading ? 'Importando...' : 'Importar'}
        </button>
      </form>

      {result && (
        <div className="rounded-lg bg-[#0B0F1A] border border-[#1F2937] p-4 text-sm space-y-1">
          <p className="text-[#10B981] font-medium">
            ✓ Importación completada
          </p>
          <p className="text-[#94A3B8]">Insertados: <span className="text-white">{result.inserted}</span></p>
          <p className="text-[#94A3B8]">Omitidos (ya existían): <span className="text-white">{result.skipped}</span></p>
          {result.warnings.length > 0 && (
            <div className="pt-1">
              <p className="text-[#F59E0B] font-medium">Avisos ({result.warnings.length}):</p>
              <ul className="mt-1 space-y-0.5">
                {result.warnings.map((w, i) => (
                  <li key={i} className="text-[#64748B]">{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-[#EF4444]">Error: {error}</p>
      )}
    </div>
  )
}
