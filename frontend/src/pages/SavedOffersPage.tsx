import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bookmark,
  BookmarkX,
  Columns3,
  GitCompare,
  Loader2,
  Trash2,
  TrendingDown,
  TrendingUp,
} from 'lucide-react'
import { api, ApiError } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import { PageHeader } from '../components/ui/PageHeader'
import { EmptyState, ErrorState, LoadingBlock } from '../components/ui/States'
import { Modal } from '../components/ui/Modal'
import { Badge, DemoBadge, Rating, VerifiedBadge } from '../components/ui/Badge'
import { DemoNotice } from '../components/DemoNotice'
import { ProductThumb } from '../components/ProductThumb'
import { totalCost } from '../utils/cost'
import { formatDate, formatPercent, formatQuantity, formatUZS, statusText, statusTone } from '../utils/format'
import { cn } from '../utils/cn'
import { tr } from '../i18n/core'
import { pluralize } from '../utils/format'

export function SavedOffersPage() {
  const toast = useToast()
  const { data, loading, error, refetch, setData } = useApi(() => api.savedOffers(), [])
  const [selected, setSelected] = useState<number[]>([])
  const [removingId, setRemovingId] = useState<number | null>(null)
  const [compareOpen, setCompareOpen] = useState(false)
  const [compareQuantity, setCompareQuantity] = useState('100')

  const saved = data ?? []
  const selectedSaved = useMemo(
    () => saved.filter((item) => selected.includes(item.id)),
    [saved, selected],
  )

  const parsedQuantity = Number(compareQuantity)
  const compareQtyValid = Number.isFinite(parsedQuantity) && parsedQuantity > 0
  const effectiveQuantity = compareQtyValid ? parsedQuantity : 0

  const handleRemove = async (savedId: number, productName: string) => {
    setRemovingId(savedId)
    try {
      await api.unsaveOffer(savedId)
      setData(saved.filter((item) => item.id !== savedId))
      setSelected((ids) => ids.filter((id) => id !== savedId))
      toast.success(`Removed ${productName} offer from saved offers.`)
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Could not remove this saved offer.')
    } finally {
      setRemovingId(null)
    }
  }

  const toggleSelected = (id: number) => {
    setSelected((ids) => (ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id]))
  }

  const comparable = selectedSaved.length >= 2
  const differentProducts = new Set(selectedSaved.map((item) => item.offer.product_id)).size > 1

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={tr("Workspace")}
        title={tr("Saved Offers")}
        description={tr("Offers you bookmarked, with price and availability changes since you saved them.")}
        actions={
          <>
            <DemoBadge />
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              disabled={!comparable}
              className="btn-secondary"
              title={comparable ? tr("Compare selected offers") : tr("Select at least two offers to compare")}
            >
              <GitCompare className="h-4 w-4" />
              {tr("Compare selected")}
              {selected.length > 0 && (
                <span className="rounded-full bg-brand-500 px-1.5 text-[10px] font-semibold text-white">
                  {selected.length}
                </span>
              )}
            </button>
          </>
        }
      />

      {error && <ErrorState message={error} onRetry={refetch} />}
      {loading && !data && <LoadingBlock rows={3} label={tr("Loading saved offers…")} />}

      {data && saved.length === 0 && (
        <EmptyState
          icon={<Bookmark className="h-5 w-5" />}
          title={tr("No saved offers yet")}
          message={tr("Save offers while comparing suppliers to track their price and availability over time.")}
          action={
            <Link to="/compare" className="btn-primary">
              {tr("Compare supplier offers")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          }
        />
      )}

      {saved.length > 0 && (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-muted">
              <span className="font-semibold text-ink">{saved.length}</span>{' '}
              {pluralize(saved.length, 'saved offer')} ·{' '}
              {selected.length > 0
                ? tr('{count} selected', { count: selected.length })
                : tr('select two or more to compare')}
            </p>
            {selected.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected([])}
                className="text-xs font-semibold text-brand-700 hover:underline"
              >
                {tr("Clear selection")}
              </button>
            )}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {saved.map((item) => {
              const change = item.price_change
              const up = change > 0
              const isSelected = selected.includes(item.id)
              const unit = item.offer.product?.unit ?? 'kg'
              const referenceQuantity = ['kg', 'l'].includes(unit) ? 100 : 10
              return (
                <article
                  key={item.id}
                  className={cn(
                    'card p-4 transition-colors',
                    isSelected && 'border-brand-300 ring-1 ring-brand-200',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <label className="mt-1 flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelected(item.id)}
                        className="h-4 w-4 rounded border-line text-brand-600 focus:ring-brand-500"
                        aria-label={`Select ${item.offer.product?.name} offer from ${item.offer.supplier?.name}`}
                      />
                    </label>
                    <ProductThumb
                      src={item.offer.product?.image_url ?? null}
                      alt={item.offer.product?.name ?? 'Product'}
                      category={item.offer.product?.category ?? ''}
                      className="h-12 w-12"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Link
                          to={`/products/${item.offer.product_id}`}
                          className="truncate text-sm font-semibold text-ink hover:text-brand-700"
                        >
                          {item.offer.product?.name}
                        </Link>
                        <Badge tone={statusTone[item.offer.status]}>
                          {statusText(item.offer.status)}
                        </Badge>
                        {item.status_changed && (
                          <Badge tone="amber">
                            {tr("Status changed:")} {statusText(item.status_at_save).toLowerCase()}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[11px] text-ink-muted">
                        {item.offer.supplier?.name} · {item.offer.supplier?.location} {tr("· saved")}{' '}
                        {formatDate(item.created_at)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-2">
                        {item.offer.supplier && <Rating value={item.offer.supplier.rating} />}
                        <VerifiedBadge verified={item.offer.supplier?.is_verified ?? false} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRemove(item.id, item.offer.product?.name ?? 'this')}
                      disabled={removingId === item.id}
                      className="rounded-lg p-1.5 text-ink-muted transition hover:bg-danger/5 hover:text-danger"
                      aria-label={tr("Remove saved offer")}
                      title={tr("Remove")}
                    >
                      {removingId === item.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <dl className="mt-3 grid grid-cols-3 gap-2 rounded-xl border border-line/70 bg-canvas/50 p-3 text-[11px]">
                    <div>
                      <dt className="text-ink-muted">{tr("Saved price")}</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{formatUZS(item.price_at_save)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">{tr("Current price")}</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{formatUZS(item.offer.unit_price)}</dd>
                    </div>
                    <div>
                      <dt className="text-ink-muted">{tr("Change")}</dt>
                      <dd
                        className={cn(
                          'mt-0.5 inline-flex items-center gap-1 font-semibold',
                          change === 0 ? 'text-ink-muted' : up ? 'text-danger' : 'text-brand-700',
                        )}
                      >
                        {change !== 0 &&
                          (up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />)}
                        {change === 0 ? tr("No change") : formatPercent(item.price_change_pct)}
                      </dd>
                    </div>
                  </dl>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <p className="text-[11px] text-ink-muted">
                      {formatUZS(item.offer.unit_price)} +{' '}
                      {item.offer.delivery_cost === 0 ? tr("free delivery") : formatUZS(item.offer.delivery_cost)} ={' '}
                      <span className="font-semibold text-ink">
                        {formatUZS(
                          totalCost(item.offer.unit_price, referenceQuantity, item.offer.delivery_cost),
                        )}
                      </span>{' '}
                      {tr("for")} {formatQuantity(referenceQuantity, unit)}
                    </p>
                    <Link
                      to={`/compare?product=${item.offer.product_id}&qty=${referenceQuantity}`}
                      className="btn-secondary shrink-0 px-3 py-1.5 text-xs"
                    >
                      {tr("Compare")}
                    </Link>
                  </div>
                </article>
              )
            })}
          </div>

          <DemoNotice />
        </div>
      )}

      <Modal
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        title={tr("Compare saved offers")}
        description={tr("Totals include delivery for the quantity you enter.")}
        size="lg"
        footer={
          <button type="button" onClick={() => setCompareOpen(false)} className="btn-secondary">
            {tr("Close")}
          </button>
        }
      >
        <div className="mb-4 flex flex-wrap items-end gap-3">
          <div>
            <label htmlFor="compare-qty" className="mb-1 block text-[11px] font-semibold text-ink-soft">
              {tr("Quantity per order")}
            </label>
            <input
              id="compare-qty"
              type="number"
              min={1}
              step="any"
              value={compareQuantity}
              onChange={(event) => setCompareQuantity(event.target.value)}
              aria-invalid={!compareQtyValid}
              className={cn('field w-32 py-2', !compareQtyValid && 'border-danger/50')}
            />
            {!compareQtyValid && (
              <p className="mt-1 text-[11px] text-danger">{tr("Enter a quantity greater than zero.")}</p>
            )}
          </div>
          <p className="pb-2 text-[11px] text-ink-muted">
            {differentProducts
              ? tr("You selected offers for different products — totals are per order, not like-for-like.")
              : tr("Same product selected — totals are directly comparable.")}
          </p>
        </div>

        {selectedSaved.length === 0 ? (
          <EmptyState
            icon={<Columns3 className="h-5 w-5" />}
            title={tr("Nothing selected")}
            message={tr("Select at least two saved offers to compare them side by side.")}
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line">
            <table className="table-base">
              <thead>
                <tr>
                  <th>{tr("Offer")}</th>
                  <th className="text-right">{tr("Unit price")}</th>
                  <th className="text-right">{tr("Delivery")}</th>
                  <th className="text-right">{tr("Total")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {[...selectedSaved]
                  .sort(
                    (a, b) =>
                      totalCost(a.offer.unit_price, effectiveQuantity, a.offer.delivery_cost) -
                      totalCost(b.offer.unit_price, effectiveQuantity, b.offer.delivery_cost),
                  )
                  .map((item, index) => {
                    const total = totalCost(
                      item.offer.unit_price,
                      effectiveQuantity,
                      item.offer.delivery_cost,
                    )
                    return (
                      <tr key={item.id} className={index === 0 ? 'bg-brand-50/50' : ''}>
                        <td>
                          <p className="text-sm font-medium text-ink">{item.offer.product?.name}</p>
                          <p className="text-[11px] text-ink-muted">
                            {item.offer.supplier?.name} · {item.offer.supplier?.location}
                          </p>
                        </td>
                        <td className="whitespace-nowrap text-right">{formatUZS(item.offer.unit_price)}</td>
                        <td className="whitespace-nowrap text-right">
                          {item.offer.delivery_cost === 0 ? tr("Free") : formatUZS(item.offer.delivery_cost)}
                        </td>
                        <td className="whitespace-nowrap text-right font-semibold text-ink">
                          {compareQtyValid ? formatUZS(total) : '—'}
                        </td>
                        <td className="text-right">
                          {index === 0 && <Badge tone="green">{tr("Cheapest")}</Badge>}
                        </td>
                      </tr>
                    )
                  })}
              </tbody>
            </table>
          </div>
        )}

        {selectedSaved.length >= 2 &&
          (() => {
            const totals = selectedSaved.map((item) =>
              totalCost(item.offer.unit_price, effectiveQuantity, item.offer.delivery_cost),
            )
            const diff = compareQtyValid ? Math.max(...totals) - Math.min(...totals) : 0
            return diff > 0 ? (
              <p className="mt-3 rounded-xl border border-brand-200 bg-brand-50/60 px-3.5 py-2.5 text-xs text-brand-900">
                {tr("Choosing the cheapest selected offer saves")}{' '}
                <span className="font-semibold">{formatUZS(diff)}</span> {tr("on this order.")}
              </p>
            ) : (
              <p className="mt-3 rounded-xl border border-line bg-canvas px-3.5 py-2.5 text-xs text-ink-muted">
                {tr("All selected offers cost the same for this quantity.")}
              </p>
            )
          })()}
      </Modal>

      {saved.length === 0 && !loading && (
        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <BookmarkX className="h-3.5 w-3.5" aria-hidden />
          {tr("Saved offers keep their original price so you can see what changed.")}
        </div>
      )}
    </div>
  )
}
