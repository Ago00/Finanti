import postgres from 'postgres'

const sql = postgres('postgresql://postgres.gstfymazslhknrmbhkoj:@Fersanrolo4@aws-0-eu-west-1.pooler.supabase.com:6543/postgres')

const [{ count }] = await sql`SELECT COUNT(*) FROM incomes WHERE archived_at IS NULL`
console.log('Active incomes:', count)

const preview = await sql`
  SELECT budget_month, budget_month - INTERVAL '1 month' AS new_budget_month
  FROM incomes WHERE archived_at IS NULL ORDER BY budget_month LIMIT 5
`
console.log('\nPreview (first 5 rows):')
for (const row of preview) {
  const from = new Date(row.budget_month).toISOString().slice(0, 7)
  const to = new Date(row.new_budget_month).toISOString().slice(0, 7)
  console.log(' ', from, '->', to)
}

const result = await sql`
  UPDATE incomes SET budget_month = budget_month - INTERVAL '1 month' WHERE archived_at IS NULL
`
console.log('\nUpdated rows:', result.count)

await sql.end()
console.log('Done.')
