export function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency }).format(value)
}

export function formatDelta(value: number, currency = 'EUR'): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${formatCurrency(value, currency)}`
}

export function formatPercentDelta(value: number): string {
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(1)}%`
}
