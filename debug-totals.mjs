import postgres from 'postgres'

const sql = postgres('postgresql://postgres.gstfymazslhknrmbhkoj:@Fersanrolo4@aws-0-eu-west-1.pooler.supabase.com:6543/postgres')

// Latest snapshot per account
console.log('=== ÚLTIMOS SNAPSHOTS POR CUENTA ===')
const snaps = await sql`
  SELECT a.name, ms.month, ms.opening_balance, ms.closing_balance, ms.contributions
  FROM monthly_snapshots ms
  JOIN accounts a ON a.id = ms.account_id
  WHERE ms.archived_at IS NULL AND a.archived_at IS NULL
  ORDER BY a.name, ms.month DESC
`
let totalClosing = 0
const byAccount = new Map()
for (const row of snaps) {
  const key = row.name
  if (!byAccount.has(key)) {
    byAccount.set(key, row)
    totalClosing += Number(row.closing_balance)
    console.log(`${row.name.padEnd(30)} ${new Date(row.month).toISOString().slice(0,7)}  cierre: ${Number(row.closing_balance).toFixed(2)}`)
  }
}
console.log('\nTOTAL closing balances (último mes):', totalClosing.toFixed(2))

// Current month incomes (May 2026)
console.log('\n=== INGRESOS (budget_month = mayo 2026) ===')
const incomes = await sql`
  SELECT amount, received_at, budget_month
  FROM incomes
  WHERE archived_at IS NULL
    AND budget_month >= '2026-05-01'
    AND budget_month < '2026-06-01'
  ORDER BY received_at
`
let totalIncome = 0
for (const row of incomes) {
  totalIncome += Number(row.amount)
  console.log(`  ${new Date(row.received_at).toISOString().slice(0,10)}  ${Number(row.amount).toFixed(2)}`)
}
console.log('Total ingresos mayo:', totalIncome.toFixed(2))

// All accounts (active)
console.log('\n=== TODAS LAS CUENTAS ACTIVAS ===')
const accounts = await sql`
  SELECT name, type FROM accounts WHERE archived_at IS NULL ORDER BY sort_order
`
for (const a of accounts) console.log(` ${a.name} (${a.type ?? 'sin tipo'})`)

await sql.end()
