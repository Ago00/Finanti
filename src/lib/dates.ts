import { format } from 'date-fns'
import { es } from 'date-fns/locale'

export { es }

export function formatMonthLabel(year: number, month: number): string {
  return format(new Date(year, month - 1, 1), 'MMMM yyyy', { locale: es })
}
