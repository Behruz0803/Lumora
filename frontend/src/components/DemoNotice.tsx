import { BadgeCheck, FlaskConical } from 'lucide-react'
import { cn } from '../utils/cn'
import { tr } from '../i18n/core'
import { useDataSource } from '../context/DatasetContext'

/**
 * Product principle: never present demo data as verified market information.
 *
 * The notice follows the dataset, not the page: it disappears only once every
 * price on screen came from an imported supplier price list, and it stays a
 * clear demo warning while demo rows are still mixed in.
 */
export function DemoNotice({ className, compact = false }: { className?: string; compact?: boolean }) {
  const dataSource = useDataSource()

  if (dataSource === 'real') {
    return (
      <div
        className={cn(
          'flex items-start gap-2.5 rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-xs text-brand-700',
          className,
        )}
      >
        <BadgeCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
        <p className="leading-relaxed">
          <span className="font-semibold">{tr('Imported price list.')}</span>{' '}
          {compact
            ? tr('Prices and delivery costs come from your imported supplier price lists.')
            : tr(
                'Prices, delivery costs and availability come from supplier price lists imported into PriceRadar. Confirm the final terms with the supplier before ordering.',
              )}
        </p>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/[0.06] px-3.5 py-2.5 text-xs text-[#7A5615]',
        className,
      )}
    >
      <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <p className="leading-relaxed">
        <span className="font-semibold">
          {dataSource === 'mixed' ? tr('Mixed data set.') : tr('Demo dataset.')}
        </span>{' '}
        {dataSource === 'mixed'
          ? compact
            ? tr('Some rows are imported real prices, others are fictional demo examples.')
            : tr(
                'Partially real data: imported supplier prices are real, but demo rows are still mixed in. Rows labelled as demo are fictional examples.',
              )
          : compact
            ? tr('Prices and suppliers are fictional examples, not real market data.')
            : tr(
                'Prices, availability and trends shown here are fictional demonstration values — not real market research. Use PriceRadar to compare total cost, then confirm details with the supplier.',
              )}
      </p>
    </div>
  )
}
