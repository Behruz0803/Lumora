/**
 * Unit tests for the client-side cost mirror and formatting helpers.
 *
 * The cost helpers must agree exactly with the backend formula
 * (Total = unit price x quantity + delivery), because the UI renders
 * client-computed numbers in the saved-offer comparison and order summary.
 */
import { describe, expect, it } from 'vitest'
import { buildOrderSummary, costPerUnit, savingsVs, totalCost } from '../utils/cost'
import {
  formatMoney,
  formatPercent,
  formatQuantity,
  formatRelativeTime,
  formatUZS,
  statusLabel,
} from '../utils/format'

describe('totalCost', () => {
  it('matches the Killer Flow demo values', () => {
    expect(totalCost(4000, 100, 50_000)).toBe(450_000)
    expect(totalCost(3500, 100, 50_000)).toBe(400_000)
    expect(totalCost(4200, 100, 0)).toBe(420_000)
  })

  it('handles free delivery', () => {
    expect(totalCost(4200, 25, 0)).toBe(105_000)
  })

  it('rounds fractional quantities to whole UZS', () => {
    expect(totalCost(1234, 2.5, 0)).toBe(3085)
    expect(totalCost(3999, 1.5, 1000)).toBe(6999) // 5998.5 rounds to 5999
  })

  it('handles zero and negative quantities without NaN', () => {
    expect(totalCost(4000, 0, 50_000)).toBe(50_000)
    expect(Number.isFinite(totalCost(4000, -5, 0))).toBe(true)
  })
})

describe('costPerUnit', () => {
  it('includes delivery in the delivered unit cost', () => {
    expect(costPerUnit(400_000, 100)).toBe(4000)
    expect(costPerUnit(450_000, 100)).toBe(4500)
  })

  it('never divides by zero', () => {
    expect(costPerUnit(1000, 0)).toBe(0)
  })
})

describe('savingsVs', () => {
  it('returns the difference against a more expensive reference', () => {
    expect(savingsVs(400_000, 450_000)).toBe(50_000)
  })

  it('never returns a negative saving', () => {
    expect(savingsVs(450_000, 400_000)).toBe(0)
  })
})

describe('buildOrderSummary', () => {
  const summary = buildOrderSummary({
    productName: 'Potatoes',
    unit: 'kg',
    quantity: 100,
    supplierName: 'Fergana Fresh Produce',
    location: 'Fergana',
    phone: '+998 73 244 18 65',
    unitPrice: 3500,
    deliveryCost: 50_000,
    total: 400_000,
    savings: 50_000,
    businessName: 'Dilshod Grocery Market',
  })

  it('states the total, delivery and saving', () => {
    expect(summary).toContain('TOTAL: 400 000 UZS')
    expect(summary).toContain('Delivery: 50 000 UZS')
    expect(summary).toContain('Product cost: 350 000 UZS')
    expect(summary).toContain('Potential saving vs most expensive eligible offer: 50 000 UZS')
  })

  it('includes the supplier contact and buyer', () => {
    expect(summary).toContain('Supplier: Fergana Fresh Produce (Fergana)')
    expect(summary).toContain('Contact: +998 73 244 18 65')
    expect(summary).toContain('Buyer: Dilshod Grocery Market')
  })

  it('labels the document as demo data', () => {
    expect(summary).toContain('PRICERADAR — PURCHASE ORDER (DEMO)')
    expect(summary).toContain('fictional')
  })
})

describe('formatting', () => {
  it('formats UZS with thin grouping', () => {
    expect(formatUZS(450_000)).toBe('450 000 UZS')
    expect(formatUZS(0)).toBe('0 UZS')
    expect(formatUZS(null)).toBe('—')
    expect(formatUZS(undefined)).toBe('—')
    expect(formatUZS(1234.6)).toBe('1 235 UZS')
  })

  it('formats money without the currency suffix', () => {
    expect(formatMoney(1_000_000)).toBe('1 000 000')
    expect(formatMoney(null)).toBe('—')
  })

  it('formats percentages with a sign', () => {
    expect(formatPercent(4.76)).toBe('+4.8%')
    expect(formatPercent(-3.2)).toBe('-3.2%')
    expect(formatPercent(0)).toBe('0.0%')
    expect(formatPercent(null)).toBe('—')
  })

  it('formats quantities without trailing zeros', () => {
    expect(formatQuantity(100, 'kg')).toBe('100 kg')
    expect(formatQuantity(2.5, 'kg')).toBe('2.5 kg')
    expect(formatQuantity(1.5)).toBe('1.5')
    expect(formatQuantity(null)).toBe('—')
  })

  it('describes relative times', () => {
    expect(formatRelativeTime(null)).toBe('—')
    expect(formatRelativeTime(new Date().toISOString())).toBe('just now')
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    expect(formatRelativeTime(oneHourAgo)).toBe('1 h ago')
  })

  it('maps every offer status to a label', () => {
    expect(statusLabel.in_stock).toBe('In stock')
    expect(statusLabel.low_stock).toBe('Low stock')
    expect(statusLabel.out_of_stock).toBe('Out of stock')
  })
})
