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
  options: {
    authenticated?: boolean
    failOverview?: boolean
    emptySaved?: boolean
    /** Reject the comparison request with a server error */
    failCompare?: boolean
    /** Simulate the backend being unreachable (fetch rejects) */
    offline?: boolean
    /** Force POST /saved-offers to answer 409 */
    duplicateSave?: boolean
    /** Fail the assistant request */
    failAssistant?: boolean
    /** Product ids that should answer 404 */
    missingProductIds?: number[]
    /** Supplier ids that should answer 404 */
    missingSupplierIds?: number[]
    /** Provenance the API reports for the catalogue: demo, mixed or real */
    dataSource?: 'demo' | 'mixed' | 'real'
    /** Simulate a CSV upload the backend rejects (bad columns) */
    failImport?: boolean
  } = {},
) {
  const savedState = (options.emptySaved ? [] : clone(fixtures.saved)) as Array<Record<string, unknown>>
  let saved = savedState

  const handler = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    if (options.offline) throw new TypeError('Failed to fetch')
    const rawUrl = typeof input === 'string' ? input : input.toString()
    const url = new URL(rawUrl, 'http://localhost')
    const path = url.pathname
    const method = (init?.method ?? 'GET').toUpperCase()
    // Multipart uploads (FormData) are not JSON, so never assume a JSON body.
    const body =
      typeof init?.body === 'string' && init.body.startsWith('{')
        ? JSON.parse(init.body)
        : undefined
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
      const term = url.searchParams.get('search')?.toLowerCase()
      const all = fixtures.products_all
      if (term) {
        const matches = all.items.filter(
          (item) =>
            item.name.toLowerCase().includes(term) ||
            item.category.toLowerCase().includes(term) ||
            (item.description ?? '').toLowerCase().includes(term),
        )
        return jsonResponse({ ...all, items: matches, total: matches.length, pages: matches.length ? 1 : 0 })
      }
      return jsonResponse(all)
    }
    if (/^\/api\/products\/\d+$/.test(path)) {
      const id = Number(path.split('/').pop())
      if (options.missingProductIds?.includes(id)) return jsonResponse({ detail: 'Product not found' }, 404)
      const match = fixtures.products_all.items.find((item) => item.id === id)
      return jsonResponse(match ?? fixtures.product)
    }
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
    if (/^\/api\/suppliers\/\d+$/.test(path)) {
      const id = Number(path.split('/').pop())
      if (options.missingSupplierIds?.includes(id)) return jsonResponse({ detail: 'Supplier not found' }, 404)
      return jsonResponse(fixtures.supplier)
    }

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
      if (options.failCompare) return jsonResponse({ detail: 'A database error occurred. Please try again.' }, 500)
      const quantity = Number(body?.quantity ?? 0)
      const base =
        quantity === 25 ? fixtures.compare_25 : quantity === 10 ? fixtures.compare_10 : fixtures.compare_100
      // echo the requested product so the page reflects what was actually asked for
      const requested = fixtures.products_all.items.find((item) => item.id === Number(body?.product_id))
      return jsonResponse(
        requested
          ? { ...base, product: { ...requested, description: undefined, is_demo: undefined } }
          : base,
      )
    }

    // ---------------------------------------------------------- saved offers
    if (path === '/api/saved-offers') {
      if (method === 'GET') return jsonResponse(saved)
      if (method === 'POST') {
        const offerId = Number(body?.offer_id)
        if (options.duplicateSave || saved.some((item) => item.offer_id === offerId)) {
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
      if (options.failAssistant) return jsonResponse({ detail: 'Assistant is temporarily unavailable.' }, 503)
      return jsonResponse({ ...fixtures.assistant, answer: `${fixtures.assistant.answer}\n\n[asked: ${body?.message}]` })
    }

    // ------------------------------------------------ dataset + price import
    if (path === '/api/dataset/status') {
      const source = options.dataSource ?? 'demo'
      const real = source === 'demo' ? 0 : source === 'real' ? 28 : 6
      return jsonResponse({
        data_source: source,
        has_real_data: real > 0,
        products_total: 8,
        products_real: source === 'real' ? 8 : source === 'mixed' ? 2 : 0,
        products_demo: source === 'real' ? 0 : source === 'mixed' ? 6 : 8,
        suppliers_total: 6,
        suppliers_real: source === 'real' ? 6 : source === 'mixed' ? 1 : 0,
        suppliers_demo: source === 'real' ? 0 : source === 'mixed' ? 5 : 6,
        offers_total: 28,
        offers_real: real,
        offers_demo: 28 - real,
        real_data_updated_at: real > 0 ? '2026-10-31T09:00:00' : null,
        disclaimer:
          source === 'real'
            ? 'Prices, delivery costs and availability come from supplier price lists imported into PriceRadar.'
            : 'Demo dataset: prices, suppliers and trends are fictional and for product demonstration only - not real market data.',
      })
    }
    if (path === '/api/import/prices' && method === 'POST') {
      if (options.failImport) {
        return jsonResponse(
          { detail: 'Missing required column(s): unit_price. Required columns are: product, supplier, unit_price.' },
          422,
        )
      }
      const dryRun = url.searchParams.get('dry_run') === 'true'
      return jsonResponse({
        dry_run: dryRun,
        rows_received: 3,
        rows_valid: 2,
        rows_failed: 1,
        offers_created: dryRun ? 2 : 0,
        offers_updated: 0,
        products_created: 1,
        suppliers_created: 1,
        errors: [{ row: 3, field: 'unit_price', message: 'Value is required' }],
        warnings: [],
        preview: [
          {
            row: 2,
            product: 'Potatoes',
            supplier: 'Tashkent Agro Trade',
            unit_price: 3900,
            delivery_cost: 40000,
            minimum_order_quantity: 50,
            available_quantity: 1200,
            status: 'in_stock',
          },
        ],
        dataset: { data_source: dryRun ? 'demo' : 'mixed', has_real_data: !dryRun },
      })
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
