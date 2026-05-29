import type { RecapAccountInput, RecapIncomeInput, RecapMovementInput, RecapBudgetInput } from '../domain'
import { computeSnapshot, computeRecapSummary } from '../domain'
import { formatCurrency } from '@/lib/formatting'

type AccountMeta = { id: string; name: string }
type IncomeMeta = { id: string; name: string }

type Props = {
  accounts: RecapAccountInput[]
  incomes: RecapIncomeInput[]
  movements: RecapMovementInput[]
  budgets: RecapBudgetInput[]
  accountMeta: AccountMeta[]
  incomeMeta: IncomeMeta[]
  categoryMeta: { id: string; name: string }[]
  assetClassMeta: { id: string; name: string }[]
}

function formatPercent(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

function gainColor(value: number): string {
  if (value > 0) return 'text-emerald-400'
  if (value < 0) return 'text-red-400'
  return 'text-[#64748B]'
}

export function StepConfirm({
  accounts,
  incomes,
  movements,
  budgets,
  accountMeta,
  incomeMeta,
  categoryMeta,
  assetClassMeta,
}: Props) {
  const summary = computeRecapSummary(accounts)

  // Income additions per account
  const incomeByAccount = new Map<string, number>()
  for (const inc of incomes) {
    if (inc.toAccountId && inc.amount > 0) {
      incomeByAccount.set(inc.toAccountId, (incomeByAccount.get(inc.toAccountId) ?? 0) + inc.amount)
    }
  }

  const accountName = (id: string) =>
    accountMeta.find((a) => a.id === id)?.name ?? id

  const incomeName = (id: string) =>
    incomeMeta.find((i) => i.id === id)?.name ?? id

  const categoryName = (id: string) =>
    categoryMeta.find((c) => c.id === id)?.name ?? id

  const assetClassName = (id: string) =>
    assetClassMeta.find((a) => a.id === id)?.name ?? id

  const totalBudget = budgets.reduce((sum, b) => sum + b.plannedAmount, 0)

  return (
    <div className="flex flex-col gap-8 text-white">
      <section>
        <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">
          Cuentas
        </h3>
        {accounts.length === 0 ? (
          <p className="text-[#64748B]">—</p>
        ) : (
          <div className="rounded-lg border border-[#1E2A3A] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#141925] text-[#64748B] text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 text-left font-medium">Cuenta</th>
                  <th className="px-4 py-2 text-right font-medium">S. Apertura</th>
                  <th className="px-4 py-2 text-right font-medium">Aportaciones</th>
                  <th className="px-4 py-2 text-right font-medium">S. Banco</th>
                  <th className="px-4 py-2 text-right font-medium">+ Ingresos</th>
                  <th className="px-4 py-2 text-right font-medium">= Cierre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2A3A]">
                {accounts.map((account) => {
                  const incAdj = incomeByAccount.get(account.id) ?? 0
                  const effectiveClosing = account.closingBalance + incAdj
                  return (
                    <tr key={account.id} className="bg-[#0B0F1A]">
                      <td className="px-4 py-2 text-white">{account.name}</td>
                      <td className="px-4 py-2 text-right text-[#94A3B8]">
                        {formatCurrency(account.openingBalance)}
                      </td>
                      <td className="px-4 py-2 text-right text-[#94A3B8]">
                        {formatCurrency(account.contributions)}
                      </td>
                      <td className="px-4 py-2 text-right text-[#94A3B8]">
                        {formatCurrency(account.closingBalance)}
                      </td>
                      <td className="px-4 py-2 text-right text-emerald-400">
                        {incAdj > 0 ? `+${formatCurrency(incAdj)}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-right text-white font-medium">
                        {formatCurrency(effectiveClosing)}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-[#141925] font-semibold border-t border-[#1E2A3A]">
                  <td className="px-4 py-2 text-[#94A3B8]">Total</td>
                  <td className="px-4 py-2 text-right text-[#94A3B8]" />
                  <td className="px-4 py-2 text-right text-[#94A3B8]">
                    {formatCurrency(summary.totalContributions)}
                  </td>
                  <td className="px-4 py-2 text-right text-[#94A3B8]">
                    {formatCurrency(summary.totalClosingBalance)}
                  </td>
                  <td className="px-4 py-2 text-right text-emerald-400">
                    {(() => { const t = Array.from(incomeByAccount.values()).reduce((a, b) => a + b, 0); return t > 0 ? `+${formatCurrency(t)}` : '—' })()}
                  </td>
                  <td className="px-4 py-2 text-right text-white">
                    {formatCurrency(summary.totalClosingBalance + Array.from(incomeByAccount.values()).reduce((a, b) => a + b, 0))}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {incomes.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">
            Ingresos
          </h3>
          <div className="rounded-lg border border-[#1E2A3A] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#141925] text-[#64748B] text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 text-left font-medium">Fuente</th>
                  <th className="px-4 py-2 text-right font-medium">Importe</th>
                  <th className="px-4 py-2 text-right font-medium">Fecha cobro</th>
                  <th className="px-4 py-2 text-left font-medium">→ Cuenta</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2A3A]">
                {incomes.map((income, i) => (
                  <tr key={i} className="bg-[#0B0F1A]">
                    <td className="px-4 py-2 text-white">
                      {incomeName(income.incomeSourceId)}
                    </td>
                    <td className="px-4 py-2 text-right text-emerald-400">
                      {formatCurrency(income.amount)}
                    </td>
                    <td className="px-4 py-2 text-right text-[#94A3B8]">
                      {income.receivedAt}
                    </td>
                    <td className="px-4 py-2 text-[#94A3B8]">
                      {income.toAccountId ? (accountName(income.toAccountId)) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {movements.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">
            Movimientos
          </h3>
          <div className="rounded-lg border border-[#1E2A3A] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#141925] text-[#64748B] text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 text-left font-medium">Origen</th>
                  <th className="px-4 py-2 text-left font-medium">Destino</th>
                  <th className="px-4 py-2 text-right font-medium">Importe</th>
                  <th className="px-4 py-2 text-left font-medium">Descripción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2A3A]">
                {movements.map((mov, i) => (
                  <tr key={i} className="bg-[#0B0F1A]">
                    <td className="px-4 py-2 text-[#94A3B8]">
                      {accountName(mov.fromAccountId)}
                    </td>
                    <td className="px-4 py-2 text-[#94A3B8]">
                      {accountName(mov.toAccountId)}
                    </td>
                    <td className="px-4 py-2 text-right text-white">
                      {formatCurrency(mov.amount)}
                    </td>
                    <td className="px-4 py-2 text-[#64748B]">
                      {mov.description ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {budgets.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide mb-3">
            Plan próximo mes
          </h3>
          <div className="rounded-lg border border-[#1E2A3A] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#141925] text-[#64748B] text-xs uppercase tracking-wide">
                  <th className="px-4 py-2 text-left font-medium">Categoría / Clase</th>
                  <th className="px-4 py-2 text-right font-medium">Importe previsto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1E2A3A]">
                {budgets.map((budget, i) => {
                  const label = budget.categoryId
                    ? categoryName(budget.categoryId)
                    : budget.assetClassId
                      ? assetClassName(budget.assetClassId)
                      : '—'
                  return (
                    <tr key={i} className="bg-[#0B0F1A]">
                      <td className="px-4 py-2 text-white">{label}</td>
                      <td className="px-4 py-2 text-right text-[#94A3B8]">
                        {formatCurrency(budget.plannedAmount)}
                      </td>
                    </tr>
                  )
                })}
                <tr className="bg-[#141925] font-semibold border-t border-[#1E2A3A]">
                  <td className="px-4 py-2 text-[#94A3B8]">Total</td>
                  <td className="px-4 py-2 text-right text-white">
                    {formatCurrency(totalBudget)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}
