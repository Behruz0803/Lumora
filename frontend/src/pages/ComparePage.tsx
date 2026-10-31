import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowRight,
  BadgeCheck,
  BookmarkCheck,
  BookmarkPlus,
  Calculator,
  Check,
  Copy,
  Info,
  Loader2,
  Minus,
  Phone,
  Plus,
  Scale,
  Search,
  Sparkles,
  Truck,
  X,
} from 'lucide-react'
import { api, ApiError } from '../services/api'
import type { Comparison, Product, ScoredOffer } from '../types'
import { PageHeader } from '../components/ui/PageHeader'
import { Modal } from '../components/ui/Modal'
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/States'
import { Badge, DemoBadge, Rating, VerifiedBadge } from '../components/ui/Badge'
import { DemoNotice } from '../components/DemoNotice'
import { ProductThumb } from '../components/ProductThumb'
import { useToast } from '../context/ToastContext'
import { useAuth } from '../context/AuthContext'
import { buildOrderSummary } from '../utils/cost'
import { cn } from '../utils/cn'
import { formatQuantity, formatRelativeTime, formatUZS, statusLabel, statusTone } from '../utils/format'

type SortKey = 'total' | 'quality' | 'delivery'
type SelectedProduct = Pick<Product, 'id' | 'name' | 'category' | 'unit' | 'image_url'>

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'total', label: 'Lowest total cost' },
  { key: 'quality', label: 'Best quality' },
  { key: 'delivery', label: 'Fastest delivery' },
]

function defaultQuantity(unit: string): number {
  return unit === 'kg' || unit === 'l' ? 100 : 10
}

export function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const toast = useToast()
  const { user } = useAuth()

  const [term, setTerm] = useState('')
  const [suggestions, setSuggestions] = useState<Product[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [popular, setPopular] = useState<Product[]>([])
  const [product, setProduct] = useState<SelectedProduct | null>(null)

  const [quantityText, setQuantityText] = useState('100')
  const [comparison, setComparison] = useState<Comparison | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sort, setSort] = useState<SortKey>('total')
  const [contactOffer, setContactOffer] = useState<ScoredOffer | null>(null)
  const [savedOfferIds, setSavedOfferIds] = useState<number[]>([])
  const [savingOfferId, setSavingOfferId] = useState<number | null>(null)

  const searchRef = useRef<HTMLDivElement>(null)
  const requestId = useRef(0)
  const lastRequestKey = useRef('')

  const quantity = Number(quantityText)
  const quantityValid = Number.isFinite(quantity) && quantity > 0

  const runComparison = useCallback(
    async (targetProduct: SelectedProduct, targetQuantity: number) => {
      if (!Number.isFinite(targetQuantity) || targetQuantity <= 0) return
      const current = ++requestId.current
      lastRequestKey.current = `${targetProduct.id}:${targetQuantity}`
      setLoading(true)
      setError(null)
      try {
        const data = await api.compare(targetProduct.id, targetQuantity)
        if (current === requestId.current) setComparison(data)
      } catch (err) {
        if (current !== requestId.current) return
        setComparison(null)
        setError(err instanceof ApiError ? err.message : 'Could not calculate the comparison.')
      } finally {
        if (current === requestId.current) setLoading(false)
      }
    },
    [],
  )

  // popular products for the empty state / quick picks
  useEffect(() => {
    let active = true
    api
      .products({ sort: 'suppliers', page_size: 6 })
      .then((data) => {
        if (active) setPopular(data.items)
      })
      .catch(() => undefined)
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    api
      .savedOffers()
      .then((items) => setSavedOfferIds(items.map((item) => item.offer_id)))
      .catch(() => undefined)
  }, [])

  // product search suggestions
  useEffect(() => {
    if (term.trim().length < 2) {
      setSuggestions([])
      return
    }
    let active = true
    const timer = window.setTimeout(async () => {
      try {
        const data = await api.products({ search: term.trim(), page_size: 6 })
        if (active) {
          setSuggestions(data.items)
          setShowSuggestions(true)
        }
      } catch {
        if (active) setSuggestions([])
      }
    }, 250)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [term])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setShowSuggestions(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectProduct = useCallback(
    (next: SelectedProduct, nextQuantity?: number) => {
      const qty = nextQuantity ?? defaultQuantity(next.unit)
      setProduct(next)
      setQuantityText(String(qty))
      setShowSuggestions(false)
      setTerm('')
      setSearchParams({ product: String(next.id), qty: String(qty) }, { replace: true })
      void runComparison(next, qty)
    },
    [runComparison, setSearchParams],
  )

  const loadExample = useCallback(async () => {
    try {
      const results = await api.products({ search: 'Potatoes', page_size: 1 })
      const sample = results.items[0] ?? popular.find((item) => item.name === 'Potatoes')
      if (!sample) {
        setTerm('Potatoes')
        toast.info('Search for Potatoes to run the example.')
        return
      }
      selectProduct(sample, 100)
    } catch {
      toast.error('Could not load the example product.')
    }
  }, [popular, selectProduct, toast])

  // Deep links and external navigation: /compare?product=1&qty=100 or ?search=potato.
  // This must react to URL changes that happen while the page is already mounted
  // (e.g. picking a result in the header search while on the comparison page).
  const currentProductId = useRef<number | null>(null)
  currentProductId.current = product?.id ?? null
  const loadingProductId = useRef<number | null>(null)
  const urlProduct = searchParams.get('product')
  const urlSearch = searchParams.get('search')
  const urlQty = searchParams.get('qty')

  useEffect(() => {
    if (!urlProduct && !urlSearch) return
    const targetId = urlProduct ? Number(urlProduct) : null
    if (targetId !== null && (!Number.isFinite(targetId) || targetId <= 0)) return
    if (targetId !== null && (currentProductId.current === targetId || loadingProductId.current === targetId)) {
      return
    }

    let active = true
    const resolve = async () => {
      try {
        if (targetId !== null) {
          loadingProductId.current = targetId
          const found = await api.product(targetId)
          if (!active) return
          const requested = Number(urlQty)
          const qty = requested > 0 ? requested : defaultQuantity(found.unit)
          setProduct(found)
          setQuantityText(String(qty))
          void runComparison(found, qty)
        } else if (urlSearch) {
          const results = await api.products({ search: urlSearch, page_size: 1 })
          if (active && results.items[0]) selectProduct(results.items[0], Number(urlQty) || undefined)
        }
      } catch (err) {
        if (!active) return
        setError(err instanceof ApiError ? err.message : 'Could not load that product.')
      } finally {
        loadingProductId.current = null
      }
    }
    void resolve()
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlProduct, urlSearch])

  // Live recalculation when the quantity changes
  useEffect(() => {
    if (!product || !quantityValid) return
    const timer = window.setTimeout(() => {
      setSearchParams({ product: String(product.id), qty: String(quantity) }, { replace: true })
      // Skip a redundant request when this exact comparison was just loaded (e.g. from a deep link).
      if (lastRequestKey.current === `${product.id}:${quantity}`) return
      void runComparison(product, quantity)
    }, 400)
    return () => window.clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quantity, product])

  const sortedOffers = useMemo(() => {
    if (!comparison) return []
    const eligible = comparison.offers.filter((offer) => offer.eligible)
    const rejected = comparison.offers.filter((offer) => !offer.eligible)
    if (sort === 'quality') {
      eligible.sort((a, b) => b.rating - a.rating || a.total_cost - b.total_cost)
    } else if (sort === 'delivery') {
      eligible.sort((a, b) => a.delivery_days - b.delivery_days || a.total_cost - b.total_cost)
    } else {
      eligible.sort((a, b) => a.total_cost - b.total_cost || b.rating - a.rating)
    }
    rejected.sort((a, b) => a.total_cost - b.total_cost)
    return [...eligible, ...rejected]
  }, [comparison, sort])

  const handleSave = async (offer: ScoredOffer) => {
    if (savingOfferId) return
    setSavingOfferId(offer.offer_id)
    try {
      await api.saveOffer(offer.offer_id)
      setSavedOfferIds((ids) => [...ids, offer.offer_id])
      toast.success(`Offer from ${offer.supplier_name} saved for later.`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setSavedOfferIds((ids) => [...ids, offer.offer_id])
        toast.info('This offer is already in your saved offers.')
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Could not save this offer.')
      }
    } finally {
      setSavingOfferId(null)
    }
  }

  const steps = [
    { label: 'Search product', done: Boolean(product) },
    { label: 'Set quantity', done: Boolean(product) && quantityValid },
    { label: 'Compare totals', done: Boolean(comparison) },
    { label: 'Contact supplier', done: Boolean(contactOffer) },
  ]
  const currentStep = steps.findIndex((step) => !step.done)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Core workflow"
        title="Price Comparison"
        description="Compare every supplier offer by total purchasing cost — unit price × quantity plus delivery — before you buy."
        actions={
          <button
            type="button"
            className="btn-secondary"
            onClick={() => void loadExample()}
          >
            <Sparkles className="h-4 w-4 text-brand-600" />
            Load 100 kg potato example
          </button>
        }
      />

      {/* Guided flow steps */}
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-2 text-xs">
        {steps.map((step, index) => (
          <li key={step.label} className="flex items-center gap-2">
            <span
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold',
                step.done
                  ? 'border-brand-500 bg-brand-500 text-white'
                  : index === currentStep
                    ? 'border-brand-400 bg-brand-50 text-brand-700'
                    : 'border-line bg-white text-ink-muted',
              )}
            >
              {step.done ? <Check className="h-3 w-3" aria-hidden /> : index + 1}
            </span>
            <span className={cn(step.done ? 'font-medium text-ink' : 'text-ink-muted')}>{step.label}</span>
            {index < steps.length - 1 && <span className="mx-1 h-px w-4 bg-line sm:w-6" aria-hidden />}
          </li>
        ))}
      </ol>

      {/* Search + quantity */}
      <div className="card p-5">
        <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
          <div ref={searchRef} className="relative">
            <label htmlFor="product-search" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              1. Which product do you need?
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" aria-hidden />
              <input
                id="product-search"
                value={term}
                onChange={(event) => setTerm(event.target.value)}
                onFocus={() => term.trim().length >= 2 && setShowSuggestions(true)}
                placeholder={product ? product.name : 'Search potatoes, rice, cooking oil…'}
                autoComplete="off"
                className="field py-3 pl-10 pr-10 text-[15px]"
                aria-expanded={showSuggestions}
                aria-controls="product-suggestions"
                role="combobox"
              />
              {product && !term && (
                <button
                  type="button"
                  onClick={() => {
                    setProduct(null)
                    setComparison(null)
                    setTerm('')
                    setSearchParams({}, { replace: true })
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-muted transition hover:bg-canvas hover:text-ink"
                  aria-label="Clear selected product"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {showSuggestions && term.trim().length >= 2 && (
              <div
                id="product-suggestions"
                role="listbox"
                className="absolute left-0 right-0 top-[calc(100%+6px)] z-30 overflow-hidden rounded-xl border border-line bg-white shadow-raised"
              >
                {suggestions.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-ink-muted">No products match “{term}”.</p>
                ) : (
                  <ul className="max-h-72 divide-y divide-line/70 overflow-y-auto">
                    {suggestions.map((item) => (
                      <li key={item.id}>
                        <button
                          type="button"
                          role="option"
                          aria-selected={product?.id === item.id}
                          onClick={() => selectProduct(item)}
                          className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-brand-50/60"
                        >
                          <ProductThumb
                            src={item.image_url}
                            alt={item.name}
                            category={item.category}
                            className="h-9 w-9"
                          />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">{item.name}</span>
                            <span className="block text-[11px] text-ink-muted">
                              {item.category} · {item.available_supplier_count} suppliers
                            </span>
                          </span>
                          <span className="shrink-0 text-xs font-semibold text-brand-700">
                            {formatUZS(item.avg_price)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {!product && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="py-1 text-[11px] font-medium text-ink-muted">Popular:</span>
                {popular.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => selectProduct(item)}
                    className="chip"
                  >
                    {item.name}
                  </button>
                ))}
                {popular.length === 0 &&
                  ['Potatoes', 'Tomatoes', 'Rice', 'Sugar'].map((name) => (
                    <button
                      key={name}
                      type="button"
                      className="chip opacity-60"
                      onClick={() => setTerm(name)}
                    >
                      {name}
                    </button>
                  ))}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="quantity" className="mb-1.5 block text-xs font-semibold text-ink-soft">
              2. How much do you need?
            </label>
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  id="quantity"
                  type="number"
                  min={0.01}
                  step="any"
                  inputMode="decimal"
                  value={quantityText}
                  onChange={(event) => setQuantityText(event.target.value)}
                  className={cn(
                    'field py-3 pr-16 text-[15px]',
                    !quantityValid && 'border-danger/50',
                  )}
                  aria-invalid={!quantityValid}
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-ink-muted">
                  {product?.unit ?? 'unit'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setQuantityText(String(Math.max(1, Math.round(quantity / 2) || 1)))}
                  className="btn-secondary px-2.5 py-3"
                  aria-label="Halve quantity"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setQuantityText(String(Math.round(quantity * 2) || 1))}
                  className="btn-secondary px-2.5 py-3"
                  aria-label="Double quantity"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[25, 50, 100, 250].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setQuantityText(String(preset))}
                  className={cn('chip', Number(quantityText) === preset && 'chip-active')}
                >
                  {preset} {product?.unit ?? ''}
                </button>
              ))}
              {product && (
                <button
                  type="button"
                  onClick={() => void runComparison(product, quantity)}
                  disabled={!quantityValid || loading}
                  className="chip ml-auto border-brand-300 text-brand-700"
                >
                  {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Calculator className="h-3 w-3" />}
                  Recalculate
                </button>
              )}
            </div>
            {!quantityValid && (
              <p className="mt-1.5 text-xs text-danger">Enter a quantity greater than zero.</p>
            )}
          </div>
        </div>
      </div>

      {!product && (
        <EmptyState
          title="Pick a product to compare supplier offers"
          message="Search for a product and enter the quantity you need. PriceRadar calculates the total cost including delivery for every eligible supplier."
          icon={<Scale className="h-5 w-5" />}
          action={
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                const sample = popular.find((item) => item.name === 'Potatoes') ?? popular[0]
                if (sample) selectProduct(sample, defaultQuantity(sample.unit))
              }}
              disabled={popular.length === 0}
            >
              <Sparkles className="h-4 w-4" />
              Try the 100 kg potato example
            </button>
          }
        />
      )}

      {product && error && <ErrorState message={error} onRetry={() => void runComparison(product, quantity)} />}

      {product && loading && !comparison && <LoadingBlock label="Calculating total costs…" rows={3} />}

      {product && comparison && (
        <div className="space-y-5">
          {/* Recommendation summary */}
          <div className="overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-card">
            <div className="flex flex-col gap-4 border-b border-brand-100 bg-gradient-to-r from-brand-50 to-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <ProductThumb
                  src={comparison.product.image_url}
                  alt={comparison.product.name}
                  category={comparison.product.category}
                  className="h-12 w-12"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-base font-semibold text-ink">{comparison.product.name}</h2>
                    <DemoBadge />
                  </div>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {formatQuantity(comparison.quantity, comparison.unit)} ·{' '}
                    {comparison.eligible_count} eligible of {comparison.offers.length} suppliers ·{' '}
                    {comparison.rejected_count} excluded
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/products/${comparison.product.id}`}
                  className="btn-secondary px-3 py-2 text-xs"
                >
                  Product details
                </Link>
                <button
                  type="button"
                  onClick={() => void runComparison(product, quantity)}
                  className="btn-secondary px-3 py-2 text-xs"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Calculator className="h-3.5 w-3.5" />}
                  Refresh
                </button>
              </div>
            </div>

            {comparison.recommended ? (
              <div className="grid gap-5 p-5 lg:grid-cols-[1.15fr_1fr]">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge tone="green">
                      <Sparkles className="h-3 w-3" aria-hidden />
                      Recommended · lowest total cost
                    </Badge>
                    {comparison.recommended.is_best_overall && (
                      <Badge tone="blue">Also best overall</Badge>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap items-baseline gap-3">
                    <p className="text-3xl font-semibold tracking-tight text-ink">
                      {formatUZS(comparison.recommended.total_cost)}
                    </p>
                    <p className="text-xs text-ink-muted">
                      total for {formatQuantity(comparison.quantity, comparison.unit)}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-ink-soft">
                    <span className="font-semibold text-ink">{comparison.recommended.supplier_name}</span>{' '}
                    · {comparison.recommended.location}
                  </p>

                  <dl className="mt-4 space-y-2 rounded-xl border border-line bg-canvas/60 p-3.5 text-sm">
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-ink-muted">
                        {formatUZS(comparison.recommended.unit_price)} ×{' '}
                        {formatQuantity(comparison.quantity, comparison.unit)}
                      </dt>
                      <dd className="font-medium text-ink">{formatUZS(comparison.recommended.product_cost)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-ink-muted">Delivery</dt>
                      <dd className="font-medium text-ink">
                        {comparison.recommended.delivery_cost === 0
                          ? 'Free'
                          : formatUZS(comparison.recommended.delivery_cost)}
                      </dd>
                    </div>
                    <div className="flex items-center justify-between gap-3 border-t border-line pt-2">
                      <dt className="font-semibold text-ink">Total cost</dt>
                      <dd className="font-semibold text-ink">{formatUZS(comparison.recommended.total_cost)}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <dt className="text-ink-muted">Delivered cost per {comparison.unit}</dt>
                      <dd className="font-medium text-ink">
                        {formatUZS(comparison.recommended.cost_per_unit)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
                    <Rating value={comparison.recommended.rating} />
                    <VerifiedBadge verified={comparison.recommended.is_verified} />
                    <Badge tone={statusTone[comparison.recommended.status]}>
                      {statusLabel[comparison.recommended.status]}
                    </Badge>
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" aria-hidden />
                      {comparison.recommended.delivery_days} day delivery
                    </span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setContactOffer(comparison.recommended)}
                      className="btn-primary"
                    >
                      <Phone className="h-4 w-4" />
                      Contact supplier
                      <ArrowRight className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => comparison.recommended && void handleSave(comparison.recommended)}
                      disabled={savedOfferIds.includes(comparison.recommended.offer_id)}
                      className="btn-secondary"
                    >
                      {savedOfferIds.includes(comparison.recommended.offer_id) ? (
                        <>
                          <BookmarkCheck className="h-4 w-4 text-brand-600" />
                          Saved
                        </>
                      ) : (
                        <>
                          <BookmarkPlus className="h-4 w-4" />
                          Save offer
                        </>
                      )}
                    </button>
                    <Link
                      to={`/suppliers/${comparison.recommended.supplier_id}`}
                      className="btn-ghost"
                    >
                      Supplier profile
                    </Link>
                  </div>
                </div>

                <div className="space-y-3">
                  {comparison.potential_savings > 0 && (
                    <div className="rounded-xl border border-brand-200 bg-brand-50/70 p-4">
                      <p className="label text-brand-700">You save on this order</p>
                      <p className="mt-1 text-2xl font-semibold text-brand-800">
                        {formatUZS(comparison.potential_savings)}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-brand-900/70">
                        Compared with the most expensive eligible offer (
                        {formatUZS(comparison.highest_eligible_total)}). Same product, same quantity.
                      </p>
                    </div>
                  )}

                  <div className="rounded-xl border border-line bg-white p-4">
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4 text-brand-600" aria-hidden />
                      <p className="text-xs font-semibold text-ink">Why this recommendation</p>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-soft">{comparison.explanation}</p>
                  </div>

                  {comparison.best_overall &&
                    comparison.cheapest &&
                    comparison.best_overall.offer_id !== comparison.cheapest.offer_id && (
                      <div className="rounded-xl border border-[#C7D9EC] bg-[#F3F8FD] p-4">
                        <p className="text-xs font-semibold text-[#2C5C8F]">Best overall alternative</p>
                        <p className="mt-1 text-sm font-semibold text-ink">
                          {comparison.best_overall.supplier_name} ·{' '}
                          {formatUZS(comparison.best_overall.total_cost)}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-ink-soft">
                          Rating {comparison.best_overall.rating.toFixed(1)}/5,{' '}
                          {comparison.best_overall.delivery_days} day delivery,{' '}
                          {comparison.best_overall.is_verified ? 'verified supplier' : 'not yet verified'}. A
                          quality and delivery premium of{' '}
                          {formatUZS(comparison.best_overall.total_cost - comparison.recommended.total_cost)}.
                        </p>
                        <button
                          type="button"
                          onClick={() => setContactOffer(comparison.best_overall)}
                          className="mt-2.5 text-xs font-semibold text-[#2C5C8F] underline-offset-2 hover:underline"
                        >
                          View this option
                        </button>
                      </div>
                    )}
                </div>
              </div>
            ) : (
              <div className="p-5">
                <div className="flex items-start gap-3 rounded-xl border border-warning/30 bg-warning/[0.07] p-4">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#96651B]" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold text-ink">No supplier can fulfil this order</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-soft">{comparison.explanation}</p>
                  </div>
                </div>
              </div>
            )}
            <div className="border-t border-line px-5 py-3">
              <DemoNotice compact />
            </div>
          </div>

          {/* Offers table */}
          <div className="card overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-sm font-semibold text-ink">All supplier offers</h3>
                <p className="mt-0.5 text-xs text-ink-muted">
                  Total cost = unit price × quantity + delivery. Ineligible offers are shown but never ranked.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    type="button"
                    onClick={() => setSort(option.key)}
                    aria-pressed={sort === option.key}
                    className={cn('chip', sort === option.key && 'chip-active')}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="table-base">
                <thead>
                  <tr>
                    <th className="w-12">#</th>
                    <th>Supplier</th>
                    <th className="text-right">Unit price</th>
                    <th className="text-right">Delivery</th>
                    <th className="text-right">Min. order</th>
                    <th className="text-right">Available</th>
                    <th className="text-right">Total cost</th>
                    <th className="text-right">Per {comparison.unit}</th>
                    <th>Updated</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedOffers.map((offer) => {
                    const isSaved = savedOfferIds.includes(offer.offer_id)
                    return (
                      <tr
                        key={offer.offer_id}
                        className={cn(
                          'transition-colors',
                          offer.is_cheapest ? 'bg-brand-50/50' : 'hover:bg-canvas/60',
                          !offer.eligible && 'bg-canvas/40 text-ink-muted',
                        )}
                      >
                        <td>
                          {offer.eligible ? (
                            <span
                              className={cn(
                                'flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold',
                                offer.is_cheapest
                                  ? 'bg-brand-500 text-white'
                                  : 'bg-canvas text-ink-muted',
                              )}
                            >
                              {offer.rank}
                            </span>
                          ) : (
                            <span className="flex h-6 w-6 items-center justify-center rounded-full border border-line text-[11px] text-ink-muted">
                              –
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Link
                              to={`/suppliers/${offer.supplier_id}`}
                              className="font-medium text-ink underline-offset-2 hover:text-brand-700 hover:underline"
                            >
                              {offer.supplier_name}
                            </Link>
                            {offer.is_cheapest && <Badge tone="green">Lowest total</Badge>}
                            {offer.is_best_overall && !offer.is_cheapest && (
                              <Badge tone="blue">Best overall</Badge>
                            )}
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-ink-muted">
                            <span>{offer.location}</span>
                            <Rating value={offer.rating} />
                            {offer.is_verified && (
                              <span className="inline-flex items-center gap-0.5 text-brand-700">
                                <BadgeCheck className="h-3 w-3" aria-hidden /> Verified
                              </span>
                            )}
                          </div>
                          {!offer.eligible && (
                            <p className="mt-1 max-w-xs text-[11px] font-medium text-danger/80">{offer.reason}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap text-right font-medium text-ink">
                          {formatUZS(offer.unit_price)}
                        </td>
                        <td className="whitespace-nowrap text-right">
                          {offer.delivery_cost === 0 ? (
                            <Badge tone="green">Free</Badge>
                          ) : (
                            formatUZS(offer.delivery_cost)
                          )}
                        </td>
                        <td className="whitespace-nowrap text-right">
                          {formatQuantity(offer.minimum_order_quantity)} {comparison.unit}
                        </td>
                        <td className="whitespace-nowrap text-right">
                          <span className={cn(!offer.eligible && 'text-danger/80')}>
                            {formatQuantity(offer.available_quantity)} {comparison.unit}
                          </span>
                        </td>
                        <td className="whitespace-nowrap text-right">
                          <span
                            className={cn(
                              'font-semibold',
                              offer.is_cheapest ? 'text-brand-700' : 'text-ink',
                              !offer.eligible && 'text-ink-muted line-through',
                            )}
                          >
                            {formatUZS(offer.total_cost)}
                          </span>
                          {offer.difference_vs_best !== null && offer.difference_vs_best > 0 && (
                            <span className="block text-[11px] text-ink-muted">
                              +{formatUZS(offer.difference_vs_best)}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap text-right text-xs">
                          {formatUZS(offer.cost_per_unit)}
                        </td>
                        <td className="whitespace-nowrap text-xs text-ink-muted">
                          <span title={new Date(offer.updated_at).toLocaleString()}>
                            {formatRelativeTime(offer.updated_at)}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setContactOffer(offer)}
                              className={cn(
                                'btn px-2.5 py-1.5 text-xs',
                                offer.eligible
                                  ? 'bg-brand-500 text-white hover:bg-brand-600'
                                  : 'border border-line bg-white text-ink-soft',
                              )}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              Contact
                            </button>
                            <button
                              type="button"
                              onClick={() => void handleSave(offer)}
                              disabled={isSaved || savingOfferId === offer.offer_id}
                              className="btn-secondary px-2 py-1.5"
                              aria-label={isSaved ? 'Offer saved' : `Save offer from ${offer.supplier_name}`}
                              title={isSaved ? 'Saved' : 'Save offer'}
                            >
                              {isSaved ? (
                                <BookmarkCheck className="h-3.5 w-3.5 text-brand-600" />
                              ) : (
                                <BookmarkPlus className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* mobile cards */}
            <ul className="divide-y divide-line md:hidden">
              {sortedOffers.map((offer) => {
                const isSaved = savedOfferIds.includes(offer.offer_id)
                return (
                  <li key={offer.offer_id} className={cn('p-4', offer.is_cheapest && 'bg-brand-50/40')}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-ink">{offer.supplier_name}</span>
                          {offer.is_cheapest && <Badge tone="green">Lowest total</Badge>}
                        </div>
                        <p className="mt-0.5 text-[11px] text-ink-muted">
                          {offer.location} · {offer.rating.toFixed(1)}/5 ·{' '}
                          {offer.is_verified ? 'Verified' : 'Unverified'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p
                          className={cn(
                            'text-sm font-semibold',
                            offer.is_cheapest ? 'text-brand-700' : 'text-ink',
                            !offer.eligible && 'text-ink-muted line-through',
                          )}
                        >
                          {formatUZS(offer.total_cost)}
                        </p>
                        <p className="text-[11px] text-ink-muted">total</p>
                      </div>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-ink-muted">
                      <span>Unit: {formatUZS(offer.unit_price)}</span>
                      <span>Delivery: {offer.delivery_cost === 0 ? 'Free' : formatUZS(offer.delivery_cost)}</span>
                      <span>Min: {formatQuantity(offer.minimum_order_quantity)} {comparison.unit}</span>
                      <span>Stock: {formatQuantity(offer.available_quantity)} {comparison.unit}</span>
                      <span>Per {comparison.unit}: {formatUZS(offer.cost_per_unit)}</span>
                      <span>Delivery: {offer.delivery_days} day(s)</span>
                      <span>Updated: {formatRelativeTime(offer.updated_at)}</span>
                    </div>
                    {!offer.eligible && (
                      <p className="mt-2 text-[11px] font-medium text-danger/80">{offer.reason}</p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setContactOffer(offer)}
                        className={cn(
                          'btn flex-1 px-3 py-2 text-xs',
                          offer.eligible
                            ? 'bg-brand-500 text-white hover:bg-brand-600'
                            : 'border border-line bg-white text-ink-soft',
                        )}
                      >
                        <Phone className="h-3.5 w-3.5" />
                        Contact supplier
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleSave(offer)}
                        disabled={isSaved}
                        className="btn-secondary px-3 py-2"
                        aria-label={isSaved ? 'Offer saved' : 'Save offer'}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="h-4 w-4 text-brand-600" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      )}

      <ContactSupplierModal
        offer={contactOffer}
        comparison={comparison}
        businessName={user?.business_name}
        onClose={() => setContactOffer(null)}
        onSave={handleSave}
        saved={contactOffer ? savedOfferIds.includes(contactOffer.offer_id) : false}
      />
    </div>
  )
}

function ContactSupplierModal({
  offer,
  comparison,
  businessName,
  onClose,
  onSave,
  saved,
}: {
  offer: ScoredOffer | null
  comparison: Comparison | null
  businessName?: string | null
  onClose: () => void
  onSave: (offer: ScoredOffer) => Promise<void>
  saved: boolean
}) {
  const toast = useToast()
  if (!offer || !comparison) return null

  const savings = Math.max(0, (comparison.highest_eligible_total ?? offer.total_cost) - offer.total_cost)
  const summary = buildOrderSummary({
    productName: comparison.product.name,
    unit: comparison.unit,
    quantity: comparison.quantity,
    supplierName: offer.supplier_name,
    location: offer.location,
    phone: offer.phone,
    unitPrice: offer.unit_price,
    deliveryCost: offer.delivery_cost,
    total: offer.total_cost,
    savings,
    businessName,
  })

  const copy = async (text: string, message: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success(message)
    } catch {
      toast.error('Clipboard is not available in this browser. Please copy manually.')
    }
  }

  return (
    <Modal
      open={Boolean(offer)}
      onClose={onClose}
      title={`Contact ${offer.supplier_name}`}
      description="Purchase summary for this order. Demo contact details — prices are fictional."
      size="lg"
      footer={
        <>
          <button type="button" onClick={onClose} className="btn-secondary">
            Close
          </button>
          <button
            type="button"
            onClick={() => void copy(summary, 'Purchase order summary copied to clipboard.')}
            className="btn-secondary"
          >
            <Copy className="h-4 w-4" />
            Copy order
          </button>
          <a href={`tel:${offer.phone.replace(/\s/g, '')}`} className="btn-primary">
            <Phone className="h-4 w-4" />
            Call supplier
          </a>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-4">
          <p className="label text-brand-700">Total purchase cost</p>
          <p className="mt-1 text-3xl font-semibold tracking-tight text-ink">{formatUZS(offer.total_cost)}</p>
          <p className="mt-1 text-xs text-ink-soft">
            {formatQuantity(comparison.quantity, comparison.unit)} of {comparison.product.name} from{' '}
            {offer.supplier_name}, {offer.location}.
          </p>
        </div>

        <dl className="divide-y divide-line rounded-xl border border-line">
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <dt className="text-ink-muted">
              Unit price × quantity ({formatQuantity(comparison.quantity, comparison.unit)})
            </dt>
            <dd className="font-medium text-ink">{formatUZS(offer.product_cost)}</dd>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <dt className="text-ink-muted">Delivery</dt>
            <dd className="font-medium text-ink">
              {offer.delivery_cost === 0 ? 'Free' : formatUZS(offer.delivery_cost)}
            </dd>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <dt className="font-semibold text-ink">Total cost</dt>
            <dd className="font-semibold text-ink">{formatUZS(offer.total_cost)}</dd>
          </div>
          <div className="flex items-center justify-between px-4 py-2.5 text-sm">
            <dt className="text-ink-muted">Delivered cost per {comparison.unit}</dt>
            <dd className="font-medium text-ink">{formatUZS(offer.cost_per_unit)}</dd>
          </div>
          {savings > 0 && (
            <div className="flex items-center justify-between px-4 py-2.5 text-sm">
              <dt className="text-brand-700">Saving vs most expensive eligible offer</dt>
              <dd className="font-semibold text-brand-700">{formatUZS(savings)}</dd>
            </div>
          )}
        </dl>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-line p-4">
            <p className="label">Supplier contact</p>
            <p className="mt-1.5 text-sm font-semibold text-ink">{offer.supplier_name}</p>
            <p className="text-xs text-ink-muted">{offer.location}</p>
            <a
              href={`tel:${offer.phone.replace(/\s/g, '')}`}
              className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-brand-700 hover:underline"
            >
              <Phone className="h-3.5 w-3.5" aria-hidden />
              {offer.phone}
            </a>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <VerifiedBadge verified={offer.is_verified} />
              <Badge tone={statusTone[offer.status]}>{statusLabel[offer.status]}</Badge>
            </div>
          </div>
          <div className="rounded-xl border border-line p-4">
            <p className="label">Order terms</p>
            <ul className="mt-1.5 space-y-1 text-xs text-ink-soft">
              <li>Minimum order: {formatQuantity(offer.minimum_order_quantity)} {comparison.unit}</li>
              <li>Available now: {formatQuantity(offer.available_quantity)} {comparison.unit}</li>
              <li>Delivery time: {offer.delivery_days} day(s)</li>
              <li>Supplier rating: {offer.rating.toFixed(1)} / 5</li>
            </ul>
          </div>
        </div>

        <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded-xl border border-line bg-canvas p-4 text-[11px] leading-relaxed text-ink-soft">
{summary}
        </pre>

        <div className="flex flex-wrap items-center justify-between gap-2">
          <DemoNotice compact className="flex-1" />
          <button
            type="button"
            onClick={() => void onSave(offer)}
            disabled={saved}
            className="btn-secondary shrink-0"
          >
            {saved ? <BookmarkCheck className="h-4 w-4 text-brand-600" /> : <BookmarkPlus className="h-4 w-4" />}
            {saved ? 'Saved' : 'Save offer'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
