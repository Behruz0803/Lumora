import { describe, expect, it, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { calls, callsTo, installFetchMock } from './mockApi'

const TOKEN_KEY = 'priceradar_token'

function renderAt(path: string) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

async function renderAuthed(path: string) {
  return renderAuthedWith(path, {})
}

async function renderAuthedWith(
  path: string,
  options: { emptySaved?: boolean; failOverview?: boolean },
) {
  localStorage.setItem(TOKEN_KEY, 'test-token')
  installFetchMock({ authenticated: true, ...options })
  return renderAt(path)
}

beforeEach(() => {
  calls.length = 0
})

describe('Authentication', () => {
  it('renders the split-screen login page with demo credentials', () => {
    installFetchMock()
    renderAt('/login')
    expect(screen.getByRole('heading', { name: /sign in to priceradar/i })).toBeInTheDocument()
    expect(screen.getByText(/know the market/i)).toBeInTheDocument()
    expect(screen.getByText('dilshod@priceradar.uz · demo1234')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /use the demo account/i })).toBeInTheDocument()
  })

  it('validates email format before calling the API', async () => {
    const fetchMock = installFetchMock()
    const user = userEvent.setup()
    renderAt('/login')
    await user.type(screen.getByLabelText(/email address/i), 'not-an-email')
    await user.type(screen.getByLabelText(/^password$/i), 'demo1234')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByText(/enter a valid email address/i)).toBeInTheDocument()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('signs in with the demo account and lands on the dashboard', async () => {
    installFetchMock({ authenticated: true })
    const user = userEvent.setup()
    renderAt('/login')
    await user.click(screen.getByRole('button', { name: /use the demo account/i }))

    expect(await screen.findByRole('heading', { name: /welcome back, dilshod/i })).toBeInTheDocument()
    expect(localStorage.getItem(TOKEN_KEY)).toBeTruthy()
    expect(callsTo('/api/auth/login')[0]?.body).toEqual({
      email: 'dilshod@priceradar.uz',
      password: 'demo1234',
    })
  })

  it('shows a readable error for wrong credentials', async () => {
    installFetchMock()
    const user = userEvent.setup()
    renderAt('/login')
    await user.type(screen.getByLabelText(/email address/i), 'dilshod@priceradar.uz')
    await user.type(screen.getByLabelText(/^password$/i), 'wrongpass1')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/incorrect email or password/i)
  })

  it('toggles password visibility', async () => {
    installFetchMock()
    const user = userEvent.setup()
    renderAt('/login')
    const password = screen.getByLabelText(/^password$/i)
    expect(password).toHaveAttribute('type', 'password')
    await user.click(screen.getByRole('button', { name: /show password/i }))
    expect(password).toHaveAttribute('type', 'text')
    await user.click(screen.getByRole('button', { name: /hide password/i }))
    expect(password).toHaveAttribute('type', 'password')
  })

  it('validates registration fields and password confirmation', async () => {
    installFetchMock()
    const user = userEvent.setup()
    renderAt('/register')

    await user.type(screen.getByLabelText(/full name/i), 'Test Owner')
    await user.type(screen.getByLabelText(/email address/i), 'owner@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'short')
    await user.type(screen.getByLabelText(/confirm password/i), 'short')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/at least 8 characters/i)).toBeInTheDocument()

    await user.clear(screen.getByLabelText(/^password$/i))
    await user.type(screen.getByLabelText(/^password$/i), 'longenough1')
    await user.clear(screen.getByLabelText(/confirm password/i))
    await user.type(screen.getByLabelText(/confirm password/i), 'different1')
    await user.click(screen.getByRole('button', { name: /create account/i }))
    expect(await screen.findByText(/passwords do not match/i)).toBeInTheDocument()
  })

  it('registers a new account successfully', async () => {
    installFetchMock({ authenticated: true })
    const user = userEvent.setup()
    renderAt('/register')
    await user.type(screen.getByLabelText(/full name/i), 'New Owner')
    await user.type(screen.getByLabelText(/business name/i), 'New Shop')
    await user.type(screen.getByLabelText(/email address/i), 'new@example.com')
    await user.type(screen.getByLabelText(/^password$/i), 'longenough1')
    await user.type(screen.getByLabelText(/confirm password/i), 'longenough1')
    await user.click(screen.getByRole('button', { name: /create account/i }))

    await waitFor(() => expect(callsTo('/api/auth/register')).toHaveLength(1))
    expect(await screen.findByRole('heading', { name: /welcome back/i })).toBeInTheDocument()
  })

  it('redirects unauthenticated visitors to the login page', async () => {
    installFetchMock()
    renderAt('/compare')
    expect(await screen.findByRole('heading', { name: /sign in to priceradar/i })).toBeInTheDocument()
  })

  it('returns to login when the stored token is rejected', async () => {
    localStorage.setItem(TOKEN_KEY, 'expired-token')
    installFetchMock({ authenticated: false })
    renderAt('/saved-offers')
    expect(await screen.findByRole('heading', { name: /sign in to priceradar/i })).toBeInTheDocument()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('Killer flow: 100 kg of potatoes', () => {
  it('shows the three demo totals and recommends the lowest total cost', async () => {
    await renderAuthed('/compare?product=1&qty=100')

    expect(await screen.findByRole('heading', { name: 'Potatoes' })).toBeInTheDocument()
    expect((await screen.findAllByText('400 000 UZS')).length).toBeGreaterThan(0)
    expect(screen.getAllByText('Fergana Fresh Produce').length).toBeGreaterThan(0)
    expect(screen.getAllByText('420 000 UZS').length).toBeGreaterThan(0)
    expect(screen.getAllByText('450 000 UZS').length).toBeGreaterThan(0)
    expect(screen.getByText(/recommended · lowest total cost/i)).toBeInTheDocument()
    expect(screen.getByText(/you save on this order/i)).toBeInTheDocument()
    expect(screen.getAllByText('50 000 UZS').length).toBeGreaterThan(0)
    expect(screen.getByText(/why this recommendation/i)).toBeInTheDocument()
    expect(screen.getByText(/saves 50 000 UZS on this order/i)).toBeInTheDocument()
  })

  it('never ranks the out-of-stock supplier and shows the reason', async () => {
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    expect(screen.getAllByText('Namangan Food Supply').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/currently out of stock/i).length).toBeGreaterThan(0)
    expect(screen.getByText(/3 eligible of 4 suppliers · 1 excluded/i)).toBeInTheDocument()
  })

  it('opens the purchase summary with contact details and copies the order', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    await user.click(screen.getAllByRole('button', { name: /contact supplier/i })[0])
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).getByText(/contact fergana fresh produce/i)).toBeInTheDocument()
    expect(within(dialog).getByText('+998 73 244 18 65')).toBeInTheDocument()
    expect(within(dialog).getAllByText('400 000 UZS').length).toBeGreaterThan(0)
    expect(within(dialog).getAllByText('50 000 UZS').length).toBeGreaterThan(0)
    expect(within(dialog).getByText(/purchase order \(demo\)/i)).toBeInTheDocument()

    const writeSpy = vi.spyOn(navigator.clipboard, 'writeText')
    await user.click(within(dialog).getByRole('button', { name: /copy order/i }))
    expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining('TOTAL: 400 000 UZS'))
    expect(await screen.findByText(/purchase order summary copied/i)).toBeInTheDocument()
  })

  it('saves the recommended offer via the API', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    await user.click(screen.getAllByRole('button', { name: /^save offer$/i })[0])
    await waitFor(() =>
      expect(calls.filter((call) => call.method === 'POST' && call.url.startsWith('/api/saved-offers'))).toHaveLength(1),
    )
    expect(await screen.findByRole('button', { name: /^saved$/i })).toBeDisabled()
  })

  it('recalculates totals when the quantity changes', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    const quantity = screen.getByLabelText(/how much do you need/i)
    await user.clear(quantity)
    await user.type(quantity, '25')

    expect((await screen.findAllByText('105 000 UZS')).length).toBeGreaterThan(0)
    expect(screen.getByText(/1 eligible of 4 suppliers · 3 excluded/i)).toBeInTheDocument()
    expect(screen.getAllByText('Bukhara Farm Direct').length).toBeGreaterThan(0)
    await waitFor(() =>
      expect(callsTo('/api/recommendations/compare').some((call) => call.body?.quantity === 25)).toBe(true),
    )
  })

  it('explains when no supplier can fulfil the order', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    const quantity = screen.getByLabelText(/how much do you need/i)
    await user.clear(quantity)
    await user.type(quantity, '10')

    expect(await screen.findByText(/no supplier can fulfil this order/i)).toBeInTheDocument()
  })

  it('sorts offers by quality and delivery with working toggles', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    const quality = screen.getByRole('button', { name: /best quality/i })
    await user.click(quality)
    expect(quality).toHaveAttribute('aria-pressed', 'true')

    const delivery = screen.getByRole('button', { name: /fastest delivery/i })
    await user.click(delivery)
    expect(delivery).toHaveAttribute('aria-pressed', 'true')
    expect(quality).toHaveAttribute('aria-pressed', 'false')
  })

  it('rejects an invalid quantity without calling the API', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    const quantity = screen.getByLabelText(/how much do you need/i)
    await user.clear(quantity)
    expect(screen.getByText(/enter a quantity greater than zero/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recalculate/i })).toBeDisabled()
  })

  it('starts from an empty state and loads the potato example', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare')

    expect(await screen.findByText(/pick a product to compare supplier offers/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /try the 100 kg potato example/i }))
    expect((await screen.findAllByText('400 000 UZS')).length).toBeGreaterThan(0)
  })

  it('searches for a product and selects it', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare')

    const search = await screen.findByLabelText(/which product do you need/i)
    await user.type(search, 'potato')
    const option = await screen.findByRole('option', { name: /potatoes/i })
    await user.click(option)

    expect((await screen.findAllByText('400 000 UZS')).length).toBeGreaterThan(0)
    expect(callsTo('/api/products?search=potato').length).toBeGreaterThan(0)
  })
})

describe('Navigation and layout', () => {
  it('renders every sidebar destination and navigates between pages', async () => {
    const user = userEvent.setup()
    await renderAuthed('/')
    await screen.findByRole('heading', { name: /welcome back/i })

    for (const label of [
      'Overview',
      'Price Comparison',
      'Products',
      'Suppliers',
      'Market Analytics',
      'AI Assistant',
      'Saved Offers',
      'Settings',
    ]) {
      expect(screen.getAllByRole('link', { name: new RegExp(`^${label}$`) }).length).toBeGreaterThan(0)
    }

    await user.click(screen.getAllByRole('link', { name: 'Products' })[0])
    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument()
    expect(await screen.findByText('Cooking oil')).toBeInTheDocument()
  })

  it('opens and closes the mobile navigation drawer', async () => {
    const user = userEvent.setup()
    await renderAuthed('/')
    await screen.findByRole('heading', { name: /welcome back/i })

    await user.click(screen.getByRole('button', { name: /open navigation/i }))
    expect(screen.getByRole('button', { name: /close navigation/i })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /close navigation/i }))
    expect(screen.queryByRole('button', { name: /close navigation/i })).not.toBeInTheDocument()
  })

  it('uses the header search to jump into a comparison', async () => {
    const user = userEvent.setup()
    await renderAuthed('/')
    await screen.findByRole('heading', { name: /welcome back/i })

    const searches = screen.getAllByLabelText(/search products/i)
    await user.type(searches[0], 'potato')
    const subtitle = await screen.findByText(/vegetables · \d+ suppliers/i)
    const option = subtitle.closest('button')
    expect(option).not.toBeNull()
    await user.click(option as HTMLElement)

    await waitFor(() => expect(window.location.pathname).toBe('/compare'))
    expect((await screen.findAllByText('400 000 UZS')).length).toBeGreaterThan(0)
  })

  it('shows a not-found page for unknown routes', async () => {
    await renderAuthed('/does-not-exist')
    expect(await screen.findByRole('heading', { name: /page not found/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to overview/i })).toBeInTheDocument()
  })

  it('renders an error state with retry on the dashboard', async () => {
    const user = userEvent.setup()
    await renderAuthedWith('/', { failOverview: true })

    expect(await screen.findByText(/database error occurred/i)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /retry/i }))
    await waitFor(() => expect(callsTo('/api/analytics/overview').length).toBeGreaterThan(1))
  })
})

describe('Catalogue pages', () => {
  it('renders product cards with prices and availability', async () => {
    const user = userEvent.setup()
    await renderAuthed('/products')

    expect(await screen.findByRole('heading', { name: 'Products' })).toBeInTheDocument()
    expect(await screen.findByText('Cooking oil')).toBeInTheDocument()
    expect(screen.getAllByText(/in stock/i).length).toBeGreaterThan(0)
    expect(screen.getAllByRole('button', { name: /compare offers/i })).toHaveLength(8)

    await user.click(screen.getByRole('button', { name: /^vegetables/i }))
    await waitFor(() =>
      expect(callsTo('/api/products?category=Vegetables').length).toBeGreaterThan(0),
    )
  })

  it('honours a category deep link from a supplier profile', async () => {
    await renderAuthed('/products?category=Vegetables')
    await waitFor(() =>
      expect(callsTo('/api/products?category=Vegetables').length).toBeGreaterThan(0),
    )
    expect(await screen.findByRole('button', { name: /^vegetables/i })).toHaveAttribute('aria-pressed', 'true')
  })

  it('filters products with a search term', async () => {
    const user = userEvent.setup()
    await renderAuthed('/products')
    await screen.findByText('Cooking oil')

    await user.type(screen.getByLabelText(/search products by name/i), 'potato')
    await waitFor(() => expect(callsTo('/api/products?search=potato').length).toBeGreaterThan(0))
  })

  it('renders supplier cards and applies the verified filter', async () => {
    const user = userEvent.setup()
    await renderAuthed('/suppliers')

    expect(await screen.findByRole('heading', { name: 'Suppliers' })).toBeInTheDocument()
    expect(await screen.findByText('Tashkent Agro Trade')).toBeInTheDocument()
    expect(screen.getByText('+998 71 200 41 20')).toBeInTheDocument()

    const verified = screen.getByRole('button', { name: /verified only/i })
    await user.click(verified)
    expect(verified).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(callsTo('/api/suppliers?verified=true').length).toBeGreaterThan(0))
  })

  it('renders the supplier profile with offers and contact actions', async () => {
    await renderAuthed('/suppliers/1')
    expect(await screen.findByRole('heading', { name: 'Tashkent Agro Trade' })).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /copy phone/i })).toBeInTheDocument()
    expect(screen.getAllByText(/compare/i).length).toBeGreaterThan(0)
  })

  it('renders market analytics with filters and indicators', async () => {
    const user = userEvent.setup()
    await renderAuthed('/analytics')

    expect(await screen.findByRole('heading', { name: 'Market Analytics' })).toBeInTheDocument()
    expect(await screen.findByText('Stock health')).toBeInTheDocument()
    expect(screen.getByText('Demand & supply indicators')).toBeInTheDocument()
    expect(screen.getByText(/simulated series/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '90 days' }))
    await waitFor(() =>
      expect(callsTo('/api/analytics/market?days=90').length).toBeGreaterThan(0),
    )
  })

  it('renders product detail with history and offers', async () => {
    await renderAuthed('/products/1')
    expect(await screen.findByRole('heading', { name: 'Potatoes' })).toBeInTheDocument()
    expect(await screen.findByText('Price history')).toBeInTheDocument()
    expect(screen.getByText('Supplier offers')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /compare 100 kg/i })).toBeInTheDocument()
  })
})

describe('Saved offers', () => {
  it('lists saved offers with price change information', async () => {
    await renderAuthed('/saved-offers')
    expect(await screen.findByRole('heading', { name: 'Saved Offers' })).toBeInTheDocument()
    expect(await screen.findAllByRole('button', { name: /remove saved offer/i })).toHaveLength(2)
    expect(screen.getAllByText(/saved price/i).length).toBe(2)
  })

  it('removes a saved offer through the API', async () => {
    const user = userEvent.setup()
    await renderAuthed('/saved-offers')
    const removeButtons = await screen.findAllByRole('button', { name: /remove saved offer/i })

    await user.click(removeButtons[0])
    await waitFor(() => expect(callsTo('/api/saved-offers/')).toHaveLength(1))
    await waitFor(() => expect(screen.getAllByRole('button', { name: /remove saved offer/i })).toHaveLength(1))
    expect(await screen.findByText(/removed .* offer from saved offers/i)).toBeInTheDocument()
  })

  it('compares two selected saved offers', async () => {
    const user = userEvent.setup()
    await renderAuthed('/saved-offers')
    const checkboxes = await screen.findAllByRole('checkbox')

    await user.click(checkboxes[0])
    await user.click(checkboxes[1])
    const compareButton = screen.getByRole('button', { name: /compare selected/i })
    expect(compareButton).toBeEnabled()
    await user.click(compareButton)

    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getAllByText(/cheapest/i).length).toBeGreaterThan(0)
    expect(within(dialog).getAllByRole('row').length).toBe(3)
  })

  it('shows an empty state when nothing is saved', async () => {
    await renderAuthedWith('/saved-offers', { emptySaved: true })
    expect(await screen.findByText(/no saved offers yet/i)).toBeInTheDocument()
  })
})

describe('Assistant and settings', () => {
  it('answers a question with the rule-based engine', async () => {
    const user = userEvent.setup()
    await renderAuthed('/assistant')

    expect(await screen.findByRole('heading', { name: 'AI Assistant' })).toBeInTheDocument()
    expect(screen.getByText(/no external ai model is connected/i)).toBeInTheDocument()

    await user.type(screen.getByLabelText(/message the assistant/i), 'compare potatoes')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() => expect(document.body.textContent).toContain('[asked: compare potatoes]'))
    expect(callsTo('/api/assistant/chat')[0]?.body).toMatchObject({ message: 'compare potatoes' })
  })

  it('sends an optional product context with the question', async () => {
    const user = userEvent.setup()
    await renderAuthed('/assistant')
    await screen.findByRole('option', { name: 'Potatoes' })

    await user.selectOptions(screen.getByLabelText('Product'), '1')
    await user.type(screen.getByLabelText('Quantity'), '100')
    await user.type(screen.getByLabelText(/message the assistant/i), 'which is cheapest?')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    await waitFor(() =>
      expect(callsTo('/api/assistant/chat')[0]?.body).toMatchObject({ product_id: 1, quantity: 100 }),
    )
  })

  it('updates the profile from settings', async () => {
    const user = userEvent.setup()
    await renderAuthed('/settings')

    const name = await screen.findByLabelText('Full name')
    await user.clear(name)
    await user.type(name, 'Dilshod K.')
    await user.click(screen.getByRole('button', { name: /save profile/i }))

    await waitFor(() =>
      expect(
        calls.find(
          (call) => call.url === '/api/auth/me' && call.method === 'PATCH' && call.body,
        )?.body,
      ).toMatchObject({ full_name: 'Dilshod K.' }),
    )
    expect(await screen.findByText(/profile updated/i)).toBeInTheDocument()
  })

  it('validates the password change form', async () => {
    const user = userEvent.setup()
    await renderAuthed('/settings')
    await screen.findByLabelText('Full name')

    await user.click(screen.getByRole('button', { name: /update password/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 8 characters/i)
  })

  it('signs out and returns to login', async () => {
    const user = userEvent.setup()
    await renderAuthed('/settings')
    await screen.findByLabelText('Full name')

    await user.click(screen.getAllByRole('button', { name: /sign out/i })[0])
    expect(await screen.findByRole('heading', { name: /sign in to priceradar/i })).toBeInTheDocument()
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  })
})

describe('Dashboard overview', () => {
  it('shows KPIs, recent offers and the killer flow entry point', async () => {
    await renderAuthed('/')
    expect(await screen.findByRole('heading', { name: /welcome back, dilshod/i })).toBeInTheDocument()

    expect(await screen.findByText('Tracked products')).toBeInTheDocument()
    expect(screen.getByText('Active suppliers')).toBeInTheDocument()
    expect(screen.getByText('Average market price')).toBeInTheDocument()
    expect(screen.getByText('Potential savings')).toBeInTheDocument()
    expect(screen.getByText(/dilshod needs 100 kg of potatoes/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /run the 100 kg potato flow/i })).toBeInTheDocument()
    expect(await screen.findByText('Recent supplier offers')).toBeInTheDocument()
    expect(screen.getByText('Recent price changes')).toBeInTheDocument()
  })

  it('opens the killer flow from the dashboard call to action', async () => {
    const user = userEvent.setup()
    await renderAuthed('/')
    await screen.findByRole('heading', { name: /welcome back/i })

    await user.click(screen.getByRole('link', { name: /run the 100 kg potato flow/i }))
    expect((await screen.findAllByText('400 000 UZS')).length).toBeGreaterThan(0)
  })
})
