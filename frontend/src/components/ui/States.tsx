import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Spinner({ className = 'h-4 w-4' }: { className?: string }) {
  return <Loader2 className={cn('animate-spin', className)} aria-hidden />
}

export function LoadingBlock({ label = 'Loading…', rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className="space-y-3" role="status" aria-label={label}>
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="relative overflow-hidden rounded-xl border border-line bg-white p-4">
          <div className="h-3 w-1/3 rounded bg-canvas" />
          <div className="mt-3 h-3 w-2/3 rounded bg-canvas" />
          <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/70 to-transparent" />
        </div>
      ))}
      <span className="sr-only">{label}</span>
    </div>
  )
}

export function EmptyState({
  title,
  message,
  action,
  icon,
}: {
  title: string
  message: string
  action?: ReactNode
  icon?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 text-brand-600">
        {icon ?? <Inbox className="h-5 w-5" />}
      </div>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1.5 max-w-sm text-sm text-ink-muted">{message}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
  compact = false,
}: {
  message: string
  onRetry?: () => void
  compact?: boolean
}) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 rounded-2xl border border-danger/25 bg-danger/5 p-5 sm:flex-row sm:items-center sm:justify-between',
        compact && 'p-4',
      )}
    >
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-danger" aria-hidden />
        <div>
          <p className="text-sm font-semibold text-ink">Something went wrong</p>
          <p className="mt-0.5 text-sm text-ink-muted">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button type="button" onClick={onRetry} className="btn-secondary shrink-0">
          <RefreshCw className="h-4 w-4" />
          Retry
        </button>
      )}
    </div>
  )
}

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="text-xs font-medium text-danger">
      {children}
    </p>
  )
}
