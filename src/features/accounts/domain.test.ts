import { describe, it, expect } from 'vitest'
import {
  calculateGain,
  calculateGainPercentage,
  calculateMonthlyChange,
  calculateMonthlyChangePercentage,
} from './domain'

describe('calculateGain', () => {
  it('auto: gain = closing - opening - contributions', () => {
    expect(calculateGain({ openingBalance: 1000, closingBalance: 1100, contributions: 50, gainMode: 'auto' })).toBe(50)
  })

  it('auto: negative gain (loss)', () => {
    expect(calculateGain({ openingBalance: 1000, closingBalance: 900, contributions: 0, gainMode: 'auto' })).toBe(-100)
  })

  it('manual: returns manualGain', () => {
    expect(calculateGain({ openingBalance: 1000, closingBalance: 1100, contributions: 50, gainMode: 'manual', manualGain: 75 })).toBe(75)
  })

  it('manual: returns 0 if manualGain is null', () => {
    expect(calculateGain({ openingBalance: 1000, closingBalance: 1100, contributions: 50, gainMode: 'manual', manualGain: null })).toBe(0)
  })

  it('projects: always returns 0', () => {
    expect(calculateGain({ openingBalance: 1000, closingBalance: 1200, contributions: 100, gainMode: 'projects' })).toBe(0)
  })
})

describe('calculateGainPercentage', () => {
  it('calculates percentage relative to opening', () => {
    expect(calculateGainPercentage(100, 1000)).toBeCloseTo(10)
  })

  it('returns 0 if opening is 0', () => {
    expect(calculateGainPercentage(50, 0)).toBe(0)
  })
})

describe('calculateMonthlyChange', () => {
  it('positive change', () => {
    expect(calculateMonthlyChange(1000, 1100)).toBe(100)
  })

  it('negative change', () => {
    expect(calculateMonthlyChange(1100, 1000)).toBe(-100)
  })
})

describe('calculateMonthlyChangePercentage', () => {
  it('calculates percentage change', () => {
    expect(calculateMonthlyChangePercentage(1000, 1100)).toBeCloseTo(10)
  })

  it('returns 0 if previous is 0', () => {
    expect(calculateMonthlyChangePercentage(0, 100)).toBe(0)
  })
})
