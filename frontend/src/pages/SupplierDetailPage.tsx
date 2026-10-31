import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Copy, MapPin, Phone, Truck, Users } from 'lucide-react'
import { api } from '../services/api'
import { useApi } from '../hooks/useApi'
import { useToast } from '../context/ToastContext'
import { ErrorState, LoadingBlock, EmptyState } from '../components/ui/States'
import { Badge, DemoBadge, Rating, VerifiedBadge } from '../components/ui/Badge'
import { DemoNotice } from '../components/DemoNotice'
import { ProductThumb } from '../components/ProductThumb'
import { formatDate, formatQuantity, formatRelativeTime, formatUZS, statusLabel, statusTone } from '../utils/format'

export function SupplierDetailPage() {
  const { supplierId } = useParams()
  const id = Number(supplierId)
  const navigate = useNavigate()
  const toast = useToast()

  const supplier = useApi(() => api.supplier(id), [id])
  const offers = useApi(() => api.supplierOffers(id), [id])

  if (supplier.error) {
    return (
      <div className="space-y-4">
        <Link to="/suppliers" className="btn-ghost w-fit px-0 text-xs">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to suppliers
        </Link>
        <ErrorState message={supplier.error} onRetry={supplier.refetch} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Link to="/suppliers" className="btn-ghost w-fit px-0 text-xs">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to suppliers
      </Link>

      {supplier.loading && !supplier.data && <LoadingBlock rows={3} label="Loading supplier…" />}

      {supplier.data && (
        <>
          <div className="card overflow-hidden">
            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="flex items-start gap-4">
                <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-lg font-semibold text-brand-700">
                  {supplier.data.name
                    .split(' ')
                    .map((part) => part[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight text-ink">{supplier.data.name}</h1>
                    <VerifiedBadge verified={supplier.data.is_verified} />
                    <DemoBadge />
                  </div>
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {supplier.data.location}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" aria-hidden />
                      {supplier.data.delivery_days} day delivery
                    </span>
                    <Rating value={supplier.data.rating} />
                  </p>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
                    {supplier.data.description}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {supplier.data.categories.map((category) => (
                      <Link
                        key={category}
                        to={`/products?category=${encodeURIComponent(category)}`}
                        className="rounded-full border border-line bg-canvas px-2.5 py-0.5 text-[11px] font-medium text-ink-soft hover:border-brand-200 hover:text-brand-700"
                      >
                        {category}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-2">
                <a
                  href={`tel:${supplier.data.phone.replace(/\s/g, '')}`}
                  className="btn-primary"
                >
                  <Phone className="h-4 w-4" />
                  {supplier.data.phone}
                </a>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(supplier.data!.phone)
                      toast.success('Phone number copied.')
                    } catch {
                      toast.error('Clipboard is not available in this browser.')
                    }
                  }}
                >
                  <Copy className="h-4 w-4" />
                  Copy phone
                </button>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-px border-t border-line bg-line sm:grid-cols-4">
              {[
                { label: 'Active offers', value: `${supplier.data.offer_count}`, icon: Users },
                { label: 'Products supplied', value: `${supplier.data.product_count}`, icon: Users },
                { label: 'Rating', value: `${supplier.data.rating.toFixed(1)} / 5`, icon: Users },
                { label: 'Member since', value: formatDate(supplier.data.created_at), icon: Users },
              ].map((item) => (
                <div key={item.label} className="bg-white px-4 py-3">
                  <dt className="text-[11px] font-medium uppercase tracking-wide text-ink-muted">{item.label}</dt>
                  <dd className="mt-0.5 text-sm font-semibold text-ink">{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="card overflow-hidden">
            <div className="border-b border-line px-5 py-4">
              <h2 className="text-sm font-semibold text-ink">Offers from this supplier</h2>
              <p className="mt-0.5 text-xs text-ink-muted">
                Unit prices, delivery fees and stock levels from the demo dataset.
              </p>
            </div>

            {offers.loading && !offers.data && (
              <div className="p-5">
                <LoadingBlock rows={3} label="Loading offers…" />
              </div>
            )}
            {offers.error && (
              <div className="p-5">
                <ErrorState message={offers.error} onRetry={offers.refetch} compact />
              </div>
            )}
            {offers.data && offers.data.length === 0 && (
              <div className="p-5">
                <EmptyState title="No offers listed" message="This supplier has no active offers right now." />
              </div>
            )}

            {offers.data && offers.data.length > 0 && (
              <>
                <div className="hidden overflow-x-auto md:block">
                  <table className="table-base">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th className="text-right">Unit price</th>
                        <th className="text-right">Delivery</th>
                        <th className="text-right">Min. order</th>
                        <th className="text-right">Available</th>
                        <th>Status</th>
                        <th>Updated</th>
                        <th className="text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {offers.data.map((offer) => (
                        <tr key={offer.id} className="hover:bg-canvas/60">
                          <td>
                            <div className="flex items-center gap-2.5">
                              <ProductThumb
                                src={offer.product?.image_url ?? null}
                                alt={offer.product?.name ?? 'Product'}
                                category={offer.product?.category ?? ''}
                                className="h-9 w-9"
                              />
                              <div>
                                <Link
                                  to={`/products/${offer.product_id}`}
                                  className="text-sm font-medium text-ink hover:text-brand-700"
                                >
                                  {offer.product?.name}
                                </Link>
                                <p className="text-[11px] text-ink-muted">{offer.product?.category}</p>
                              </div>
                            </div>
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
                            {formatQuantity(offer.minimum_order_quantity)}{' '}
                            {offer.product?.unit}
                          </td>
                          <td className="whitespace-nowrap text-right">
                            {formatQuantity(offer.available_quantity)} {offer.product?.unit}
                          </td>
                          <td>
                            <Badge tone={statusTone[offer.status]}>{statusLabel[offer.status]}</Badge>
                          </td>
                          <td className="whitespace-nowrap text-xs text-ink-muted">
                            {formatRelativeTime(offer.updated_at)}
                          </td>
                          <td>
                            <div className="flex justify-end">
                              <button
                                type="button"
                                onClick={() =>
                                  navigate(
                                    `/compare?product=${offer.product_id}&qty=${
                                      offer.product?.unit === 'kg' || offer.product?.unit === 'l' ? 100 : 10
                                    }`,
                                  )
                                }
                                className="btn-secondary px-2.5 py-1.5 text-xs"
                              >
                                Compare
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <ul className="divide-y divide-line md:hidden">
                  {offers.data.map((offer) => (
                    <li key={offer.id} className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <ProductThumb
                            src={offer.product?.image_url ?? null}
                            alt={offer.product?.name ?? 'Product'}
                            category={offer.product?.category ?? ''}
                            className="h-10 w-10"
                          />
                          <div>
                            <Link
                              to={`/products/${offer.product_id}`}
                              className="text-sm font-medium text-ink"
                            >
                              {offer.product?.name}
                            </Link>
                            <p className="text-[11px] text-ink-muted">
                              Min {formatQuantity(offer.minimum_order_quantity)} · stock{' '}
                              {formatQuantity(offer.available_quantity)}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-ink">{formatUZS(offer.unit_price)}</p>
                          <p className="text-[11px] text-ink-muted">
                            {offer.delivery_cost === 0 ? 'free delivery' : `+${formatUZS(offer.delivery_cost)}`}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <Badge tone={statusTone[offer.status]}>{statusLabel[offer.status]}</Badge>
                        <button
                          type="button"
                          onClick={() =>
                            navigate(
                              `/compare?product=${offer.product_id}&qty=${
                                offer.product?.unit === 'kg' || offer.product?.unit === 'l' ? 100 : 10
                              }`,
                            )
                          }
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          Compare
                          <ArrowRight className="h-3 w-3" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>

          <DemoNotice />
        </>
      )}
    </div>
  )
}
