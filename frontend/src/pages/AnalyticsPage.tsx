import { useEffect, useState } from 'react'
import {
  Activity,
  BadgeCheck,
  BarChart3,
  CircleDollarSign,
  PackageCheck,
  TrendingDown,
  TrendingUp,
  Truck,
} from 'lucide-react'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { PageHeader } from '../components/ui/PageHeader'
import { StatCard } from '../components/StatCard'
import { CategoryBarChart, ChartLegend, PriceHistoryChart, TrendAreaChart } from '../components/Charts'
import { DemoNotice } from '../components/DemoNotice'
import { Badge, DemoBadge } from '../components/ui/Badge'
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/States'
import { formatMoney, formatPercent, formatRelativeTime, formatUZS, pluralize } from '../utils/format'
import { cn } from '../utils/cn'
import { tr } from '../i18n/core'

const RANGES = [
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 180, label: '180 days' },
]

const supplyTone: Record<string, 'green' | 'amber' | 'red'> = {
  healthy: 'green',
  tight: 'amber',
  constrained: 'red',
}

export function AnalyticsPage() {
  const [days, setDays] = useState(30)
  const [productId, setProductId] = useState<number | null>(null)

  const market = useApi(() => api.market(days), [days])
  const products = useApi(() => api.products({ page_size: 100, sort: 'name' }), [])

  useEffect(() => {
    if (productId === null && products.data && products.data.items.length > 0) {
      const potatoes = products.data.items.find((item) => item.name === 'Potatoes')
      setProductId(potatoes?.id ?? products.data.items[0].id)
    }
  }, [products.data, productId])

  const history = useApi(
    () => (productId ? api.priceHistory(productId, Math.max(days, 30)) : Promise.resolve(null)),
    [productId, days],
  )

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Market intelligence")}
        title={tr("Market Analytics")}
        description={tr("Price history, category averages, supply health and demand indicators derived from the demo dataset.")}
        actions={
          <>
            <DemoBadge />
            <div className="flex items-center gap-1 rounded-xl border border-line bg-white p-1">
              {RANGES.map((range) => (
                <button
                  key={range.days}
                  type="button"
                  onClick={() => setDays(range.days)}
                  aria-pressed={days === range.days}
                  className={cn(
                    'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
                    days === range.days ? 'bg-brand-500 text-white' : 'text-ink-soft hover:bg-canvas',
                  )}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </>
        }
      />

      {market.error && <ErrorState message={market.error} onRetry={market.refetch} />}
      {market.loading && !market.data && <LoadingBlock rows={5} label={tr("Loading market analytics…")} />}

      {market.data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label={tr("Tracked offers")}
              value={market.data.supply.total_offers}
              hint={tr('{inStock} in stock · {low} low', { inStock: market.data.supply.in_stock_offers, low: market.data.supply.low_stock_offers })}
              icon={<PackageCheck className="h-4.5 w-4.5" />}
            />
            <StatCard
              label={tr("Stock health")}
              value={`${market.data.supply.stock_health_pct.toFixed(1)}%`}
              hint={tr('{count} {noun} out of stock', { count: market.data.supply.out_of_stock_offers, noun: pluralize(market.data.supply.out_of_stock_offers, 'offer') })}
              icon={<Activity className="h-4.5 w-4.5" />}
              tone="brand"
            />
            <StatCard
              label={tr("Suppliers")}
              value={market.data.suppliers.total_suppliers}
              hint={tr('{percent}% verified · avg {rating}/5', { percent: market.data.suppliers.verified_pct.toFixed(0), rating: market.data.suppliers.avg_rating.toFixed(1) })}
              icon={<BadgeCheck className="h-4.5 w-4.5" />}
            />
            <StatCard
              label={tr("Avg delivery time")}
              value={tr('{count} days', { count: market.data.suppliers.avg_delivery_days.toFixed(1) })}
              hint={tr('{count} units available', { count: formatMoney(market.data.supply.total_available_volume) })}
              icon={<Truck className="h-4.5 w-4.5" />}
            />
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="card p-5 xl:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="text-sm font-semibold text-ink">{tr("Average market price")}</h2>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {tr("Daily average across all tracked products · last")} {days} {tr("days")}
                  </p>
                </div>
                <Badge tone="amber">{tr("Simulated series")}</Badge>
              </div>
              <div className="mt-4">
                <TrendAreaChart data={market.data.trend} height={264} />
              </div>
            </div>

            <div className="card p-5">
              <h2 className="text-sm font-semibold text-ink">{tr("Average price by category")}</h2>
              <p className="mt-0.5 text-xs text-ink-muted">{tr("Averaged across available supplier offers")}</p>
              <div className="mt-3">
                <CategoryBarChart data={market.data.categories} height={264} />
              </div>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-3">
            <div className="card p-5 xl:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold text-ink">{tr("Product price history")}</h2>
                  <p className="mt-0.5 text-xs text-ink-muted">
                    {tr("Average price with individual supplier series")}
                  </p>
                </div>
                <label htmlFor="analytics-product" className="sr-only">
                  {tr("Select product")}
                </label>
                <select
                  id="analytics-product"
                  value={productId ?? ''}
                  onChange={(event) => setProductId(Number(event.target.value))}
                  className="field w-auto min-w-[170px] py-2 text-xs"
                >
                  {(products.data?.items ?? []).map((product) => (
                    <option key={product.id} value={product.id}>
                      {tr(product.name)}
                    </option>
                  ))}
                </select>
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
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-muted">
                    <span>
                      {tr("Change:")}{' '}
                      <span
                        className={cn(
                          'font-semibold',
                          (history.data.change_pct ?? 0) > 0 ? 'text-danger' : 'text-brand-700',
                        )}
                      >
                        {formatPercent(history.data.change_pct)}
                      </span>
                    </span>
                    <span>{tr("Avg:")} {formatUZS(history.data.avg_price)}</span>
                    <span>
                      {tr("Range:")} {formatUZS(history.data.min_price)} – {formatUZS(history.data.max_price)}
                    </span>
                  </div>
                  <div className="mt-2">
                    <PriceHistoryChart
                      points={history.data.points}
                      series={history.data.supplier_series}
                      unit={history.data.unit}
                      height={276}
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
                </>
              )}
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <h2 className="text-sm font-semibold text-ink">{tr("Demand & supply indicators")}</h2>
                <p className="mt-0.5 text-xs text-ink-muted">{tr("Derived from offer availability per category")}</p>
              </div>
              <ul className="divide-y divide-line">
                {market.data.demand.map((item) => (
                  <li key={item.category} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{tr(item.category)}</p>
                      <p className="text-[11px] text-ink-muted">
                        {item.offer_count} {pluralize(item.offer_count, 'offer')} ·{' '}
                        {tr('avg {price}', { price: formatUZS(item.avg_price) })}
                      </p>
                    </div>
                    <Badge tone={supplyTone[item.supply_status]}>
                      {item.supply_status === 'healthy'
                        ? tr("Healthy supply")
                        : item.supply_status === 'tight'
                          ? tr('Tight supply')
                          : tr('Constrained')}
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <div className="card overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <BarChart3 className="h-4 w-4 text-brand-600" aria-hidden />
                  {tr("Category breakdown")}
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>{tr("Category")}</th>
                      <th className="text-right">{tr("Products")}</th>
                      <th className="text-right">{tr("Offers")}</th>
                      <th className="text-right">{tr("Avg price")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {market.data.categories.map((category) => (
                      <tr key={category.category} className="hover:bg-canvas/60">
                        <td className="font-medium text-ink">{category.category}</td>
                        <td className="text-right">{category.product_count}</td>
                        <td className="text-right">{category.offer_count}</td>
                        <td className="text-right font-medium text-ink">{formatUZS(category.avg_price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card overflow-hidden">
              <div className="border-b border-line px-5 py-4">
                <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <CircleDollarSign className="h-4 w-4 text-brand-600" aria-hidden />
                  {tr("Recent price movement")}
                </h2>
              </div>
              {market.data.price_changes.length === 0 ? (
                <div className="p-5">
                  <EmptyState title={tr("No price movement")} message={tr("Prices have not changed in this window.")} />
                </div>
              ) : (
                <ul className="max-h-[360px] divide-y divide-line overflow-y-auto">
                  {market.data.price_changes.map((change) => {
                    const up = change.change_pct >= 0
                    return (
                      <li
                        key={`${change.product_id}-${change.supplier_name}-${change.changed_at}`}
                        className="flex items-center justify-between gap-3 px-5 py-3"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-ink">{change.product_name}</p>
                          <p className="truncate text-[11px] text-ink-muted">
                            {change.supplier_name} · {formatRelativeTime(change.changed_at)}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-xs font-semibold text-ink">
                            {formatMoney(change.old_price)} → {formatMoney(change.new_price)}
                          </p>
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[11px] font-semibold',
                              up ? 'text-danger' : 'text-brand-700',
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
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>

          <DemoNotice />
        </>
      )}
    </div>
  )
}
