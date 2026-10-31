import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, BadgeCheck, MapPin, Phone, RotateCcw, Store, Truck } from 'lucide-react'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useDebounce } from '../hooks/useDebounce'
import { PageHeader } from '../components/ui/PageHeader'
import { SearchInput } from '../components/ui/SearchInput'
import { Pagination } from '../components/ui/Pagination'
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/States'
import { DemoBadge, Rating, VerifiedBadge } from '../components/ui/Badge'
import { DemoNotice } from '../components/DemoNotice'
import { cn } from '../utils/cn'

const PAGE_SIZE = 9

export function SuppliersPage() {
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('all')
  const [verifiedOnly, setVerifiedOnly] = useState(false)
  const [sort, setSort] = useState('rating')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 350)

  const locations = useApi(() => api.supplierLocations(), [])
  const { data, loading, error, refetch } = useApi(
    () =>
      api.suppliers({
        search: debouncedSearch || undefined,
        location: location === 'all' ? undefined : location,
        verified: verifiedOnly ? true : undefined,
        sort,
        page,
        page_size: PAGE_SIZE,
      }),
    [debouncedSearch, location, verifiedOnly, sort, page],
  )

  useEffect(() => {
    setPage(1)
  }, [debouncedSearch, location, verifiedOnly, sort])

  const filtersActive = Boolean(search) || location !== 'all' || verifiedOnly || sort !== 'rating'

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Directory"
        title="Suppliers"
        description="Wholesale suppliers, distributors and farmer cooperatives in the PriceRadar demo network."
        actions={<DemoBadge />}
      />

      <div className="card p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by supplier name, city or category…"
            className="flex-1"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label htmlFor="location" className="sr-only">
              Location
            </label>
            <select
              id="location"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              className="field w-auto min-w-[150px] py-2.5"
            >
              <option value="all">All locations</option>
              {(locations.data ?? []).map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <label htmlFor="supplier-sort" className="sr-only">
              Sort suppliers
            </label>
            <select
              id="supplier-sort"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="field w-auto min-w-[170px] py-2.5"
            >
              <option value="rating">Highest rated</option>
              <option value="delivery">Fastest delivery</option>
              <option value="offers">Most offers</option>
              <option value="name">Name (A–Z)</option>
            </select>
            <button
              type="button"
              onClick={() => setVerifiedOnly((value) => !value)}
              aria-pressed={verifiedOnly}
              className={cn('chip py-2.5', verifiedOnly && 'chip-active')}
            >
              <BadgeCheck className="h-3.5 w-3.5" />
              Verified only
            </button>
            {filtersActive && (
              <button
                type="button"
                onClick={() => {
                  setSearch('')
                  setLocation('all')
                  setVerifiedOnly(false)
                  setSort('rating')
                }}
                className="btn-secondary py-2.5 text-xs"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}
      {loading && !data && <LoadingBlock rows={4} label="Loading suppliers…" />}

      {data && data.items.length === 0 && (
        <EmptyState
          icon={<Store className="h-5 w-5" />}
          title="No suppliers match your filters"
          message="Adjust the location, verification filter or search term and try again."
          action={
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setSearch('')
                setLocation('all')
                setVerifiedOnly(false)
              }}
            >
              Clear filters
            </button>
          }
        />
      )}

      {data && data.items.length > 0 && (
        <>
          <p className="text-xs text-ink-muted">
            <span className="font-semibold text-ink">{data.total}</span> supplier
            {data.total === 1 ? '' : 's'} in the directory
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {data.items.map((supplier) => (
              <article key={supplier.id} className="card flex flex-col p-5 transition-shadow hover:shadow-raised">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate text-sm font-semibold text-ink">{supplier.name}</h3>
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-ink-muted">
                      <MapPin className="h-3 w-3" aria-hidden />
                      {supplier.location}
                    </p>
                  </div>
                  <VerifiedBadge verified={supplier.is_verified} />
                </div>

                <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-ink-soft">
                  {supplier.description}
                </p>

                <div className="mt-3 flex flex-wrap gap-1.5">
                  {supplier.categories.map((category) => (
                    <span
                      key={category}
                      className="rounded-full border border-line bg-canvas px-2 py-0.5 text-[10px] font-medium text-ink-soft"
                    >
                      {category}
                    </span>
                  ))}
                </div>

                <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl border border-line/70 bg-canvas/50 p-3 text-center">
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-ink-muted">Rating</dt>
                    <dd className="mt-0.5 flex justify-center">
                      <Rating value={supplier.rating} />
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-ink-muted">Offers</dt>
                    <dd className="text-xs font-semibold text-ink">{supplier.offer_count}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] uppercase tracking-wide text-ink-muted">Delivery</dt>
                    <dd className="text-xs font-semibold text-ink">{supplier.delivery_days} d</dd>
                  </div>
                </dl>

                <div className="mt-3 space-y-1.5 text-[11px] text-ink-muted">
                  <a
                    href={`tel:${supplier.phone.replace(/\s/g, '')}`}
                    className="flex items-center gap-1.5 hover:text-brand-700"
                  >
                    <Phone className="h-3 w-3" aria-hidden />
                    {supplier.phone}
                  </a>
                  <p className="flex items-center gap-1.5">
                    <Truck className="h-3 w-3" aria-hidden />
                    {supplier.delivery_days} day delivery · {supplier.product_count} products
                  </p>
                </div>

                <div className="mt-auto flex gap-2 pt-4">
                  <Link to={`/suppliers/${supplier.id}`} className="btn-primary flex-1 px-3 py-2 text-xs">
                    View profile
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                  <Link to="/compare" className="btn-secondary px-3 py-2 text-xs">
                    Compare
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

          <DemoNotice />
        </>
      )}
    </div>
  )
}
