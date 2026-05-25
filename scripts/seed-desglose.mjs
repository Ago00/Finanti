import postgres from 'postgres'

const sql = postgres('postgresql://postgres.gstfymazslhknrmbhkoj:@Fersanrolo4@aws-0-eu-west-1.pooler.supabase.com:6543/postgres')

// ── Cargar asset classes ──────────────────────────────────────────────────────
const existing = await sql`SELECT id, name FROM asset_classes`
const ac = {}
for (const row of existing) ac[row.name] = row.id

function acId(name) {
  if (!ac[name]) { console.error(`❌ Asset class no encontrado: ${name}`); return null }
  return ac[name]
}

// ── Datos del Excel (Desglose) ────────────────────────────────────────────────
// Cada entrada: { month: 'YYYY-MM-DD', investments: [{ name, planned, actual }] }
// Orden: Noviembre 2024 → Mayo 2026
const months = [
  { month: '2024-11-01', inv: [
    { name: 'Civislend',  planned: 600, actual: 600 },
    { name: 'S&P500',     planned: 400, actual: 400 },
    { name: 'AzValor',    planned: 400, actual: 400 },
  ]},
  { month: '2024-12-01', inv: [
    { name: 'Civislend',  planned: 600, actual: 600 },
    { name: 'S&P500',     planned: 600, actual: 600 },
    { name: 'AzValor',    planned: 200, actual: 200 },
  ]},
  { month: '2025-01-01', inv: [
    { name: 'Civislend',  planned: 600, actual: 600 },
    { name: 'S&P500',     planned: 500, actual: 500 },
    { name: 'MSCI World', planned: 500, actual: 500 },
  ]},
  { month: '2025-02-01', inv: [
    { name: 'Civislend',  planned: 600, actual: 600 },
    { name: 'S&P500',     planned: 400, actual: 400 },
    { name: 'MSCI World', planned: 365.79, actual: 365.80 },
  ]},
  { month: '2025-03-01', inv: [
    { name: 'Civislend',  planned: 600, actual: 600 },
    { name: 'S&P500',     planned: 400, actual: 400 },
    { name: 'MSCI World', planned: 366, actual: 366 },
  ]},
  { month: '2025-04-01', inv: [
    { name: 'Civislend',  planned: 800, actual: 800 },
    { name: 'S&P500',     planned: 500, actual: 500 },
    { name: 'MSCI World', planned: 400, actual: 400 },
  ]},
  { month: '2025-05-01', inv: [
    { name: 'BTC',        planned: 400, actual: 400 },
    { name: 'S&P500',     planned: 500, actual: 500 },
    { name: 'MSCI World', planned: 400, actual: 400 },
  ]},
  { month: '2025-06-01', inv: [
    { name: 'BTC',        planned: 400, actual: 400 },
    { name: 'S&P500',     planned: 650, actual: 650 },
    { name: 'MSCI World', planned: 465, actual: 465 },
  ]},
  { month: '2025-07-01', inv: [
    { name: 'BTC',        planned: 500, actual: 500 },
    { name: 'S&P500',     planned: 200, actual: 200 },
    { name: 'MSCI World', planned: 200, actual: 200 },
  ]},
  { month: '2025-08-01', inv: [
    { name: 'Trading212', planned: 200, actual: 200 },
    { name: 'Cobas',      planned: 1000, actual: 1000 },
    { name: 'BTC',        planned: 500, actual: 500 },
  ]},
  { month: '2025-09-01', inv: [
    { name: 'Oro',        planned: 250, actual: 250 },
    { name: 'BTC',        planned: 300, actual: 300 },
    { name: 'MSCI World', planned: 250, actual: 250 },
  ]},
  { month: '2025-10-01', inv: [
    { name: 'Oro',        planned: 300, actual: 300 },
    { name: 'Cobas',      planned: 200, actual: 200 },
    { name: 'Civislend',  planned: 400, actual: 400 },
    { name: 'S&P500',     planned: 100, actual: 100 },
    { name: 'Emergentes', planned: 150, actual: 150 },
  ]},
  { month: '2025-11-01', inv: [
    { name: 'Oro',        planned: 200, actual: 200 },
    { name: 'BTC',        planned: 550, actual: 550 },
    { name: 'S&P500',     planned: 200, actual: 200 },
    { name: 'MSCI World', planned: 200, actual: 200 },
    { name: 'Emergentes', planned: 200, actual: 200 },
  ]},
  { month: '2025-12-01', inv: [
    { name: 'Oro',        planned: 200, actual: 200 },
    { name: 'Cobas',      planned: 200, actual: 200 },
    { name: 'BTC',        planned: 400, actual: 400 },
    { name: 'S&P500',     planned: 250, actual: 250 },
    { name: 'Emergentes', planned: 250, actual: 250 },
  ]},
  { month: '2026-01-01', inv: [
    { name: 'Oro',        planned: 100, actual: 100 },
    { name: 'Cobas',      planned: 300, actual: 300 },
    { name: 'AzValor',    planned: 300, actual: 300 },
    { name: 'S&P500',     planned: 100, actual: 100 },
    { name: 'MSCI World', planned: 100, actual: 100 },
    { name: 'Emergentes', planned: 100, actual: 100 },
  ]},
  { month: '2026-02-01', inv: [
    { name: 'Oro',        planned: 250, actual: 250 },
    { name: 'BTC',        planned: 800, actual: 800 },
    { name: 'S&P500',     planned: 150, actual: 150 },
    { name: 'MSCI World', planned: 150, actual: 150 },
    { name: 'Emergentes', planned: 150, actual: 150 },
  ]},
  { month: '2026-03-01', inv: [
    { name: 'Oro',        planned: 300, actual: 300 },
    { name: 'S&P500',     planned: 300, actual: 300 },
    { name: 'MSCI World', planned: 300, actual: 300 },
    { name: 'Emergentes', planned: 300, actual: 300 },
  ]},
  { month: '2026-04-01', inv: [] }, // sin inversiones en abril 2026
  { month: '2026-05-01', inv: [
    { name: 'Oro',        planned: 300, actual: 300 },
    { name: 'BTC',        planned: 300, actual: 300 },
    { name: 'S&P500',     planned: 300, actual: 300 },
    { name: 'MSCI World', planned: 300, actual: 300 },
    { name: 'Emergentes', planned: 300, actual: 300 },
  ]},
]

// ── Seedear ───────────────────────────────────────────────────────────────────
let inserted = 0, updated = 0, skipped = 0

for (const { month, inv } of months) {
  const monthTs = new Date(month + 'T00:00:00.000Z')

  // Borrar entradas de inversión existentes para este mes
  const deleted = await sql`
    DELETE FROM budgets WHERE month = ${monthTs} AND asset_class_id IS NOT NULL
  `

  // Insertar las del Excel
  for (const e of inv) {
    const id = acId(e.name)
    if (!id) { skipped++; continue }
    if (e.planned === 0 && e.actual === 0) continue
    await sql`
      INSERT INTO budgets (id, month, category_id, asset_class_id, planned_amount, actual_amount, created_at, updated_at)
      VALUES (gen_random_uuid(), ${monthTs}, NULL, ${id}, ${e.planned}, ${e.actual}, NOW(), NOW())
    `
    inserted++
  }

  console.log(`✓ ${month}: ${inv.filter(e => e.planned > 0 || e.actual > 0).length} inversiones`)
}

console.log(`\nResumen: ${inserted} entradas insertadas, ${skipped} omitidas`)
await sql.end()
