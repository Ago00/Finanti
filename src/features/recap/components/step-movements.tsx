'use client'

type AccountOption = { id: string; name: string }

type Props = {
  accounts: AccountOption[]
  inputs: import('../domain').RecapMovementInput[]
  onChange: (updated: import('../domain').RecapMovementInput[]) => void
}

export function StepMovements({ accounts, inputs, onChange }: Props) {
  function handleAdd() {
    const next = [
      ...inputs,
      {
        fromAccountId: accounts[0].id,
        toAccountId: accounts[1]?.id ?? accounts[0].id,
        amount: 0,
        description: null,
      },
    ]
    onChange(next)
  }

  function handleRemove(index: number) {
    onChange(inputs.filter((_, i) => i !== index))
  }

  function handleChange<K extends keyof import('../domain').RecapMovementInput>(
    index: number,
    field: K,
    value: import('../domain').RecapMovementInput[K],
  ) {
    onChange(inputs.map((row, i) => (i === index ? { ...row, [field]: value } : row)))
  }

  const inputClass =
    'bg-[#0B0F1A] border border-[#1E2A3A] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#6366F1]'

  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="text-white font-semibold text-base">Movimientos entre cuentas</h2>
        <p className="text-[#64748B] text-sm mt-0.5">
          Opcional — registra transferencias entre tus cuentas este mes
        </p>
      </div>

      {inputs.length === 0 ? (
        <p className="text-[#64748B] text-sm">No hay movimientos este mes.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {inputs.map((row, i) => (
            <div
              key={i}
              className="bg-[#141925] border border-[#1E2A3A] p-3 rounded-xl flex flex-col gap-3"
            >
              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={row.fromAccountId}
                  onChange={(e) => handleChange(i, 'fromAccountId', e.target.value)}
                  className={inputClass}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>

                <span className="text-[#94A3B8] text-sm">→</span>

                <select
                  value={row.toAccountId}
                  onChange={(e) => handleChange(i, 'toAccountId', e.target.value)}
                  className={inputClass}
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id} disabled={a.id === row.fromAccountId}>
                      {a.name}
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => handleRemove(i)}
                  className="ml-auto text-[#64748B] hover:text-red-400 text-lg leading-none"
                >
                  ×
                </button>
              </div>

              <div className="flex gap-2 flex-wrap">
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={row.amount === 0 ? '' : row.amount}
                  placeholder="Importe"
                  onChange={(e) => handleChange(i, 'amount', parseFloat(e.target.value) || 0)}
                  className={inputClass + ' w-32'}
                />

                <input
                  type="text"
                  maxLength={200}
                  value={row.description ?? ''}
                  placeholder="Descripción (opcional)"
                  onChange={(e) =>
                    handleChange(i, 'description', e.target.value || null)
                  }
                  className={inputClass + ' flex-1'}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={handleAdd}
        disabled={accounts.length === 0}
        className="self-start text-[#6366F1] border border-[#6366F1] rounded-lg px-4 py-2 text-sm hover:bg-[#6366F1]/10 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        Añadir movimiento
      </button>
    </div>
  )
}
