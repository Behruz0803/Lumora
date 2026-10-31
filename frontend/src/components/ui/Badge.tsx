import type { ReactNode } from 'react'
import { BadgeCheck, Star } from 'lucide-react'
import { cn } from '../../utils/cn'
import { tr } from '../../i18n/core'

type Tone = 'green' | 'amber' | 'red' | 'neutral' | 'blue'

const toneClasses: Record<Tone, string> = {
  green: 'border-brand-200 bg-brand-50 text-brand-700',
  amber: 'border-warning/30 bg-warning/10 text-[#96651B]',
  red: 'border-danger/25 bg-danger/10 text-danger',
  neutral: 'border-line bg-canvas text-ink-muted',
  blue: 'border-[#C7D9EC] bg-[#EEF4FB] text-[#2C5C8F]',
}

export function Badge({
  children,
  tone = 'neutral',
  className,
}: {
  children: ReactNode
  tone?: Tone
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold leading-5',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

export function VerifiedBadge({ verified }: { verified: boolean }) {
  if (verified) {
    return (
      <Badge tone="green">
        <BadgeCheck className="h-3 w-3" aria-hidden />
        {tr("Verified")}
      </Badge>
    )
  }
  return <Badge tone="neutral">{tr("Unverified")}</Badge>
}

export function Rating({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-xs font-semibold text-ink-soft', className)}>
      <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden />
      {value.toFixed(1)}
    </span>
  )
}

export function DemoBadge() {
  return (
    <Badge tone="amber" className="uppercase tracking-wide">
      {tr("Demo data")}
    </Badge>
  )
}
