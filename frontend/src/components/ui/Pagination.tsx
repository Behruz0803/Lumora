import { ChevronLeft, ChevronRight } from 'lucide-react'
import { tr } from '../../i18n/core'

interface PaginationProps {
  page: number
  pages: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function Pagination({ page, pages, total, pageSize, onPageChange }: PaginationProps) {
  if (total === 0) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)

  const candidates = Array.from(new Set([1, page - 1, page, page + 1, pages])).filter(
    (value) => value >= 1 && value <= pages,
  )
  const sorted = candidates.sort((a, b) => a - b)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-line px-1 pt-4 sm:flex-row">
      <p className="text-xs text-ink-muted">
        {tr("Showing")} <span className="font-semibold text-ink-soft">{from}</span>–
        <span className="font-semibold text-ink-soft">{to}</span> {tr("of")}{' '}
        <span className="font-semibold text-ink-soft">{total}</span>
      </p>
      <nav className="flex items-center gap-1" aria-label={tr("Pagination")}>
        <button
          type="button"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="btn-secondary px-2.5 py-2"
          aria-label={tr("Previous page")}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        {sorted.map((value, index) => (
          <span key={value} className="flex items-center gap-1">
            {index > 0 && value - sorted[index - 1] > 1 && (
              <span className="px-1 text-xs text-ink-muted">…</span>
            )}
            <button
              type="button"
              onClick={() => onPageChange(value)}
              aria-current={value === page ? 'page' : undefined}
              className={
                value === page
                  ? 'btn bg-brand-500 px-3 py-2 text-white'
                  : 'btn-secondary px-3 py-2 text-ink-soft'
              }
            >
              {value}
            </button>
          </span>
        ))}
        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= pages}
          className="btn-secondary px-2.5 py-2"
          aria-label={tr("Next page")}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </nav>
    </div>
  )
}
