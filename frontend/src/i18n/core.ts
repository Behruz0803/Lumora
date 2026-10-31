/**
 * Lightweight i18n core for PriceRadar.
 *
 * Design notes
 * ------------
 * - The key IS the English source string (e.g. `tr('Save offer')`). English
 *   therefore needs no dictionary: an unknown key falls back to itself, so a
 *   missing translation can never render a raw key like `common.save`.
 * - `tr()` is a plain module function, not a hook, so it can be used inside
 *   helper modules (formatters, cost summaries) as well as components. The
 *   application root re-mounts on language change (see `main.tsx`), so every
 *   component re-renders with the new language without threading a hook through
 *   5 000 lines of JSX.
 * - `plural()` implements English/Russian plural categories; Uzbek uses a
 *   single form, which is the correct CLDR behaviour for `uz`.
 */
import { en } from './locales/en'
import { ru } from './locales/ru'
import { uz } from './locales/uz'

export type Language = 'en' | 'uz' | 'ru'

export const LANGUAGES: { value: Language; label: string; short: string; locale: string }[] = [
  { value: 'en', label: 'English', short: 'EN', locale: 'en-US' },
  { value: 'uz', label: "O'zbekcha", short: 'UZ', locale: 'uz-UZ' },
  { value: 'ru', label: 'Русский', short: 'RU', locale: 'ru-RU' },
]

export const STORAGE_KEY = 'priceradar_lang'

const DICTIONARIES: Record<Language, Record<string, string>> = { en, uz, ru }

const listeners = new Set<() => void>()

function isLanguage(value: unknown): value is Language {
  return value === 'en' || value === 'uz' || value === 'ru'
}

/** Best-effort detection: stored choice → browser preference → English. */
export function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (isLanguage(stored)) return stored
  } catch {
    /* storage disabled */
  }
  const candidates = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : []
  for (const tag of candidates) {
    const base = (tag || '').toLowerCase().split('-')[0]
    if (isLanguage(base)) return base
  }
  return 'en'
}

let current: Language = typeof window === 'undefined' ? 'en' : detectLanguage()

function applyDocumentLanguage(language: Language) {
  if (typeof document === 'undefined') return
  document.documentElement.lang = language
  const meta = LANGUAGES.find((item) => item.value === language)
  if (meta) document.documentElement.setAttribute('data-locale', meta.locale)
}

applyDocumentLanguage(current)

export function getLanguage(): Language {
  return current
}

export function setLanguage(language: Language, options: { persist?: boolean } = {}) {
  if (!isLanguage(language)) return
  current = language
  applyDocumentLanguage(language)
  if (options.persist !== false) {
    try {
      localStorage.setItem(STORAGE_KEY, language)
    } catch {
      /* storage disabled */
    }
  }
  listeners.forEach((listener) => listener())
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function locale(): string {
  return LANGUAGES.find((item) => item.value === current)?.locale ?? 'en-US'
}

function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  )
}

/** Translate a literal English source string into the active language. */
export function tr(source: string | null | undefined, vars?: Record<string, string | number>): string {
  if (source === null || source === undefined) return ''
  const dictionary = DICTIONARIES[current]
  const translated = dictionary[source]
  if (translated !== undefined) return interpolate(translated, vars)
  // English is the source language; also honour explicit English overrides.
  const override = DICTIONARIES.en[source]
  return interpolate(override ?? source, vars)
}

/** Translate using an explicit language (used by server-side render helpers). */
export function translateFor(language: Language, source: string | null | undefined, vars?: Record<string, string | number>) {
  if (source === null || source === undefined) return ''
  const translated = DICTIONARIES[language][source] ?? DICTIONARIES.en[source] ?? source
  return interpolate(translated, vars)
}

function pluralCategory(count: number): 'one' | 'few' | 'many' {
  if (current === 'en') return count === 1 ? 'one' : 'many'
  if (current !== 'ru') return 'one'
  const mod10 = Math.abs(count) % 10
  const mod100 = Math.abs(count) % 100
  if (mod10 === 1 && mod100 !== 11) return 'one'
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return 'few'
  return 'many'
}

/**
 * Plural-aware noun lookup. Dictionary entries use the keys
 * `<noun>.one`, `<noun>.few`, `<noun>.many`.
 */
export function plural(count: number, noun: string): string {
  const category = pluralCategory(count)
  const dictionary = DICTIONARIES[current]
  return dictionary[`${noun}.${category}`] ?? dictionary[`${noun}.many`] ?? tr(noun)
}

/** All keys referenced by the source dictionaries — used by the coverage test. */
export function dictionaryKeys(language: Language): string[] {
  return Object.keys(DICTIONARIES[language])
}
