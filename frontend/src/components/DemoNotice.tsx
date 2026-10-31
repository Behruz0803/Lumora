import { FlaskConical } from 'lucide-react'
import { cn } from '../utils/cn'

/**
 * Product principle: never present demo data as verified market information.
 * This notice is rendered next to every price/analytics surface.
 */
export function DemoNotice({ className, compact = false }: { className?: string; compact?: boolean }) {
  return (
    <div
      className={cn(
        'flex items-start gap-2.5 rounded-xl border border-warning/25 bg-warning/[0.06] px-3.5 py-2.5 text-xs text-[#7A5615]',
        className,
      )}
    >
      <FlaskConical className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <p className="leading-relaxed">
        <span className="font-semibold">Demo dataset.</span>{' '}
        {compact
          ? 'Prices and suppliers are fictional examples, not real market data.'
          : 'Prices, availability and trends shown here are fictional demonstration values — not real market research. Use PriceRadar to compare total cost, then confirm details with the supplier.'}
      </p>
    </div>
  )
}
