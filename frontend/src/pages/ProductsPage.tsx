import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Filter, Package, PackageSearch, RotateCcw } from 'lucide-react'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useDebounce } from '../hooks/useDebounce'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/States'
import { Badge, DemoBadge } from '../components/ui/Badge'
import { ProductThumb } from '../components/ProductThumb'
import { DemoNotice } from '../components/DemoNotice'
import { formatRelativeTime, formatUZS, statusLabel, statusTone } from '../utils/format'
import { cn } from '../utils/cn'

const SORT_OPTIONS = [
  { value: 'name', label: 'Name (A–Z)' },
  { value: 'price_asc', label: 'Lowest average price' },
  { value: 'price_desc', label: 'Highest average price' },
  { value: 'suppliers', label: 'Most suppliers' },
  { value: 'updated', label: 'Recently updated' },
]

const PAGE_SIZE = 12

export function ProductsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState(searchParams.get('category') ?? 'all')
  const [availability, setAvailability] = useState('all')
  const [sort, setSort] = useState('name')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 350)

  const categories = useApi(() => api.categories(), [])
  const { data, loading, error, refetch } = useApi(
    () =>
      api.products({
        search: debouncedSearch || undefined,
        category: category === 'all' ? undefined : category,
        availability: availability === 'all' ? undefined : availability,
        sort,
        page,
        page_size: PAGE_SIZE,
      }),
    [debouncedSearch, category, availability, sort, page],
  )

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, category, availability, sort])

  // Keep the category in the URL so deep links (e.g. from a supplier profile) work and are shareable.
  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if (category === 'all') next.delete('category')
    else next.set('category', category)
    setSearchParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category])

  const filtersActive = Boolean(search) || category !== 'all' || availability !== 'all' || sort !== 'name'

  const resetFilters = () => {
    setSearch('')
    setCategory('all')
    setAvailability('all')
    setSort('name')
    setPage(1)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Every product tracked by PriceRadar, with average market price, supplier coverage and availability."
        actions={<DemoBadge />}
      />

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search products by name, category or description…"
            className="flex-1"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="availability" className="sr-only">
              Availability
            </label>
            <select
              id="availability"
              value={availability}
              onChange={(event) => setAvailability(event.target.value)}
              className="field w-auto min-w-[150px] py-2.5"
            >
              <option value="all">All availability</option>
              <option value="in_stock">In stock</option>
              <option value="low_stock">Low stock</option>
              <option value="out_of_stock">Out of stock</option>
            </select>
            <label htmlFor="sort" className="sr-only">
              Sort products
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="field w-auto min-w-[180px] py-2.5"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {filtersActive && (
              <button type="button" onClick={resetFilters} className="btn-secondary py-2.5 text-xs">
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="flex shrink-0 items-center gap-1.5 pr-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">
            <Filter className="h-3 w-3" aria-hidden />
            Category
          </span>
          <button
            type="button"
            onClick={() => setCategory('all')}
            aria-pressed={category === 'all'}
            className={cn('chip shrink-0', category === 'all' && 'chip-active')}
          >
            All products
          </button>
          {(categories.data ?? []).map((item) => (
            <button
              key={item.category}
              type="button"
              onClick={() => setCategory(item.category)}
              aria-pressed={category === item.category}
              className={cn('chip shrink-0', category === item.category && 'chip-active')}
            >
              {item.category}
              <span className={cn('text-[10px]', category === item.category ? 'text-white/70' : 'text-ink-muted')}>
                {item.product_count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}
      {loading && !data && <LoadingBlock rows={4} label="Loading products…" />}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={<PackageSearch className="h-5 w-5" />}
          title="No products match your filters"
          message="Try a different search term, category or availability filter."
          action={
            <button type="button" className="btn-primary" onClick={resetFilters}>
              Clear filters
            </button>
          }
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-xs text-ink-muted">
              <span className="font-semibold text-ink">{data.total}</span> product
              {data.total === 1 ? '' : 's'}
              {category !== 'all' && ` in ${category}`}
            </p>
            <p className="hidden text-[11px] text-ink-muted sm:block">Average prices exclude out-of-stock offers</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
            {data.items.map((product) => (
              <article key={product.id} className="card-interactive group flex flex-col overflow-hidden">
                <Link to={`/products/${product.id}`} className="flex flex-1 flex-col p-4">
                  <div className="flex items-start gap-3">
                    <ProductThumb
                      src={product.image_url}
                      alt={product.name}
                      category={product.category}
                      className="h-14 w-14"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="truncate text-sm font-semibold text-ink group-hover:text-brand-700">
                          {product.name}
                        </h3>
                        <Badge tone={statusTone[product.availability]}>{statusLabel[product.availability]}</Badge>
                      </div>
                      <p className="mt-0.5 text-[11px] text-ink-muted">{product.category}</p>
                      <p className="mt-2 text-lg font-semibold tracking-tight text-ink">
                        {formatUZS(product.avg_price)}
                        <span className="ml-1 text-[11px] font-normal text-ink-muted">
                          avg / {product.unit}
                        </span>
                      </p>
                    </div>
                  </div>

                  <dl className="mt-3.5 grid grid-cols-2 gap-2 rounded-lg border border-line/70 bg-canvas/50 p-2.5 text-[11px]">
                    <div>
                      <dt className="text-ink-muted">Suppliers</dt>
                      <dd className="font-semibold text-ink">
                        {product.available_supplier_count} / {product.offer_count}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">Range</dt>
                      <dd className="font-semibold text-ink">
                        {product.min_price ? formatUZS(product.min_price).replace(' UZS', '') : '—'}–
                        {product.max_price ? formatUZS(product.max_price).replace(' UZS', '') : '—'}
                      </dd>
                    </div>
                  </dl>

                  <p className="mt-2.5 text-[11px] text-ink-muted">
                    Updated {formatRelativeTime(product.updated_at)}
                  </p>
                </Link>

                <div className="flex gap-2 border-t border-line px-4 py-3">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        `/compare?product=${product.id}&qty=${
                          product.unit === 'kg' || product.unit === 'l' ? 100 : 10
                        }`,
                      )
                    }
                    className="btn-primary flex-1 px-3 py-2 text-xs"
                  >
                    Compare offers
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <Link to={`/products/${product.id}`} className="btn-secondary px-3 py-2 text-xs">
                    Details
                  </Link>
                </div>
              </article>
            ))}
          </div>

          <Pagination
            page={data.page}
            pages={data.pages}
            total={data.total}
            pageSize={data.page_size}
            onPageChange={(next) => {
              setPage(next)
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
          />
        </>
      )}

      <div className="flex items-center gap-2">
        <Package className="h-3.5 w-3.5 text-ink-muted" aria-hidden />
        <DemoNotice compact className="flex-1" />
      </div>
    </div>
  )
}
