import { ArrowLeft } from 'lucide-react'
import { Link } from '@/i18n/navigation'

/** Header for detail pages: a quiet back link, the record's name, one meta line, actions on the right. */
export function DetailHeader({
  backHref,
  backLabel,
  title,
  meta,
  actions,
}: {
  backHref: string
  backLabel: string
  title: React.ReactNode
  meta?: React.ReactNode
  actions?: React.ReactNode
}) {
  return (
    <div className="space-y-3">
      <Link href={backHref} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> {backLabel}
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
          {meta && <div className="mt-1 text-sm text-muted-foreground">{meta}</div>}
        </div>
        {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
      </div>
    </div>
  )
}
