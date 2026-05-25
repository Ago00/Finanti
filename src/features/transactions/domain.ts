export type TransactionRow = {
  id: string
  amount: number
  paidAt: Date
  categoryName: string | null
  groupName: string | null
  description: string | null
  prescindible: boolean
}

export function groupTransactionsByDay<T extends TransactionRow>(
  transactions: T[],
): { date: string; items: T[] }[] {
  const map = new Map<string, T[]>()

  for (const tx of transactions) {
    const date = tx.paidAt.toISOString().slice(0, 10)
    const group = map.get(date)
    if (group) {
      group.push(tx)
    } else {
      map.set(date, [tx])
    }
  }

  return Array.from(map.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([date, items]) => ({
      date,
      items: items.slice().sort((a, b) => b.paidAt.getTime() - a.paidAt.getTime()),
    }))
}

export function sumTransactions(transactions: { amount: number }[]): number {
  return transactions.reduce((sum, tx) => sum + tx.amount, 0)
}

export function filterByMonth(
  transactions: TransactionRow[],
  year: number,
  month: number,
): TransactionRow[] {
  return transactions.filter(
    (tx) => tx.paidAt.getUTCFullYear() === year && tx.paidAt.getUTCMonth() + 1 === month,
  )
}
