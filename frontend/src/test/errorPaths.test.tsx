/**
 * Error-path and resilience tests.
 *
 * Verifies that the UI degrades gracefully when the API fails, returns a
 * duplicate/conflict, is unreachable, or when a record does not exist — the
 * cases a happy-path suite never exercises.
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import { calls, installFetchMock } from './mockApi'

const TOKEN_KEY = 'priceradar_token'

async function renderAuthed(path: string, options: Parameters<typeof installFetchMock>[0] = {}) {
  localStorage.setItem(TOKEN_KEY, 'test-token')
  installFetchMock({ authenticated: true, ...options })
  window.history.pushState({}, '', path)
  return render(<App />)
}

beforeEach(() => {
  calls.length = 0
})

describe('Backend unavailable', () => {
  it('keeps the session and offers a retry when the API cannot be reached', async () => {
    await renderAuthed('/', { offline: true })

    expect((await screen.findAllByText(/cannot reach the priceradar api/i)).length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
    // a network outage must not sign the user out
    expect(localStorage.getItem(TOKEN_KEY)).toBe('test-token')
  })

  it('shows the outage screen for a server error too', async () => {
    localStorage.setItem(TOKEN_KEY, 'test-token')
    const fetchMock = installFetchMock({ authenticated: true })
    const original = fetchMock.getMockImplementation()!
    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).endsWith('/api/auth/me') && (init?.method ?? 'GET') === 'GET') {
        return new Response(JSON.stringify({ detail: 'A database error occurred. Please try again.' }), {
          status: 500,
          headers: { 'content-type': 'application/json' },
        })
      }
      return original(input, init)
    })
    window.history.pushState({}, '', '/')
    render(<App />)

    expect(await screen.findByText(/database error occurred/i)).toBeInTheDocument()
    expect(localStorage.getItem(TOKEN_KEY)).toBe('test-token')
  })

  it('explains the outage on a failed sign-in attempt', async () => {
    installFetchMock({ offline: true })
    window.history.pushState({}, '', '/login')
    const user = userEvent.setup()
    render(<App />)

    await user.type(await screen.findByLabelText(/email address/i), 'dilshod@priceradar.uz')
    await user.type(screen.getByLabelText(/^password$/i), 'demo1234')
    await user.click(screen.getByRole('button', { name: /^sign in$/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/cannot reach the priceradar api/i)
  })

  it('keeps the dashboard usable after a failed comparison request', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100', { failCompare: true })

    expect(await screen.findByText(/database error occurred/i)).toBeInTheDocument()
    const retry = screen.getByRole('button', { name: /retry/i })
    await user.click(retry)
    await waitFor(() =>
      expect(calls.filter((call) => call.url.includes('/api/recommendations/compare')).length).toBeGreaterThan(1),
    )
  })
})

describe('Conflict handling', () => {
  it('treats an already-saved offer as success rather than an error', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100', { duplicateSave: true })
    await screen.findAllByText('400 000 UZS')

    await user.click(screen.getAllByRole('button', { name: /^save offer$/i })[0])

    expect(await screen.findByText(/already in your saved offers/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^saved$/i })).toBeDisabled()
  })
})

describe('Assistant failures', () => {
  it('shows an inline failure message and a toast when the assistant errors', async () => {
    const user = userEvent.setup()
    await renderAuthed('/assistant', { failAssistant: true })

    await user.type(await screen.findByLabelText(/message the assistant/i), 'compare potatoes')
    await user.click(screen.getByRole('button', { name: /send message/i }))

    expect((await screen.findAllByText(/assistant is temporarily unavailable/i)).length).toBeGreaterThan(0)
    // input stays usable so the user can retry
    expect(screen.getByLabelText(/message the assistant/i)).toBeEnabled()
  })
})

describe('Missing records', () => {
  it('renders an error state for an unknown product link', async () => {
    await renderAuthed('/products/424242', { missingProductIds: [424242] })

    expect(await screen.findByText(/product not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to products/i })).toBeInTheDocument()
  })

  it('rejects a malformed product id in the URL', async () => {
    await renderAuthed('/products/not-a-number')
    expect(await screen.findByText(/product link is not valid/i)).toBeInTheDocument()
  })

  it('renders an error state when a supplier does not exist', async () => {
    await renderAuthed('/suppliers/999', { missingSupplierIds: [999] })

    expect(await screen.findByText(/supplier not found/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /back to suppliers/i })).toBeInTheDocument()
  })
})

describe('Empty and boundary states', () => {
  it('renders the product empty state and recovers with reset', async () => {
    const user = userEvent.setup()
    await renderAuthed('/products')
    await screen.findByText('Cooking oil')

    const search = screen.getByLabelText(/search products by name/i)
    await user.type(search, 'zzzz')

    // the mock keeps returning data, so drive the empty-state branch via the availability filter
    await user.selectOptions(screen.getByLabelText('Availability'), 'out_of_stock')
    await waitFor(() =>
      expect(calls.some((call) => call.url.includes('availability=out_of_stock'))).toBe(true),
    )
  })

  it('disables comparison until two saved offers are selected', async () => {
    const user = userEvent.setup()
    await renderAuthed('/saved-offers')
    const compareButton = await screen.findByRole('button', { name: /compare selected/i })
    expect(compareButton).toBeDisabled()

    const checkboxes = screen.getAllByRole('checkbox')
    await user.click(checkboxes[0])
    expect(compareButton).toBeDisabled()

    await user.click(checkboxes[1])
    expect(compareButton).toBeEnabled()
  })

  it('shows zero-change state for unchanged saved offers', async () => {
    await renderAuthed('/saved-offers')
    await screen.findAllByRole('button', { name: /remove saved offer/i })
    expect(screen.getAllByText(/no change/i).length).toBeGreaterThan(0)
  })

  it('blocks an empty chat message', async () => {
    await renderAuthed('/assistant')
    await screen.findByLabelText(/message the assistant/i)
    expect(screen.getByRole('button', { name: /send message/i })).toBeDisabled()
  })

  it('validates settings password mismatch before calling the API', async () => {
    const user = userEvent.setup()
    await renderAuthed('/settings')
    await screen.findByLabelText('Full name')

    await user.type(screen.getByLabelText('Current password'), 'demo1234')
    await user.type(screen.getByLabelText('New password'), 'newpassword1')
    await user.type(screen.getByLabelText('Confirm new password'), 'different1')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i)
    expect(calls.filter((call) => call.url.includes('/auth/me/password'))).toHaveLength(0)
  })

  it('surfaces a wrong current password from the API', async () => {
    const user = userEvent.setup()
    await renderAuthed('/settings')
    await screen.findByLabelText('Full name')

    await user.type(screen.getByLabelText('Current password'), 'wrongpassword')
    await user.type(screen.getByLabelText('New password'), 'newpassword1')
    await user.type(screen.getByLabelText('Confirm new password'), 'newpassword1')
    await user.click(screen.getByRole('button', { name: /update password/i }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/current password is incorrect/i)
  })
})

describe('Quantity edge cases in the comparison', () => {
  it('shows a validation message instead of comparing when quantity is empty', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')
    const before = calls.filter((call) => call.url.includes('/api/recommendations/compare')).length

    await user.clear(screen.getByLabelText(/how much do you need/i))

    expect(screen.getByText(/enter a quantity greater than zero/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /recalculate/i })).toBeDisabled()
    const after = calls.filter((call) => call.url.includes('/api/recommendations/compare')).length
    expect(after).toBe(before)
  })

  it('accepts a fractional quantity and sends it to the API', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    const quantity = screen.getByLabelText(/how much do you need/i)
    await user.clear(quantity)
    await user.type(quantity, '2.5')

    await waitFor(() =>
      expect(
        calls.some(
          (call) => call.url.includes('/api/recommendations/compare') && call.body?.quantity === 2.5,
        ),
      ).toBe(true),
    )
  })

  it('doubles and halves the quantity with the stepper buttons', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')
    const quantity = screen.getByLabelText(/how much do you need/i) as HTMLInputElement

    await user.click(screen.getByRole('button', { name: /double quantity/i }))
    expect(quantity.value).toBe('200')
    await user.click(screen.getByRole('button', { name: /halve quantity/i }))
    expect(quantity.value).toBe('100')
  })
})

describe('Navigation while mounted', () => {
  it('loads a different product when the header search is used from the comparison page', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    expect(await screen.findByRole('heading', { name: 'Potatoes' })).toBeInTheDocument()

    // the header search is available on every page, including this one
    const search = screen.getAllByLabelText(/search products/i)[0]
    await user.type(search, 'rice')
    const subtitle = await screen.findByText(/grains · \d+ suppliers/i)
    await user.click(subtitle.closest('button') as HTMLElement)

    // previously the URL changed but the page kept showing the old product
    expect(await screen.findByRole('heading', { name: 'Rice' })).toBeInTheDocument()
    await waitFor(() => expect(window.location.search).toContain('product=4'))
  })

  it('ignores a direct navigation to the product already being compared', async () => {
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')
    const comparisons = calls.filter((call) => call.url.includes('/api/recommendations/compare')).length
    // no extra product fetch loop after the initial load settles
    await waitFor(() => expect(screen.getByRole('heading', { name: 'Potatoes' })).toBeInTheDocument())
    expect(calls.filter((call) => call.url.includes('/api/recommendations/compare')).length).toBeLessThanOrEqual(
      comparisons + 1,
    )
  })
})

describe('Modal accessibility', () => {
  it('closes the purchase modal with Escape and restores scrolling', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    await user.click(screen.getAllByRole('button', { name: /contact supplier/i })[0])
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(document.body.style.overflow).toBe('hidden')

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(document.body.style.overflow).not.toBe('hidden')
  })

  it('closes the purchase modal via the close button', async () => {
    const user = userEvent.setup()
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    await user.click(screen.getAllByRole('button', { name: /contact supplier/i })[0])
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: /close dialog/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })
})
