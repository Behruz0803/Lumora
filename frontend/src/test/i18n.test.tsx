/**
 * Internationalisation tests: dictionary coverage, formatting, plural rules and
 * the end-to-end language switch in the real UI.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from '../App'
import keys from '../i18n/keys.json'
import { uz } from '../i18n/locales/uz'
import { ru } from '../i18n/locales/ru'
import { getLanguage, plural, setLanguage, tr } from '../i18n'
import { installFetchMock } from './mockApi'

const TOKEN_KEY = 'priceradar_token'

beforeEach(() => {
  setLanguage('en')
  localStorage.clear()
})

describe('dictionary coverage', () => {
  it('has no missing Uzbek or Russian translation for any UI string', () => {
    const missingUz = keys.filter((key) => !uz[key])
    const missingRu = keys.filter((key) => !ru[key])
    expect(missingUz, `missing uz: ${missingUz.join(' | ')}`).toEqual([])
    expect(missingRu, `missing ru: ${missingRu.join(' | ')}`).toEqual([])
  })

  it('never leaves an untranslated English string in the Russian or Uzbek dictionaries', () => {
    // A value identical to its key is allowed only for intentionally identical
    // tokens (brand names, units, symbols).
    // Brand names, unit symbols and abbreviations are legitimately identical.
    const allowed = new Set([
      'PriceRadar',
      'PriceRadar home',
      'kg',
      'l',
      'UZS',
      '{count} {noun}',
      'Min',
      'Min:',
      'kg / l,',
      'Namangan',
      'Dilshod Karimov',
    ])
    const identicalRu = Object.entries(ru)
      .filter(([key, value]) => key === value && !allowed.has(key))
      .map(([key]) => key)
    const identicalUz = Object.entries(uz)
      .filter(([key, value]) => key === value && !allowed.has(key))
      .map(([key]) => key)
    expect(identicalRu).toEqual([])
    expect(identicalUz).toEqual([])
  })

  it('keeps interpolation placeholders intact in every translation', () => {
    const placeholders = (value: string) => (value.match(/\{(\w+)\}/g) ?? []).sort()
    const broken: string[] = []
    for (const key of keys) {
      const expected = placeholders(key)
      for (const [lang, dict] of [
        ['uz', uz],
        ['ru', ru],
      ] as const) {
        const value = dict[key]
        if (!value) continue
        const actual = placeholders(value)
        if (expected.join() !== actual.join()) broken.push(`${lang}: ${key}`)
      }
    }
    expect(broken).toEqual([])
  })

  it('covers the demo dataset labels', () => {
    for (const name of ['Potatoes', 'Tomatoes', 'Onions', 'Rice', 'Flour', 'Cooking oil', 'Sugar', 'Eggs']) {
      expect(uz[name], `uz ${name}`).toBeTruthy()
      expect(ru[name], `ru ${name}`).toBeTruthy()
    }
    for (const category of ['Vegetables', 'Grains', 'Oils & Fats', 'Pantry', 'Dairy & Eggs']) {
      expect(uz[category], `uz ${category}`).toBeTruthy()
      expect(ru[category], `ru ${category}`).toBeTruthy()
    }
  })
})

describe('translation engine', () => {
  it('falls back to the English source for unknown keys', () => {
    expect(tr('This string does not exist in any dictionary')).toBe('This string does not exist in any dictionary')
  })

  it('interpolates variables', () => {
    setLanguage('uz')
    expect(tr('Welcome back, {name}', { name: 'Dilshod' })).toBe('Xush kelibsiz, Dilshod')
    setLanguage('ru')
    expect(tr('Welcome back, {name}', { name: 'Дильшод' })).toBe('С возвращением, Дильшод')
  })

  it('leaves unknown placeholders untouched', () => {
    setLanguage('ru')
    expect(tr('{price} UZS', { other: 'x' })).toContain('{price}')
  })

  it('applies English plural rules', () => {
    setLanguage('en')
    expect(plural(1, 'supplier')).toBe('supplier')
    expect(plural(2, 'supplier')).toBe('suppliers')
    expect(plural(0, 'supplier')).toBe('suppliers')
  })

  it('applies Russian plural rules', () => {
    setLanguage('ru')
    expect(plural(1, 'supplier')).toBe('поставщик')
    expect(plural(3, 'supplier')).toBe('поставщика')
    expect(plural(5, 'supplier')).toBe('поставщиков')
    expect(plural(11, 'supplier')).toBe('поставщиков')
    expect(plural(21, 'supplier')).toBe('поставщик')
    expect(plural(22, 'supplier')).toBe('поставщика')
  })

  it('uses a single form for Uzbek', () => {
    setLanguage('uz')
    expect(plural(1, 'supplier')).toBe("ta ta'minotchi".replace("ta'minotchi", 'ta’minotchi'))
    expect(plural(7, 'supplier')).toBe(plural(1, 'supplier'))
  })

  it('persists the choice and updates <html lang>', () => {
    setLanguage('ru')
    expect(localStorage.getItem('priceradar_lang')).toBe('ru')
    expect(document.documentElement.lang).toBe('ru')
    setLanguage('uz')
    expect(localStorage.getItem('priceradar_lang')).toBe('uz')
    expect(getLanguage()).toBe('uz')
  })
})

describe('language switch in the UI', () => {
  async function renderApp(path = '/') {
    localStorage.setItem(TOKEN_KEY, 'test-token')
    installFetchMock({ authenticated: true })
    window.history.pushState({}, '', path)
    return render(<App />)
  }

  it('translates the dashboard when Russian is picked from the header switcher', async () => {
    const user = userEvent.setup()
    await renderApp('/')
    expect(await screen.findByText('Tracked products')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /change language/i }))
    await user.click(screen.getByRole('menuitemradio', { name: /русский/i }))

    await waitFor(() => expect(screen.getByText('Отслеживаемые товары')).toBeInTheDocument())
    expect(screen.getByText('Активные поставщики')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('ru')
  })

  it('translates the dashboard into Uzbek', async () => {
    const user = userEvent.setup()
    await renderApp('/')
    await screen.findByText('Tracked products')

    await user.click(screen.getByRole('button', { name: /change language/i }))
    await user.click(screen.getByRole('menuitemradio', { name: /o.zbekcha/i }))

    await waitFor(() => expect(screen.getByText('Kuzatilayotgan mahsulotlar')).toBeInTheDocument())
    expect(document.documentElement.lang).toBe('uz')
  })

  it('localises the product catalogue, including demo product names', async () => {
    const user = userEvent.setup()
    await renderApp('/products')
    await screen.findByText('Cooking oil')

    await user.click(screen.getByRole('button', { name: /change language/i }))
    await user.click(screen.getByRole('menuitemradio', { name: /русский/i }))

    await waitFor(() => expect(screen.getByText('Растительное масло')).toBeInTheDocument())
    expect(screen.getByText('Картофель')).toBeInTheDocument()
  })

  it('keeps the language when navigating between pages', async () => {
    const user = userEvent.setup()
    await renderApp('/')
    await screen.findByText('Tracked products')

    await user.click(screen.getByRole('button', { name: /change language/i }))
    await user.click(screen.getByRole('menuitemradio', { name: /русский/i }))
    await waitFor(() => expect(screen.getByText('Отслеживаемые товары')).toBeInTheDocument())

    await user.click(screen.getByRole('link', { name: /поставщики/i }))
    expect(await screen.findByText('Ташкент')).toBeInTheDocument()
  })

  it('translates the comparison flow including supplier locations', async () => {
    const user = userEvent.setup()
    await renderApp('/compare?product=1&qty=100')
    await screen.findAllByText('400 000 UZS')

    await user.click(screen.getByRole('button', { name: /change language/i }))
    await user.click(screen.getByRole('menuitemradio', { name: /русский/i }))

    await waitFor(() => expect(screen.getAllByText('Фергана').length).toBeGreaterThan(0))
    expect(screen.getByText('Картофель')).toBeInTheDocument()
  })

  it('offers the language control on the sign-in screen too', async () => {
    const user = userEvent.setup()
    installFetchMock()
    window.history.pushState({}, '', '/login')
    render(<App />)
    await screen.findByRole('heading', { name: /sign in to priceradar/i })

    await user.click(screen.getByRole('button', { name: /o.zbekcha/i }))
    await waitFor(() => expect(screen.getByRole('heading', { name: /priceradar’ga kirish/i })).toBeInTheDocument())
  })

  it('restores the saved language on a fresh load', async () => {
    localStorage.setItem('priceradar_lang', 'ru')
    setLanguage('ru')
    await renderApp('/')
    expect(await screen.findByText('Отслеживаемые товары')).toBeInTheDocument()
  })
})
