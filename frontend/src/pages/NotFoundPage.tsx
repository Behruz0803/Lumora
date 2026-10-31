import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-brand-600">
        <Compass className="h-6 w-6" aria-hidden />
      </span>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Page not found</h1>
      <p className="mt-1.5 max-w-sm text-sm text-ink-muted">
        The page you are looking for does not exist or has moved. Let's get you back to the market.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Link to="/" className="btn-primary">
          Back to overview
        </Link>
        <Link to="/compare" className="btn-secondary">
          Compare prices
        </Link>
      </div>
    </div>
  )
}
