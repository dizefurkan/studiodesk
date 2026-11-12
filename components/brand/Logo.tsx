import { cn } from '@/lib/utils'

/**
 * StudioDesk mark: a dancer simplified into an "S" (raised arm + head).
 * Colors come from theme tokens (--primary, --highlight), so it follows light/dark.
 * Static asset copies live in /public/brand and app/icon.svg (favicon).
 */
export function LogoMark({ className, title = 'StudioDesk' }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" role="img" aria-label={title} className={cn('size-8 shrink-0', className)}>
      <circle cx="41" cy="8.5" r="5" className="fill-highlight" />
      <path
        d="M40 19c-8-1-17 2-16 9 1 7 17 7 17 16 0 7-9 10-19 8"
        className="stroke-primary"
        strokeWidth="6.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M30 19.5C24 16 21 11 20 5" className="stroke-primary" strokeWidth="4.5" strokeLinecap="round" />
    </svg>
  )
}

/** Mark + "StudioDesk" wordmark. `inverted` for dark backgrounds. */
export function Logo({
  className,
  markClassName,
  inverted = false,
}: {
  className?: string
  markClassName?: string
  inverted?: boolean
}) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <LogoMark className={markClassName} title="" />
      <span
        className={cn(
          'text-lg font-bold tracking-tight',
          inverted ? 'text-white' : 'text-foreground'
        )}
      >
        Studio<span className="text-primary">Desk</span>
      </span>
    </span>
  )
}
