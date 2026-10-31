import { AlertTriangle, RefreshCw, WifiOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { tr } from '../i18n/core'

/**
 * Shown when a stored session exists but the API cannot be reached.
 * Keeps the user signed in and offers a retry instead of logging them out.
 */
export function ConnectionErrorScreen() {
  const { connectionError, retryConnection, loading, logout } = useAuth()

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4" role="alert">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-6 text-center shadow-card">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10 text-[#96651B]">
          <WifiOff className="h-5 w-5" aria-hidden />
        </span>
        <h1 className="mt-4 text-lg font-semibold text-ink">{tr("Cannot reach the PriceRadar API")}</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          {connectionError ?? tr('The service is unavailable right now.')}
        </p>
        <p className="mt-2 text-xs text-ink-muted">
          {tr("Your session is still saved. Check that the backend is running on port 8000, then try again.")}
        </p>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={retryConnection} disabled={loading} className="btn-primary">
            <RefreshCw className={loading ? 'h-4 w-4 animate-spin' : 'h-4 w-4'} />
            {loading ? tr("Reconnecting…") : tr("Try again")}
          </button>
          <button type="button" onClick={logout} className="btn-secondary">
            <AlertTriangle className="h-4 w-4" />
            {tr("Sign out instead")}
          </button>
        </div>
      </div>
    </div>
  )
}
