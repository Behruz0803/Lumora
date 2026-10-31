import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  CircleDollarSign,
  PiggyBank,
  Sparkles,
  Store,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'
import { api } from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useApi } from '../hooks/useApi'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/StatCard'
import { TrendAreaChart } from '../components/Charts'
import { CategoryBarChart } from '../components/Charts'
import { DemoNotice } from '../components/DemoNotice'
import { DemoBadge, Rating } from '../components/ui/Badge'
import { ProductThumb } from '../components/ProductThumb'
import { GlobalSearch } from '../components/GlobalSearch'
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/States'
import {
  formatMoney,
  formatPercent,
  formatQuantity,
  formatRelativeTime,
  formatUZS,
  statusText,
  pluralize,
  statusTone,
} from '../utils/format'
import { Badge } from '../components/ui/Badge'
import { cn } from '../utils/cn'
import { tr } from '../i18n/core'

export function OverviewPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data, loading, error, refetch } = useApi(() => api.overview(), [])

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const trendChange =
    data && data.trend.length > 1
      ? ((data.trend[data.trend.length - 1].avg_price - data.trend[0].avg_price) /
          data.trend[0].avg_price) *
        100
      : null

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={today}
        title={tr('Welcome back, {name}', { name: user?.full_name?.split(' ')[0] ?? tr('there') })}
        description={tr("Here is where the market stands today across your tracked products and suppliers.")}
        actions={
          <>
            <Link to="/assistant" className="btn-secondary">
              <Sparkles className="h-4 w-4 text-brand-600" />
              {tr("Ask the assistant")}
            </Link>
            <Link to="/compare" className="btn-primary">
              {tr("Compare prices")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </>
        }
      />

      {/* Killer flow entry point */}
      <div className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">{tr("Core demo workflow")}</Badge>
              <DemoBadge />
            </div>
            <h2 className="mt-2 text-lg font-semibold tracking-tight text-ink sm:text-xl">
              {tr("Dilshod needs 100 kg of potatoes for his grocery store")}
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {tr("Search the product, enter the quantity, and PriceRadar ranks every supplier by total cost — unit price × 100 kg plus delivery. The cheapest unit price is not always the cheapest order.")}
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-2 sm:items-end">
            <Link to="/compare?search=potatoes&qty=100" className="btn-primary whitespace-nowrap">
              {tr("Run the 100 kg potato flow")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <p className="text-[11px] text-ink-muted sm:text-right">
              {tr("3 suppliers · delivery included · savings shown")}
            </p>
          </div>
        </div>
      </div>

      {error && <ErrorState message={error} onRetry={refetch} />}
      {loading && !data && <LoadingBlock rows={4} label={tr("Loading dashboard…")} />}

      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={tr("Tracked products")}
              value={data.total_products}
              hint={tr('{count} {noun}', { count: data.total_offers, noun: pluralize(data.total_offers, 'supplier offer') })}
              icon={<Boxes className="h-4.5 w-4.5" />}
            />
            <StatCard
              label={tr("Active suppliers")}
              value={data.active_suppliers}
              hint={
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" aria-hidden /> {tr("with live offers")}
                </span>
              }
              icon={<Store className="h-4.5 w-4.5" />}
            />
            <StatCard
              label={tr("Average market price")}
              value={formatUZS(data.avg_market_price)}
              hint={tr("across tracked products, per unit")}
              icon={<CircleDollarSign className="h-4.5 w-4.5" />}
              trend={
                trendChange === null
                  ? undefined
                  : {
                      direction: trendChange >= 0 ? 'up' : 'down',
                      label: formatPercent(trendChange),
                      good: trendChange < 0,
                    }
              }
            />
            <StatCard
              label={tr("Potential savings")}
              value={formatUZS(data.potential_savings)}
              hint={tr('{percent}% vs worst eligible offer', { percent: data.savings_pct.toFixed(1) })}
              icon={<PiggyBank className="h-4.5 w-4.5" />}
              tone="brand"
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="card p-5 xl:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{tr("Market price trend")}</h3>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {tr("Daily average across all tracked products · last 30 days")}
                  </p>
                </div>
                <Link
                  to="/analytics"
                  className="text-xs font-semibold text-brand-700 underline-offset-2 hover:underline"
                >
                  {tr("Full analytics")}
                </Link>
              </div>
              <div className="mt-4">
                <TrendAreaChart data={data.trend} height={248} />
              </div>
              <div className="mt-3">
                <DemoNotice compact />
              </div>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink">{tr("Quick product search")}</h3>
              <p className="mt-0.5 text-xs text-ink-muted">
                {tr("Jump straight into a total-cost comparison.")}
              </p>
              <div className="mt-3">
                <GlobalSearch />
              </div>

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-ink">{tr("Top categories")}</h3>
                  <Link to="/products" className="text-xs font-semibold text-brand-700 hover:underline">
                    {tr("All products")}
                  </Link>
                </div>
                <div className="mt-2">
                  <CategoryBarChart data={data.top_categories} height={190} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="card overflow-hidden xl:col-span-2">
              <div className="flex items-center justify-between border-b border-line px-5 py-4">
                <div>
                  <h3 className="text-sm font-semibold text-ink">{tr("Recent supplier offers")}</h3>
                  <p className="mt-0.5 text-xs text-ink-muted">{tr("Latest price updates in the demo dataset")}</p>
                </div>
                <Link to="/products" className="text-xs font-semibold text-brand-700 hover:underline">
                  {tr("Browse")}
                </Link>
              </div>
              <ul className="divide-y divide-line">
                {data.recent_offers.map((offer) => (
                  <li key={offer.id} className="flex items-center gap-3 px-5 py-3">
                    <ProductThumb
                      src={offer.product?.image_url ?? null}
                      alt={offer.product?.name ?? 'Product'}
                      category={offer.product?.category ?? ''}
                      className="h-10 w-10"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">{tr(offer.product?.name ?? "")}</p>
                      <p className="truncate text-[11px] text-ink-muted">
                        {tr(offer.supplier?.name ?? "")} · {tr(offer.supplier?.location ?? "")} ·{' '}
                        {formatRelativeTime(offer.updated_at)}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm font-semibold text-ink">{formatUZS(offer.unit_price)}</p>
                      <p className="text-[11px] text-ink-muted">
                        {tr("per")} {offer.product?.unit} {tr("· delivery")}{' '}
                        {offer.delivery_cost === 0 ? tr("free") : formatMoney(offer.delivery_cost)}
                      </p>
                    </div>
                    <Badge tone={statusTone[offer.status]}>{statusText(offer.status)}</Badge>
                    <Link
                      to={`/compare?product=${offer.product_id}&qty=${
                        offer.product?.unit === 'kg' || offer.product?.unit === 'l' ? 100 : 10
                      }`}
                      className="btn-secondary px-2.5 py-1.5 text-xs"
                    >
                      {tr("Compare")}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <h3 className="text-sm font-semibold text-ink">{tr("Recent price changes")}</h3>
                <p className="mt-0.5 text-xs text-ink-muted">{tr("Latest movement per offer")}</p>
              </div>
              {data.price_changes.length === 0 ? (
                <div className="p-5">
                  <EmptyState
                    title={tr("No price changes yet")}
                    message={tr("As supplier prices update, changes will appear here.")}
                  />
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {data.price_changes.map((change) => {
                    const up = change.change_pct >= 0
                    return (
                      <li key={`${change.product_id}-${change.supplier_name}-${change.changed_at}`} className="px-5 py-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => navigate(`/products/${change.product_id}`)}
                              className="truncate text-sm font-medium text-ink hover:text-brand-700"
                            >
                              {change.product_name}
                            </button>
                            <p className="truncate text-[11px] text-ink-muted">
                              {change.supplier_name} · {formatRelativeTime(change.changed_at)}
                            </p>
                          </div>
                          <span
                            className={cn(
                              'inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                              up ? 'bg-danger/10 text-danger' : 'bg-brand-50 text-brand-700',
                            )}
                          >
                            {up ? (
                              <TrendingUp className="h-3 w-3" aria-hidden />
                            ) : (
                              <TrendingDown className="h-3 w-3" aria-hidden />
                            )}
                            {formatPercent(change.change_pct)}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink-soft">
                          {formatUZS(change.old_price)} → {formatUZS(change.new_price)} / {change.unit}
                        </p>
                      </li>
                    )
                  })}
                </ul>
              )}
              <div className="border-t border-line px-5 py-3">
                <Link
                  to="/analytics"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
                >
                  {tr("View market analytics")}
                  <ArrowUpRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink">{tr("Top categories by offers")}</h3>
              <p className="mt-0.5 text-xs text-ink-muted">{tr("Where the demo market has the most supply")}</p>
              <ul className="mt-4 space-y-3">
                {data.top_categories.map((category) => {
                  const max = Math.max(...data.top_categories.map((item) => item.offer_count), 1)
                  return (
                    <li key={category.category}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-ink">{category.category}</span>
                        <span className="text-ink-muted">
                          {category.offer_count} {tr("offers · avg")} {formatUZS(category.avg_price)}
                        </span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-canvas">
                        <div
                          className="h-full rounded-full bg-brand-500"
                          style={{ width: `${Math.max(6, (category.offer_count / max) * 100)}%` }}
                        />
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>

            <div className="card p-5">
              <h3 className="text-sm font-semibold text-ink">{tr("Supplier snapshot")}</h3>
              <p className="mt-0.5 text-xs text-ink-muted">{tr("Ratings and delivery terms from the directory")}</p>
              <ul className="mt-4 space-y-3">
                {data.recent_offers.slice(0, 4).map((offer) =>
                  offer.supplier ? (
                    <li key={offer.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <Link
                          to={`/suppliers/${offer.supplier_id}`}
                          className="truncate text-sm font-medium text-ink hover:text-brand-700"
                        >
                          {offer.supplier.name}
                        </Link>
                        <p className="text-[11px] text-ink-muted">
                          {offer.supplier.location} · {offer.supplier.delivery_days} {tr("day delivery")}
                        </p>
                      </div>
                      <Rating value={offer.supplier.rating} />
                    </li>
                  ) : null,
                )}
              </ul>
              <Link
                to="/suppliers"
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:underline"
              >
                {tr("Open supplier directory")}
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <DemoNotice className="flex-1" />
            <p className="text-[11px] text-ink-muted">
              {tr("Avg order quantities used for savings:")} {formatQuantity(100)} {tr("kg / l,")} {formatQuantity(10)} {tr("trays.")}
            </p>
          </div>
        </>
      )}
    </div>
  )
}
