import postgres from 'postgres'

const sql = postgres('postgresql://postgres.gstfymazslhknrmbhkoj:@Fersanrolo4@aws-0-eu-west-1.pooler.supabase.com:6543/postgres')

await sql`ALTER TABLE budgets ADD COLUMN IF NOT EXISTS actual_amount numeric(12,2) DEFAULT 0`
console.log('✓ Columna actual_amount añadida a budgets')

await sql.end()
