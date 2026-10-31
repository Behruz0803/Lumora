import { useEffect, useRef, useState } from 'react'
import { Check, Globe } from 'lucide-react'
import { LANGUAGES, getLanguage, setLanguage, subscribe, type Language } from '../i18n'
import { cn } from '../utils/cn'
import { tr } from '../i18n/core'

interface LanguageSwitcherProps {
  /** Renders a compact icon-only trigger (top bar) or the full control. */
  variant?: 'compact' | 'full'
  className?: string
}

/**
 * Language picker for English, Uzbek and Russian.
 * The choice is stored locally and applied to the whole interface immediately.
 */
export function LanguageSwitcher({ variant = 'compact', className }: LanguageSwitcherProps) {
  const [language, setLanguageState] = useState<Language>(getLanguage())
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => subscribe(() => setLanguageState(getLanguage())), [])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  const active = LANGUAGES.find((item) => item.value === language) ?? LANGUAGES[0]

  const choose = (value: Language) => {
    setLanguage(value)
    setOpen(false)
  }

  if (variant === 'full') {
    return (
      <div className={className}>
        <div
          role="group"
          aria-label={tr("Interface language")}
          className="inline-flex rounded-xl border border-line bg-white p-1"
        >
          {LANGUAGES.map((item) => {
            const isActive = item.value === language
            return (
              <button
                key={item.value}
                type="button"
                onClick={() => choose(item.value)}
                aria-pressed={isActive}
                lang={item.value}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                  isActive ? 'bg-brand-500 text-white shadow-sm' : 'text-ink-soft hover:bg-canvas',
                )}
              >
                {isActive && <Check className="h-3.5 w-3.5" aria-hidden />}
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('relative', className)} ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={tr("Change language")}
        title={tr("Change language")}
        className="flex items-center gap-1.5 rounded-xl border border-line bg-white px-2.5 py-1.5 text-xs font-semibold text-ink-soft transition hover:border-brand-200 hover:bg-brand-50/50"
      >
        <Globe className="h-4 w-4 text-ink-muted" aria-hidden />
        <span>{active.short}</span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label={tr("Language")}
          className="absolute right-0 z-30 mt-2 w-44 overflow-hidden rounded-xl border border-line bg-white shadow-raised"
        >
          {LANGUAGES.map((item) => {
            const isActive = item.value === language
            return (
              <button
                key={item.value}
                type="button"
                role="menuitemradio"
                aria-checked={isActive}
                lang={item.value}
                onClick={() => choose(item.value)}
                className={cn(
                  'flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-sm transition hover:bg-canvas',
                  isActive ? 'font-semibold text-brand-700' : 'text-ink-soft',
                )}
              >
                <span>{item.label}</span>
                <span className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-ink-muted">
                    {item.short}
                  </span>
                  {isActive && <Check className="h-3.5 w-3.5 text-brand-600" aria-hidden />}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
