import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '../utils/cn'
import { tr } from '../i18n/core'

type ToastKind = 'success' | 'error' | 'info'

interface Toast {
  id: number
  kind: ToastKind
  message: string
}

interface ToastContextValue {
  toast: (message: string, kind?: ToastKind) => void
  success: (message: string) => void
  error: (message: string) => void
  info: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const icons = {
  success: CheckCircle2,
  error: AlertTriangle,
  info: Info,
}

const tones: Record<ToastKind, string> = {
  success: 'border-brand-200 bg-white text-ink',
  error: 'border-danger/30 bg-white text-ink',
  info: 'border-line bg-white text-ink',
}

const iconTones: Record<ToastKind, string> = {
  success: 'text-brand-600',
  error: 'text-danger',
  info: 'text-ink-muted',
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((item) => item.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, kind: ToastKind = 'info') => {
      const id = nextId.current++
      setToasts((current) => [...current.slice(-3), { id, kind, message }])
      window.setTimeout(() => remove(id), kind === 'error' ? 6000 : 4000)
    },
    [remove],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (message: string) => toast(message, 'success'),
      error: (message: string) => toast(message, 'error'),
      info: (message: string) => toast(message, 'info'),
    }),
    [toast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-6 sm:items-end sm:px-6"
      >
        {toasts.map((item) => {
          const Icon = icons[item.kind]
          return (
            <div
              key={item.id}
              role="status"
              className={cn(
                'pointer-events-auto flex w-full max-w-sm animate-slide-in items-start gap-3 rounded-xl border px-4 py-3 shadow-raised',
                tones[item.kind],
              )}
            >
              <Icon className={cn('mt-0.5 h-4 w-4 shrink-0', iconTones[item.kind])} aria-hidden />
              <p className="flex-1 text-sm leading-snug">{item.message}</p>
              <button
                type="button"
                onClick={() => remove(item.id)}
                className="rounded-md p-0.5 text-ink-muted transition hover:bg-canvas hover:text-ink"
                aria-label={tr("Dismiss notification")}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within a ToastProvider')
  return context
}
