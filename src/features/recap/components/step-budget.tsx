'use client'

type CategoryOption = { id: string; name: string }
type AssetClassOption = { id: string; name: string }

type Props = {
  categories: CategoryOption[]
  assetClasses: AssetClassOption[]
  inputs: import('../domain').RecapBudgetInput[]
  onChange: (updated: import('../domain').RecapBudgetInput[]) => void
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value)
}

export function StepBudget({ categories, assetClasses, inputs, onChange }: Props) {
  function handleAdd() {
    onChange([
      ...inputs,
      {
        categoryId: categories[0]?.id ?? null,
        assetClassId: null,
        plannedAmount: 0,
      },
    ])
  }

  function handleRemove(index: number) {
    onChange(inputs.filter((_, i) => i !== index))
  }

  function handleChangeAmount(index: number, value: number) {
    onChange(inputs.map((row, i) => (i === index ? { ...row, plannedAmount: value } : row)))
  }

  function handleToggleType(index: number, type: 'gasto' | 'inversion') {
    onChange(
      inputs.map((row, i) => {
        if (i !== index) return row
        if (type === 'gasto') {
          return { ...row, categoryId: categories[0]?.id ?? null, assetClassId: null }
        }
        return { ...row, categoryId: null, assetClassId: assetClasses[0]?.id ?? null }
      }),
    )
  }

  function handleSelectCategory(index: number, id: string) {
    onChange(inputs.map((row, i) => (i === index ? { ...row, categoryId: id } : row)))
  }

  function handleSelectAssetClass(index: number, id: string) {
    onChange(inputs.map((row, i) => (i === index ? { ...row, assetClassId: id } : row)))
  }

  const grandTotal = inputs.reduce((sum, row) => sum + (row.plannedAmount || 0), 0)

  const inputClass =
    'bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-white font-semibold text-base">Plan del próximo mes</h2>
        <p className="text-[#64748B] text-sm mt-0.5">Define cuánto destinar a cada partida</p>
      </div>

      {inputs.length > 0 && (
        <div className="flex flex-col gap-3">
          {inputs.map((row, i) => {
            const isGasto = row.assetClassId == null
            return (
              <div
                key={i}
                className="bg-[#141925] border border-[#1E2A3A] p-3 rounded-xl flex flex-col gap-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex rounded-lg overflow-hidden border border-[#1E2A3A]">
                    <button
                      type="button"
                      onClick={() => handleToggleType(i, 'gasto')}
                      className={`px-3 py-1.5 text-sm transition-colors ${
                        isGasto
                          ? 'bg-[#6366F1] text-white'
                          : 'bg-transparent text-[#64748B] hover:text-[#94A3B8]'
                      }`}
                    >
                      Gasto
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleType(i, 'inversion')}
                      className={`px-3 py-1.5 text-sm transition-colors ${
                        !isGasto
                          ? 'bg-[#6366F1] text-white'
                          : 'bg-transparent text-[#64748B] hover:text-[#94A3B8]'
                      }`}
                    >
                      Inversión
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemove(i)}
                    className="ml-auto text-[#64748B] hover:text-red-400 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>

                <div className="flex gap-2 flex-wrap items-center">
                  {isGasto ? (
                    <select
                      value={row.categoryId ?? ''}
                      onChange={(e) => handleSelectCategory(i, e.target.value)}
                      className={inputClass + ' flex-1'}
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <select
                      value={row.assetClassId ?? ''}
                      onChange={(e) => handleSelectAssetClass(i, e.target.value)}
                      className={inputClass + ' flex-1'}
                    >
                      {assetClasses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={row.plannedAmount === 0 ? '' : row.plannedAmount}
                    placeholder="Importe previsto"
                    onChange={(e) => handleChangeAmount(i, parseFloat(e.target.value) || 0)}
                    className={inputClass + ' w-36'}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleAdd}
          className="text-[#6366F1] border border-[#6366F1] rounded-lg px-4 py-2 text-sm hover:bg-[#6366F1]/10"
        >
          Añadir línea
        </button>

        {inputs.length > 0 && (
          <p className="text-white font-semibold text-sm">
            Total previsto: {formatCurrency(grandTotal)}
          </p>
        )}
      </div>
    </div>
  )
}
