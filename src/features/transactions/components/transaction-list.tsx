import { groupTransactionsByDay, sumTransactions } from '../domain'
import type { TransactionWithRefs } from '../queries'
import { TransactionRow } from './transaction-row'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { formatCurrency } from '@/lib/formatting'

function formatAmount(amount: number): string {
  return formatCurrency(-Math.abs(amount))
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

type Props = {
  transactions: TransactionWithRefs[]
  categories: { id: string; name: string }[]
  groups: { id: string; name: string }[]
}

export function TransactionList({ transactions, categories, groups }: Props) {
  if (transactions.length === 0) {
    return (
      <p className="text-center text-[#64748B] text-sm py-8">No hay gastos este mes.</p>
    )
  }

  const dayGroups = groupTransactionsByDay(transactions)

  return (
    <div>
      {dayGroups.map(({ date, items }) => {
        const dailyTotal = sumTransactions(items)
        const heading = capitalize(format(new Date(date + 'T12:00:00Z'), 'EEEE d MMM', { locale: es }))

        return (
          <div key={date} className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-[#64748B] uppercase tracking-wider">{heading}</span>
              <span className="text-xs text-[#94A3B8]">{formatAmount(dailyTotal)}</span>
            </div>

            <div>
              {items.map((tx) => (
                <TransactionRow key={tx.id} tx={tx} categories={categories} groups={groups} />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
