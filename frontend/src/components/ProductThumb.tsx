import { useState } from 'react'
import { cn } from '../utils/cn'

const categoryTint: Record<string, string> = {
  Vegetables: 'bg-[#EAF6F0]',
  Grains: 'bg-[#F6F1E6]',
  'Oils & Fats': 'bg-[#FBF3E4]',
  Pantry: 'bg-[#F2F0FA]',
  'Dairy & Eggs': 'bg-[#FDF1E7]',
}

/** Product image with a graceful branded fallback if the asset is unavailable. */
export function ProductThumb({
  src,
  alt,
  category,
  className,
  imageClassName,
}: {
  src: string | null
  alt: string
  category: string
  className?: string
  imageClassName?: string
}) {
  const [failed, setFailed] = useState(false)
  const initials = alt
    .split(' ')
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-line',
        categoryTint[category] ?? 'bg-canvas',
        className,
      )}
    >
      {src && !failed ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          onError={() => setFailed(true)}
          className={cn('h-full w-full object-cover', imageClassName)}
        />
      ) : (
        <span className="text-sm font-semibold tracking-wide text-brand-700">{initials}</span>
      )}
    </div>
  )
}
