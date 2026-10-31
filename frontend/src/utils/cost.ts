/**
 * Client-side mirror of the backend pricing rule, used for instant previews
 * (e.g. quantity steppers). The backend remains the source of truth.
 *
 *   Total Cost = (Unit Price x Quantity) + Delivery Cost
 */
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
  return [
    'PRICERADAR — PURCHASE ORDER (DEMO)',
    `Buyer: ${input.businessName || 'My business'}`,
    `Product: ${input.productName}`,
    `Quantity: ${input.quantity} ${input.unit}`,
    `Supplier: ${input.supplierName} (${input.location})`,
    `Contact: ${input.phone}`,
    '',
    `Unit price: ${fmt(input.unitPrice)} UZS / ${input.unit}`,
    `Product cost: ${fmt(input.unitPrice * input.quantity)} UZS`,
    `Delivery: ${fmt(input.deliveryCost)} UZS`,
    `TOTAL: ${fmt(input.total)} UZS`,
    `Potential saving vs most expensive eligible offer: ${fmt(input.savings)} UZS`,
    '',
    'Prices from the PriceRadar demo dataset (fictional).',
  ].join('\n')
}
