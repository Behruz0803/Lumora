/**
 * Fetch-level mock backend.
 *
 * Responses are recorded from the real FastAPI service (see fixtures/api.json),
 * so component tests exercise the exact payload shapes the backend returns.
 */
import { vi } from 'vitest'
import fixtures from './fixtures/api.json'

export interface RecordedCall {
  method: string
  url: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any
}

export const calls: RecordedCall[] = []

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json' },
  })
}

export function installFetchMock(
  options: { authenticated?: boolean; failOverview?: boolean; emptySaved?: boolean } = {},
) {
  const savedState = (options.emptySaved ? [] : clone(fixtures.saved)) as Array<Record<string, unknown>>
  let saved = savedState

  const handler = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const rawUrl = typeof input === 'string' ? input : input.toString()
    const url = new URL(rawUrl, 'http://localhost')
    const path = url.pathname
    const method = (init?.method ?? 'GET').toUpperCase()
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ method, url: `${path}${url.search}`, body })

    // ---------------------------------------------------------------- auth
    if (path === '/api/auth/login' && method === 'POST') {
      if (body?.password === 'demo1234') return jsonResponse(fixtures.login)
      return jsonResponse({ detail: 'Incorrect email or password.' }, 401)
    }
    if (path === '/api/auth/register' && method === 'POST') {
      if (body?.email === 'dup@example.com') {
        return jsonResponse({ detail: 'An account with this email already exists. Try signing in instead.' }, 409)
      }
      return jsonResponse(
        {
          access_token: 'test-token',
          token_type: 'bearer',
          user: { ...fixtures.me, full_name: body.full_name, email: body.email, business_name: body.business_name ?? null },
        },
        201,
      )
    }
    if (path === '/api/auth/me') {
      if (method === 'PATCH') {
        return jsonResponse({ ...fixtures.me, ...body })
      }
      if (!options.authenticated) return jsonResponse({ detail: 'Not authenticated' }, 401)
      return jsonResponse(fixtures.me)
    }
    if (path === '/api/auth/me/password' && method === 'POST') {
      if (body?.current_password !== 'demo1234') return jsonResponse({ detail: 'Current password is incorrect.' }, 400)
      return jsonResponse({ detail: 'Password updated successfully.' })
    }

    // ------------------------------------------------------------ products
    if (path === '/api/products/categories') return jsonResponse(fixtures.categories)
    if (path === '/api/products') {
      if (url.searchParams.get('search')) return jsonResponse(fixtures.products)
      return jsonResponse(fixtures.products_all)
    }
    if (/^\/api\/products\/\d+$/.test(path)) return jsonResponse(fixtures.product)
    if (/^\/api\/products\/\d+\/offers$/.test(path)) {
      const quantity = Number(url.searchParams.get('quantity') ?? 0)
      const items = fixtures.offers.items
        .filter((offer) => offer.product_id === 1)
        .map((offer) => ({
          ...offer,
          total_cost: quantity > 0 ? Math.round(offer.unit_price * quantity) + offer.delivery_cost : null,
          product_cost: quantity > 0 ? Math.round(offer.unit_price * quantity) : null,
          cost_per_unit: quantity > 0 ? (Math.round(offer.unit_price * quantity) + offer.delivery_cost) / quantity : null,
          eligible:
            quantity > 0
              ? offer.status !== 'out_of_stock' &&
                quantity >= offer.minimum_order_quantity &&
                quantity <= offer.available_quantity
              : null,
        }))
      return jsonResponse(items)
    }
    if (/^\/api\/products\/\d+\/price-history$/.test(path)) return jsonResponse(fixtures.history)

    // ----------------------------------------------------------- suppliers
    if (path === '/api/suppliers/locations') return jsonResponse(fixtures.locations)
    if (path === '/api/suppliers') return jsonResponse(fixtures.suppliers)
    if (/^\/api\/suppliers\/\d+\/offers$/.test(path)) return jsonResponse(fixtures.supplier_offers)
    if (/^\/api\/suppliers\/\d+$/.test(path)) return jsonResponse(fixtures.supplier)

    // -------------------------------------------------------------- offers
    if (path === '/api/offers') return jsonResponse(fixtures.offers)

    // ----------------------------------------------------------- analytics
    if (path === '/api/analytics/overview') {
      if (options.failOverview) return jsonResponse({ detail: 'A database error occurred. Please try again.' }, 500)
      return jsonResponse(fixtures.overview)
    }
    if (path === '/api/analytics/market') return jsonResponse(fixtures.market)
    if (/^\/api\/analytics\/price-history\/\d+$/.test(path)) return jsonResponse(fixtures.history)

    // ------------------------------------------------------- recommendations
    if (path === '/api/recommendations/compare' && method === 'POST') {
      const quantity = Number(body?.quantity ?? 0)
      if (quantity === 25) return jsonResponse(fixtures.compare_25)
      if (quantity === 10) return jsonResponse(fixtures.compare_10)
      return jsonResponse(fixtures.compare_100)
    }

    // ---------------------------------------------------------- saved offers
    if (path === '/api/saved-offers') {
      if (method === 'GET') return jsonResponse(saved)
      if (method === 'POST') {
        const offerId = Number(body?.offer_id)
        if (saved.some((item) => item.offer_id === offerId)) {
          return jsonResponse({ detail: 'Offer is already saved' }, 409)
        }
        const offer = fixtures.offers.items.find((item) => item.id === offerId) ?? fixtures.offers.items[0]
        const created = {
          id: 999,
          offer_id: offerId,
          created_at: new Date().toISOString(),
          price_at_save: offer.unit_price,
          status_at_save: offer.status,
          price_change: 0,
          price_change_pct: 0,
          status_changed: false,
          offer,
        }
        saved = [created, ...saved]
        return jsonResponse(created, 201)
      }
    }
    if (/^\/api\/saved-offers\/\d+$/.test(path) && method === 'DELETE') {
      const id = Number(path.split('/').pop())
      saved = saved.filter((item) => item.id !== id)
      return new Response(null, { status: 204 })
    }

    // ------------------------------------------------------------ assistant
    if (path === '/api/assistant/chat' && method === 'POST') {
      return jsonResponse({ ...fixtures.assistant, answer: `${fixtures.assistant.answer}\n\n[asked: ${body?.message}]` })
    }

    return jsonResponse({ detail: `No mock handler for ${method} ${path}` }, 404)
  }

  const fetchMock = vi.fn(handler)
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

export function callsTo(pathFragment: string): RecordedCall[] {
  return calls.filter((call) => call.url.includes(pathFragment))
}
