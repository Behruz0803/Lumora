import type { ReactNode } from 'react'
import { cn } from '../utils/cn'

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = 'default',
  trend,
}: {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon: ReactNode
  tone?: 'default' | 'brand' | 'warning'
  trend?: { direction: 'up' | 'down'; label: string; good?: boolean }
}) {
  return (
    <div
      className={cn(
        'card p-5 transition-shadow hover:shadow-raised',
        tone === 'brand' && 'border-brand-200 bg-gradient-to-br from-white to-brand-50/70',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
        <span
          className={cn(
            'flex h-9 w-9 items-center justify-center rounded-xl border',
            tone === 'brand'
              ? 'border-brand-200 bg-white text-brand-600'
              : tone === 'warning'
                ? 'border-warning/25 bg-warning/10 text-[#96651B]'
                : 'border-line bg-canvas text-ink-soft',
          )}
        >
          {icon}
        </span>
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-tight tracking-tight text-ink">{value}</p>
      <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
        {trend && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 font-semibold',
              trend.good === false ? 'bg-danger/10 text-danger' : 'bg-brand-50 text-brand-700',
            )}
          >
            {trend.direction === 'up' ? '▲' : '▼'} {trend.label}
          </span>
        )}
        {hint}
      </div>
    </div>
  )
}
