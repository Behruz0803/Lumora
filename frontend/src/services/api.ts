import type {
  AssistantReply,
  AuthResponse,
  Category,
  Comparison,
  Market,
  Offer,
  Overview,
  Page,
  PriceHistory,
  Product,
  SavedOffer,
  Supplier,
  User,
} from '../types'
import { getLanguage, tr } from '../i18n'

const TOKEN_KEY = 'priceradar_token'
// Requests go through the Vite dev-server proxy to the FastAPI backend.
const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? ''

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

export class ApiError extends Error {
  status: number
  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type QueryValue = string | number | boolean | null | undefined

function buildQuery(params: Record<string, QueryValue> = {}): string {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return
    search.set(key, String(value))
  })
  const query = search.toString()
  return query ? `?${query}` : ''
}

async function request<T>(
  path: string,
  options: RequestInit & { params?: Record<string, QueryValue> } = {},
): Promise<T> {
  const { params, ...init } = options
  const headers = new Headers(init.headers)
  if (init.body) headers.set('Content-Type', 'application/json')
  const token = tokenStore.get()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  // Server-generated text (explanations, eligibility reasons, assistant answers)
  // is returned in the active interface language.
  headers.set('Accept-Language', getLanguage())

  let response: Response
  try {
    response = await fetch(`${BASE_URL}/api${path}${buildQuery(params)}`, { ...init, headers })
  } catch {
    throw new ApiError(tr('Cannot reach the PriceRadar API. Check that the backend server is running.'), 0)
  }

  if (response.status === 401) {
    tokenStore.clear()
    window.dispatchEvent(new CustomEvent('priceradar:unauthorized'))
  }

  if (response.status === 204) return undefined as T

  const isJson = response.headers.get('content-type')?.includes('application/json')
  const payload = isJson ? await response.json().catch(() => null) : null

  if (!response.ok) {
    const detail =
      (payload && typeof payload.detail === 'string' && payload.detail) ||
      (response.status === 401
        ? tr('Your session has expired. Please sign in again.')
        : tr('Request failed with status {status}.', { status: response.status }))
    throw new ApiError(detail, response.status)
  }
  return payload as T
}

const get = <T>(path: string, params?: Record<string, QueryValue>) => request<T>(path, { params })
const post = <T>(path: string, body?: unknown) =>
  request<T>(path, { method: 'POST', body: body === undefined ? undefined : JSON.stringify(body) })
const patch = <T>(path: string, body: unknown) =>
  request<T>(path, { method: 'PATCH', body: JSON.stringify(body) })
const del = (path: string) => request<void>(path, { method: 'DELETE' })

export interface ProductQuery {
  search?: string
  category?: string
  availability?: string
  sort?: string
  page?: number
  page_size?: number
}

export interface SupplierQuery {
  search?: string
  location?: string
  verified?: boolean
  category?: string
  sort?: string
  page?: number
  page_size?: number
}

export interface OfferQuery {
  product_id?: number
  supplier_id?: number
  category?: string
  status?: string
  max_price?: number
  quantity?: number
  sort?: string
  page?: number
  page_size?: number
}

export const api = {
  // auth
  login: (email: string, password: string) => post<AuthResponse>('/auth/login', { email, password }),
  register: (data: { full_name: string; email: string; password: string; business_name?: string }) =>
    post<AuthResponse>('/auth/register', data),
  me: () => get<User>('/auth/me'),
  updateProfile: (data: Partial<Pick<User,
    'full_name' | 'business_name' | 'phone' | 'language' |
    'notify_price_drops' | 'notify_new_offers' | 'notify_weekly_digest'>>) =>
    patch<User>('/auth/me', data),
  changePassword: (current_password: string, new_password: string) =>
    post<{ detail: string }>('/auth/me/password', { current_password, new_password }),

  // catalog
  products: (params?: ProductQuery) => get<Page<Product>>('/products', params as Record<string, QueryValue>),
  product: (id: number) => get<Product>(`/products/${id}`),
  productOffers: (id: number, params?: { quantity?: number; sort?: string }) =>
    get<Offer[]>(`/products/${id}/offers`, params as Record<string, QueryValue>),
  categories: () => get<Category[]>('/products/categories'),

  suppliers: (params?: SupplierQuery) => get<Page<Supplier>>('/suppliers', params as Record<string, QueryValue>),
  supplier: (id: number) => get<Supplier>(`/suppliers/${id}`),
  supplierOffers: (id: number) => get<Offer[]>(`/suppliers/${id}/offers`),
  supplierLocations: () => get<string[]>('/suppliers/locations'),

  offers: (params?: OfferQuery) => get<Page<Offer>>('/offers', params as Record<string, QueryValue>),
  offer: (id: number, quantity?: number) => get<Offer>(`/offers/${id}`, quantity ? { quantity } : undefined),

  // analytics
  overview: () => get<Overview>('/analytics/overview'),
  market: (days: number) => get<Market>('/analytics/market', { days }),
  priceHistory: (productId: number, days: number) =>
    get<PriceHistory>(`/analytics/price-history/${productId}`, { days }),

  // saved
  savedOffers: () => get<SavedOffer[]>('/saved-offers'),
  saveOffer: (offer_id: number) => post<SavedOffer>('/saved-offers', { offer_id }),
  unsaveOffer: (savedId: number) => del(`/saved-offers/${savedId}`),

  // recommendation + assistant
  compare: (product_id: number, quantity: number) =>
    post<Comparison>('/recommendations/compare', { product_id, quantity }),
  ask: (message: string, product_id?: number, quantity?: number) =>
    post<AssistantReply>('/assistant/chat', { message, product_id, quantity }),
}
