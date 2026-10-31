/** Money is stored in whole UZS; display with thin spaces, e.g. 450 000 UZS. */
export function formatUZS(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const rounded = Math.round(value)
  return `${rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} UZS`
}

export function formatMoney(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return Math.round(value).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
}

export function formatNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  return value.toLocaleString('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatQuantity(value: number | null | undefined, unit?: string): string {
  if (value === null || value === undefined) return '—'
  const rounded = Number.isInteger(value) ? value.toString() : value.toFixed(2).replace(/\.?0+$/, '')
  return unit ? `${rounded} ${unit}` : rounded
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—'
  const sign = value > 0 ? '+' : ''
  return `${sign}${value.toFixed(digits)}%`
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value.endsWith('Z') || value.includes('+') ? value : `${value}Z`)
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatRelativeTime(value: string | null | undefined): string {
  if (!value) return '—'
  const date = new Date(value.endsWith('Z') || value.includes('+') ? value : `${value}Z`)
  if (Number.isNaN(date.getTime())) return '—'
  const diffMs = Date.now() - date.getTime()
  const minutes = Math.round(diffMs / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days} d ago`
  return formatDate(value)
}

export function formatShortDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

export const statusLabel: Record<string, string> = {
  in_stock: 'In stock',
  low_stock: 'Low stock',
  out_of_stock: 'Out of stock',
}

export const statusTone: Record<string, 'green' | 'amber' | 'red'> = {
  in_stock: 'green',
  low_stock: 'amber',
  out_of_stock: 'red',
}
