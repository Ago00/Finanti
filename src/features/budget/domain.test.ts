import { describe, it, expect } from 'vitest'
import { computeBudgetLine, computeBudgetAnalysis, BudgetLineInput } from './domain'

// ─── computeBudgetLine ────────────────────────────────────────────────────────

describe('computeBudgetLine', () => {
  it('under budget: progress < 100, overBudget false, restante > 0', () => {
    const line = computeBudgetLine({
      label: 'Alimentación',
      color: '#6366F1',
      type: 'gasto',
      planned: 500,
      actual: 300,
    })
    expect(line.restante).toBe(200)
    expect(line.progress).toBe(60)
    expect(line.overBudget).toBe(false)
  })

  it('over budget: progress = 100, overBudget true, restante negative', () => {
    const line = computeBudgetLine({
      label: 'Ocio',
      color: '#10B981',
      type: 'gasto',
      planned: 200,
      actual: 350,
    })
    expect(line.restante).toBe(-150)
    expect(line.progress).toBe(100)
    expect(line.overBudget).toBe(true)
  })

  it('exactly on budget: progress = 100, overBudget false, restante = 0', () => {
    const line = computeBudgetLine({
      label: 'Transporte',
      color: '#F59E0B',
      type: 'gasto',
      planned: 150,
      actual: 150,
    })
    expect(line.restante).toBe(0)
    expect(line.progress).toBe(100)
    expect(line.overBudget).toBe(false)
  })

  it('planned = 0, actual = 0: progress = 0, overBudget false', () => {
    const line = computeBudgetLine({
      label: 'Sin planificar',
      color: '#8B5CF6',
      type: 'gasto',
      planned: 0,
      actual: 0,
    })
    expect(line.progress).toBe(0)
    expect(line.overBudget).toBe(false)
  })

  it('planned = 0, actual > 0: progress = 0, overBudget true', () => {
    const line = computeBudgetLine({
      label: 'Extras',
      color: '#EF4444',
      type: 'gasto',
      planned: 0,
      actual: 50,
    })
    expect(line.progress).toBe(0)
    expect(line.overBudget).toBe(true)
  })

  it('progress is capped at 100 even when actual greatly exceeds planned', () => {
    const line = computeBudgetLine({
      label: 'Ropa',
      color: '#EC4899',
      type: 'gasto',
      planned: 100,
      actual: 999,
    })
    expect(line.progress).toBe(100)
  })

  it('preserves all input fields on the returned object', () => {
    const input: BudgetLineInput = {
      label: 'Renta Fija',
      color: '#06B6D4',
      type: 'inversion',
      planned: 1000,
      actual: 800,
    }
    const line = computeBudgetLine(input)
    expect(line.label).toBe(input.label)
    expect(line.color).toBe(input.color)
    expect(line.type).toBe(input.type)
    expect(line.planned).toBe(input.planned)
    expect(line.actual).toBe(input.actual)
  })
})

// ─── computeBudgetAnalysis ────────────────────────────────────────────────────

describe('computeBudgetAnalysis', () => {
  const month = new Date(Date.UTC(2026, 4, 1)) // May 2026

  const gasto1: BudgetLineInput = { label: 'Alimentación', color: '#6366F1', type: 'gasto', planned: 500, actual: 300 }
  const gasto2: BudgetLineInput = { label: 'Transporte', color: '#10B981', type: 'gasto', planned: 200, actual: 180 }
  const inv1: BudgetLineInput = { label: 'Renta Fija', color: '#F59E0B', type: 'inversion', planned: 1000, actual: 900 }
  const inv2: BudgetLineInput = { label: 'Acciones', color: '#8B5CF6', type: 'inversion', planned: 400, actual: 400 }

  it('correctly separates gastoLines and inversionLines', () => {
    const analysis = computeBudgetAnalysis({ month, totalIncome: 3000, lines: [gasto1, inv1, gasto2, inv2] })
    expect(analysis.gastoLines.every(l => l.type === 'gasto')).toBe(true)
    expect(analysis.inversionLines.every(l => l.type === 'inversion')).toBe(true)
    expect(analysis.gastoLines).toHaveLength(2)
    expect(analysis.inversionLines).toHaveLength(2)
  })

  it('orders gastoLines by planned desc', () => {
    const analysis = computeBudgetAnalysis({ month, totalIncome: 3000, lines: [gasto2, gasto1] })
    expect(analysis.gastoLines[0].planned).toBeGreaterThanOrEqual(analysis.gastoLines[1].planned)
    expect(analysis.gastoLines[0].label).toBe('Alimentación')
  })

  it('orders inversionLines by planned desc', () => {
    const analysis = computeBudgetAnalysis({ month, totalIncome: 3000, lines: [inv2, inv1] })
    expect(analysis.inversionLines[0].planned).toBeGreaterThanOrEqual(analysis.inversionLines[1].planned)
    expect(analysis.inversionLines[0].label).toBe('Renta Fija')
  })

  it('computes totalPlanned as sum of all planned amounts', () => {
    const analysis = computeBudgetAnalysis({ month, totalIncome: 3000, lines: [gasto1, gasto2, inv1] })
    expect(analysis.totalPlanned).toBe(500 + 200 + 1000)
  })

  it('computes totalActual as sum of all actual amounts', () => {
    const analysis = computeBudgetAnalysis({ month, totalIncome: 3000, lines: [gasto1, gasto2, inv1] })
    expect(analysis.totalActual).toBe(300 + 180 + 900)
  })

  it('computes totalRestante = totalPlanned - totalActual', () => {
    const analysis = computeBudgetAnalysis({ month, totalIncome: 3000, lines: [gasto1, gasto2, inv1] })
    expect(analysis.totalRestante).toBe(analysis.totalPlanned - analysis.totalActual)
  })

  it('sinAsignar = totalIncome - totalPlanned', () => {
    const analysis = computeBudgetAnalysis({ month, totalIncome: 3000, lines: [gasto1, gasto2] })
    expect(analysis.sinAsignar).toBe(3000 - (500 + 200))
  })

  it('sinAsignar can be negative when totalPlanned > totalIncome', () => {
    const analysis = computeBudgetAnalysis({ month, totalIncome: 500, lines: [gasto1, inv1] })
    expect(analysis.sinAsignar).toBe(500 - (500 + 1000))
    expect(analysis.sinAsignar).toBeLessThan(0)
  })

  it('returns empty arrays and zeroes for no lines', () => {
    const analysis = computeBudgetAnalysis({ month, totalIncome: 2000, lines: [] })
    expect(analysis.gastoLines).toEqual([])
    expect(analysis.inversionLines).toEqual([])
    expect(analysis.totalPlanned).toBe(0)
    expect(analysis.totalActual).toBe(0)
    expect(analysis.totalRestante).toBe(0)
    expect(analysis.sinAsignar).toBe(2000)
  })

  it('preserves the month reference', () => {
    const analysis = computeBudgetAnalysis({ month, totalIncome: 1000, lines: [] })
    expect(analysis.month).toBe(month)
  })
})
