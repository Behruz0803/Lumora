/**
 * Accessibility and responsive-structure audits.
 *
 * - every interactive control must have an accessible name
 * - every form field must be associated with a label
 * - responsive fallbacks (desktop table + mobile cards, drawer trigger) must exist
 */
import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'
import { installFetchMock } from './mockApi'

const TOKEN_KEY = 'priceradar_token'

async function renderAuthed(path: string, options: Parameters<typeof installFetchMock>[0] = {}) {
  localStorage.setItem(TOKEN_KEY, 'test-token')
  installFetchMock({ authenticated: true, ...options })
  window.history.pushState({}, '', path)
  return render(<App />)
}

/** Accessible-name resolution following the common cases of the accname spec. */
function accessibleName(element: Element): string {
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel?.trim()) return ariaLabel.trim()

  const labelledBy = element.getAttribute('aria-labelledby')
  if (labelledBy) {
    const text = labelledBy
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent ?? '')
      .join(' ')
      .trim()
    if (text) return text
  }

  const id = element.getAttribute('id')
  if (id) {
    const label = document.querySelector(`label[for="${id}"]`)
    if (label?.textContent?.trim()) return label.textContent.trim()
  }

  // wrapping <label>
  const wrappingLabel = element.closest('label')
  if (wrappingLabel?.textContent?.trim()) return wrappingLabel.textContent.trim()

  const text = element.textContent?.trim()
  if (text) return text
  const title = element.getAttribute('title')
  return title?.trim() ?? ''
}

function assertNamedControls(container: HTMLElement, pageName: string) {
  const controls = Array.from(
    container.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [role="switch"]'),
  ).filter((element) => {
    // skip hidden controls (inactive responsive branches / sr-only helpers are still auditable)
    const style = window.getComputedStyle(element)
    return style.display !== 'none' && !element.hasAttribute('disabled')
  })

  const unnamed = controls.filter((element) => accessibleName(element).length === 0)
  if (unnamed.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      `Unnamed controls on ${pageName}:`,
      unnamed.map((element) => `${element.tagName.toLowerCase()}#${element.id || '(no id)'}:${element.outerHTML.slice(0, 120)}`),
    )
  }
  expect(unnamed).toHaveLength(0)
}

beforeEach(() => {
  localStorage.clear()
})

describe('Accessible names', () => {
  const pages: Array<[string, () => Promise<unknown>]> = [
    ['login', async () => {}],
    ['overview', async () => screen.findByText('Tracked products')],
    ['compare', async () => screen.findAllByText('400 000 UZS')],
    ['products', async () => screen.findByText('Cooking oil')],
    ['suppliers', async () => screen.findByText('Tashkent Agro Trade')],
    ['analytics', async () => screen.findByText('Stock health')],
    ['assistant', async () => screen.findByLabelText(/message the assistant/i)],
    ['saved offers', async () => screen.findAllByRole('button', { name: /remove saved offer/i })],
    ['settings', async () => screen.findByLabelText('Full name')],
  ]

  it.each(pages)('every control on the %s page has an accessible name', async (page, ready) => {
    if (page === 'login') {
      installFetchMock()
      window.history.pushState({}, '', '/login')
      render(<App />)
      await screen.findByRole('heading', { name: /sign in to priceradar/i })
    } else {
      await renderAuthed(page === 'compare' ? '/compare?product=1&qty=100' : pagePath(page))
      await ready()
    }
    assertNamedControls(document.body, page)
  })
})

function pagePath(page: string): string {
  const map: Record<string, string> = {
    overview: '/',
    products: '/products',
    suppliers: '/suppliers',
    analytics: '/analytics',
    assistant: '/assistant',
    'saved offers': '/saved-offers',
    settings: '/settings',
  }
  return map[page] ?? '/'
}

describe('Form labelling', () => {
  it('labels every input on the settings page', async () => {
    await renderAuthed('/settings')
    await screen.findByLabelText('Full name')

    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input, select, textarea'))
    const unlabelled = inputs.filter((input) => accessibleName(input).length === 0)
    expect(unlabelled.map((input) => input.id || input.outerHTML.slice(0, 120))).toEqual([])
  })

  it('labels every input on the comparison page', async () => {
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    const inputs = Array.from(document.querySelectorAll<HTMLInputElement>('input, select, textarea'))
    const unlabelled = inputs.filter((input) => accessibleName(input).length === 0)
    expect(unlabelled.map((input) => input.id || input.outerHTML.slice(0, 120))).toEqual([])
  })
})

describe('Responsive structure', () => {
  it('provides a mobile navigation trigger alongside the desktop sidebar', async () => {
    await renderAuthed('/')
    await screen.findByText('Tracked products')

    const sidebar = document.querySelector('aside')
    expect(sidebar).not.toBeNull()
    // desktop sidebar is hidden below lg, the hamburger is hidden from lg up
    expect(sidebar?.className).toContain('lg:block')
    expect(sidebar?.className).toContain('hidden')
    const trigger = screen.getByRole('button', { name: /open navigation/i })
    expect(trigger.className).toContain('lg:hidden')
  })

  it('renders both a desktop table and a mobile card list for offers', async () => {
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    const tables = Array.from(document.querySelectorAll('table'))
    expect(tables.length).toBeGreaterThan(0)
    const tableWrapper = tables[0].parentElement
    expect(tableWrapper?.className).toContain('hidden')
    expect(tableWrapper?.className).toContain('md:block')

    const mobileList = document.querySelector('ul.divide-y.md\\:hidden')
    expect(mobileList).not.toBeNull()
  })

  it('scrolls wide tables inside an overflow container', async () => {
    await renderAuthed('/analytics')
    await screen.findByText('Stock health')

    const tables = Array.from(document.querySelectorAll('table'))
    expect(tables.length).toBeGreaterThan(0)
    for (const table of tables) {
      const wrapper = table.closest('.overflow-x-auto')
      expect(wrapper, `table is not inside an overflow-x-auto wrapper: ${table.className}`).not.toBeNull()
    }
  })

  it('uses a viewport-aware modal layout', async () => {
    await renderAuthed('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')
    const contact = screen.getAllByRole('button', { name: /contact supplier/i })[0]
    contact.click()
    const dialog = await screen.findByRole('dialog')
    expect(dialog.className).toContain('max-h-[92vh]')
    expect(dialog.className).toContain('rounded-t-2xl')
  })
})

describe('Live regions', () => {
  it('announces toasts politely', async () => {
    await renderAuthed('/saved-offers')
    await screen.findAllByRole('button', { name: /remove saved offer/i })
    const region = document.querySelector('[aria-live="polite"]')
    expect(region).not.toBeNull()
  })

  it('marks error states with role=alert', async () => {
    await renderAuthed('/products/424242', { missingProductIds: [424242] })
    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument())
  })
})
