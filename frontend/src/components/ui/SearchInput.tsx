import { Search, X } from 'lucide-react'
import { cn } from '../../utils/cn'
import { tr } from '../../i18n/core'

export function SearchInput({
  value,
  onChange,
  placeholder,
  className,
  label,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
  className?: string
  label?: string
}) {
  return (
    <div className={cn('relative', className)}>
      <Search
        className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted"
        aria-hidden
      />
      <input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className="field pl-10 pr-9 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-muted transition hover:bg-canvas hover:text-ink"
          aria-label={tr("Clear search")}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  )
}
