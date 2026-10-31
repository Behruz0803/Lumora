import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Search, TrendingUp } from 'lucide-react'
import { api } from '../services/api'
import type { Product } from '../types'
import { formatUZS } from '../utils/format'
import { ProductThumb } from './ProductThumb'
import { tr } from '../i18n/core'

/** Header search: finds products and jumps straight into the comparison flow. */
export function GlobalSearch() {
  const [term, setTerm] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (term.trim().length < 2) {
      setResults([])
      setLoading(false)
      return
    }
    let active = true
    setLoading(true)
    const timer = window.setTimeout(async () => {
      try {
        const data = await api.products({ search: term.trim(), page_size: 5 })
        if (active) {
          setResults(data.items)
          setOpen(true)
        }
      } catch {
        if (active) setResults([])
      } finally {
        if (active) setLoading(false)
      }
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [term])

  const goToCompare = (product: Product) => {
    setOpen(false)
    setTerm('')
    navigate(`/compare?product=${product.id}&qty=100`)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-md">
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
      <input
        value={term}
        onChange={(event) => setTerm(event.target.value)}
        onFocus={() => term.trim().length >= 2 && setOpen(true)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && results[0]) goToCompare(results[0])
          if (event.key === 'Escape') setOpen(false)
        }}
        placeholder={tr("Search products to compare…")}
        aria-label={tr("Search products")}
        className="field bg-canvas/70 pl-10 pr-9 focus:bg-white"
      />
      {loading && (
        <Loader2
          className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-muted"
          aria-hidden
        />
      )}
      {open && term.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] z-40 overflow-hidden rounded-xl border border-line bg-white shadow-raised">
          {results.length === 0 && !loading ? (
            <p className="px-4 py-3 text-sm text-ink-muted">{tr("No products match “")}{term}”.</p>
          ) : (
            <ul className="divide-y divide-line/70">
              {results.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => goToCompare(product)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-brand-50/60"
                  >
                    <ProductThumb
                      src={product.image_url}
                      alt={tr(product.name)}
                      category={product.category}
                      className="h-9 w-9"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-ink">{tr(product.name)}</span>
                      <span className="block truncate text-[11px] text-ink-muted">
                        {product.category} · {product.available_supplier_count} {tr("suppliers")}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-semibold text-brand-700">
                      {formatUZS(product.avg_price)}
                    </span>
                    <TrendingUp className="h-3.5 w-3.5 shrink-0 text-ink-muted" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
