import postgres from 'postgres'

const sql = postgres('postgresql://postgres.gstfymazslhknrmbhkoj:@Fersanrolo4@aws-0-eu-west-1.pooler.supabase.com:6543/postgres')

const [accounts, snaps] = await Promise.all([
  sql`SELECT a.name, a.asset_class_id, ac.name as ac_name FROM accounts a LEFT JOIN asset_classes ac ON a.asset_class_id = ac.id WHERE a.archived_at IS NULL ORDER BY a.sort_order`,
  sql`SELECT a.name, ms.month, ms.contributions FROM monthly_snapshots ms JOIN accounts a ON ms.account_id = a.id WHERE ms.month >= '2026-05-01' AND ms.month < '2026-06-01' AND ms.archived_at IS NULL`,
])

console.log('CUENTAS:')
for (const a of accounts) console.log(' ', a.name, '| asset_class:', a.ac_name ?? 'null')

console.log('\nSNAPSHOTS MAYO 2026:')
if (snaps.length === 0) console.log('  (ninguno)')
for (const s of snaps) console.log(' ', s.name, '| contributions:', s.contributions)

await sql.end()
