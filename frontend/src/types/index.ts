export interface User {
  id: number
  full_name: string
  email: string
  business_name: string | null
  phone: string | null
  language: string
  notify_price_drops: boolean
  notify_new_offers: boolean
  notify_weekly_digest: boolean
  created_at: string
}

export interface AuthResponse {
  access_token: string
  token_type: string
  user: User
}

export interface ProductBrief {
  id: number
  name: string
  category: string
  unit: string
  image_url: string | null
}

export type Availability = 'in_stock' | 'low_stock' | 'out_of_stock'
export type OfferStatus = Availability

export interface Product extends ProductBrief {
  description: string | null
  is_demo: boolean
  avg_price: number | null
  min_price: number | null
  max_price: number | null
  offer_count: number
  available_supplier_count: number
  availability: Availability
  updated_at: string | null
}

export interface Category {
  category: string
  product_count: number
  avg_price: number | null
  offer_count: number
}

export interface SupplierBrief {
  id: number
  name: string
  location: string
  phone: string
  rating: number
  delivery_days: number
  is_verified: boolean
}

export interface Supplier extends SupplierBrief {
  description: string | null
  categories: string[]
  is_demo: boolean
  offer_count: number
  product_count: number
  created_at: string
}

export interface Offer {
  id: number
  product_id: number
  supplier_id: number
  unit_price: number
  delivery_cost: number
  minimum_order_quantity: number
  available_quantity: number
  status: OfferStatus
  is_demo: boolean
  updated_at: string
  product: ProductBrief | null
  supplier: SupplierBrief | null
  product_cost: number | null
  total_cost: number | null
  cost_per_unit: number | null
  eligible: boolean | null
}

export interface ScoredOffer {
  offer_id: number
  supplier_id: number
  supplier_name: string
  location: string
  phone: string
  rating: number
  delivery_days: number
  is_verified: boolean
  unit_price: number
  delivery_cost: number
  minimum_order_quantity: number
  available_quantity: number
  status: OfferStatus
  quantity: number
  product_cost: number
  total_cost: number
  cost_per_unit: number
  eligible: boolean
  reason: string
  updated_at: string
  score: number | null
  rank: number | null
  is_cheapest: boolean
  is_best_overall: boolean
  difference_vs_best: number | null
}

export interface Comparison {
  product: ProductBrief
  quantity: number
  unit: string
  offers: ScoredOffer[]
  recommended: ScoredOffer | null
  cheapest: ScoredOffer | null
  best_overall: ScoredOffer | null
  eligible_count: number
  rejected_count: number
  highest_eligible_total: number | null
  potential_savings: number
  explanation: string
  data_source: string
  disclaimer: string
}

export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface PricePoint {
  date: string
  price: number
}

export interface SupplierSeries {
  supplier_id: number
  supplier_name: string
  points: PricePoint[]
}

export interface PriceHistory {
  product_id: number
  product_name: string
  unit: string
  days: number
  points: PricePoint[]
  supplier_series: SupplierSeries[]
  min_price: number | null
  max_price: number | null
  avg_price: number | null
  change_pct: number | null
  data_source: string
}

export interface PriceChange {
  product_id: number
  product_name: string
  category: string
  unit: string
  old_price: number
  new_price: number
  change_pct: number
  supplier_name: string
  changed_at: string
}

export interface TrendPoint {
  date: string
  avg_price: number
}

export interface Overview {
  total_products: number
  active_suppliers: number
  total_offers: number
  avg_market_price: number
  potential_savings: number
  savings_pct: number
  price_changes: PriceChange[]
  trend: TrendPoint[]
  top_categories: Category[]
  recent_offers: Offer[]
  data_source: string
  disclaimer: string
}

export interface MarketSupply {
  total_offers: number
  in_stock_offers: number
  low_stock_offers: number
  out_of_stock_offers: number
  stock_health_pct: number
  total_available_volume: number
}

export interface MarketSuppliers {
  total_suppliers: number
  verified_suppliers: number
  verified_pct: number
  avg_rating: number
  avg_delivery_days: number
}

export interface DemandIndicator {
  category: string
  offer_count: number
  avg_price: number | null
  supply_status: 'healthy' | 'tight' | 'constrained'
}

export interface Market {
  days: number
  trend: TrendPoint[]
  categories: Category[]
  price_changes: PriceChange[]
  supply: MarketSupply
  suppliers: MarketSuppliers
  demand: DemandIndicator[]
  data_source: string
  disclaimer: string
}

export interface SavedOffer {
  id: number
  offer_id: number
  created_at: string
  price_at_save: number
  status_at_save: OfferStatus
  price_change: number
  price_change_pct: number
  status_changed: boolean
  offer: Offer
}

export interface AssistantReply {
  answer: string
  intent: string
  suggestions: string[]
  referenced_offers: ScoredOffer[]
  engine: string
  disclaimer: string
}

// ------------------------------------------------------------- data provenance
export type DataSource = 'demo' | 'mixed' | 'real'

export interface DatasetStatus {
  data_source: DataSource
  has_real_data: boolean
  products_total: number
  products_real: number
  products_demo: number
  suppliers_total: number
  suppliers_real: number
  suppliers_demo: number
  offers_total: number
  offers_real: number
  offers_demo: number
  real_data_updated_at: string | null
  disclaimer: string
}

export interface ImportRowError {
  row: number
  field: string | null
  message: string
}

export interface ImportPreviewRow {
  row: number
  product: string
  supplier: string
  unit_price: number
  delivery_cost: number
  minimum_order_quantity: number
  available_quantity: number
  status: OfferStatus
}

export interface ImportReport {
  dry_run: boolean
  rows_received: number
  rows_valid: number
  rows_failed: number
  offers_created: number
  offers_updated: number
  products_created: number
  suppliers_created: number
  errors: ImportRowError[]
  warnings: string[]
  preview: ImportPreviewRow[]
  dataset: DatasetStatus | null
}
