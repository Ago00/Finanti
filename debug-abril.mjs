import postgres from 'postgres'
const sql = postgres('postgresql://postgres.gstfymazslhknrmbhkoj:@Fersanrolo4@aws-0-eu-west-1.pooler.supabase.com:6543/postgres')

console.log('=== INGRESOS budget_month = abril 2026 ===')
const incomes = await sql`
  SELECT i.amount, i.received_at, i.budget_month, s.name as source
  FROM incomes i
  LEFT JOIN income_sources s ON s.id = i.income_source_id
  WHERE i.archived_at IS NULL
    AND i.budget_month >= '2026-04-01'
    AND i.budget_month < '2026-05-01'
  ORDER BY i.received_at
`
let total = 0
for (const r of incomes) {
  total += Number(r.amount)
  console.log(`  ${r.source ?? '?'}  received: ${new Date(r.received_at).toISOString().slice(0,10)}  importe: ${Number(r.amount).toFixed(2)}`)
}
console.log('TOTAL abril:', total.toFixed(2))

await sql.end()
