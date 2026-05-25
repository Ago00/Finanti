import postgres from 'postgres'

const sql = postgres('postgresql://postgres.gstfymazslhknrmbhkoj:@Fersanrolo4@aws-0-eu-west-1.pooler.supabase.com:6543/postgres')

// ── 1. Añadir asset classes que faltan ────────────────────────────────────────
const newClasses = [
  { name: 'Oro',        color: '#EAB308' },
  { name: 'Emergentes', color: '#EC4899' },
]

const ids = {}

// Obtener todos los existentes
const existing = await sql`SELECT id, name FROM asset_classes`
for (const ac of existing) ids[ac.name] = ac.id

// Crear los que faltan
for (const ac of newClasses) {
  if (!ids[ac.name]) {
    const [row] = await sql`
      INSERT INTO asset_classes (id, name, color, created_at, updated_at)
      VALUES (gen_random_uuid(), ${ac.name}, ${ac.color}, NOW(), NOW())
      RETURNING id, name
    `
    ids[row.name] = row.id
    console.log(`Creada: ${row.name} → ${row.id}`)
  } else {
    console.log(`Ya existe: ${ac.name}`)
  }
}

console.log('Asset classes disponibles:', Object.keys(ids))

// ── 2. Corregir entradas de inversión mayo 2026 ───────────────────────────────
const mayo = '2026-05-01T00:00:00.000Z'

// Borrar todas las entradas de inversión existentes para mayo 2026
await sql`DELETE FROM budgets WHERE month = ${mayo} AND asset_class_id IS NOT NULL`
console.log('Borradas entradas de inversión anteriores de mayo 2026')

// Insertar las correctas del Excel (fila 92 del segundo Mayo)
const entries = [
  { name: 'Oro',        amount: 300 },
  { name: 'BTC',        amount: 300 },
  { name: 'S&P500',     amount: 300 },
  { name: 'MSCI World', amount: 300 },
  { name: 'Emergentes', amount: 300 },
]

for (const e of entries) {
  const acId = ids[e.name]
  if (!acId) { console.error(`No se encontró asset class: ${e.name}`); continue }
  await sql`
    INSERT INTO budgets (id, month, category_id, asset_class_id, planned_amount, created_at, updated_at)
    VALUES (gen_random_uuid(), ${mayo}, NULL, ${acId}, ${e.amount}, NOW(), NOW())
  `
  console.log(`✓ ${e.name}: ${e.amount}€`)
}

// ── 3. Resumen final ──────────────────────────────────────────────────────────
const budgets = await sql`
  SELECT b.planned_amount, ac.name as asset_class
  FROM budgets b
  LEFT JOIN asset_classes ac ON b.asset_class_id = ac.id
  WHERE b.month = ${mayo}
  ORDER BY b.created_at
`
console.log('\nPresupuesto mayo 2026 final:')
for (const b of budgets) {
  console.log(`  ${b.asset_class ?? 'gasto'}: ${b.planned_amount}€`)
}

await sql.end()
