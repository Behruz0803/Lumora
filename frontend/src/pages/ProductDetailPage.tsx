import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Calculator, LineChart as LineChartIcon, Store } from 'lucide-react'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/States'
import { Badge, DemoBadge, Rating, VerifiedBadge } from '../components/ui/Badge'
import { ProductThumb } from '../components/ProductThumb'
import { ChartLegend, PriceHistoryChart } from '../components/Charts'
import { DemoNotice } from '../components/DemoNotice'
import {
  formatPercent,
  formatQuantity,
  formatRelativeTime,
  formatUZS,
  statusText,
  statusTone,
} from '../utils/format'
import { cn } from '../utils/cn'
import { tr } from '../i18n/core'

const RANGES = [30, 90, 180]

export function ProductDetailPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const id = Number(productId)
  const [days, setDays] = useState(90)
  const [showSuppliers, setShowSuppliers] = useState(true)

  const product = useApi(() => api.product(id), [id])
  const history = useApi(() => api.priceHistory(id, days), [id, days])
  const referenceQuantity = product.data ? (['kg', 'l'].includes(product.data.unit) ? 100 : 10) : 100
  const offers = useApi(
    () => api.productOffers(id, { quantity: referenceQuantity, sort: 'total' }),
    [id, referenceQuantity],
  )
  const invalid = !Number.isFinite(id) || id <= 0

  if (invalid) {
    return (
      <div className="space-y-4">
        <ErrorState message={tr("That product link is not valid.")} onRetry={() => navigate('/products')} />
      </div>
    )
  }

  if (product.error) {
    return (
      <div className="space-y-4">
        <Link to="/products" className="btn-ghost px-0 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> {tr("Back to products")}
        </Link>
        <ErrorState message={product.error} onRetry={product.refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/products" className="btn-ghost w-fit px-0 text-xs">
        <ArrowLeft className="h-3.5 w-3.5" /> {tr("Back to products")}
      </Link>

      {product.loading && !product.data && <LoadingBlock rows={3} label={tr("Loading product…")} />}

      {product.data && (
        <>
          <div className="card overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <ProductThumb
                  src={product.data.image_url}
                  alt={product.data.name}
                  category={tr(product.data.category)}
                  className="h-20 w-20"
                />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-ink">{product.data.name}</h1>
                    <Badge tone={statusTone[product.data.availability]}>
                      {statusText(product.data.availability)}
                    </Badge>
                    <DemoBadge />
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">
                    {tr(product.data.category)} {tr("· sold by")} {product.data.unit}
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                    {tr(product.data.description ?? "")}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate(`/compare?product=${product.data?.id}&qty=${referenceQuantity}`)}
                className="btn-primary shrink-0"
              >
                <Calculator className="h-4 w-4" />
                {tr("Compare")} {formatQuantity(referenceQuantity, product.data.unit)}
              </button>
            </div>

            <dl className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-3 lg:grid-cols-6">
              {[
                { label: tr('Average price'), value: formatUZS(product.data.avg_price) },
                { label: tr('Lowest offer'), value: formatUZS(product.data.min_price) },
                { label: tr('Highest offer'), value: formatUZS(product.data.max_price) },
                {
                  label: tr('Available suppliers'),
                  value: `${product.data.available_supplier_count} / ${product.data.offer_count}`,
                },
                {
                  label: tr('Availability'),
                  value: statusText(product.data.availability),
                },
                { label: tr('Last updated'), value: formatRelativeTime(product.data.updated_at) },
              ].map((item) => (
                <div key={item.label} className="bg-white px-4 py-3">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">
                    {item.label}
                  </dt>
                  <dd className="mt-0.5 text-sm font-semibold text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="card p-5 xl:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <LineChartIcon className="h-4 w-4 text-brand-600" aria-hidden />
                    {tr("Price history")}
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {tr('Daily average price per {unit}, plus each supplier series', {
                      unit: tr(product.data.unit),
                    })}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  {RANGES.map((range) => (
                    <button
                      key={range}
                      type="button"
                      onClick={() => setDays(range)}
                      className={cn('chip', days === range && 'chip-active')}
                      aria-pressed={days === range}
                    >
                      {range}{tr("d")}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowSuppliers((value) => !value)}
                    className={cn('chip', showSuppliers && 'chip-active')}
                    aria-pressed={showSuppliers}
                  >
                    {tr("Suppliers")}
                  </button>
                </div>
              </div>

              {history.loading && !history.data && (
                <div className="mt-4">
                  <LoadingBlock rows={2} label={tr("Loading price history…")} />
                </div>
              )}
              {history.error && (
                <div className="mt-4">
                  <ErrorState message={history.error} onRetry={history.refetch} compact />
                </div>
              )}
              {history.data && (
                <>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs">
                    <span className="text-ink-muted">
                      {tr('{days}-day change:', { days })}{' '}
                      <span
                        className={cn(
                          'font-semibold',
                          (history.data.change_pct ?? 0) > 0 ? 'text-danger' : 'text-brand-700',
                        )}
                      >
                        {formatPercent(history.data.change_pct)}
                      </span>
                    </span>
                    <span className="text-ink-muted">
                      {tr("Range:")} {formatUZS(history.data.min_price)} – {formatUZS(history.data.max_price)}
                    </span>
                    <span className="text-ink-muted">{tr("Average:")} {formatUZS(history.data.avg_price)}</span>
                  </div>
                  <div className="mt-3">
                    <PriceHistoryChart
                      points={history.data.points}
                      series={history.data.supplier_series}
                      unit={history.data.unit}
                      showSuppliers={showSuppliers}
                      height={288}
                    />
                  </div>
                  <div className="mt-3">
                    <ChartLegend
                      items={[
                        { label: 'Average', color: '#0F8B5F' },
                        ...history.data.supplier_series.map((series, index) => ({
                          label: series.supplier_name,
                          color: ['#3BA377', '#E9A23B', '#2C5C8F', '#8A6BBF', '#DC5555', '#6FBF9C'][index % 6],
                        })),
                      ]}
                    />
                  </div>
                  <div className="mt-4">
                    <DemoNotice compact />
                  </div>
                </>
              )}
            </div>

            <div className="card overflow-hidden">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <Store className="h-4 w-4 text-brand-600" aria-hidden />
                    {tr("Supplier offers")}
                  </h2>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {tr("Total at")} {formatQuantity(referenceQuantity, product.data.unit)}
                  </p>
                </div>
              </div>

              {offers.loading && !offers.data && (
                <div className="p-5">
                  <LoadingBlock rows={2} label={tr("Loading offers…")} />
                </div>
              )}
              {offers.error && (
                <div className="p-5">
                  <ErrorState message={offers.error} onRetry={offers.refetch} compact />
                </div>
              )}
              {offers.data && offers.data.length === 0 && (
                <div className="p-5">
                  <EmptyState title={tr("No offers yet")} message={tr("No supplier has listed this product.")} />
                </div>
              )}
              {offers.data && offers.data.length > 0 && (
                <ul className="divide-y divide-line">
                  {offers.data.map((offer) => (
                    <li key={offer.id} className="px-5 py-3.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            to={`/suppliers/${offer.supplier_id}`}
                            className="truncate text-sm font-medium text-ink hover:text-brand-700"
                          >
                            {offer.supplier?.name}
                          </Link>
                          <p className="text-[11px] text-ink-muted">
                            {offer.supplier?.location} · {offer.supplier?.delivery_days} {tr("day delivery")}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-1.5">
                            {offer.supplier && <Rating value={offer.supplier.rating} />}
                            <VerifiedBadge verified={offer.supplier?.is_verified ?? false} />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-ink">{formatUZS(offer.unit_price)}</p>
                          <p className="text-[11px] text-ink-muted">
                            {offer.delivery_cost === 0 ? tr("free delivery") : `+${formatUZS(offer.delivery_cost)}`}
                          </p>
                          {offer.total_cost !== null && (
                            <p className="mt-0.5 text-[11px] font-medium text-brand-700">
                              {formatUZS(offer.total_cost)} {tr("total")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        <Badge tone={statusTone[offer.status]}>{statusText(offer.status)}</Badge>
                        <span className="text-[11px] text-ink-muted">
                          {tr("Min")} {formatQuantity(offer.minimum_order_quantity, product.data?.unit)}
                        </span>
                        <span className="text-[11px] text-ink-muted">
                          {tr("Stock")} {formatQuantity(offer.available_quantity)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="border-t border-line p-4">
                <Link
                  to={`/compare?product=${product.data.id}&qty=${referenceQuantity}`}
                  className="btn-primary w-full"
                >
                  {tr("Open full comparison")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
