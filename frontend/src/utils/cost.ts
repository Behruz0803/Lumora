/**
 * Client-side mirror of the backend pricing rule, used for instant previews
 * (e.g. quantity steppers). The backend remains the source of truth.
 *
 *   Total Cost = (Unit Price x Quantity) + Delivery Cost
 */
import { tr } from '../i18n'

export function totalCost(unitPrice: number, quantity: number, deliveryCost: number): number {
  return Math.round(unitPrice * quantity) + deliveryCost
}

export function costPerUnit(total: number, quantity: number): number {
  if (quantity <= 0) return 0
  return Math.round((total / quantity) * 100) / 100
}

export function savingsVs(total: number, referenceTotal: number): number {
  return Math.max(0, referenceTotal - total)
}

/** Builds the copyable purchase summary used by the "Contact supplier" flow. */
export function buildOrderSummary(input: {
  productName: string
  unit: string
  quantity: number
  supplierName: string
  location: string
  phone: string
  unitPrice: number
  deliveryCost: number
  total: number
  savings: number
  businessName?: string | null
}): string {
  const fmt = (value: number) => value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ')
  const unit = tr(input.unit)
  return [
    tr('PRICERADAR — PURCHASE ORDER (DEMO)'),
    tr('Buyer: {name}', { name: input.businessName || tr('My business') }),
    tr('Product: {name}', { name: tr(input.productName) }),
    tr('Quantity: {value} {unit}', { value: input.quantity, unit }),
    tr('Supplier: {name} ({location})', { name: input.supplierName, location: tr(input.location) }),
    tr('Contact: {phone}', { phone: input.phone }),
    '',
    tr('Unit price: {price} UZS / {unit}', { price: fmt(input.unitPrice), unit }),
    tr('Product cost: {price} UZS', { price: fmt(input.unitPrice * input.quantity) }),
    tr('Delivery: {price} UZS', { price: fmt(input.deliveryCost) }),
    tr('TOTAL: {price} UZS', { price: fmt(input.total) }),
    tr('Potential saving vs most expensive eligible offer: {price} UZS', { price: fmt(input.savings) }),
    '',
    tr('Prices from the PriceRadar demo dataset (fictional).'),
  ].join('\n')
}
