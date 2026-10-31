import { Loader2 } from 'lucide-react'

export function FullPageLoader({ label = 'Loading PriceRadar…' }: { label?: string }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas" role="status">
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-500 shadow-sm">
        <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden>
          <circle cx="12" cy="12" r="8.25" stroke="white" strokeWidth="1.5" strokeOpacity="0.55" />
          <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.5" strokeOpacity="0.8" />
          <path d="M12 12 18.5 5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </span>
      <p className="flex items-center gap-2 text-sm text-ink-muted">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        {label}
      </p>
    </div>
  )
}
